/**
 * The podium after the flag: the first three cars on their steps, gold, silver
 * and bronze, confetti coming down and the camera circling slowly.
 */

import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { buildCar } from "./carModel";
import { createRenderer, environmentFor } from "./studio";

const STEP = [
  { place: 1, x: 0, height: 0.9, colour: "#d4af37" },
  { place: 2, x: -5.6, height: 0.6, colour: "#c0c6cc" },
  { place: 3, x: 5.6, height: 0.4, colour: "#b0703c" },
];

const numberTexture = (place, colour) => {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 128;
  const g = canvas.getContext("2d");
  g.fillStyle = "#0d1a30";
  g.fillRect(0, 0, 256, 128);
  g.fillStyle = colour;
  g.fillRect(0, 0, 256, 10);
  g.font = "900 92px Arial, sans-serif";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(String(place), 128, 74);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
};

export default function Podium({ year = 2024, cars = [], height = 260, label }) {
  const mount = useRef(null);
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
    scene.add(new THREE.HemisphereLight("#e6eeff", "#1c2230", 0.7));
    const key = new THREE.DirectionalLight("#ffffff", 2.4);
    key.position.set(6, 12, 8);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    Object.assign(key.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12, near: 1, far: 40 });
    scene.add(key);
    const floor = new THREE.Mesh(new THREE.CircleGeometry(16, 48), new THREE.ShadowMaterial({ opacity: 0.4 }));
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    const disposables = [floor.geometry, floor.material];
    STEP.forEach((step, index) => {
      const entry = cars[index];
      const block = new THREE.Mesh(new THREE.BoxGeometry(5.2, step.height, 3.2), [
        new THREE.MeshStandardMaterial({ color: "#0d1a30", roughness: 0.5 }),
        new THREE.MeshStandardMaterial({ color: "#0d1a30", roughness: 0.5 }),
        new THREE.MeshStandardMaterial({ color: step.colour, roughness: 0.25, metalness: 0.7 }),
        new THREE.MeshStandardMaterial({ color: "#0d1a30" }),
        new THREE.MeshStandardMaterial({ map: numberTexture(step.place, step.colour), roughness: 0.5 }),
        new THREE.MeshStandardMaterial({ color: "#0d1a30" }),
      ]);
      block.position.set(step.x, step.height / 2, 0);
      block.castShadow = true;
      block.receiveShadow = true;
      scene.add(block);
      disposables.push(block.geometry, ...block.material);
      if (!entry) return;
      const car = buildCar({ year, color: entry.color, color2: entry.color2, name: entry.name, compound: year >= 2007 ? "soft" : null });
      car.position.set(step.x, step.height, 0);
      car.rotation.y = -Math.PI / 2 + (index === 0 ? 0 : index === 1 ? 0.25 : -0.25);
      car.scale.setScalar(0.92);
      scene.add(car);
    });

    // Confetti in the three podium colours and the winner's.
    const count = 420;
    const confettiGeometry = new THREE.PlaneGeometry(0.12, 0.07);
    const confettiMaterial = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide });
    const confetti = new THREE.InstancedMesh(confettiGeometry, confettiMaterial, count);
    const palette = ["#d4af37", "#f3f1e9", "#c8102e", cars[0]?.color || "#f2b705", "#3e8ed8"].map((c) => new THREE.Color(c));
    const pieces = Array.from({ length: count }, (_, i) => ({
      x: (Math.random() - 0.5) * 18, y: Math.random() * 10 + 2, z: (Math.random() - 0.5) * 8,
      speed: 0.6 + Math.random() * 1.2, spin: Math.random() * 6, phase: Math.random() * 6,
    }));
    pieces.forEach((_, i) => confetti.setColorAt(i, palette[i % palette.length]));
    scene.add(confetti);
    disposables.push(confettiGeometry, confettiMaterial);

    const camera = new THREE.PerspectiveCamera(32, 2, 0.1, 200);
    const resize = () => {
      const width = host.clientWidth || 500;
      const h = host.clientHeight || height;
      renderer.setSize(width, h, false);
      camera.aspect = width / h;
      camera.updateProjectionMatrix();
    };
    resize();
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null;
    observer?.observe(host);

    let frame = 0;
    let last = performance.now();
    let angle = 0.35;
    const matrix = new THREE.Matrix4();
    const quaternion = new THREE.Quaternion();
    const euler = new THREE.Euler();
    const scale = new THREE.Vector3(1, 1, 1);
    const position = new THREE.Vector3();
    const loop = () => {
      const now = performance.now();
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      angle += dt * 0.12;
      const radius = 15;
      camera.position.set(Math.sin(angle) * radius, 4.4, Math.cos(angle) * radius);
      camera.lookAt(0, 0.9, 0);
      pieces.forEach((piece, i) => {
        piece.y -= piece.speed * dt;
        piece.spin += dt * 4;
        if (piece.y < 0) piece.y += 12;
        position.set(piece.x + Math.sin(piece.spin + piece.phase) * 0.3, piece.y, piece.z);
        euler.set(piece.spin, piece.spin * 0.7, 0);
        quaternion.setFromEuler(euler);
        matrix.compose(position, quaternion, scale);
        confetti.setMatrixAt(i, matrix);
      });
      confetti.instanceMatrix.needsUpdate = true;
      renderer.render(scene, camera);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
      disposables.forEach((item) => item.dispose?.());
      renderer.dispose();
      host.removeChild(canvas);
    };
    // A finished race's podium does not change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <div ref={mount} className="mn-showroom mn-podium" style={{ height }} role="img" aria-label={label} />;
}
