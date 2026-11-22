/**
 * The car on a turntable: the team's livery on the shape of its era, lit like
 * a launch, turning slowly. Drag to spin it; it settles back into its turn.
 *
 * Look (RF-3D-06, DESIGN.md "pit wall at night"): a dark studio environment
 * with soft panels for the paint to reflect, PBR Neutral tone mapping so the
 * livery keeps its colours, a cool rim light to cut the silhouette out of the
 * dark card, a baked contact shadow, and the hero level of the GLB (LOD0
 * geometry, textures up to 2048 px), drawn at >= 1.5x pixel ratio with MSAA.
 */

import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { buildCar } from "./carModel";
import { createRenderer, studioEnvironmentFor } from "./studio";
import { createContactShadow } from "./contactShadow";
import { carAssetFor } from "./assets/manifest";
import { createAssetCar } from "./assets/assetCar";
import { frameTurntable } from "./showroomFraming";

// Mounted turntables, oldest first. Only the newest one on screen draws (RNF-02): a moment's showroom over
// Central's car card, or a card scrolled out of view, keeps its last frame and costs no GPU time.
const stages = [];
const drawing = () => [...stages].reverse().find((stage) => stage.onScreen);

const FOV = 24;
const HERO_MIN_PX = 700;
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
    if (!node.isMesh || !node.geometry || node.name === "contact-shadow") return;
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
    const renderer = createRenderer(canvas, { alpha: true, shadows: false, tone: "neutral", supersample: true });
    renderer.setClearColor(0x000000, 0);
    const scene = new THREE.Scene();
    scene.environment = studioEnvironmentFor(renderer);
    scene.environmentIntensity = 1.5;
    scene.add(new THREE.HemisphereLight("#c9d8f2", "#14181f", 0.5));
    // Key from the front-left above, a cool rim from behind (the silhouette against the dark card), a weak warm fill.
    const key = new THREE.DirectionalLight("#fff6ea", 1.1);
    key.position.set(4, 7, 5);
    scene.add(key);
    const rim = new THREE.DirectionalLight("#a9c8ff", 2.2);
    rim.position.set(-6, 3.5, -5);
    scene.add(rim);
    const fill = new THREE.DirectionalLight("#ffd9a0", 0.6);
    fill.position.set(6, 1, -2);
    scene.add(fill);
    // A soft round floor that fades to nothing.
    const floorCanvas = document.createElement("canvas");
    floorCanvas.width = 256;
    floorCanvas.height = 256;
    const g = floorCanvas.getContext("2d");
    const gradient = g.createRadialGradient(128, 128, 10, 128, 128, 128);
    gradient.addColorStop(0, "rgba(190,210,255,0.13)");
    gradient.addColorStop(0.6, "rgba(190,210,255,0.04)");
    gradient.addColorStop(1, "rgba(190,210,255,0)");
    g.fillStyle = gradient;
    g.fillRect(0, 0, 256, 256);
    const floorTexture = new THREE.CanvasTexture(floorCanvas);
    floorTexture.colorSpace = THREE.SRGBColorSpace;
    const floor = new THREE.Mesh(new THREE.CircleGeometry(4.2, 64), new THREE.MeshBasicMaterial({ map: floorTexture, transparent: true, depthWrite: false }));
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);
    // Baked under each car (and again when a sharper level of the GLB arrives); it turns with the car.
    const contact = createContactShadow();
    const camera = new THREE.PerspectiveCamera(FOV, 2, 0.1, 100);
    camera.position.copy(VIEW).multiplyScalar(7.4);
    camera.lookAt(0, 0.35, 0);
    const turntable = new THREE.Group();
    scene.add(turntable);

    const s = state.current;
    Object.assign(s, { renderer, scene, camera, turntable, contact, baked: null, angle: -1.05, velocity: 0.0025, dragging: false, lastX: 0, fit: null, aspect: 2 });
    s.onScreen = true;
    stages.push(s);
    const seen = typeof IntersectionObserver !== "undefined" ? new IntersectionObserver(([entry]) => { s.onScreen = entry.isIntersecting; }) : null;
    seen?.observe(host);

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
      if (drawing() !== s) {
        frame = requestAnimationFrame(loop);
        return;
      }
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
      // Re-bake the contact shadow for a new car or a newly arrived level.
      const stamp = s.car ? `${s.car.id}:${s.car.userData.loaded ?? 0}` : null;
      if (s.car && stamp !== s.baked && contact.bake(renderer, s.car)) s.baked = stamp;
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
      seen?.disconnect();
      stages.splice(stages.indexOf(s), 1);
      canvas.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      floor.geometry.dispose();
      floor.material.map.dispose();
      floor.material.dispose();
      contact.dispose();
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
    // The hero level (2048 px textures) only where it shows: a canvas at least ~700 device pixels wide (Car
    // screen, phone at 2x). Small cards (Central at 1x) get LOD0, which the race needs anyway.
    const devicePixels = (mount.current?.clientWidth || 0) * (window.devicePixelRatio || 1);
    const car = asset ? createAssetCar({ asset, placeholder: procedural, renderer: s.renderer, year, closeUp: true, hero: devicePixels >= HERO_MIN_PX }) : procedural;
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

