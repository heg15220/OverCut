/**
 * CAM-5 (F1M24-GAMEPLAY §2.11 sc-pose-from-sim; RF-SIM-10, RF-3D-04, RF-SIM-15, RNF-05, RNF-07,
 * SRS §6): the safety car in the 3D view comes from the engine's snapshot.sc and nothing else; its
 * deployment is filmed by broadcast.json sequences.scDeploy, deterministic by seed, never before
 * 1993, and with no snapshot the director films as before. The 90 m ahead of the leader are gone
 * from three/Race3D.js.
 */

import fs from "fs";
import path from "path";
import broadcast from "../../data/balance/broadcast.json";
import { circuitFor } from "../../engine/venue";
import { poseAt } from "../../engine/trackGeometry";
import { isScSnapshot, scDrawn, scInEra, scLightLevels, scLightsOn, scPoseOf, scShareOf } from "../../three/safetyCarView";
import { directorState } from "./directorState";
import { scSequenceCameras, scShotLength, stepScDeploy } from "./scSequence";

const SEQ = broadcast.sequences.scDeploy;
const PIT_IDS = new Set(broadcast.pitRig.cams.map((cam) => cam.id));
const monza = circuitFor({ name: "Italian Grand Prix", circuit: "monza" }, 2005);

/** The engine's snapshot.sc over a neutralisation (SIM-5 shape): out at 10 s, picks up the leader at 40 s, in this lap at 120 s, restart at 160 s. */
const scAt = (t) => {
  if (t < 10) return null;
  const s = (0.1 + (t - 10) * 0.002) % 1;
  if (t < 40) return { phase: "DEPLOYED", s, v: 45, lap: 5, lightsOn: true };
  if (t < 80) return { phase: "PICKUP", s, v: 40, lap: 5, lightsOn: true };
  if (t < 120) return { phase: "TRAIN", s, v: 38, lap: 6, lightsOn: true };
  if (t < 160) return { phase: "IN_THIS_LAP", s, v: 38, lap: 7, lightsOn: false };
  if (t < 170) return { phase: "RESTART", s, v: 0, lap: 8, lightsOn: false };
  return null;
};

/** Runs the deployment sequence at 10 Hz over [0, until) s; returns every cut. */
const runDeploy = ({ seed = 3, year = 2024, until = 200, sc = scAt } = {}) => {
  let state = null;
  const cuts = [];
  for (let k = 0; k < until * 10; k += 1) {
    const t = k / 10;
    state = stepScDeploy(state, { sc: sc(t), tau: t, seed, year });
    const key = state.active ? state.cam : null;
    const last = cuts[cuts.length - 1];
    if (!last || last.key !== key) cuts.push({ key, t });
  }
  return cuts;
};

const rowsOf = (n) => Array.from({ length: n }, (_, i) => ({ car: { id: `c${i}`, isUser: i === 3 }, position: i + 1, interval: i ? 3 : undefined, lapsDown: 0, pose: { progress: 5.5 - 0.004 * i, inPit: false } }));

describe("broadcast.json scDeploy, scLights, scView (RNF-07)", () => {
  test("the deployment shots name cameras the view has and the safety car's era", () => {
    expect(SEQ.shots.length).toBeGreaterThan(0);
    expect(SEQ.shots[0].trigger).toBe("sc:DEPLOYED");
    scSequenceCameras().forEach((cam) => expect(PIT_IDS.has(cam) || cam === "chase" || cam === "heli").toBe(true));
    SEQ.shots.forEach((shot) => {
      expect(shot.requires).toBe("safetyCar");
      expect(shot.subject).toBe("safetyCar");
      expect(shot.maxSec).toBeGreaterThanOrEqual(shot.minSec);
    });
  });

  test("values without a source are marked pending", () => {
    expect(SEQ.status).toBe("pending");
    expect(broadcast.scLights.status).toBe("pending");
    expect(broadcast.scView.status).toBe("pending");
  });
});

describe("the safety car from snapshot.sc (three/safetyCarView.js)", () => {
  test("only from 1993 and only in the phases it is on the road (SRS §6.2)", () => {
    const sc = { phase: "TRAIN", s: 0.3, v: 40, lap: 3, lightsOn: true };
    expect(scInEra(1992)).toBe(false);
    expect(scInEra(1993)).toBe(true);
    expect(scInEra(undefined)).toBe(false);
    expect(scDrawn(sc, 1990)).toBe(false);
    expect(scDrawn(sc, 2024)).toBe(true);
    expect(scDrawn({ ...sc, phase: "RESTART" }, 2024)).toBe(false);
    expect(scDrawn(null, 2024)).toBe(false);
    expect(scPoseOf(sc, monza, 1986)).toBeNull();
  });

  test("a pose handed over without a phase is not a snapshot", () => {
    expect(isScSnapshot({ x: 1, y: 2, heading: 0 })).toBe(false);
    expect(isScSnapshot({ phase: "DEPLOYED", s: 0.1 })).toBe(true);
  });

  test("it is drawn at the engine's s: a share of the lap, or metres when above 1", () => {
    const pose = scPoseOf({ phase: "PICKUP", s: 0.25, v: 30, lap: 2 }, monza, 2024);
    const at = poseAt(monza, 0.25);
    expect(pose.x).toBeCloseTo(at.x, 6);
    expect(pose.y).toBeCloseTo(at.y, 6);
    expect(pose.progress).toBe(0.25);
    expect(pose.v).toBe(30);
    expect(scShareOf({ s: monza.length / 2 }, monza)).toBeCloseTo(0.5, 9);
    expect(scShareOf({ s: 0.4, progress: 7.75 }, monza)).toBeCloseTo(0.75, 9);
    expect(scShareOf({ phase: "TRAIN" }, monza)).toBeNull();
  });

  test("no distance to the leader decides where it is: the same s, the same place, whoever leads", () => {
    const a = scPoseOf({ phase: "TRAIN", s: 0.6, v: 40, lap: 4 }, monza, 2010);
    const b = scPoseOf({ phase: "TRAIN", s: 0.6, v: 40, lap: 9 }, monza, 2010);
    expect(a).toEqual(b);
  });

  test("lights: the engine's lightsOn, else off once it is in this lap (FIA)", () => {
    expect(scLightsOn({ phase: "TRAIN", lightsOn: false })).toBe(false);
    expect(scLightsOn({ phase: "IN_THIS_LAP", lightsOn: true })).toBe(true);
    expect(scLightsOn({ phase: "TRAIN" })).toBe(true);
    expect(scLightsOn({ phase: "IN_THIS_LAP" })).toBe(false);
    expect(scLightsOn(null)).toBe(false);
  });

  test("the light bar flashes at scLights.flashHz, its halves in turn, and is dark with the lights off", () => {
    const cfg = broadcast.scLights;
    expect(scLightLevels(0.1, false)).toEqual([0, 0]);
    const period = 1 / cfg.flashHz;
    const first = scLightLevels(period * 0.1, true);
    const second = scLightLevels(period * 0.6, true);
    expect(first).toEqual([1, cfg.offLevel]);
    expect(second).toEqual([cfg.offLevel, 1]);
    expect(scLightLevels(period * 1.1, true)).toEqual(first);
    expect(scLightLevels(3, true, { ...cfg, flashHz: null })).toEqual([1, 1]);
    expect(scLightLevels(period * 0.1, true, { ...cfg, pattern: "together" })).toEqual([1, 1]);
  });
});

describe("the deployment sequence (components/director/scSequence.js)", () => {
  test("films the safety car leaving the pits once per deployment, then back to the race", () => {
    const cuts = runDeploy();
    const shots = cuts.filter((cut) => cut.key !== null);
    expect(shots[0]).toEqual({ key: SEQ.shots[0].cam, t: 10 });
    expect(shots.map((cut) => cut.key)).toEqual(SEQ.shots.map((shot) => shot.cam));
    const total = SEQ.shots.reduce((sum, shot) => sum + shot.maxSec, 0);
    const end = cuts.find((cut) => cut.key === null && cut.t > 10);
    expect(end.t).toBeLessThanOrEqual(10 + total + 0.2);
    expect(end.t).toBeGreaterThanOrEqual(10 + SEQ.shots.reduce((sum, shot) => sum + shot.minSec, 0));
  });

  test("a second deployment is filmed again", () => {
    const twice = (t) => (t < 100 ? scAt(t) : scAt(t - 90));
    const starts = runDeploy({ sc: twice, until: 200 }).filter((cut) => cut.key === SEQ.shots[0].cam);
    expect(starts.map((cut) => cut.t)).toEqual([10, 100]);
  });

  test("deterministic by seed (RF-SIM-15 / RNF-05)", () => {
    expect(runDeploy({ seed: 11 })).toEqual(runDeploy({ seed: 11 }));
    const lengths = (seed) => SEQ.shots.map((shot, index) => scShotLength(shot, { seed, deployment: 1, index }));
    expect(lengths(1)).toEqual(lengths(1));
    expect(lengths(1)).not.toEqual(lengths(2));
  });

  test("nothing before 1993, and nothing without snapshot.sc", () => {
    expect(runDeploy({ year: 1988 }).every((cut) => cut.key === null)).toBe(true);
    expect(runDeploy({ sc: () => null }).every((cut) => cut.key === null)).toBe(true);
    expect(stepScDeploy(null, { sc: scAt(20), tau: 20 }).active).toBe(false);
  });

  test("ends when the safety car leaves the road", () => {
    const early = (t) => (t < 12 ? scAt(t) : null);
    const cuts = runDeploy({ sc: early, until: 30 });
    expect(cuts.find((cut) => cut.key === null && cut.t > 10).t).toBeCloseTo(12, 6);
  });
});

describe("directorState with snapshot.sc", () => {
  test("shotKind 'sc' while the deployment is on air, the chosen car still the subject", () => {
    let prev = null;
    const all = [];
    for (let k = 0; k < 400; k += 1) {
      const t = k / 10;
      prev = directorState("c3", rowsOf(10), [], [], { now: t, tau: t, prev, seed: 5, year: 2024, sc: scAt(t) });
      all.push(prev);
    }
    const kinds = all.map((shot) => shot.shotKind);
    expect(all.every((shot) => shot.subjectIds[0] === "c3")).toBe(true);
    const sc = all.filter((shot) => shot.shotKind === "sc");
    expect(sc.length).toBeGreaterThan(0);
    expect(sc.every((shot) => shot.scShot.subject === "safetyCar" && shot.camType === (PIT_IDS.has(shot.cameraId) ? "pit" : shot.cameraId))).toBe(true);
    expect(kinds.slice(0, 100).includes("sc")).toBe(false);
    expect(kinds[100]).toBe("sc");
    expect(kinds[kinds.length - 1]).not.toBe("sc");
  });

  test("without snapshot.sc the director is unchanged", () => {
    const run = (withSc) => {
      let prev = null;
      const out = [];
      for (let k = 0; k < 200; k += 1) {
        const t = k / 10;
        const clock = { now: t, tau: t, prev, seed: 5, year: 2024, ...(withSc ? { sc: null } : {}) };
        prev = directorState("c3", rowsOf(10), [], [], clock);
        out.push([prev.shotKind, prev.cameraId, prev.subjectIds.join()]);
      }
      return out;
    };
    expect(run(true)).toEqual(run(false));
  });
});

describe("three/Race3D.js (CAM-5)", () => {
  const source = fs.readFileSync(path.join(__dirname, "../../three/Race3D.js"), "utf8");
  test("the 90 m ahead of the leader are gone: the safety car comes from snapshot.sc", () => {
    expect(source).not.toMatch(/90\s*\/\s*circuit\.length/);
    expect(source).not.toMatch(/safetyCarOn/);
    expect(source).toMatch(/scPoseOf\(/);
  });
});
