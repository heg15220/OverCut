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
 * position, target, fov } }, F1M24-GAMEPLAY Â§1.7) for the TV listener of the sound. Props arrive every frame from the live
 * view and are read by the render loop through a ref, so React does no work
 * per frame here beyond handing them over.
 *
 * CAM-3 (F1M24-GAMEPLAY Â§2.5, Â§2.9; RF-3D-04, RF-SIM-12, RNF-05, RNF-07):
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
 *
 * CAM-5 (F1M24-GAMEPLAY §2.11 sc-pose-from-sim; RF-SIM-10, RF-3D-04, RNF-07): the safety car is
 * drawn where the engine puts it - `sc`, snapshot.sc of §1.7 (SIM-5) - with its light bar flashing
 * (broadcast.json scLights; dark when the engine says the lights are off) and only in the seasons
 * that have one (three/safetyCarView.js). Without the snapshot no safety car runs (the 90 m ahead of
 * the leader are gone). On TV the director's `shotKind: "sc"` (sequences.scDeploy) films it leaving
 * the pits.
 *
 * LOOK-C3 (F1M24-CHINA §2.8, §2.4, §2.5; VIEW-06, VIEW-05, VIEW-18, VIEW-10; RF-3D-04, RF-SIM-11,
 * RNF-02, RNF-05, RNF-07):
 *   - daylight: the real sun of the circuit at the session's hour (three/sky.js lookContextFor from
 *     data/circuits/sites.json + the race clock; optional `session` {date, startLocal, tzHours} and
 *     `weather` = snapshot.weather from the live view), the engine's clouds softening the shadows and
 *     lifting the sky light, a Preetham dome, FogExp2 by humidity; floodlit races keep their night.
 *   - post (three/post/*) by quality (`quality` prop, else view-look.json quality): grade, asymmetric
 *     auto exposure metered on the drawn frame and carried across cuts, onboard motion blur with the
 *     car on air masked (layer blur.maskLayer); nothing in `low`.
 *   - sparks from the floor in the eras with skids and smoke on the engine's lock-ups (three/fx/sparks.js,
 *     seeded on the race clock).
 *   - every object hung on the scene has an owner; meshes without one, or small ones floating above the
 *     road inside the circuit model, are hidden and counted (three/fx/strays.js, data-strays on the host).
 *
 * LOOK-C4 (F1M24-CHINA §2.9, §1.5 «Spray»; GS-10, VIEW-07; RF-SIM-11, RF-3D-04, RNF-02, RNF-05, RNF-07):
 * the wet is the engine's water, no longer a boolean. `weather` (snapshot.weather or the worker's
 * weatherNow) and each car's spray (`pose.spray`, `car.spray` or the `spray` prop, in `cars` order) are
 * read through three/rain/hookup.js; without them the old `wet` flag stands for a wet track
 * (view-look.json rain.hookup.flagFallback). The asphalt darkens and the racing line dries first
 * (trackScene.js setWater on the procedural road; three/rain/worldWet.js on a real circuit's GLB); every
 * car throws its spray, with a trail that follows the track; the rain fog follows the rain rate; lens
 * drops only on the onboards (a post pass); rain streaks seeded on the race clock (seedFor, never an
 * unseeded random). Nothing here touches the race.
 */

import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { buildCar } from "./carModel";
import { buildTrack } from "./trackScene";
import { angularShake, buildPitRig, buildZoneRig, carBodyFrame, critDampStep, fitRig, frame, garageShot, isOnboard, modeForYear, onboardFor, onboardWobble, pitShot, rigCamOfType, roadRoughness, scParkedPose, scriptShot, seedOf, shakeOffset, tvRival } from "./cameras";
import { kerbZonesFor, onKerb } from "./audio/kerbs";
import cameraData from "../data/balance/cameras.json";
import { onRacingLine } from "./racingLine";
import { QUICK_REPLAY, boxSpecFor, countOverlap, overlapPass } from "./viewOverlap";
import { boxPointOf, etaToBox, stepSequence } from "../components/director/pitSequence";
import { recordReplay, replayFrameAt, replayPoseAt, tracksideFor } from "../components/replay/replayBuffer";
import broadcast from "../data/balance/broadcast.json";
import { isScSnapshot, scLightLevels, scLightsOn, scPoseOf } from "./safetyCarView";
import { createRenderer, environmentFor } from "./studio";
import { carAssetFor, circuitAssetFor } from "./assets/manifest";
import { createAssetCar } from "./assets/assetCar";
import { buildHeightField, loadCircuitAsset } from "./assets/assetCircuit";
import { pruneOldCaches } from "./assets/loader";
import LOOK from "../data/balance/view-look.json";
import { applySkyDome, createSkyDome, lookAt, lookContextFor, lookIsStale } from "./sky";
import { createPostChain, qualityFor, renderMask } from "./post/chain";
import { cutExposure, createExposure, exposureMultiplier, sceneLuminanceFrom, stepExposure } from "./post/exposure";
import { gradeFor } from "./post/grade";
import { blurParams } from "./post/motionBlur";
import { createSparkSystem, lockupOf } from "./fx/sparks";
import { hideStrays, own, roadTopOf } from "./fx/strays";
import { carSprayOf, createSprayLayer, enableWorldWet, frameWeatherFor, isRaining, lensDrops, rainFogDensity, seedFor, sprayAheadOf, sprayIntensityOf, spraySeedOf, streakCountFor, streakPositions, wettableMaterialsOf, worldMaskFor } from "./rain";
import { racingLine } from "./racingLine";
import { poseAt } from "../engine/trackGeometry";

const MASK_LAYER = LOOK.blur.maskLayer;
const SUN_DISTANCE = LOOK.sky.shadow.lightDistanceM;


const unwrap = (from, to) => {
  let target = to;
  while (target - from > Math.PI) target -= Math.PI * 2;
  while (target - from < -Math.PI) target += Math.PI * 2;
  return target;
};

/**
 * A generic safety car: a low coupÃ© with a light bar in two halves that flash in turn (CAM-5,
 * broadcast.json scView.model and scLights; no make or livery of a real one). `setLights([l, r])`
 * sets each half's brightness (0..1), `roll(metres)` turns the wheels.
 */
const buildSafetyCar = () => {
  const look = SC_VIEW.model;
  const group = new THREE.Group();
  const paint = new THREE.MeshPhysicalMaterial({ color: look.paint, metalness: 0.7, roughness: 0.25, clearcoat: 1 });
  const dark = new THREE.MeshStandardMaterial({ color: look.dark, roughness: 0.3, metalness: 0.4 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.7, 1.95), paint);
  body.position.y = 0.55;
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.5, 1.6), dark);
  cabin.position.set(-0.3, 1.1, 0);
  group.add(body, cabin);
  // The light bar: one half on each side of the roof.
  const halves = [0.3, -0.3].map((z) => {
    const material = new THREE.MeshStandardMaterial({ color: look.lightBase, emissive: look.lightOn, emissiveIntensity: look.emissiveOn });
    const half = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.12, 0.58), material);
    half.position.set(-0.3, 1.42, z);
    group.add(half);
    return material;
  });
  const lit = new THREE.Color(look.lightBase);
  const off = new THREE.Color(look.lightOff);
  const wheels = [];
  [[1.45, 0.88], [1.45, -0.88], [-1.45, 0.88], [-1.45, -0.88]].forEach(([x, z]) => {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.33, 0.28, 20), dark);
    wheel.rotation.x = Math.PI / 2;
    wheel.position.set(x, 0.33, z);
    group.add(wheel);
    wheels.push(wheel);
  });
  group.traverse((node) => {
    node.castShadow = true;
  });
  own(group, "safetyCar");
  let spun = 0;
  group.userData.setLights = (levels) => {
    halves.forEach((material, index) => {
      const level = levels[index] ?? 0;
      material.emissiveIntensity = look.emissiveOn * level;
      material.color.copy(off).lerp(lit, level);
    });
  };
  group.userData.roll = (metres) => {
    spun += metres;
    wheels.forEach((wheel) => {
      wheel.rotation.y = -spun / 0.33;
    });
  };
  return group;
};

/** A pit crew: a dozen figures in team colours around a stopped car. */
const buildCrew = (color) => {
  const group = own(new THREE.Group(), "crew");
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
const SC_VIEW = broadcast.scView;

export default function Race3D({ circuit, year, cars, focusId, mode, wet, lights, sc, safetyCar, teams, onPick, labels, clock, sample, cameraBus, seed, replayBuffer, replay, director, session, weather, spray, humidity, quality }) {
  const mount = useRef(null);
  const props = useRef({});
  props.current = { cars, focusId, mode, wet, lights, sc, safetyCar, onPick, clock, sample, year, cameraBus, seed, replayBuffer, replay, director, session, weather, spray, humidity, quality };
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
    own(sun, "light");
    own(sun.target, "light");
    own(hemi, "light");
    // LOOK-C3: the quality level, the sparks and the exposure; the sky dome and the post chain load lazily.
    const level = qualityFor(props.current.quality);
    const sparks = createSparkSystem({ quality: level });
    scene.add(sparks.object);
    // LOOK-C4 (VIEW-07): rain streaks in a box around the camera, as many as the rain rate asks for at this
    // quality (three/rain/fog.js), placed from the race seed and clock each frame.
    const streakCapacity = Math.max(1, LOOK.rain.streaks.count[level] ?? LOOK.rain.streaks.count.medium);
    const drops = new Float32Array(streakCapacity * 6);
    const rainGeometry = new THREE.BufferGeometry();
    rainGeometry.setAttribute("position", new THREE.BufferAttribute(drops, 3));
    rainGeometry.setDrawRange(0, 0);
    const rain = own(new THREE.LineSegments(rainGeometry, new THREE.LineBasicMaterial({ color: "#c9dcf0", transparent: true, opacity: 0.45 })), "rain");
    rain.frustumCulled = false;
    rain.visible = false;
    scene.add(rain);
    // LOOK-C4 (GS-10, VIEW-07): the spray of every car, one instanced layer sized for the quality level.
    const sprayLayer = createSprayLayer({ quality: level });
    const sprayMesh = own(sprayLayer.mesh, "rain");
    scene.add(sprayMesh);

    pruneOldCaches();
    const state = {
      heightAt: null,
      field: null,
      renderer, scene, camera, sun, hemi, sky, rain, drops, streakCapacity, sprayLayer, overlay, host,
      raining: false, assetScene: null, assetWet: null,
      quality: level, qualityLevel: LOOK.quality.levels[level], sparks, exposure: createExposure(), post: null, dome: null, look: null, lookCtx: null,
      track: null, carObjects: new Map(), tags: new Map(), crews: new Map(), safetyCar: null, rig: [], camState: {},
      cam: { pos: new THREE.Vector3(0, 50, 0), look: new THREE.Vector3(), heading: 0 }, last: performance.now(),
    };
    world.current = state;
    let disposed = false;
    createSkyDome()
      .then((dome) => {
        if (disposed) return;
        own(dome, "sky");
        dome.visible = false;
        dome.frustumCulled = false;
        scene.add(dome);
        state.dome = dome;
        state.lookCtx = null;
      })
      .catch(() => {});
    createPostChain({ renderer, scene, camera, quality: level, lens: true })
      .then((chain) => {
        if (disposed) {
          chain.dispose();
          return;
        }
        state.post = chain;
        chain.setSize(host.clientWidth || 800, host.clientHeight || 480);
      })
      .catch(() => {});

    const resize = () => {
      const width = host.clientWidth || 800;
      const height = host.clientHeight || 480;
      renderer.setSize(width, height, false);
      state.post?.setSize(width, height);
      if (state.mask) state.mask.target.setSize(Math.max(1, Math.round(width / 2)), Math.max(1, Math.round(height / 2)));
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
      if (state.post) state.post.render(dt);
      else renderer.render(scene, camera);
    };
    frame = requestAnimationFrame(loop);

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer?.disconnect();
      canvas.removeEventListener("click", click);
      rainGeometry.dispose();
      sprayLayer.dispose();
      state.assetWet?.dispose();
      sparks.dispose();
      state.post?.dispose();
      if (state.mask) {
        state.mask.target.dispose();
        state.mask.material.dispose();
      }
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
    own(track.group, "track");
    state.scene.add(track.group);
    state.track = track;
    track.applyWeather(state, Boolean(state.raining));
    // LOOK-C4 (GS-10): the drier racing line of the wet asphalt is the engine's line (engine/trackData).
    const line = racingLine(circuit);
    track.setRacingLine((i) => line.offsets[i]);
    // LOOK-C3: relight for this circuit on the next frame; audit the scene once it settles.
    state.lookCtx = null;
    state.strayAt = null;
    state.sparks?.reset();
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
          assetScene = own(scene, "circuit");
          state.scene.add(scene);
          track.group.visible = false;
          // LOOK-C4: its materials get the engine's water through a mask of the road, on the first wet frame.
          state.assetScene = scene;
          state.heightAt = heightAt;
          state.roadTop = roadTopOf(heightAt);
          state.strayAt = null;
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
      state.assetWet?.dispose();
      state.assetWet = null;
      state.assetScene = null;
      state.heightAt = null;
      state.roadTop = 0;
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
      own(object, "car");
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
  const { cars = [], wet, lights, sc: scSnapshot, safetyCar, clock, sample, year, cameraBus, seed, replayBuffer, replay, director, session, weather, spray: sprayGiven, humidity } = props;
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
    // The step race places cars sideways itself (pose.lateral, SIM-FISICA Â§3.1): the view only
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
      // SIM-FISICA Â§3.7 (WP9): the step race's own speed; the quick replay's from how far it moved.
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
      focus = { x, z, y: ground, heading: entry.yaw, speed: entry.speed || 0, share: pose.progress, turn: entry.turn, spec, item: { ...item, pose }, entry };
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

  // Safety car (CAM-5): where the engine says it is (snapshot.sc, §1.7, SIM-5, as `sc` - or as
  // `safetyCar` from a view that hands the snapshot over under that name), never a fixed distance
  // ahead of the leader; a plain pose handed over is drawn as it is. Not in a replay: the buffer
  // has no safety car, and the view invents none.
  const scGiven = isScSnapshot(scSnapshot) ? scSnapshot : isScSnapshot(safetyCar) ? safetyCar : null;
  let sc = replayed ? null : scGiven ? scPoseOf(scGiven, circuit, year) : safetyCar && Number.isFinite(safetyCar.x) ? safetyCar : null;
  let scLit = Boolean(sc) && (scGiven ? scLightsOn(scGiven) : true);
  // CAM-4: before lights out the safety car waits behind the grid, in the years it exists (the director says so); lights off.
  if (!sc && !replayed && director?.scParked) {
    sc = scParkedPose(circuit, cars.length);
    scLit = false;
  }
  if (sc) {
    if (!state.safetyCar) {
      state.safetyCar = buildSafetyCar();
      state.scene.add(state.safetyCar);
    }
    const object = state.safetyCar;
    const scShare = Number.isFinite(sc.progress) ? sc.progress : null;
    const ground = state.heightAt && scShare !== null ? state.heightAt(scShare) : 0;
    if (object.visible && state.scLast) object.userData.roll(Math.hypot(sc.x - state.scLast.x, sc.y - state.scLast.y));
    state.scLast = { x: sc.x, y: sc.y };
    object.visible = true;
    object.position.set(sc.x, ground, sc.y);
    object.rotation.y = -sc.heading;
    // The light bar flashes on the view's own clock (broadcast.json scLights).
    object.userData.setLights(scLightLevels(state.viewTime || 0, scLit));
    state.scFocus = { x: sc.x, y: ground, z: sc.y, heading: sc.heading, speed: Number.isFinite(sc.v) ? sc.v : 0, share: scShare ?? 0, turn: 0, spec: null, item: null };
  } else {
    if (state.safetyCar) state.safetyCar.visible = false;
    state.scLast = null;
    state.scFocus = null;
  }

  state.track?.setLights(typeof lights === "number" ? lights : 0);

  // Weather. LOOK-C4 (GS-10, VIEW-07): the engine's water and rain (or the old flag's stand-in).
  const frameWeather = frameWeatherFor({ weather, wet });
  const raining = isRaining(frameWeather);
  const rh = Number.isFinite(humidity) ? humidity : Number.isFinite(frameWeather.humidity) ? frameWeather.humidity : LOOK.fog.defaultHumidity;
  const rainFog = raining ? rainFogDensity({ humidity: rh, rainMmH: frameWeather.rainRate }) : null;
  let relight = false;
  if (state.raining !== raining) {
    state.raining = raining;
    state.track?.applyWeather?.(state, raining, { fogDensity: rainFog });
    relight = true;
  }
  // The asphalt from the water on and off the racing line, by sector: the procedural road and the GLB's.
  const wetLook = state.track ? state.track.setWater(frameWeather) : null;
  if (state.assetScene && wetLook && (wetLook.wet || state.assetWet)) {
    if (!state.assetWet) state.assetWet = enableWorldWet(wettableMaterialsOf(state.assetScene), worldMaskFor(circuit));
    state.assetWet.update(wetLook);
  }
  // LOOK-C3 (VIEW-06): the sun of this circuit at the session's hour on the race clock, the engine's clouds.
  const ctx = lookContextFor({ circuit, year, tau: tau ?? 0, session, weather: frameWeather.state !== null ? frameWeather : null, wet: raining, humidity });
  if (ctx ? lookIsStale(state.lookCtx, ctx) : state.lookCtx !== null || state.look) {
    state.lookCtx = ctx;
    state.look = ctx ? lookAt(ctx) : null;
    relight = true;
  }
  if (relight && state.track) {
    if (!state.look) state.track.applyWeather(state, raining, { fogDensity: rainFog });
    state.daylit = Boolean(state.track.applyDaylight?.(state, state.look, { dome: Boolean(state.dome), wet: raining, fogDensity: rainFog }));
    if (state.dome) {
      state.dome.visible = state.daylit;
      if (state.daylit) applySkyDome(state.dome, state.look.sun, state.look.cloud);
    }
  }
  // VIEW-07: the rain's air thickens and thins with the rain rate between relights.
  if (raining && state.track) state.track.setRainFog(state, rainFog);

  // Camera.
  if (focus) {
    const cam = state.cam;
    const inGarage = focus.item?.pose?.garage && mode !== "heli";
    // CAM-2: the zone cameras are drawn with the race seed (the circuit and year when the live view
    // gives none), and the TV frame opens for two when the focused car is racing a rival.
    state.camState.seed = seed ?? seedOf(`${circuit.splineId ?? circuit.id ?? ""}|${year ?? ""}`);
    // CAM-C1 (VIEW-03, VIEW-12): the lenses are horizontal (made vertical for this canvas), the
    // onboard lens is the season's, and the helicopter swings round on the race clock.
    state.camState.aspect = camera.aspect;
    state.camState.year = Number.isFinite(year) ? year : null;
    state.camState.simDt = Math.max(dt, Math.min(simDt, 0.5));
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
    // CAM-5 sc-pose-from-sim: the safety car sent out (directorState shotKind "sc", broadcast.json
    // sequences.scDeploy) is filmed from its pit camera - by the chase camera when it is too far from
    // it (scView.pitCamMaxM) - then chased and flown over; the shot frames the safety car, not a car.
    let scBus = null;
    if (!scriptShotOn && mode === "tv" && !replayed && !lockCam && !inGarage && director?.shotKind === "sc" && director.scShot && state.scFocus) {
      const scFocus = state.scFocus;
      const id = director.scShot.cam;
      let shotSc = null;
      let used = null;
      if (director.camType === "pit") {
        shotSc = pitShot(id, scFocus, circuit, state.pitRig || [], null, world);
        if (shotSc && Math.hypot(shotSc.pos.x - scFocus.x, shotSc.pos.z - scFocus.z) > SC_VIEW.pitCamMaxM) shotSc = null;
        if (shotSc) used = { id, kind: "pit" };
      } else if (id === "heli" || id === "chase") {
        shotSc = frame(id, scFocus, circuit, state.rig, state.camState, dt, world);
        used = { id, kind: id };
      }
      if (!shotSc) {
        shotSc = frame("chase", scFocus, circuit, state.rig, state.camState, dt, world);
        used = { id: "chase", kind: "chase" };
      }
      scriptShotOn = shotSc;
      scBus = { ...used, subject: "safetyCar" };
      scriptBus = scBus;
    }
    const scriptKey = scriptShotOn ? `${scBus ? `sc:${scBus.id}` : scripted.cameraId}|${scBus ? "safetyCar" : focus.item?.car?.id ?? ""}` : null;
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
    // A shot that comes already smoothed (`held`: the helicopter's damped bearing, CAM-C1) is taken as it is.
    if (shot.snap || shot.held || cam.pos.distanceTo(shot.pos) > 120) {
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
    const shakeSeed = seedOf(`${focus.item?.car?.id ?? ""}|${mode}`);
    const rider = mount && !seqCam ? focus.entry : null;
    if (rider) {
      // CAM-C2 (VIEW-04): the onboard is a child of the car - it turns with the chassis' own pitch
      // and roll (the body motion the engine gives the pose, as the car's group is drawn) - and its
      // shake turns the lens by angle, seeded on the race clock; a kerb (three/audio/kerbs.js, on
      // the engine's line + lateral) and a bumpy road (heightAt) make it bounce more.
      let wobble = null;
      let lift = 0;
      if (angularShake(mount.shake)) {
        const pose = focus.item?.pose || {};
        const offAxis = Number.isFinite(pose.lateral) ? (pose.lineOffset ?? 0) + pose.lateral : NaN;
        const kerb = onKerb(kerbZonesFor(circuit), focus.share, offAxis, cameraData.shakeModel.kerbReachM);
        const rough = roadRoughness(state.heightAt, focus.share, circuit.length);
        wobble = onboardWobble(mount.shake, { speed: focus.speed || 0, tSec: tau ?? state.viewTime, seed: shakeSeed, kerb, rough });
      } else if (mount.shake) lift = shakeOffset(mount.shake, focus.speed || 0, tau ?? state.viewTime, shakeSeed);
      const placed = carBodyFrame(cam.pos, cam.look, rider.object.position, { yaw: rider.yaw, pitch: rider.pitch || 0, roll: rider.object.rotation.x }, wobble);
      placed.pos.y += lift;
      placed.look.y += lift;
      camera.position.copy(placed.pos);
      camera.up.copy(placed.up);
      camera.lookAt(placed.look);
    } else {
      camera.up.set(0, 1, 0);
      if (mount?.shake) camera.position.y += shakeOffset(mount.shake, focus.speed || 0, tau ?? state.viewTime, shakeSeed);
      camera.lookAt(cam.look);
    }
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
        // CAM-5: on the safety car's deployment shots the subject is the safety car.
        subjectId: scriptOn?.subject === "safetyCar" ? "safetyCar" : focus.item?.car?.id ?? null,
        position: { x: camera.position.x, y: camera.position.y, z: camera.position.z },
        target: { x: cam.look.x, y: cam.look.y, z: cam.look.z },
        fov: camera.fov,
      };
    }
    const base = focus.y || 0;
    // VIEW-06: the light comes from where the sun is (sky.js), the shadow camera still around the car on air.
    if (state.daylit && state.look) {
      const d = state.look.sun;
      state.sun.position.set(focus.x + d.x * SUN_DISTANCE, base + d.y * SUN_DISTANCE, focus.z + d.z * SUN_DISTANCE);
    } else state.sun.position.set(focus.x + 60, base + 120, focus.z + 40);
    state.sun.target.position.set(focus.x, base, focus.z);
    if (state.dome) state.dome.position.copy(camera.position);
    // VIEW-05 / VIEW-06: grade, onboard blur with the car on air masked, auto exposure on the race clock.
    if (state.post) {
      const cloud = state.look ? state.look.cloud : raining ? 1 : 0;
      let blur = blurParams({ speedMps: 0, quality: state.quality });
      let maskTexture = null;
      if (rider && state.post.passes?.motionBlur) {
        blur = blurParams({ speedMps: focus.speed || 0, yawRate: focus.turn || 0, aspect: camera.aspect, quality: state.quality });
        if (blur.enabled) {
          if (!state.mask) {
            const size = state.renderer.getSize(new THREE.Vector2());
            state.mask = { target: new THREE.WebGLRenderTarget(Math.max(1, Math.round(size.x / 2)), Math.max(1, Math.round(size.y / 2))), material: new THREE.MeshBasicMaterial({ color: "#ffffff", fog: false }) };
          }
          rider.object.traverse((node) => node.layers.enable(MASK_LAYER));
          renderMask(THREE, state.renderer, state.scene, camera, state.mask.target, state.mask.material);
          maskTexture = state.mask.target.texture;
        }
      }
      // VIEW-07: drops on the lens of an onboard only - the rain's and the spray of the car just ahead.
      let lens = [];
      if (rider && state.post.passes?.lens) {
        const subject = focus.item?.car?.id;
        const k = ordered.findIndex((item) => item.car.id === subject);
        const ahead = k > 0 ? ordered[k - 1] : null;
        const aheadEntry = ahead ? state.carObjects.get(ahead.car.id) : null;
        const aheadLevel = ahead ? sprayIntensityOf(carSprayOf({ car: ahead.car, pose: ahead.pose, index: cars.findIndex((c) => c.car.id === ahead.car.id), spray: sprayGiven, frame: frameWeather, year }), aheadEntry?.speed || 0) : 0;
        const sprayAhead = ahead ? sprayAheadOf(aheadLevel, ahead.metres - ordered[k].metres) : 0;
        lens = lensDrops({ seed: seedFor("lens", seed ?? state.camState.seed ?? 0, subject ?? ""), t: tau ?? state.viewTime, rainRate: raining ? frameWeather.rainRate : 0, sprayAhead, speedMps: focus.speed || 0, cameraKind: "onboard" });
      }
      state.post.update({ grade: gradeFor(cloud), blur, maskTexture, lens: { drops: lens, aspect: camera.aspect } });
      if (state.qualityLevel?.autoExposure) {
        // A cut keeps the previous shot's exposure (cutExposure); the meter reads the last drawn frame.
        const shotKey = cameraBus?.current?.id ?? mode;
        if (state.shotKey !== shotKey) {
          state.exposure = cutExposure(state.exposure);
          state.shotKey = shotKey;
        }
        const measured = state.post.luminance?.();
        if (measured !== null && measured !== undefined) state.sceneLum = sceneLuminanceFrom(measured, state.exposure);
        if (Number.isFinite(state.sceneLum)) state.exposure = stepExposure(state.exposure, state.sceneLum, tau !== null ? simDt : dt);
        state.renderer.toneMappingExposure = exposureMultiplier(state.exposure);
      }
    }
    // VIEW-07: the rain streaks, as many as the rain rate asks for, from the race seed and clock (RNF-05).
    const streaks = raining ? Math.min(state.streakCapacity, streakCountFor(frameWeather.rainRate, state.quality)) : 0;
    state.rain.visible = streaks > 0;
    if (streaks > 0) {
      const streakSeed = seedFor("streaks", seed ?? state.camState.seed ?? 0);
      streakPositions({ seed: streakSeed, t: tau ?? state.viewTime, count: streaks, centre: { x: camera.position.x, y: camera.position.y, z: camera.position.z }, out: state.drops });
      state.rain.geometry.setDrawRange(0, streaks * 2);
      state.rain.geometry.attributes.position.needsUpdate = true;
    }
  }

  // GS-10 / VIEW-07: every car's spray from the engine's figure, the trail along the track behind it.
  if (state.sprayLayer) {
    const seedText = seed ?? state.camState.seed ?? 0;
    const sprayCars = [];
    items.forEach((item, index) => {
      const entry = state.carObjects.get(item.car.id);
      const pose = item.pose;
      if (!entry || pose.gone || pose.inPit || !entry.object.visible) return;
      const level = carSprayOf({ car: item.car, pose, index, spray: sprayGiven, frame: frameWeather, year });
      if (!(level > 0)) return;
      if (entry.spraySeedKey !== seedText) {
        entry.spraySeed = spraySeedOf(seedText, item.car.id);
        entry.spraySeedKey = seedText;
      }
      const at = entry.object.position;
      const off = (pose.lineOffset ?? 0) + (pose.lateral ?? 0) + entry.lateral;
      const behind = Number.isFinite(pose.progress)
        ? (metres) => {
            const share = pose.progress - metres / length;
            const p = poseAt(circuit, share);
            return { x: p.x - Math.sin(p.heading) * off, z: p.y + Math.cos(p.heading) * off, y: state.heightAt ? state.heightAt(share) : at.y, heading: p.heading };
          }
        : null;
      sprayCars.push({ seed: entry.spraySeed, x: at.x, y: at.y, z: at.z, heading: entry.yaw, speedMps: entry.speed || 0, spray: level, behind });
    });
    state.sprayLayer.update(sprayCars, { t: tau ?? state.viewTime ?? 0, camera });
  }

  // VIEW-18: sparks and lock-up smoke on the race clock, seeded by the race (three/fx/sparks.js).
  if (state.sparks && tau !== null) {
    const sparkCars = [];
    items.forEach((item) => {
      const entry = state.carObjects.get(item.car.id);
      if (!entry || item.pose.gone || item.pose.inPit || !entry.object.visible) return;
      const pos = entry.object.position;
      sparkCars.push({
        key: item.car.id,
        x: pos.x,
        y: pos.y,
        z: pos.z,
        heading: entry.yaw,
        speedMps: entry.speed || 0,
        brake: item.pose.brake,
        lonG: item.pose.lonG,
        rough: roadRoughness(state.heightAt, item.pose.progress, length),
        lockup: lockupOf(item.pose),
      });
    });
    state.sparks.update({ year, tau, seed: seed ?? state.camState.seed ?? 0, cars: sparkCars });
  }

  // VIEW-10: nothing on air without an owner, nothing small floating over the road (three/fx/strays.js).
  const viewTime = state.viewTime || 0;
  if (state.strayAt === null || state.strayAt === undefined || viewTime - state.strayAt >= LOOK.fx.strays.everySec) {
    state.strayAt = viewTime;
    const found = hideStrays(state.scene, { roadTopY: state.roadTop || 0 });
    state.strays = (state.strays || 0) + found.ownerless + found.floating;
    if (state.host) state.host.dataset.strays = String(state.strays);
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
