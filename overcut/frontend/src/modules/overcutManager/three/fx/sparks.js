/**
 * Sparks from under the floor and lock-up smoke (VIEW-18, LOOK-C3; RF-3D-04, SRS §6, RNF-02, RNF-05, RNF-07).
 *
 * F1M24-CHINA §2.8: in the daylight broadcast the floor's skids strike sparks at the end of the
 * straights, when the nose dives under hard braking, and over bumps; flashes of one to three frames.
 * Only in the eras whose cars carry metal skids under the floor (view-look.json fx.sparks.eras, pending
 * until each year's FIA technical regulations are read; never in 2013). Smoke only when the engine says a
 * car is paying a lock-up (pose.incident = "lockup" or lon = "LOCKUP"): the view never invents one.
 *
 * Deterministic (F1M24-CHINA §1.4 rule 7, RNF-05): whether a burst is struck is decided per tick of the
 * race clock (fx.sparks.tickSec) with a seeded hash of the race seed, the car and the tick, never with
 * Math.random or the wall clock. A burst then flashes for `flashFrames` drawn frames (what a broadcast
 * frame shows), its particles' directions seeded by the burst. Smoke puffs live in race time.
 *
 * Everything tunable is in data/balance/view-look.json fx (RNF-07).
 */

import * as THREE from "three";
import LOOK from "../../data/balance/view-look.json";
import { hash01x2, mix32, seedFor } from "../rain/seeded";

const SPARKS = LOOK.fx.sparks;
const SMOKE = LOOK.fx.lockupSmoke;
const KMH = 3.6;

/** Whether the cars of `year` strike sparks from under the floor (fx.sparks.eras; outside every era: no). */
export const sparksEnabled = (year, eras = SPARKS.eras) => {
  if (!Number.isFinite(year)) return false;
  const era = eras.find((entry) => entry.from <= year && year <= entry.to);
  return Boolean(era && era.value);
};

/**
 * Whether a car's state strikes sparks: above minSpeedKmh and either braking hard (brake ≥ minBrake and,
 * when the pose carries it, a deceleration of minDecelG or more) or over a bump (vertical curvature of
 * the road ≥ bumpCurvature, three/cameras.js roadRoughness).
 */
export const sparkTrigger = ({ speedMps = 0, brake, lonG, rough = 0 } = {}, cfg = SPARKS) => {
  if (!(Number.isFinite(speedMps) && speedMps * KMH >= cfg.minSpeedKmh)) return false;
  const braking = Number.isFinite(brake) && brake >= cfg.minBrake && (!Number.isFinite(lonG) || !Number.isFinite(cfg.minDecelG) || -lonG >= cfg.minDecelG);
  const bump = Number.isFinite(rough) && rough >= cfg.bumpCurvature;
  return braking || bump;
};

/** Whether the engine says the car is paying a lock-up (F1M24-GAMEPLAY §1.7 lon[i], SIM-7 incident). */
export const lockupOf = (pose) => Boolean(pose) && (pose.incident === "lockup" || pose.lon === "LOCKUP");

/**
 * The ticks of the race clock in (fromTau, toTau] at which a car strikes a burst while its trigger holds:
 * tick k (at k × tickSec) fires when hash(seed, k) < rate × tickSec. Empty when the clock did not move
 * forward (a pause, or a seek back). `seed` from seedFor("sparks", raceSeed, carId).
 */
export const burstTicks = ({ seed, fromTau, toTau, rate = SPARKS.burstsPerSec, tickSec = SPARKS.tickSec, limit = 64 } = {}) => {
  const out = [];
  if (!Number.isFinite(fromTau) || !Number.isFinite(toTau) || !(toTau > fromTau) || !(rate > 0)) return out;
  const chance = Math.min(1, rate * tickSec);
  const first = Math.floor(fromTau / tickSec) + 1;
  const last = Math.floor(toTau / tickSec);
  for (let k = first; k <= last && out.length < limit; k += 1) {
    if (hash01x2(seed, k, 0) < chance) out.push(k);
  }
  return out;
};

/**
 * The particles of one burst, in the car's frame (metres per second): `back` (+ = towards the rear),
 * `side` (+ = right) and `up`. They leave with (1 − carry) of the car's speed backwards relative to it,
 * plus a seeded spread, mostly sideways and a little upwards.
 */
export const burstParticles = (seed, tick, speedMps, cfg = SPARKS) => {
  const out = [];
  const base = mix32(seed, tick);
  const relBack = Math.max(0, speedMps) * (1 - cfg.carry);
  for (let i = 0; i < cfg.particlesPerBurst; i += 1) {
    const a = hash01x2(base, i, 1);
    const b = hash01x2(base, i, 2);
    const c = hash01x2(base, i, 3);
    out.push({
      back: relBack + (a - 0.3) * cfg.spreadMps,
      side: (b - 0.5) * 2 * cfg.spreadMps,
      up: c * cfg.spreadMps * 0.35,
    });
  }
  return out;
};

const levelOf = (quality, table) => table[quality] ?? table.medium;

/**
 * The spark and smoke system of the live view: `{object, update(input), reset(), stats}`.
 *   update({year, tau, seed, cars: [{key, x, y, z, heading, speedMps, brake, lonG, rough, lockup}]})
 * `heading` is the car's direction of travel in the scene's xz plane (forward = (cos, 0, sin)).
 * Nothing is drawn in a quality level without bursts or in a season without sparks.
 */
export const createSparkSystem = ({ quality = "medium" } = {}) => {
  const maxBursts = levelOf(quality, SPARKS.maxBursts);
  const maxPuffs = SMOKE.enabled ? levelOf(quality, SMOKE.maxPuffs) : 0;
  const group = new THREE.Group();
  group.name = "fx";
  group.userData.owner = "fx";
  const per = SPARKS.particlesPerBurst;
  const segments = new Float32Array(Math.max(1, maxBursts * per) * 6);
  const sparkGeometry = new THREE.BufferGeometry();
  sparkGeometry.setAttribute("position", new THREE.BufferAttribute(segments, 3));
  sparkGeometry.setDrawRange(0, 0);
  const sparkMaterial = new THREE.LineBasicMaterial({ color: SPARKS.colour, transparent: true, opacity: 1, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
  const sparkLines = new THREE.LineSegments(sparkGeometry, sparkMaterial);
  sparkLines.frustumCulled = false;
  sparkLines.renderOrder = 3;
  group.add(sparkLines);
  const puffs = new Float32Array(Math.max(1, maxPuffs) * 3);
  const smokeGeometry = new THREE.BufferGeometry();
  smokeGeometry.setAttribute("position", new THREE.BufferAttribute(puffs, 3));
  smokeGeometry.setDrawRange(0, 0);
  const smokeMaterial = new THREE.PointsMaterial({ color: SMOKE.colour, size: SMOKE.sizeM * 3, sizeAttenuation: true, transparent: true, opacity: SMOKE.opacity, depthWrite: false });
  const smoke = new THREE.Points(smokeGeometry, smokeMaterial);
  smoke.frustumCulled = false;
  smoke.renderOrder = 2;
  group.add(smoke);

  let bursts = [];
  let puffList = [];
  let lastTau = null;
  const stats = { bursts: 0, puffs: 0 };

  const reset = () => {
    bursts = [];
    puffList = [];
    lastTau = null;
  };

  const update = ({ year, tau, seed = 0, cars = [] } = {}) => {
    if (!Number.isFinite(tau)) return;
    // A seek or a replay back in time: start afresh from here.
    if (lastTau !== null && tau < lastTau) reset();
    const from = lastTau ?? tau;
    lastTau = tau;
    const sparking = maxBursts > 0 && sparksEnabled(year);
    cars.forEach((car) => {
      const carSeed = seedFor("sparks", seed, car.key);
      if (sparking && sparkTrigger(car)) {
        burstTicks({ seed: carSeed, fromTau: from, toTau: tau, limit: 2 }).forEach((tick) => {
          if (bursts.length >= maxBursts) bursts.shift();
          bursts.push({ x: car.x, y: car.y, z: car.z, heading: car.heading, speed: car.speedMps, framesLeft: SPARKS.flashFrames || 1, particles: burstParticles(carSeed, tick, car.speedMps) });
          stats.bursts += 1;
        });
      }
      if (maxPuffs > 0 && car.lockup) {
        burstTicks({ seed: seedFor("smoke", seed, car.key), fromTau: from, toTau: tau, rate: SMOKE.puffsPerSec, tickSec: 1 / Math.max(1, SMOKE.puffsPerSec), limit: 4 }).forEach((tick) => {
          if (puffList.length >= maxPuffs) puffList.shift();
          const jitter = hash01x2(seedFor("smoke", seed, car.key), tick, 1) - 0.5;
          puffList.push({ x: car.x - Math.sin(car.heading) * jitter, y: car.y + 0.25, z: car.z + Math.cos(car.heading) * jitter, born: tick / Math.max(1, SMOKE.puffsPerSec) });
          stats.puffs += 1;
        });
      }
    });
    // Sparks: one flash of flashFrames drawn frames each.
    let n = 0;
    const dtFrame = 1 / SPARKS.nominalFps;
    bursts.forEach((burst) => {
      const age = ((SPARKS.flashFrames || 1) - burst.framesLeft) * dtFrame;
      const fx = Math.cos(burst.heading);
      const fz = Math.sin(burst.heading);
      burst.particles.forEach((p) => {
        // World velocity: the car's (× carry) plus the spread, relative to the ground.
        const vx = fx * (burst.speed - p.back) - fz * p.side;
        const vz = fz * (burst.speed - p.back) + fx * p.side;
        const vy = p.up;
        const sx = burst.x + fx * SPARKS.spawnAheadM + vx * age;
        const sz = burst.z + fz * SPARKS.spawnAheadM + vz * age;
        const sy = burst.y + 0.05 + vy * age - 0.5 * SPARKS.gravityMps2 * age * age;
        const o = n * 6;
        segments[o] = sx;
        segments[o + 1] = Math.max(burst.y + 0.02, sy);
        segments[o + 2] = sz;
        segments[o + 3] = sx - vx * SPARKS.streakSec;
        segments[o + 4] = Math.max(burst.y + 0.02, sy - vy * SPARKS.streakSec);
        segments[o + 5] = sz - vz * SPARKS.streakSec;
        n += 1;
      });
      burst.framesLeft -= 1;
    });
    bursts = bursts.filter((burst) => burst.framesLeft > 0);
    sparkGeometry.setDrawRange(0, n * 2);
    sparkGeometry.attributes.position.needsUpdate = n > 0;
    sparkLines.visible = n > 0;
    // Smoke: puffs that rise and fade in race time.
    puffList = puffList.filter((puff) => tau - puff.born < SMOKE.lifeSec);
    puffList.forEach((puff, k) => {
      const age = Math.max(0, tau - puff.born);
      puffs[k * 3] = puff.x;
      puffs[k * 3 + 1] = puff.y + SMOKE.riseMps * age;
      puffs[k * 3 + 2] = puff.z;
    });
    smokeGeometry.setDrawRange(0, puffList.length);
    smokeGeometry.attributes.position.needsUpdate = puffList.length > 0;
    smoke.visible = puffList.length > 0;
  };

  const dispose = () => {
    sparkGeometry.dispose();
    sparkMaterial.dispose();
    smokeGeometry.dispose();
    smokeMaterial.dispose();
  };

  return { object: group, update, reset, dispose, stats, get active() { return { bursts: bursts.length, puffs: puffList.length }; } };
};
