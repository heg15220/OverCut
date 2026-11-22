/**
 * The car on a turntable: the team's livery on the shape of its era, lit like
 * a launch, turning slowly. Drag to spin it; it settles back into its turn.
 */

import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { buildCar } from "./carModel";
import { createRenderer, environmentFor } from "./studio";

export default function Showroom({ year = 2024, color = "#c8102e", color2, name = "", number = null, height = 220, className = "", label }) {
  const mount = useRef(null);
  const state = useRef({});

  // The stage: renderer, lights, floor and camera, built once.
  useEffect(() => {
    const host = mount.current;
    if (!host) return undefined;
    const canvas = document.createElement("canvas");
    canvas.className = "mn-showroom__canvas";
    host.appendChild(canvas);
    const renderer = createRenderer(canvas, { alpha: true });
    renderer.setClearColor(0x000000, 0);
    const scene = new THREE.Scene();
    scene.environment = environmentFor(renderer);
    scene.add(new THREE.HemisphereLight("#dfe9ff", "#20242c", 0.6));
    const key = new THREE.DirectionalLight("#ffffff", 2.2);
    key.position.set(4, 7, 5);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    Object.assign(key.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4, near: 1, far: 20 });
    key.shadow.radius = 6;
    scene.add(key);
    const rim = new THREE.DirectionalLight("#9fc2ff", 1.2);
    rim.position.set(-6, 3, -4);
    scene.add(rim);
    // A soft round floor that fades to nothing.
    const floorCanvas = document.createElement("canvas");
    floorCanvas.width = 256;
    floorCanvas.height = 256;
    const g = floorCanvas.getContext("2d");
    const gradient = g.createRadialGradient(128, 128, 10, 128, 128, 128);
    gradient.addColorStop(0, "rgba(255,255,255,0.16)");
    gradient.addColorStop(0.6, "rgba(255,255,255,0.05)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = gradient;
    g.fillRect(0, 0, 256, 256);
    const floor = new THREE.Mesh(new THREE.CircleGeometry(4.2, 64), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(floorCanvas), transparent: true, depthWrite: false }));
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);
    const shadow = new THREE.Mesh(new THREE.CircleGeometry(4, 48), new THREE.ShadowMaterial({ opacity: 0.45 }));
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.002;
    shadow.receiveShadow = true;
    scene.add(shadow);
    const camera = new THREE.PerspectiveCamera(24, 2, 0.1, 100);
    camera.position.set(6.8, 2.6, 6.8);
    camera.lookAt(0, 0.35, 0);
    const turntable = new THREE.Group();
    scene.add(turntable);

    const s = state.current;
    Object.assign(s, { renderer, scene, camera, turntable, angle: -1.05, velocity: 0.0025, dragging: false, lastX: 0 });

    const resize = () => {
      const width = host.clientWidth || 300;
      const h = host.clientHeight || height;
      renderer.setSize(width, h, false);
      camera.aspect = width / h;
      // Frame the whole car whatever the box's shape.
      camera.position.setLength(width / h < 1.4 ? 9.6 : 7.4);
      camera.updateProjectionMatrix();
    };
    resize();
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null;
    observer?.observe(host);

    const down = (event) => {
      s.dragging = true;
      s.lastX = event.clientX;
      canvas.setPointerCapture?.(event.pointerId);
    };
    const move = (event) => {
      if (!s.dragging) return;
      const dx = event.clientX - s.lastX;
      s.lastX = event.clientX;
      s.angle += dx * 0.012;
      s.velocity = dx * 0.0008;
    };
    const up = () => {
      s.dragging = false;
    };
    canvas.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);

    let frame = 0;
    const loop = () => {
      if (!s.dragging) {
        // Ease back into a slow turn after a flick.
        s.velocity += (0.0025 - s.velocity) * 0.03;
        s.angle += s.velocity;
      }
      turntable.rotation.y = s.angle;
      renderer.render(scene, camera);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
      canvas.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      floor.geometry.dispose();
      floor.material.map.dispose();
      floor.material.dispose();
      shadow.geometry.dispose();
      shadow.material.dispose();
      renderer.dispose();
      host.removeChild(canvas);
    };
  }, [height]);

  // The car itself, rebuilt when the season or the livery changes.
  useEffect(() => {
    const s = state.current;
    if (!s.turntable) return undefined;
    const car = buildCar({ year, color, color2, name, number, compound: year >= 2007 ? "soft" : null });
    car.position.x = 0.1;
    s.turntable.add(car);
    // Geometry and materials are cached and shared between cars; only the group goes.
    return () => s.turntable.remove(car);
  }, [year, color, color2, name, number]);

  return <div ref={mount} className={`mn-showroom ${className}`} style={{ height }} role="img" aria-label={label || name} />;
}

