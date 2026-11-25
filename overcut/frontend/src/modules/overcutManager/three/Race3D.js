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
 * only places, turns and draws them. Onboards come from data/balance/cameras.json
 * by era (an onboard the season lacks is filmed by the chase camera); their
 * vibration is seeded noise on the race clock (RNF-05), and the camera on air is
 * published every frame on `cameraBus` ({ current: { id, kind, mode, subjectId,
 * position, target, fov } }, F1M24-GAMEPLAY §1.7) for the TV listener of the sound. Props arrive every frame from the live
 * view and are read by the render loop through a ref, so React does no work
 * per frame here beyond handing them over.
 *
 * CAM-3 (F1M24-GAMEPLAY §2.5, §2.9; RF-3D-04, RF-SIM-12, RNF-05, RNF-07):
 *   - pit and garage sequences: on TV, when the car on air pits (or leaves its garage in a
 *     session) components/director/pitSequence.js tells it with the pit-lane cameras of
 *     three/pitCameras.js, over the zones; the crew steps into the box crewLeadSec before the car.
 *   - replays: `replayBuffer` (components/replay/replayBuffer.js createReplayBuffer) is filled
 *     from `sample` at fixed instants of the race clock; `replay` = { plan, clock } (planReplay,
 *     a ref with the seconds since it began) draws the buffer instead of the race - the angles of
 *     the plan, the subject of the replay - and the live view owns the clock and the pause.
 *   - the safety pass (three/viewOverlap.js): no two cars drawn inside one another, every
 *     correction counted (viewOverlapStats).
 * None of it touches the race (RNF-05): it reads poses and draws.
 */

import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { buildCar } from "./carModel";
import { buildTrack } from "./trackScene";
import { buildPitRig, buildZoneRig, critDampStep, fitRig, frame, garageShot, isOnboard, modeForYear, onboardFor, pitShot, rigCamOfType, scParkedPose, scriptShot, seedOf, shakeOffset, tvRival } from "./cameras";
import { onRacingLine } from "./racingLine";
import { QUICK_REPLAY, boxSpecFor, countOverlap, overlapPass } from "./viewOverlap";
import { boxPointOf, etaToBox, stepSequence } from "../components/director/pitSequence";
import { recordReplay, replayFrameAt, replayPoseAt, tracksideFor } from "../components/replay/replayBuffer";
import broadcast from "../data/balance/broadcast.json";
import { poseAt } from "../engine/trackGeometry";
import { createRenderer, environmentFor } from "./studio";
import { carAssetFor, circuitAssetFor } from "./assets/manifest";
import { createAssetCar } from "./assets/assetCar";
import { buildHeightField, loadCircuitAsset } from "./assets/assetCircuit";
import { pruneOldCaches } from "./assets/loader";


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

const CREW_LEAD_SEC = broadcast.sequences.pitStop.crewLeadSec;

export default function Race3D({ circuit, year, cars, focusId, mode, wet, lights, safetyCar, safetyCarOn, teams, onPick, labels, clock, sample, cameraBus, seed, replayBuffer, replay, director }) {
  const mount = useRef(null);
  const props = useRef({});
  props.current = { cars, focusId, mode, wet, lights, safetyCar, safetyCarOn, onPick, clock, sample, year, cameraBus, seed, replayBuffer, replay, director };
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

    pruneOldCaches();
    const state = {
      heightAt: null,
      field: null,
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
    // The TV rig by zones (CAM-2): the circuit's camera-zones.json, or zones built from its geometry.
    state.rig = buildZoneRig(circuit);
    state.camState = {};
    state.circuit = circuit;
    // CAM-3: the pit-lane cameras on this circuit's lane, and no sequence under way.
    state.pitRig = buildPitRig(circuit);
    state.pitSeq = null;
    state.pitBox = null;
    // The real circuit, when the pipeline calibrated one for this layout (RF-3D-01, RF-3D-03); the
    // procedural track stays on screen until it arrives, and if it never does (RF-3D-02).
    let disposed = false;
    let assetScene = null;
    const asset = circuit.splineId ? circuitAssetFor({ splineId: circuit.splineId }) : null;
    if (asset) {
      loadCircuitAsset(asset, state.renderer)
        .then(({ scene, heightAt, spline }) => {
          if (disposed) return null;
          assetScene = scene;
          state.scene.add(scene);
          track.group.visible = false;
          state.heightAt = heightAt;
          // Once per circuit: what stands around the road, then the rig fitted to it (RF-3D-04).
          return buildHeightField(scene, spline.points).then((field) => {
            if (disposed || !field) return;
            state.field = field;
            state.rig = fitRig(buildZoneRig(circuit), circuit, field, heightAt);
            state.camState = {};
          });
        })
        .catch(() => {});
    }
    return () => {
      disposed = true;
      if (assetScene) state.scene.remove(assetScene);
      state.heightAt = null;
      state.field = null;
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
      const procedural = buildCar({ year, color: car.color, color2: car.color2, name: car.teamName || car.short || "", number: index + 1, compound: car.compound, tcam: mate ? "#f5e400" : "#111318" });
      // The team's real car when the manifest has one for this season (RF-3D-01); its era's procedural car otherwise.
      const asset = carAssetFor(year, car.teamId);
      const object = asset ? createAssetCar({ asset, placeholder: procedural, renderer: state.renderer, year }) : procedural;
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
  const { cars = [], wet, lights, safetyCar, clock, sample, safetyCarOn, year, cameraBus, seed, replayBuffer, replay, director } = props;
  const { camera, circuit } = state;
  if (!circuit) return;
  const liveTau = clock ? clock.current : null;

  // CAM-3 replays: the buffer fills from the race clock while the race is on screen; a replay
  // draws the buffer at the replay's own race time, from the angles of its plan.
  const plan = replay?.plan && replayBuffer ? replay.plan : null;
  const replayed = plan ? replayFrameAt(plan, replay.clock ? replay.clock.current : 0) : null;
  if (!replayed && replayBuffer && liveTau !== null) {
    const byId = new Map(cars.map((item) => [item.car.id, item]));
    recordReplay(replayBuffer, liveTau, [...byId.keys()], (id, t) => (sample ? sample(byId.get(id).car, t) : byId.get(id).pose));
  }
  const focusId = replayed ? plan.subjectId ?? props.focusId : props.focusId;
  // SRS 6.2: an onboard the cars of this season did not carry is filmed by the chase camera
  // (a replay angle may use the replay-only close-up, cameras.json).
  let mode = modeForYear(props.mode || "chase", year);
  let lockCam = null;
  if (replayed) {
    const angle = replayed.angle;
    if (angle.kind === "onboard") mode = angle.cam;
    else {
      const key = `${plan.at}|${angle.from}`;
      if (state.replayAngle?.key !== key) {
        const start = replayPoseAt(replayBuffer, focusId, angle.from);
        state.replayAngle = { key, cam: tracksideFor(state.rig, start ? ((start.progress % 1) + 1) % 1 : NaN, angle.slot, seed ?? 0) };
      }
      lockCam = state.replayAngle.cam;
      mode = lockCam ? "tv" : "chase";
    }
  } else state.replayAngle = null;
  const onboard = isOnboard(mode);
  const tau = replayed ? replayed.tau : liveTau;
  const simDt = tau !== null && state.lastTau !== undefined ? Math.max(0, tau - state.lastTau) : dt;
  if (tau !== null) state.lastTau = tau;

  // Poses: live from the clock where the view gave us one, otherwise as handed over; in a replay, from the buffer.
  const items = cars.map((item) => {
    const raw = replayed ? replayPoseAt(replayBuffer, item.car.id, tau) || { ...item.pose, gone: true } : sample && tau !== null ? sample(item.car, tau) : item.pose;
    return { ...item, pose: onRacingLine(circuit, raw) };
  });

  // Side by side: a car right behind another pulls out of its wake.
  const length = circuit.length;
  const ordered = items.filter((item) => !item.pose.gone).map((item) => ({ ...item, metres: item.pose.progress * length })).sort((a, b) => b.metres - a.metres);
  const lateralTarget = new Map();
  ordered.forEach((item, index) => {
    const ahead = ordered[index - 1];
    let target = 0;
    // The step race places cars sideways itself (pose.lateral, SIM-FISICA §3.1): the view only
    // pulls a car out of a wake on the quick replay, which has no lateral of its own.
    if (item.pose.lateral === undefined && ahead && !item.pose.inPit && !ahead.pose.inPit && ahead.metres - item.metres < QUICK_REPLAY.wakeMetres) {
      // Pull to whichever side has more road (broadcast.json viewSafety.quickReplay).
      const room = ahead.pose.lineOffset ?? 0;
      target = room > 0 ? -QUICK_REPLAY.pullOutMetres : QUICK_REPLAY.pullOutMetres;
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
  const drawn = [];
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
      // SIM-FISICA §3.7 (WP9): the step race's own speed; the quick replay's from how far it moved.
      const speed = Number.isFinite(pose.v) ? pose.v : travelled / simDt;
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
      entry.pitch = THREE.MathUtils.clamp(entry.lonAcc * 0.0016 * soft, -0.045, 0.03);
      // RF-SIM-01 / RF-SIM-02: the step race gives the body motion itself (engine/sim/powertrain.js: weight
      // transfer by era, degrees; + nose down, roll to the outside), the side from the view's own turn.
      if (Number.isFinite(pose.pitch)) entry.pitch = THREE.MathUtils.clamp((-pose.pitch * Math.PI) / 180, -0.06, 0.04);
      if (Number.isFinite(pose.roll)) object.rotation.x = -Math.sign(entry.latAcc) * Math.min(0.09, (Math.abs(pose.roll) * Math.PI) / 180);
      object.rotation.z = entry.pitch;
      entry.spin += travelled;
      const curvature = speed > 1 ? yawRate / speed : 0;
      const steer = THREE.MathUtils.clamp(Math.atan(wheelbase * curvature) * 1.15, -0.5, 0.5);
      entry.steer += (steer - entry.steer) * Math.min(1, smooth(10));
      object.userData.wheels.forEach((wheel) => {
        wheel.spin.rotation.z = -entry.spin / wheel.radius;
        if (wheel.steer) wheel.pivot.rotation.y = -entry.steer;
      });
      object.userData.sync?.();
      entry.turn = yawRate;
    } else if (!entry.last) entry.yaw = pose.heading;
    entry.last = { x, z };
    let ground = state.heightAt && Number.isFinite(pose.progress) ? state.heightAt(pose.progress) : 0;
    // In the pit lane, off the racing line the heights were sampled on, the grid says where the road is.
    if (pose.inPit && state.field) ground = state.field.floorNear(x, z, ground) ?? ground;
    object.position.set(x, ground, z);
    // For the safety pass (CAM-3): the cars on the road, where they are drawn and which way the road takes them.
    if (!pose.inPit && !pose.parked && !pose.garage && !pose.onGrid && Number.isFinite(pose.progress)) drawn.push({ id: car.id, x, z, heading: pose.heading, along: (((pose.progress % 1) + 1) % 1) * length, object });
    object.rotation.order = "YXZ";
    object.rotation.y = -entry.yaw;
    // Up and down the hills of a real circuit the car pitches with the road.
    if (state.heightAt && Number.isFinite(pose.progress) && !pose.inPit) {
      const slope = (state.heightAt(pose.progress + 3 / length) - state.heightAt(pose.progress - 3 / length)) / 6;
      object.rotation.z = (entry.pitch || 0) + Math.atan(slope);
    }
    if (entry.compound !== car.compound) {
      object.userData.setCompound(car.compound);
      entry.compound = car.compound;
    }
    if (car.id === focusId) {
      focus = { x, z, y: ground, heading: entry.yaw, speed: entry.speed || 0, share: pose.progress, turn: entry.turn, spec, item: { ...item, pose } };
      // The gear on the steering wheel (pose.gear from the power unit), read only from the cockpit.
      if (onboard && Number.isFinite(pose.gear)) object.userData.setGear?.(pose.gear);
    }

    // The pit crew around a car stopped in its box during the race - and, for the car on air,
    // already waiting in the box crewLeadSec before it arrives (CAM-3, broadcast.json pitStop).
    let crew = state.crews.get(car.id);
    const waiting = !pose.stopped && car.id === focusId && etaToBox(pose) <= CREW_LEAD_SEC ? boxPointOf(pose) : null;
    if ((pose.stopped && !pose.garage) || waiting) {
      if (!crew) {
        crew = buildCrew(car.color);
        state.crews.set(car.id, crew);
        state.scene.add(crew);
      }
      crew.visible = true;
      if (waiting) crew.position.set(waiting.x, ground, waiting.y);
      else crew.position.set(x, ground, z);
      crew.rotation.y = -(waiting ? waiting.heading : pose.heading);
    } else if (crew) crew.visible = false;
  });

  // The safety pass (CAM-3 no-overlap-view): no two silhouettes inside one another, each correction counted.
  if (drawn.length > 1) {
    const result = overlapPass(drawn, boxSpecFor(year));
    countOverlap(result);
    result.fixes.forEach((fix, id) => {
      const entry = drawn.find((item) => item.id === id);
      if (!entry) return;
      entry.object.position.x += fix.dx;
      entry.object.position.z += fix.dz;
      if (focus && focus.item?.car?.id === id) {
        focus.x += fix.dx;
        focus.z += fix.dz;
      }
    });
  }
  if (!focus && ordered[0]) {
    const lead = state.carObjects.get(ordered[0].car.id);
    if (lead) focus = { x: lead.object.position.x, y: lead.object.position.y, z: lead.object.position.z, heading: lead.yaw, speed: lead.speed || 0, share: ordered[0].pose.progress, spec: lead.object.userData.spec, item: ordered[0] };
  }

  // Safety car: given, or running 90 m ahead of the leader.
  let sc = safetyCar;
  if (!sc && safetyCarOn && ordered[0] && !ordered[0].pose.inPit) sc = poseAt(circuit, ((ordered[0].pose.progress % 1) + 1) % 1 + 90 / circuit.length);
  // CAM-4: before lights out the safety car waits behind the grid, in the years it exists (the director says so).
  if (!sc && director?.scParked) sc = scParkedPose(circuit, cars.length);
  if (sc) {
    if (!state.safetyCar) {
      state.safetyCar = buildSafetyCar();
      state.scene.add(state.safetyCar);
    }
    state.safetyCar.visible = true;
    const scShare = Number.isFinite(sc.progress) ? sc.progress : ordered[0] ? ordered[0].pose.progress + 90 / circuit.length : null;
    state.safetyCar.position.set(sc.x, state.heightAt && scShare !== null ? state.heightAt(scShare) : 0, sc.y);
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
    // CAM-2: the zone cameras are drawn with the race seed (the circuit and year when the live view
    // gives none), and the TV frame opens for two when the focused car is racing a rival.
    state.camState.seed = seed ?? seedOf(`${circuit.splineId ?? circuit.id ?? ""}|${year ?? ""}`);
    if (mode === "tv") {
      const rival = tvRival(ordered, focus.item?.car?.id, state.carObjects);
      focus.rival = rival ? { x: rival.object.position.x, z: rival.object.position.z } : null;
    }
    const world = state.heightAt ? { heightAt: state.heightAt, field: state.field } : null;
    // CAM-3 pit-sequence / garage exit: on TV (not on a camera the viewer picked, not in a replay)
    // the stop of the car on air is told with the pit cameras, on the race clock (RNF-05).
    const subjectPose = focus.item?.pose;
    const subjectId = focus.item?.car?.id ?? null;
    let seqCam = null;
    if (mode === "tv" && !replayed && !lockCam) {
      const was = state.pitSeq;
      state.pitSeq = stepSequence(was, { carId: subjectId, pose: subjectPose, tau: tau ?? state.viewTime ?? 0, seed: state.camState.seed, etaSec: etaToBox(subjectPose) });
      if (state.pitBox && state.pitBox.carId !== subjectId) state.pitBox = null;
      const box = subjectPose?.inPit ? boxPointOf(subjectPose) : null;
      if (box) state.pitBox = { ...box, carId: subjectId };
      else if (!subjectPose?.inPit && !state.pitSeq.active) state.pitBox = null;
      if (state.pitSeq.active) seqCam = state.pitSeq.cam;
      // Out of the sequence the trackside director chooses afresh (and cuts).
      else if (was?.active) state.camState.tvCam = null;
    } else state.pitSeq = null;
    state.camState.lockCam = lockCam;
    // CAM-4 start-finish-scripts and onboard-inserts: on TV (not on a camera the viewer picked, not in
    // a replay) the director's script or insert shot (`director`, the directorState result) takes the air.
    const scripted = mode === "tv" && !replayed && !lockCam && director && (director.shotKind === "script" || director.shotKind === "insert") && director.cameraId ? director : null;
    let scriptShotOn = null;
    let scriptBus = null;
    if (scripted && !inGarage) {
      const id = scripted.cameraId;
      const kind = scripted.camType;
      if (kind === "script") scriptShotOn = scriptShot(id, focus, circuit, { gridCount: cars.length, world });
      else if (kind === "onboard" || kind === "chase" || kind === "heli") scriptShotOn = frame(id, focus, circuit, state.rig, state.camState, dt, world);
      else if (kind === "rig") {
        const rigCam = rigCamOfType(state.rig, String(id).slice(4), focus);
        if (rigCam) {
          state.camState.lockCam = rigCam;
          scriptShotOn = frame("tv", focus, circuit, state.rig, state.camState, dt, world);
          state.camState.lockCam = lockCam;
          scriptBus = { id: rigCam.id, kind: rigCam.type };
        }
      }
      if (scriptShotOn && !scriptBus) scriptBus = { id, kind: kind === "script" ? "script" : kind === "onboard" ? "onboard" : kind };
    }
    const scriptKey = scriptShotOn ? `${scripted.cameraId}|${focus.item?.car?.id ?? ""}` : null;
    if (scriptShotOn && state.lastScriptKey !== scriptKey) scriptShotOn.snap = true;
    // Out of a script the trackside director chooses afresh (and cuts).
    if (!scriptShotOn && state.lastScriptKey) state.camState.tvCam = null;
    state.lastScriptKey = scriptKey;
    let shot = null;
    if (inGarage) shot = garageShot(focus);
    else if (scriptShotOn) shot = scriptShotOn;
    else if (seqCam === "chase") shot = frame("chase", focus, circuit, state.rig, state.camState, dt, world);
    else if (seqCam) shot = pitShot(seqCam, focus, circuit, state.pitRig || [], state.pitBox, world);
    if (shot && seqCam && state.lastSeqCam !== seqCam) shot.snap = true;
    state.lastSeqCam = seqCam;
    if (!shot) shot = frame(mode, focus, circuit, state.rig, state.camState, dt, world);
    if (replayed && state.lastReplayKey !== `${plan.at}|${replayed.angle.from}`) {
      shot.snap = true;
      state.lastReplayKey = `${plan.at}|${replayed.angle.from}`;
    }
    // On a real circuit the road climbs and falls: a shot framed on the flat plane follows the car's height.
    if (focus.y && !shot.abs) {
      shot.pos = shot.pos.clone();
      shot.look = shot.look.clone();
      shot.pos.y += focus.y;
      shot.look.y += focus.y;
    }
    if (shot.snap || cam.pos.distanceTo(shot.pos) > 120) {
      cam.pos.copy(shot.pos);
      cam.look.copy(shot.look);
      cam.lookVel = null;
    } else {
      // The camera eases in race time: at 10x the cars cover ten times the road per frame, and a lens
      // easing in wall-clock time would trail tens of metres behind its car (out of a long-lens TV shot).
      const ease = Math.max(dt, Math.min(simDt, 0.5));
      cam.pos.lerp(shot.pos, Math.min(1, ease * (shot.lag ?? 30)));
      if (shot.critDamp) {
        // The TV lens on a critically damped spring (framing.byType critDamp): no overshoot.
        if (!cam.lookVel) cam.lookVel = new THREE.Vector3();
        ["x", "y", "z"].forEach((axis) => {
          const next = critDampStep(cam.look[axis], cam.lookVel[axis], shot.look[axis], shot.critDamp, ease);
          cam.look[axis] = next.x;
          cam.lookVel[axis] = next.v;
        });
      } else {
        cam.lookVel = null;
        cam.look.lerp(shot.look, Math.min(1, ease * (shot.lookLag ?? 10)));
      }
    }
    camera.fov += (shot.fov - camera.fov) * Math.min(1, shot.snap ? 1 : dt * 3);
    camera.near = shot.near ?? 0.3;
    camera.updateProjectionMatrix();
    camera.position.copy(cam.pos);
    // A little vibration on the onboard cameras, as the real ones have: seeded noise on the race
    // clock (the view's own time when there is none), never Math.random (RNF-05).
    state.viewTime = (state.viewTime || 0) + dt;
    const mount = !inGarage && scriptBus?.kind === "onboard" ? onboardFor(scriptBus.id) : !inGarage && !scriptBus && onboard ? onboardFor(mode) : null;
    if (mount?.shake) camera.position.y += shakeOffset(mount.shake, focus.speed || 0, tau ?? state.viewTime, seedOf(`${focus.item?.car?.id ?? ""}|${mode}`));
    camera.lookAt(cam.look);
    // The camera on air, for whoever listens (the TV sound, AUD-2).
    if (cameraBus) {
      // A TV shot no tower can take is flown by the helicopter (cameras.js frame).
      const fallback = mode === "tv" && !inGarage && !seqCam && !scriptBus && state.camState.fallback;
      const tv = mode === "tv" && !inGarage && !seqCam && !scriptBus && !fallback ? state.camState.tvCam : null;
      // A pit-sequence shot is named by its pit camera (kind "pit"), the chase shot of a garage exit as the chase camera.
      const pit = !inGarage && !scriptBus && seqCam ? seqCam : null;
      // A script or insert shot (CAM-4) by its own camera: kind "script", "onboard", "chase", "heli" or the trackside type.
      const scriptOn = !inGarage ? scriptBus : null;
      cameraBus.current = {
        id: inGarage ? "garage" : scriptOn ? scriptOn.id : pit ?? (fallback ? "heli" : tv?.id ?? mode),
        kind: inGarage ? "garage" : scriptOn ? scriptOn.kind : pit ? (pit === "chase" ? "chase" : "pit") : fallback ? "heli" : tv ? tv.type : onboard ? "onboard" : mode,
        mode,
        replay: Boolean(replayed),
        subjectId: focus.item?.car?.id ?? null,
        position: { x: camera.position.x, y: camera.position.y, z: camera.position.z },
        target: { x: cam.look.x, y: cam.look.y, z: cam.look.z },
        fov: camera.fov,
      };
    }
    const base = focus.y || 0;
    state.sun.position.set(focus.x + 60, base + 120, focus.z + 40);
    state.sun.target.position.set(focus.x, base, focus.z);
    if (state.rain.visible) {
      const positions = state.drops;
      state.seeds.forEach((seed, i) => {
        seed[1] -= dt * 28;
        if (seed[1] < 0) seed[1] += 40;
        const px = cam.pos.x + seed[0];
        const py = base + seed[1];
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
  items.forEach((item) => {
    const tag = state.tags.get(item.car.id);
    const entry = state.carObjects.get(item.car.id);
    if (!tag || !entry) return;
    v.copy(entry.object.position);
    v.y += 1.6;
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
