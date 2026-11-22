/**
 * The real circuit on the weekend briefing (RF-3D-01): the calibrated GLB from
 * the asset manifest, seen from a slow orbit around its spline.
 *
 * Kept cheap on purpose (RNF-02): no shadows, pixel ratio capped at 1.5, a
 * frame every 50 ms at most, nothing drawn while the card is off screen or the
 * tab hidden, and a single still frame when the player prefers reduced motion.
 * The parsed GLB is the same one the race reuses (loader.js caches it), so the
 * preview also warms the live view. If the file is missing it calls `onError`
 * and the card keeps its 2D map (RF-3D-02).
 */

import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { createRenderer, environmentFor } from "./studio";
import { loadCircuitAsset } from "./assets/assetCircuit";

const FRAME_MS = 50;
const TURN_PER_SECOND = 0.05;

export default function CircuitPreview({ asset, label, onReady, onError, background = "#0e1520" }) {
  const mount = useRef(null);
  const callbacks = useRef({ onReady, onError });
  callbacks.current = { onReady, onError };

  useEffect(() => {
    const host = mount.current;
    if (!host || !asset) return undefined;
    const canvas = document.createElement("canvas");
    host.appendChild(canvas);
    const renderer = createRenderer(canvas, { shadows: false });
    renderer.setPixelRatio(Math.min(1.5, window.devicePixelRatio || 1));
    renderer.setClearColor(background, 1);
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(background);
    scene.environment = environmentFor(renderer);
    scene.add(new THREE.HemisphereLight("#dfe9ff", "#1a2230", 0.9));
    const sun = new THREE.DirectionalLight("#fff6e8", 2);
    sun.position.set(0.6, 1, 0.35);
    scene.add(sun);
    const camera = new THREE.PerspectiveCamera(28, 1.6, 1, 20000);
    const view = { center: new THREE.Vector3(), radius: 600, angle: -0.6, ready: false };

    const reduce = typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let visible = true;
    let disposed = false;
    let handle = 0;
    let last = 0;
    let lastFrame = 0;

    const place = () => {
      const { center, radius, angle } = view;
      camera.position.set(center.x + Math.cos(angle) * radius * 1.9, center.y + radius * 1.05, center.z + Math.sin(angle) * radius * 1.9);
      camera.lookAt(center);
    };
    const draw = () => {
      place();
      renderer.render(scene, camera);
    };
    const resize = () => {
      const width = host.clientWidth || 320;
      const height = host.clientHeight || 200;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      if (view.ready) draw();
    };
    resize();
    const resizeObserver = typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null;
    resizeObserver?.observe(host);
    const seen = typeof IntersectionObserver !== "undefined" ? new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }) : null;
    seen?.observe(host);

    const loop = (time) => {
      handle = requestAnimationFrame(loop);
      if (!view.ready || !visible || document.hidden || time - lastFrame < FRAME_MS) return;
      const dt = last ? Math.min(0.2, (time - last) / 1000) : 0;
      last = time;
      lastFrame = time;
      view.angle += dt * TURN_PER_SECOND;
      draw();
    };

    loadCircuitAsset(asset, renderer)
      .then(({ scene: circuit, spline }) => {
        if (disposed) return;
        scene.add(circuit);
        // Frame the road, not the whole mesh (a sky dome or far scenery would shrink it to a dot).
        const box = new THREE.Box3();
        (spline.points || []).forEach(([x, y, z]) => box.expandByPoint(new THREE.Vector3(x, y, z)));
        if (box.isEmpty()) box.setFromObject(circuit);
        box.getCenter(view.center);
        const size = box.getSize(new THREE.Vector3());
        view.radius = Math.max(size.x, size.z) * 0.5 || 600;
        camera.near = Math.max(1, view.radius / 200);
        camera.far = view.radius * 12;
        camera.updateProjectionMatrix();
        scene.fog = new THREE.Fog(background, view.radius * 2.6, view.radius * 6);
        view.ready = true;
        draw();
        callbacks.current.onReady?.();
        if (!reduce) handle = requestAnimationFrame(loop);
      })
      .catch(() => {
        if (!disposed) callbacks.current.onError?.();
      });

    return () => {
      disposed = true;
      cancelAnimationFrame(handle);
      resizeObserver?.disconnect();
      seen?.disconnect();
      // Geometry and textures belong to the shared parse (loader.js): only the renderer goes.
      renderer.dispose();
      renderer.forceContextLoss?.();
      if (canvas.parentNode === host) host.removeChild(canvas);
    };
  }, [asset, background]);

  return <div ref={mount} className="wk-preview" role="img" aria-label={label} />;
}
