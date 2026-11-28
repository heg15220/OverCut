/**
 * Instanced spray behind the cars (GS-10 / VIEW-07 modules, LOOK-C2; RF-SIM-11, RF-3D-04, RNF-02, RNF-05,
 * RNF-07). F1M24-CHINA §1.5 «Spray»: the engine publishes `snapshot.spray[i]` (0..1, the water under car
 * i) and the view only reads it; the same figure costs the follower time in the engine and is heard by
 * the sound (AUD-C5), so what is seen, heard and paid is one number.
 *
 * The spray of a car is a cloud that hangs in the air almost where it was thrown (it keeps `carry` of
 * the car's speed) and fades out: its trail is speed × life × (1 − carry), 50–150 m by level at racing
 * speed (rain.spray.trailM). The particle system is stateless: particle k of a car has a seeded phase,
 * and its age at race time t is ((t / life + phase) mod 1) × life; its jitter changes every cycle with a
 * seeded hash of (k, cycle). The same seed, car and race clock give the same particles (seedOf, never an
 * unseeded random or the wall clock; F1M24-CHINA §1.4 rule 7). No spray with no water or no speed; none in
 * the `low` quality level (proposed amendment 10, §4).
 *
 * Values in data/balance/view-look.json rain.spray. LOOK-C4 draws it in Race3D.js from each car's engine
 * spray (three/rain/hookup.js carSprayOf), with the trail following the track.
 */

import * as THREE from "three";
import LOOK from "../../data/balance/view-look.json";
import { hash01, hash01x2, mix32, seedFor } from "./seeded";

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const finite = (v, fallback = 0) => (Number.isFinite(v) ? v : fallback);
const lerp = (a, b, t) => a + (b - a) * t;

/** Visible spray intensity (0..1) of a car: the engine's level × a speed ramp (none when slow or stopped). */
export const sprayIntensityOf = (level, speedMps, cfg = LOOK.rain.spray) => {
  const l = clamp(finite(level), 0, 1);
  if (!(l > 0)) return 0;
  const speed = clamp((finite(speedMps) - cfg.speedMinMps) / (cfg.speedFullMps - cfg.speedMinMps), 0, 1);
  return l * speed;
};

/** Trail length (m) at racing speed and particle life (s) for an intensity. */
export const trailOf = (intensity, cfg = LOOK.rain.spray) => {
  const i = clamp(finite(intensity), 0, 1);
  const trailM = lerp(cfg.trailM[0], cfg.trailM[1], i);
  return { trailM, lifeSec: (cfg.lifeMaxSec * trailM) / cfg.trailM[1] };
};

/**
 * Particles per car for a list of intensities at a quality level: the level's total shared among the cars
 * that throw spray, capped per car, × each car's intensity. Zero intensity → zero particles.
 */
export const sprayBudget = (intensities, quality = "medium", cfg = LOOK.rain.spray) => {
  const total = cfg.maxParticles[quality] ?? cfg.maxParticles.medium;
  const cap = cfg.perCarMax[quality] ?? cfg.perCarMax.medium;
  const active = intensities.filter((v) => v > 0).length;
  if (!active || !total || !cap) return intensities.map(() => 0);
  const perCar = Math.min(cap, Math.floor(total / active));
  return intensities.map((v) => (v > 0 ? Math.max(1, Math.round(perCar * clamp(v, 0, 1))) : 0));
};

/**
 * The particles of one car at race time `t` (s), in the car's frame: `back` metres behind the rear axle
 * along the track, `up` above the road, `side` to the right of travel; `size` (m) and `alpha` (0..1).
 * `seed` from seedFor("spray", seedText, carId).
 */
export const sprayParticles = ({ seed, t, intensity, speedMps, count, cfg = LOOK.rain.spray }) => {
  const out = [];
  const i = clamp(finite(intensity), 0, 1);
  if (!(i > 0) || !(count > 0)) return out;
  const { lifeSec } = trailOf(i, cfg);
  const v = Math.max(0, finite(speedMps));
  const clock = finite(t);
  for (let k = 0; k < count; k += 1) {
    const phase = hash01(seed, k);
    const cycles = clock / lifeSec + phase;
    const cycle = Math.floor(cycles);
    const share = cycles - cycle;
    const age = share * lifeSec;
    const jitter = mix32(seed, k);
    const wheel = hash01x2(jitter, cycle, 1) < 0.5 ? -1 : 1;
    const spread = (hash01x2(jitter, cycle, 2) * 2 - 1) * cfg.spreadMps * age;
    const rise = cfg.riseMps * age * (0.5 + hash01x2(jitter, cycle, 3));
    out.push({
      back: age * v * (1 - cfg.carry) + hash01x2(jitter, cycle, 4) * 0.6,
      up: cfg.startHeightM + rise,
      side: wheel * cfg.halfTrackM + spread,
      size: lerp(cfg.sizeM[0], cfg.sizeM[1], share) * (0.8 + 0.4 * hash01x2(jitter, cycle, 5)),
      alpha: cfg.opacity * i * (1 - share) * (1 - share * 0.35),
      age,
    });
  }
  return out;
};

/** Seeds of every car's spray for a race (`seedText`: the race seed or circuit; `carId`: the car's id). */
export const spraySeedOf = (seedText, carId) => seedFor("spray", seedText, carId);

// ------------------------------------------------------------------ three.js layer

/** A soft round sprite (radial falloff), generated in code so no image is shipped. */
const puffTexture = (size = 32) => {
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const dx = (x + 0.5) / size - 0.5;
      const dy = (y + 0.5) / size - 0.5;
      const r = Math.min(1, Math.hypot(dx, dy) * 2);
      const a = (1 - r * r) ** 2;
      const o = (y * size + x) * 4;
      data[o] = 255;
      data[o + 1] = 255;
      data[o + 2] = 255;
      data[o + 3] = Math.round(a * 255);
    }
  }
  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  texture.needsUpdate = true;
  return texture;
};

/**
 * The spray layer: one InstancedMesh of camera-facing puffs sized for the quality level's budget. Its
 * per-instance alpha is an attribute (aOcAlpha) multiplied in the fragment shader. Returns
 * `{mesh, capacity, update(cars, {t, camera, quality}), dispose()}`; `cars` is
 * `[{seed, x, z, y?, heading, speedMps, spray, behind?(d) → {x, z, heading}}]` (world metres, heading in
 * the circuit plane as in trackScene.js; `behind` follows the track for long trails).
 */
export const createSprayLayer = ({ quality = "medium", cfg = LOOK.rain.spray } = {}) => {
  const capacity = cfg.maxParticles[quality] ?? cfg.maxParticles.medium;
  const geometry = new THREE.PlaneGeometry(1, 1);
  const alpha = new THREE.InstancedBufferAttribute(new Float32Array(Math.max(1, capacity)), 1);
  alpha.setUsage(THREE.DynamicDrawUsage);
  geometry.setAttribute("aOcAlpha", alpha);
  const material = new THREE.MeshBasicMaterial({ color: cfg.colour, map: puffTexture(), transparent: true, depthWrite: false, fog: true });
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nattribute float aOcAlpha;\nvarying float vOcAlpha;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvOcAlpha = aOcAlpha;");
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\nvarying float vOcAlpha;")
      .replace("#include <alphamap_fragment>", "#include <alphamap_fragment>\ndiffuseColor.a *= vOcAlpha;");
  };
  material.customProgramCacheKey = () => "ocSpray";
  const mesh = new THREE.InstancedMesh(geometry, material, Math.max(1, capacity));
  mesh.count = 0;
  mesh.frustumCulled = false;
  mesh.renderOrder = 2;
  const matrix = new THREE.Matrix4();
  const position = new THREE.Vector3();
  const scale = new THREE.Vector3();
  const facing = new THREE.Quaternion();
  const update = (cars, { t, camera = null, quality: level = quality } = {}) => {
    const intensities = cars.map((car) => sprayIntensityOf(car.spray, car.speedMps, cfg));
    const counts = sprayBudget(intensities, level, cfg);
    if (camera) facing.copy(camera.quaternion);
    let n = 0;
    cars.forEach((car, c) => {
      if (!counts[c]) return;
      const particles = sprayParticles({ seed: car.seed, t, intensity: intensities[c], speedMps: car.speedMps, count: counts[c], cfg });
      particles.forEach((p) => {
        if (n >= capacity) return;
        const at = car.behind ? car.behind(p.back) : { x: car.x - Math.cos(car.heading) * p.back, z: car.z - Math.sin(car.heading) * p.back, heading: car.heading };
        const h = finite(at.heading, car.heading);
        // LOOK-C4: a trail that follows the track (`behind`) also follows the road's height when it gives one.
        position.set(at.x - Math.sin(h) * p.side, finite(at.y, finite(car.y, 0)) + p.up, at.z + Math.cos(h) * p.side);
        scale.set(p.size, p.size, p.size);
        matrix.compose(position, facing, scale);
        mesh.setMatrixAt(n, matrix);
        alpha.array[n] = p.alpha;
        n += 1;
      });
    });
    mesh.count = n;
    mesh.instanceMatrix.needsUpdate = true;
    alpha.needsUpdate = true;
    return n;
  };
  return {
    mesh,
    capacity,
    update,
    dispose: () => {
      geometry.dispose();
      material.map.dispose();
      material.dispose();
    },
  };
};
