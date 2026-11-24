/**
 * The wipe between a session's gate, the session and its results (session-options-transition,
 * docs/manager/F1M24-GAMEPLAY.md §2.12.2; RF-WKD-02, RF-WKD-07, RNF-07, RNF-09): the OverCut
 * logo over the team colour, in, held and out on the timings of data/balance/weekend-ui.json,
 * skippable with a click, Enter, Space or Escape. With prefers-reduced-motion - or a browser
 * that cannot say (no matchMedia) - there is no animation at all: it hands over at once.
 * It only draws: nothing here touches the simulation (RNF-05).
 */

import React, { useEffect, useRef, useState } from "react";
import logo from "../../app/components/Resources/LogoOverCut.png";
import balance from "../data/balance/weekend-ui.json";
import { t } from "./texts";
import "./styles/session-flow.css";

/** Whether the viewer asked for less motion (unknown counts as yes: no animation is the safe side). */
export const prefersReducedMotion = () => {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return true;
  try {
    return Boolean(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  } catch (error) {
    return true;
  }
};

/** The wipe's three phases in milliseconds (weekend-ui.json transition). */
export const transitionTimings = (config = balance.transition) => ({
  in: Math.max(0, Math.round((config.inSec || 0) * 1000)),
  hold: Math.max(0, Math.round((config.holdSec || 0) * 1000)),
  out: Math.max(0, Math.round((config.outSec || 0) * 1000)),
});

const SKIP_KEYS = new Set(["Enter", " ", "Escape"]);

export default function Transition({ label, sublabel, onDone, config = balance.transition }) {
  const [reduced] = useState(prefersReducedMotion);
  const [phase, setPhase] = useState("in");
  const done = useRef(false);
  const finish = useRef(onDone);
  finish.current = onDone;

  const end = () => {
    if (done.current) return;
    done.current = true;
    finish.current?.();
  };

  useEffect(() => {
    if (reduced) {
      end();
      return undefined;
    }
    const timing = transitionTimings(config);
    const timers = [
      setTimeout(() => setPhase("hold"), timing.in),
      setTimeout(() => setPhase("out"), timing.in + timing.hold),
      setTimeout(end, timing.in + timing.hold + timing.out),
    ];
    return () => timers.forEach(clearTimeout);
    // The wipe runs once per mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (reduced || !config.skippable) return undefined;
    const onKey = (event) => {
      if (!SKIP_KEYS.has(event.key)) return;
      event.preventDefault();
      end();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced]);

  if (reduced) return null;
  const timing = transitionTimings(config);
  return (
    <div
      className={`wk-transition is-${phase}`}
      role="status"
      aria-live="polite"
      data-testid="session-transition"
      style={{ "--wk-tr-in": `${timing.in}ms`, "--wk-tr-out": `${timing.out}ms` }}
      onClick={config.skippable ? end : undefined}
    >
      <div className="wk-transition__card">
        <img src={logo} alt="" aria-hidden="true" />
        {label && <strong>{label}</strong>}
        {sublabel && <small>{sublabel}</small>}
      </div>
      {config.skippable && (
        <button type="button" className="mn-btn wk-transition__skip" onClick={end}>
          {t("Saltar", "Skip")}
        </button>
      )}
    </div>
  );
}
