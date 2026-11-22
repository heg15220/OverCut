/**
 * The car on a turntable: the team's livery on the shape of its era, lit like
 * a launch, turning slowly. Drag to spin it; it settles back into its turn.
 */

import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { buildCar } from "./carModel";
import { createRenderer, environmentFor } from "./studio";
import { carAssetFor } from "./assets/manifest";
import { createAssetCar } from "./assets/assetCar";
import { frameTurntable } from "./showroomFraming";

const FOV = 24;
// A low three-quarter view, the angle of a launch photo.
const VIEW = new THREE.Vector3(6.8, 2.6, 6.8).normalize();
const ELEVATION = Math.asin(VIEW.y);

/**
 * The car's footprint about the turntable axis, measured with the turntable
 * square-on so the answer does not depend on where it is in its turn. The car
 * is re-centred on the axis so it spins in place.
 */
const measure = (turntable, car) => {
  const angle = turntable.rotation.y;
  turntable.rotation.y = 0;
  turntable.updateMatrixWorld(true);
  const box = new THREE.Box3();
  const part = new THREE.Box3();
  car.traverseVisible((node) => {
    if (!node.isMesh || !node.geometry) return;
    if (!node.geometry.boundingBox) node.geometry.computeBoundingBox();
    part.copy(node.geometry.boundingBox).applyMatrix4(node.matrixWorld);
    box.union(part);
  });
  turntable.rotation.y = angle;
  turntable.updateMatrixWorld(true);
  if (box.isEmpty()) return null;
  const centre = box.getCenter(new THREE.Vector3());
  car.position.x -= centre.x;
  car.position.z -= centre.z;
  const size = box.getSize(new THREE.Vector3());
  return { radius: Math.hypot(size.x, size.z) / 2, minY: box.min.y, maxY: box.max.y };
};

export default function Showroom({ year = 2024, color = "#c8102e", color2, name = "", number = null, height = 220, className = "", label, teamRef = null, margin = 0.06 }) {
  // The team's real car of that season when the manifest has it (RF-3D-01), with its author and licence (RF-3D-06).
  const asset = teamRef ? carAssetFor(year, teamRef) : null;
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
    const camera = new THREE.PerspectiveCamera(FOV, 2, 0.1, 100);
    camera.position.copy(VIEW).multiplyScalar(7.4);
    camera.lookAt(0, 0.35, 0);
    const turntable = new THREE.Group();
    scene.add(turntable);

    const s = state.current;
    Object.assign(s, { renderer, scene, camera, turntable, angle: -1.05, velocity: 0.0025, dragging: false, lastX: 0, fit: null, aspect: 2 });

    // Frame the car by its own size for the box's shape (any aspect, phone to ultra-wide).
    s.frame = () => {
      const fit = s.fit || { radius: 2.9, minY: 0, maxY: 1 };
      const { distance, targetY } = frameTurntable({ ...fit, aspect: s.aspect, fov: FOV, elevation: ELEVATION, margin: s.margin ?? 0.06 });
      camera.position.copy(VIEW).multiplyScalar(distance);
      camera.position.y += targetY;
      camera.lookAt(0, targetY, 0);
      camera.far = Math.max(100, distance * 4);
      camera.updateProjectionMatrix();
    };

    const resize = () => {
      const width = host.clientWidth || 300;
      const h = host.clientHeight || (typeof height === "number" ? height : 220);
      renderer.setSize(width, h, false);
      camera.aspect = width / h;
      s.aspect = width / h;
      s.frame();
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
    let tick = 0;
    const loop = () => {
      // The GLB arrives after the placeholder (lightest LOD first): re-measure now and then.
      tick += 1;
      if (s.car && tick % 20 === 0) {
        const fit = measure(turntable, s.car);
        const old = s.fit;
        if (fit && (!old || Math.abs(fit.radius - old.radius) > old.radius * 0.01 || Math.abs(fit.maxY - old.maxY) > 0.02 || Math.abs(fit.minY - old.minY) > 0.02)) {
          s.fit = fit;
          s.frame();
        }
      }
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

  useEffect(() => {
    state.current.margin = margin;
    state.current.frame?.();
  }, [margin]);

  // The car itself, rebuilt when the season or the livery changes.
  useEffect(() => {
    const s = state.current;
    if (!s.turntable) return undefined;
    const procedural = buildCar({ year, color, color2, name, number, compound: year >= 2007 ? "soft" : null });
    const car = asset ? createAssetCar({ asset, placeholder: procedural, renderer: s.renderer, year }) : procedural;
    s.turntable.add(car);
    s.car = car;
    s.fit = measure(s.turntable, car);
    s.frame?.();
    // Geometry and materials are cached and shared between cars; only the group goes.
    return () => {
      s.turntable.remove(car);
      if (s.car === car) s.car = null;
    };
  }, [year, color, color2, name, number, asset, height]);

  return (
    <figure className={`mn-showroom-frame ${className}`}>
      <div ref={mount} className="mn-showroom" style={{ height }} role="img" aria-label={label || name} />
      {asset && (
        <figcaption className="mn-showroom__credit">
          {asset.chassis ? `${asset.chassis} · ` : ""}
          {asset.source ? (
            <a href={asset.source} target="_blank" rel="noopener noreferrer">
              {asset.author || "?"}
            </a>
          ) : (
            asset.author || "?"
          )}
          {" · "}
          {asset.license || "?"}
          {asset.status === "review" ? " · por revisar" : ""}
        </figcaption>
      )}
    </figure>
  );
}

