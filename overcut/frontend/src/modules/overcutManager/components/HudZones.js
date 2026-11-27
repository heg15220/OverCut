/**
 * VIEW-01 (F1M24-CHINA §2.5; RF-3D-04, RNF-09): the shell of the live HUD by zones, shared by the race
 * (LiveRace) and the sessions (SessionLive).
 *
 *   useHudShell(rootRef)   the window and the live view's own size, whether the zones apply
 *                          (hud.json layout.minViewportPx) and the immersive switch
 *   ImmersiveHost          the immersive "live" mode: the live view over the whole window, above the
 *                          site header and the GP stepper. The manager's tree sits in stacking contexts
 *                          under the site header (atoms.js Layer), so the view is portalled into one
 *                          container node that moves between its place in the page and a fixed layer
 *                          on <body> - the same React tree either way, so the 3D view is never rebuilt
 *                          when the viewer goes in or out.
 *   FoldToggle             the button that folds a driver card (or the tower, or the radio) to one line
 *
 * hudLayout.js computes the rectangles; styles/hudZones.css draws them.
 */

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MN_LAYER_Z } from "./atoms";
import { IconArrowDown, IconArrowUp, IconExit, IconExternal } from "./icons";
import { LAYOUT } from "./hudLayout";
import { t } from "./texts";
import "./styles/hudZones.css";

const windowSize = () => (typeof window === "undefined" ? { w: 0, h: 0 } : { w: window.innerWidth || 0, h: window.innerHeight || 0 });

/** The window's size, kept up to date. */
export const useWindowSize = () => {
  const [size, setSize] = useState(windowSize);
  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const onResize = () => setSize(windowSize());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return size;
};

/** An element's size (ResizeObserver), or `fallback` where there is none (jsdom, old browsers). */
export const useBoxSize = (ref, fallback, key = null) => {
  const [size, setSize] = useState(null);
  useEffect(() => {
    const node = ref.current;
    if (!node || typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver(([entry]) => {
      const box = entry.contentRect;
      setSize((old) => (old && Math.abs(old.w - box.width) < 0.5 && Math.abs(old.h - box.height) < 0.5 ? old : { w: box.width, h: box.height }));
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [ref, key]);
  return size && size.w > 0 && size.h > 0 ? size : fallback;
};

/**
 * The live view's shell: `canZone` when the window is at least layout.minViewportPx (else the stacked
 * layout of always), the view's own `box` size, and the immersive switch (on by default where it can
 * be, hud.json layout.immersive; the exit key leaves it unless a dialog is open).
 */
export const useHudShell = (rootRef, { defaultOn = true } = {}, layout = LAYOUT) => {
  const win = useWindowSize();
  const canZone = win.w >= layout.minViewportPx.w && win.h >= layout.minViewportPx.h;
  const [immersivePick, setImmersive] = useState(null);
  const immersive = Boolean(layout.immersive.enabled && canZone && (immersivePick ?? (layout.immersive.default && defaultOn)));
  useEffect(() => {
    if (!immersive || typeof window === "undefined") return undefined;
    const onKey = (event) => {
      if (event.key !== layout.immersive.exitKey || event.defaultPrevented) return;
      if (typeof document !== "undefined" && document.querySelector('.mn-layer-root:not(.lv-immersive-root) [role="dialog"]')) return;
      setImmersive(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [immersive, layout.immersive.exitKey]);
  const box = useBoxSize(rootRef, immersive ? win : null, canZone);
  return { canZone, immersive, setImmersive, box: box || win };
};

/**
 * The immersive host. Inline (`active` false) the view sits where the page puts it; active, the same DOM
 * node moves to a fixed layer on <body> at the manager's layer height (atoms.js MN_LAYER_Z, the dialogs
 * opened later stack above it), carrying the team colours. Without `portal` (no zones possible), the view
 * is rendered inline as it always was.
 */
export const ImmersiveHost = ({ active, portal, children }) => {
  const anchor = useRef(null);
  const [container] = useState(() => (typeof document !== "undefined" ? document.createElement("div") : null));
  useLayoutEffect(() => {
    if (!portal || !container) return undefined;
    container.className = "lv-host";
    if (!active) {
      anchor.current?.appendChild(container);
      return () => container.remove();
    }
    const root = anchor.current?.closest?.(".mn-root");
    const style = root ? window.getComputedStyle(root) : null;
    const layer = document.createElement("div");
    layer.className = "mn-root mn-layer-root lv-immersive-root";
    layer.dataset.testid = "immersive-layer";
    Object.assign(layer.style, { position: "fixed", inset: "0", zIndex: String(MN_LAYER_Z), minHeight: "0", overflow: "hidden" });
    ["--team", "--team2"].forEach((name) => {
      const value = style?.getPropertyValue(name).trim();
      if (value) layer.style.setProperty(name, value);
    });
    layer.appendChild(container);
    document.body.appendChild(layer);
    return () => {
      container.remove();
      layer.remove();
    };
  }, [active, portal, container]);
  if (!portal || !container) return children;
  return (
    <div ref={anchor} className={`lv-host-anchor${active ? " is-away" : ""}`}>
      {createPortal(children, container)}
    </div>
  );
};

/** Fold / unfold a block to one line; the label says which and what (RNF-09: words, not only an arrow). */
export const FoldToggle = ({ open, onToggle, what }) => (
  <button
    type="button"
    className="mn-icon-btn lv-fold"
    aria-expanded={open}
    aria-label={open ? t(`Plegar ${what}`, `Fold ${what}`) : t(`Desplegar ${what}`, `Unfold ${what}`)}
    title={open ? t(`Plegar ${what}`, `Fold ${what}`) : t(`Desplegar ${what}`, `Unfold ${what}`)}
    onClick={(event) => {
      event.stopPropagation();
      onToggle(!open);
    }}
  >
    {open ? <IconArrowDown size={14} /> : <IconArrowUp size={14} />}
  </button>
);

/** VIEW-01: in and out of the immersive live mode (over the site header and the GP stepper). */
export const ImmersiveToggle = ({ shell, layout = LAYOUT }) =>
  shell.canZone && layout.immersive.enabled ? (
    <button
      type="button"
      className="mn-btn mn-btn--sm mn-btn--ghost lv-play__immersive"
      aria-pressed={shell.immersive}
      onClick={() => shell.setImmersive(!shell.immersive)}
      title={shell.immersive ? t("Salir del modo directo (Esc)", "Leave live mode (Esc)") : t("Modo directo a pantalla completa", "Full-window live mode")}
    >
      {shell.immersive ? <IconExit size={16} /> : <IconExternal size={16} />}
      <span className="wk-hide-md">{shell.immersive ? t("Salir", "Exit") : t("Directo", "Live")}</span>
    </button>
  ) : null;
