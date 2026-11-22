/**
 * The race in 3D: the circuit, the field in its liveries, and the cameras.
 *
 *   chase    behind and above the car you follow, the way a game or a drone
 *            shot rides with it.
 *   onboard  the T-camera on top of the airbox: the driver's view of the road.
 *   heli     the helicopter: high overhead and a little behind, looking down
 *            on the car and the cars around it.
 *   tv       trackside broadcast cameras: the nearest one to the car takes the
 *            shot and zooms to keep it framed.
 *
 * The race clock (see raceClock.js) already knows where every car is; this view
 * only places, turns and draws them. Props arrive every frame from the live
 * view and are read by the render loop through a ref, so React does no work
 * per frame here beyond handing them over.
 */

import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { buildCar } from "./carModel";
import { buildTrack } from "./trackScene";
import { buildRig, frame } from "./cameras";
import { onRacingLine } from "./racingLine";
import { poseAt } from "../engine/trackGeometry";
import { createRenderer, environmentFor } from "./studio";


const unwrap = (from, to) => {
  let target = to;
  while (target - from > Math.PI) target -= Math.PI * 2;
  while (target - from < -Math.PI) target += Math.PI * 2;
  return target;
};

/** A generic safety car: a low silver coupé with a light bar. */
const buildSafetyCar = () => {
  const group = new THREE.Group();
  const paint = new THREE.MeshPhysicalMaterial({ color: "#c9ccd2", metalness: 0.7, roughness: 0.25, clearcoat: 1 });
  const dark = new THREE.MeshStandardMaterial({ color: "#121418", roughness: 0.3, metalness: 0.4 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.7, 1.95), paint);
  body.position.y = 0.55;
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.5, 1.6), dark);
  cabin.position.set(-0.3, 1.1, 0);
  const bar = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.12, 1.2), new THREE.MeshStandardMaterial({ color: "#ffb000", emissive: "#ff9000", emissiveIntensity: 2 }));
  bar.position.set(-0.3, 1.42, 0);
  group.add(body, cabin, bar);
  [[1.45, 0.88], [1.45, -0.88], [-1.45, 0.88], [-1.45, -0.88]].forEach(([x, z]) => {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.33, 0.28, 20), dark);
    wheel.rotation.x = Math.PI / 2;
    wheel.position.set(x, 0.33, z);
    group.add(wheel);
  });
  group.traverse((node) => {
    node.castShadow = true;
  });
  return group;
};

/** A pit crew: a dozen figures in team colours around a stopped car. */
const buildCrew = (color) => {
  const group = new THREE.Group();
  const suit = new THREE.MeshStandardMaterial({ color, roughness: 0.7 });
  const helmet = new THREE.MeshStandardMaterial({ color: "#f3f1e9", roughness: 0.4 });
  const spots = [[1.9, 1.2], [1.9, -1.2], [-1.6, 1.25], [-1.6, -1.25], [2.4, 1.6], [2.4, -1.6], [-2.1, 1.65], [-2.1, -1.65], [3.4, 0], [-3.1, 0], [0.6, 1.5], [0.6, -1.5]];
  spots.forEach(([x, z]) => {
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.17, 0.62, 4, 8), suit);
    body.position.set(x, 0.52, z);
    body.rotation.z = (x > 0 ? -1 : 1) * 0.35;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), helmet);
    head.position.set(x * 0.94, 1.0, z);
    group.add(body, head);
  });
  return group;
};

export default function Race3D({ circuit, year, cars, focusId, mode, wet, lights, safetyCar, safetyCarOn, teams, onPick, labels, clock, sample }) {
  const mount = useRef(null);
  const props = useRef({});
  props.current = { cars, focusId, mode, wet, lights, safetyCar, safetyCarOn, onPick, clock, sample };
  const world = useRef(null);

  // Renderer, sky, sun and camera: once.
  useEffect(() => {
    const host = mount.current;
    const canvas = document.createElement("canvas");
    canvas.className = "mn-race3d__canvas";
    host.appendChild(canvas);
    const overlay = document.createElement("div");
    overlay.className = "mn-race3d__tags";
    host.appendChild(overlay);
    const renderer = createRenderer(canvas);
    const scene = new THREE.Scene();
    scene.environment = environmentFor(renderer);
    scene.environmentIntensity = 0.55;
    const sky = new THREE.Color("#8fb6dc");
    scene.background = sky;
    scene.fog = new THREE.Fog(sky, 300, 1600);
    const hemi = new THREE.HemisphereLight("#cfe4ff", "#4b5a3a", 1.1);
    scene.add(hemi);
    const sun = new THREE.DirectionalLight("#fff3dd", 2.6);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -60, right: 60, top: 60, bottom: -60, near: 10, far: 400 });
    sun.shadow.bias = -0.0004;
    scene.add(sun, sun.target);
    const camera = new THREE.PerspectiveCamera(55, 16 / 9, 0.3, 4000);
    // Rain: streaks that live in a box around the camera.
    const dropCount = 2600;
    const drops = new Float32Array(dropCount * 6);
    const rainGeometry = new THREE.BufferGeometry();
    rainGeometry.setAttribute("position", new THREE.BufferAttribute(drops, 3));
    const rain = new THREE.LineSegments(rainGeometry, new THREE.LineBasicMaterial({ color: "#c9dcf0", transparent: true, opacity: 0.45 }));
    rain.frustumCulled = false;
    rain.visible = false;
    scene.add(rain);
    const seeds = Array.from({ length: dropCount }, () => [Math.random() * 80 - 40, Math.random() * 40, Math.random() * 80 - 40]);

    const state = {
      renderer, scene, camera, sun, hemi, sky, rain, drops, seeds, overlay,
      track: null, carObjects: new Map(), tags: new Map(), crews: new Map(), safetyCar: null, rig: [], camState: {},
      cam: { pos: new THREE.Vector3(0, 50, 0), look: new THREE.Vector3(), heading: 0 }, last: performance.now(),
    };
    world.current = state;

    const resize = () => {
      const width = host.clientWidth || 800;
      const height = host.clientHeight || 480;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    resize();
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null;
    observer?.observe(host);

    // Click a car to follow it.
    const raycaster = new THREE.Raycaster();
    const click = (event) => {
      const rect = canvas.getBoundingClientRect();
      const pointer = new THREE.Vector2(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects([...state.carObjects.values()].map((entry) => entry.object), true);
      if (!hits.length) return;
      let node = hits[0].object;
      while (node && !node.userData.carId) node = node.parent;
      if (node) props.current.onPick?.(node.userData.carId);
    };
    canvas.addEventListener("click", click);

    let frame = 0;
    const loop = () => {
      frame = requestAnimationFrame(loop);
      const now = performance.now();
      const dt = Math.min(0.1, (now - state.last) / 1000);
      state.last = now;
      step(state, props.current, dt);
      renderer.render(scene, camera);
    };
    frame = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
      canvas.removeEventListener("click", click);
      rainGeometry.dispose();
      renderer.dispose();
      host.removeChild(canvas);
      host.removeChild(overlay);
      world.current = null;
    };
  }, []);

  // The circuit: rebuilt when it changes.
  useEffect(() => {
    const state = world.current;
    if (!state) return undefined;
    const track = buildTrack(circuit, { teams, year });
    state.scene.add(track.group);
    state.track = track;
    track.applyWeather(state, Boolean(state.wet));
    state.rig = buildRig(circuit);
    state.camState = {};
    state.circuit = circuit;
    return () => {
      state.scene.remove(track.group);
      track.group.traverse((node) => {
        if (node.geometry) node.geometry.dispose();
        if (node.material && !node.material.userData?.shared && !Array.isArray(node.material)) node.material.dispose();
      });
      state.track = null;
    };
  }, [circuit, teams, year]);

  // The field: one car per entrant, in its livery, built once per race.
  useEffect(() => {
    const state = world.current;
    if (!state) return undefined;
    const created = [];
    // Team-mates are told apart, as on TV, by the colour of the T-camera: black, then yellow.
    const seenTeams = new Map();
    cars.forEach(({ car, code }, index) => {
      if (state.carObjects.has(car.id)) return;
      const mate = seenTeams.get(car.teamId) || 0;
      seenTeams.set(car.teamId, mate + 1);
      const object = buildCar({ year, color: car.color, color2: car.color2, name: car.teamName || car.short || "", number: index + 1, compound: car.compound, tcam: mate ? "#f5e400" : "#111318" });
      object.userData.carId = car.id;
      state.scene.add(object);
      // F1-game name tag: position on the team colour, flag, surname, gap.
      const tag = document.createElement("div");
      tag.className = `mn-race3d__tag${car.isUser ? " is-user" : ""}`;
      tag.style.setProperty("--team", car.color);
      const position = document.createElement("span");
      position.className = "t-pos";
      tag.appendChild(position);
      if (car.nat) {
        const flag = document.createElement("img");
        flag.src = `https://flagcdn.com/w40/${car.nat}.png`;
        flag.alt = "";
        tag.appendChild(flag);
      }
      const nameNode = document.createElement("span");
      nameNode.className = "t-name";
      nameNode.textContent = (car.name || code).split(" ").filter((part) => !/^(jr|sr)\.?$/i.test(part)).pop().toUpperCase();
      tag.appendChild(nameNode);
      const gapNode = document.createElement("span");
      gapNode.className = "t-gap";
      tag.appendChild(gapNode);
      tag.userData = { position, gapNode };
      state.overlay.appendChild(tag);
      state.carObjects.set(car.id, { object, lateral: 0, last: null, compound: car.compound, spin: 0, yaw: 0, speed: 0, latAcc: 0, lonAcc: 0, steer: 0, turn: 0 });
      state.tags.set(car.id, tag);
      created.push(car.id);
    });
    return () => {
      created.forEach((id) => {
        const entry = state.carObjects.get(id);
        if (entry) state.scene.remove(entry.object);
        state.carObjects.delete(id);
        state.tags.get(id)?.remove();
        state.tags.delete(id);
      });
    };
    // Cars are created once per race; their positions arrive through the ref.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, circuit]);

  return <div ref={mount} className="mn-race3d" role="img" aria-label={labels?.near || "3D"} />;
}

/**
 * One frame. Every car is placed from the race clock itself (so motion is as
 * smooth as the display, whatever React is doing), moved onto the racing line,
 * and given the body language of a racing car: yaw that follows the line, roll
 * against the corner, dive under braking and squat under power, steering lock
 * from the radius it is turning on and wheels that roll at its speed.
 */
function step(state, props, dt) {
  const { cars = [], focusId, mode = "chase", wet, lights, safetyCar, clock, sample, safetyCarOn } = props;
  const { camera, circuit } = state;
  if (!circuit) return;
  const tau = clock ? clock.current : null;
  const simDt = tau !== null && state.lastTau !== undefined ? Math.max(0, tau - state.lastTau) : dt;
  if (tau !== null) state.lastTau = tau;

  // Poses: live from the clock where the view gave us one, otherwise as handed over.
  const items = cars.map((item) => {
    const raw = sample && tau !== null ? sample(item.car, tau) : item.pose;
    return { ...item, pose: onRacingLine(circuit, raw) };
  });

  // Side by side: a car right behind another pulls out of its wake.
  const length = circuit.length;
  const ordered = items.filter((item) => !item.pose.gone).map((item) => ({ ...item, metres: item.pose.progress * length })).sort((a, b) => b.metres - a.metres);
  const lateralTarget = new Map();
  ordered.forEach((item, index) => {
    const ahead = ordered[index - 1];
    let target = 0;
    if (ahead && !item.pose.inPit && !ahead.pose.inPit && ahead.metres - item.metres < 9) {
      // Pull to whichever side has more road.
      const room = ahead.pose.lineOffset ?? 0;
      target = room > 0 ? -2.3 : 2.3;
    }
    lateralTarget.set(item.car.id, target);
  });

  const present = new Set(items.map((item) => item.car.id));
  state.carObjects.forEach((entry, id) => {
    if (!present.has(id)) entry.object.visible = false;
  });
  state.tags.forEach((tag, id) => {
    if (!present.has(id)) tag.style.display = "none";
  });

  let focus = null;
  const smooth = (rate) => 1 - Math.exp(-rate * Math.max(simDt, dt * 0.5));
  items.forEach((item) => {
    const entry = state.carObjects.get(item.car.id);
    if (!entry) return;
    const { pose, car } = item;
    const object = entry.object;
    object.visible = !pose.gone;
    if (pose.gone) return;
    entry.lateral += ((pose.parked || pose.inPit ? 0 : lateralTarget.get(car.id) ?? 0) - entry.lateral) * Math.min(1, smooth(1.6));
    const x = pose.x - Math.sin(pose.heading) * entry.lateral;
    const z = pose.y + Math.cos(pose.heading) * entry.lateral;
    const spec = object.userData.spec;
    const wheelbase = (spec?.front ?? 1.5) - (spec?.rear ?? -1.5);

    if (entry.last && simDt > 0) {
      const travelled = Math.hypot(x - entry.last.x, z - entry.last.z);
      const speed = travelled / simDt;
      const yawWanted = pose.garage || pose.stopped ? pose.heading : Math.atan2(z - entry.last.z, x - entry.last.x);
      // Yaw follows the direction of travel, eased so sample joints never show.
      const target = travelled > 0.05 ? unwrap(entry.yaw, yawWanted) : entry.yaw;
      const previousYaw = entry.yaw;
      entry.yaw += (target - entry.yaw) * Math.min(1, smooth(14));
      const yawRate = (entry.yaw - previousYaw) / simDt;
      const accel = (speed - (entry.speed ?? speed)) / simDt;
      entry.speed = speed;
      entry.latAcc += (speed * yawRate - entry.latAcc) * Math.min(1, smooth(5));
      entry.lonAcc += (accel - entry.lonAcc) * Math.min(1, smooth(4));
      // Old cars on soft springs lean far more than modern ones.
      const soft = (spec?.era === "front" || spec?.era === "cigar" || spec?.era === "highwing") ? 2.6 : spec?.era === "wedge" ? 1.6 : 1;
      object.rotation.x = THREE.MathUtils.clamp(-entry.latAcc * 0.0028 * soft, -0.075, 0.075);
      object.rotation.z = THREE.MathUtils.clamp(entry.lonAcc * 0.0016 * soft, -0.045, 0.03);
      entry.spin += travelled;
      const curvature = speed > 1 ? yawRate / speed : 0;
      const steer = THREE.MathUtils.clamp(Math.atan(wheelbase * curvature) * 1.15, -0.5, 0.5);
      entry.steer += (steer - entry.steer) * Math.min(1, smooth(10));
      object.userData.wheels.forEach((wheel) => {
        wheel.spin.rotation.z = -entry.spin / wheel.radius;
        if (wheel.steer) wheel.pivot.rotation.y = -entry.steer;
      });
      entry.turn = yawRate;
    } else if (!entry.last) entry.yaw = pose.heading;
    entry.last = { x, z };
    object.position.set(x, 0, z);
    object.rotation.order = "YXZ";
    object.rotation.y = -entry.yaw;
    if (entry.compound !== car.compound) {
      object.userData.setCompound(car.compound);
      entry.compound = car.compound;
    }
    if (car.id === focusId) focus = { x, z, heading: entry.yaw, speed: entry.speed || 0, share: pose.progress, turn: entry.turn, spec, item: { ...item, pose } };

    // The pit crew around a car stopped in its box during the race.
    let crew = state.crews.get(car.id);
    if (pose.stopped && !pose.garage) {
      if (!crew) {
        crew = buildCrew(car.color);
        state.crews.set(car.id, crew);
        state.scene.add(crew);
      }
      crew.visible = true;
      crew.position.set(x, 0, z);
      crew.rotation.y = -pose.heading;
    } else if (crew) crew.visible = false;
  });
  if (!focus && ordered[0]) {
    const lead = state.carObjects.get(ordered[0].car.id);
    if (lead) focus = { x: lead.object.position.x, z: lead.object.position.z, heading: lead.yaw, speed: lead.speed || 0, share: ordered[0].pose.progress, spec: lead.object.userData.spec, item: ordered[0] };
  }

  // Safety car: given, or running 90 m ahead of the leader.
  let sc = safetyCar;
  if (!sc && safetyCarOn && ordered[0] && !ordered[0].pose.inPit) sc = poseAt(circuit, ((ordered[0].pose.progress % 1) + 1) % 1 + 90 / circuit.length);
  if (sc) {
    if (!state.safetyCar) {
      state.safetyCar = buildSafetyCar();
      state.scene.add(state.safetyCar);
    }
    state.safetyCar.visible = true;
    state.safetyCar.position.set(sc.x, 0, sc.y);
    state.safetyCar.rotation.y = -sc.heading;
  } else if (state.safetyCar) state.safetyCar.visible = false;

  state.track?.setLights(typeof lights === "number" ? lights : 0);

  // Weather.
  const isWet = Boolean(wet);
  if (state.wet !== isWet) {
    state.wet = isWet;
    state.track?.setWet(isWet);
    state.rain.visible = isWet;
    state.track?.applyWeather?.(state, isWet);
  }

  // Camera.
  if (focus) {
    const cam = state.cam;
    const inGarage = focus.item?.pose?.garage && mode !== "heli";
    const shot = inGarage
      ? (() => {
          const dir = new THREE.Vector3(Math.cos(focus.heading), 0, Math.sin(focus.heading));
          const car = new THREE.Vector3(focus.x, 0, focus.z);
          return { pos: car.clone().add(dir.clone().multiplyScalar(9)).setY(2.4), look: car.clone().setY(0.6), fov: 45, snap: true };
        })()
      : frame(mode, focus, circuit, state.rig, state.camState, dt);
    if (shot.snap || cam.pos.distanceTo(shot.pos) > 120) {
      cam.pos.copy(shot.pos);
      cam.look.copy(shot.look);
    } else {
      cam.pos.lerp(shot.pos, Math.min(1, dt * (shot.lag ?? 30)));
      cam.look.lerp(shot.look, Math.min(1, dt * (shot.lookLag ?? 10)));
    }
    camera.fov += (shot.fov - camera.fov) * Math.min(1, shot.snap ? 1 : dt * 3);
    camera.near = mode === "visor" || mode === "tcam" || mode === "nose" || mode === "tcamRear" ? 0.05 : 0.3;
    camera.updateProjectionMatrix();
    camera.position.copy(cam.pos);
    // A little vibration on the onboard cameras, as the real ones have.
    if ((mode === "tcam" || mode === "visor" || mode === "nose") && (focus.speed || 0) > 5) {
      const shake = Math.min(0.012, (focus.speed || 0) * 0.00012);
      camera.position.y += (Math.random() - 0.5) * shake;
    }
    camera.lookAt(cam.look);
    state.sun.position.set(focus.x + 60, 120, focus.z + 40);
    state.sun.target.position.set(focus.x, 0, focus.z);
    if (state.rain.visible) {
      const positions = state.drops;
      state.seeds.forEach((seed, i) => {
        seed[1] -= dt * 28;
        if (seed[1] < 0) seed[1] += 40;
        const px = cam.pos.x + seed[0];
        const py = seed[1];
        const pz = cam.pos.z + seed[2];
        positions.set([px, py, pz, px + 0.15, py + 0.9, pz], i * 6);
      });
      state.rain.geometry.attributes.position.needsUpdate = true;
    }
  }

  // Name tags over the cars in shot.
  const width = state.renderer.domElement.clientWidth;
  const height = state.renderer.domElement.clientHeight;
  const v = new THREE.Vector3();
  const onboard = mode === "tcam" || mode === "visor" || mode === "nose" || mode === "tcamRear";
  items.forEach((item) => {
    const tag = state.tags.get(item.car.id);
    const entry = state.carObjects.get(item.car.id);
    if (!tag || !entry) return;
    v.copy(entry.object.position).setY(1.6);
    const distance = v.distanceTo(camera.position);
    v.project(camera);
    const visible = !item.pose.gone && v.z < 1 && Math.abs(v.x) < 1.1 && Math.abs(v.y) < 1.1 && distance < (mode === "heli" ? 500 : 260) && !(onboard && item.car.id === focusId);
    tag.style.display = visible ? "flex" : "none";
    if (!visible) return;
    tag.style.transform = `translate(${((v.x + 1) / 2) * width}px, ${((1 - v.y) / 2) * height}px) translate(-50%, -130%)`;
    const parts = tag.userData;
    const pos = item.row ? String(item.row.position) : "";
    if (parts.position.textContent !== pos) parts.position.textContent = pos;
    const gap = item.pose.stopped && !item.pose.garage
      ? `BOX ${item.pose.stopLeft.toFixed(1)}s`
      : item.tag ?? (item.row && item.row.position > 1 && item.row.gap !== undefined ? `+${item.row.gap.toFixed(3)}` : "");
    if (parts.gapNode.textContent !== gap) parts.gapNode.textContent = gap;
    tag.classList.toggle("is-focus", item.car.id === focusId);
  });
}
