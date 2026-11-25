/**
 * CAM-4 (F1M24-GAMEPLAY §2.5 / §2.13 start-finish-scripts, onboard-inserts; RF-3D-04, RF-SIM-10,
 * RF-SIM-15, RNF-05, RNF-07): the pre-race, start and finish scripts and the onboard inserts are
 * deterministic by seed, respect the era (no parked safety car before 1993, no onboard before its
 * cameras exist) and do nothing when the engine sends neither snapshot.start nor `finished`.
 */

import broadcast from "../../data/balance/broadcast.json";
import cameraData from "../../data/balance/cameras.json";
import { circuitFor } from "../../engine/venue";
import { buildZoneRig, rigCamOfType, scParkedPose, scriptAnchorM, scriptShot } from "../../three/cameras";
import { zonesFor } from "../../three/cameraZones";
import { directorState } from "./directorState";
import { SCRIPT_NAMES, camKindOf, drawnLength, insertZonesFor, scriptTime, shotAvailable, skipPreRace, stepInsert, stepScript } from "./raceScripts";

const SEQ = broadcast.sequences;
const RIG_TYPES = new Set(broadcast.rigTemplate.types.map((entry) => entry.type));
const SCRIPT_IDS = new Set(broadcast.scriptRig.cams.map((entry) => entry.id));
const ONBOARD_IDS = new Set(cameraData.onboard.map((entry) => entry.id));

/** The engine's snapshot.start over the procedure (SIM-3 shape): grid until 10 s, five lights 10-14 s, out at 15.3 s. */
const startAt = (t, { formation = false } = {}) => {
  if (formation && t < 6) return { phase: "formation", lights: 0, t, procedure: "fiveRed" };
  if (t < 10) return { phase: "grid", lights: 0, t, procedure: "fiveRed" };
  if (t < 15.3) return { phase: "lights", lights: Math.min(5, 1 + Math.floor(t - 10)), t, procedure: "fiveRed" };
  return { phase: "out", lights: 0, t: 15.3, procedure: "fiveRed" };
};

const rowsOf = (n, { finished = [] } = {}) => Array.from({ length: n }, (_, i) => ({ car: { id: `c${i}`, isUser: i === 3 }, position: i + 1, interval: i ? 2 : undefined, pose: { progress: -0.001 * i, finished: finished.includes(`c${i}`) } }));

/** Runs the start scripts at 10 Hz over [0, until) s of procedure time; returns every cut. */
const runStart = ({ seed = 7, year = 2024, until = 40, skipAt = null, formation = false } = {}) => {
  let state = null;
  const cuts = [];
  for (let k = 0; k < until * 10; k += 1) {
    const t = k / 10;
    const start = startAt(t, { formation });
    const tau = start.phase === "out" ? t - 15.3 : 0;
    if (skipAt !== null && t >= skipAt && state && !state.skipped) state = skipPreRace(state);
    state = stepScript(state, { start, events: [], tau, seed, year, subjectId: "c3", rows: rowsOf(20) });
    const last = cuts[cuts.length - 1];
    const key = state.active ? `${state.name}:${state.cam}` : "tv";
    if (!last || last.key !== key) cuts.push({ key, t, scParked: state.scParked });
  }
  return cuts;
};

describe("broadcast.json scripts (RNF-07)", () => {
  test("every shot names a camera that exists and a trigger the engine has", () => {
    const triggers = new Set(["next", "start:pre", "start:lights", "start:out", "start:grid", "start:formation", "finished:winner"]);
    SCRIPT_NAMES.forEach((name) => {
      expect(SEQ[name].shots.length).toBeGreaterThan(0);
      SEQ[name].shots.forEach((shot) => {
        expect(triggers.has(shot.trigger)).toBe(true);
        const kind = camKindOf(shot.cam);
        if (kind === "script") expect(SCRIPT_IDS.has(shot.cam)).toBe(true);
        if (kind === "rig") expect(RIG_TYPES.has(shot.cam.slice(4))).toBe(true);
        if (kind === "onboard") expect(ONBOARD_IDS.has(shot.cam)).toBe(true);
        expect(shot.maxSec ?? Infinity).toBeGreaterThanOrEqual(shot.minSec ?? 0);
      });
    });
    expect(SCRIPT_IDS.has(SEQ.finish.finisherShots.cam)).toBe(true);
    expect(SEQ.finish.finisherShots.maxSec).toBeGreaterThanOrEqual(SEQ.finish.finisherShots.minSec);
    expect(ONBOARD_IDS.has(broadcast.inserts.onboard.cam)).toBe(true);
    expect(SEQ.preRace.skippable).toBe(true);
  });

  test("script time follows the procedure, then the race clock, with no jump at lights out", () => {
    expect(scriptTime({ start: startAt(12), tau: 0 })).toBe(12);
    expect(scriptTime({ start: startAt(16), tau: 0 })).toBe(15.3);
    expect(scriptTime({ start: startAt(16), tau: 2 })).toBeCloseTo(17.3, 9);
    expect(scriptTime({ tau: 5 })).toBe(5);
    expect(scriptTime({ start: startAt(12), tau: 0, viewSec: 99 })).toBe(99);
  });
});

describe("pre-race and start scripts", () => {
  test("deterministic by seed: the same seed films the same cuts, another seed other lengths", () => {
    const a = runStart({ seed: 7 });
    const b = runStart({ seed: 7 });
    const c = runStart({ seed: 8 });
    expect(a).toEqual(b);
    expect(a.map((cut) => cut.t)).not.toEqual(c.map((cut) => cut.t));
  });

  test("grid shots before the lights, the high grid shot through the lights, head-on at lights out, then the TV", () => {
    const cuts = runStart({ seed: 3 });
    const before = cuts.filter((cut) => cut.t < 10);
    expect(before.length).toBeGreaterThan(1);
    before.forEach((cut) => expect(cut.key.startsWith("preRace:")).toBe(true));
    const lights = cuts.find((cut) => cut.t >= 10);
    expect(lights).toMatchObject({ key: "start:gridHigh", t: 10 });
    const out = cuts.find((cut) => cut.t >= 15.3);
    expect(out).toMatchObject({ key: "start:startHeadOn" });
    expect(out.t).toBeCloseTo(15.3, 6);
    const after = cuts.filter((cut) => cut.t > 15.3).map((cut) => cut.key);
    expect(after).toEqual(["start:rig:braking", "start:rig:corner", "start:rig:highWide", "tv"]);
  });

  test("the parked safety car only from 1993 (era-defaults.json safetyCar), the close-up only with its camera", () => {
    const modern = runStart({ year: 2005 });
    expect(modern.some((cut) => cut.key === "preRace:scParked")).toBe(true);
    expect(modern.filter((cut) => cut.t < 15.3).every((cut) => cut.scParked)).toBe(true);
    expect(modern.filter((cut) => cut.t > 15.3).every((cut) => !cut.scParked)).toBe(true);
    const early = runStart({ year: 1990 });
    expect(early.some((cut) => cut.key === "preRace:scParked" || cut.scParked)).toBe(false);
    const seventies = runStart({ year: 1976 });
    expect(seventies.some((cut) => cut.key === "preRace:closeUp")).toBe(false);
    expect(shotAvailable({ cam: "scParked", requires: "safetyCar" }, undefined)).toBe(false);
  });

  test("the formation lap is filmed with its own shots, and the pre-race can be skipped", () => {
    const formation = runStart({ formation: true });
    formation.filter((cut) => cut.t < 6).forEach((cut) => expect(["preRace:heli", "preRace:chase"]).toContain(cut.key));
    const skipped = runStart({ skipAt: 2 });
    expect(skipped.filter((cut) => cut.t >= 2 && cut.t < 10).every((cut) => cut.key === "tv")).toBe(true);
    expect(skipped.find((cut) => cut.t >= 10).key).toBe("start:gridHigh");
  });

  test("without PRE_START the start script still opens at lights out, and nothing happens without snapshot.start", () => {
    const noPre = stepScript(null, { start: { phase: "out", lights: 0, t: 0 }, tau: 0, seed: 1, year: 2024, subjectId: "c0", rows: rowsOf(4) });
    expect(noPre).toMatchObject({ name: "start", cam: "startHeadOn", subjectId: "c0" });
    const late = stepScript(null, { start: { phase: "out", lights: 0, t: 0 }, tau: 30, seed: 1, year: 2024, subjectId: "c0", rows: rowsOf(4) });
    expect(late.active).toBe(false);
    const none = stepScript(null, { tau: 30, seed: 1, year: 2024, subjectId: "c0", rows: rowsOf(4) });
    expect(none).toMatchObject({ active: false, cam: null, scParked: false });
  });
});

describe("finish script", () => {
  const finishedAt = (list) => list.map(([carId, t, pos]) => ({ type: "finished", carId, t, pos }));
  const crossings = [["c0", 100, 1], ["c1", 101.2, 2], ["c2", 104, 3], ["c3", 104.3, 4], ["c4", 125, 5]];
  const runFinish = (seed) => {
    let state = null;
    const shots = [];
    for (let k = 0; k <= 1000; k += 1) {
      const tau = 100 + k / 10;
      const seen = crossings.filter((entry) => entry[1] <= tau + 1e-9);
      const events = finishedAt(seen);
      state = stepScript(state, { start: { phase: "out", lights: 0, t: 15 }, events, tau, seed, year: 2024, subjectId: "c7", rows: rowsOf(5, { finished: seen.map((e) => e[0]) }) });
      const key = state.active && state.cam ? `${state.cam}|${state.subjectId}` : "tv";
      if (!shots.length || shots[shots.length - 1].key !== key) shots.push({ key, tau });
    }
    return shots;
  };

  test("the winner first, then a short shot per car that crosses; a late one is not filmed after the fact", () => {
    const shots = runFinish(11);
    expect(shots[0].key).toBe("lineHigh|c0");
    expect(shots[1].key).toBe("chase|c0");
    const finishers = shots.filter((shot) => shot.key.startsWith("lineSide|")).map((shot) => shot.key.split("|")[1]);
    // Every car is filmed once, in crossing order (c4 crosses on its own, later).
    expect(finishers).toEqual(finishers.slice().sort());
    expect(new Set(finishers).size).toBe(finishers.length);
    expect(finishers).toContain("c4");
    expect(shots[shots.length - 1].key).toBe("tv");
    const { minSec, maxSec } = SEQ.finish.finisherShots;
    for (let k = 0; k < shots.length - 1; k += 1) {
      if (shots[k].key.startsWith("lineSide|")) {
        const length = shots[k + 1].tau - shots[k].tau;
        expect(length).toBeGreaterThanOrEqual(minSec - 0.11);
        expect(length).toBeLessThanOrEqual(maxSec + 0.11);
      }
    }
  });

  test("a crossing older than maxLagSec is not filmed late", () => {
    const events = finishedAt([["c0", 100, 1], ["c1", 100.5, 2]]);
    const input = (tau) => ({ start: { phase: "out", lights: 0, t: 15 }, events, tau, seed: 4, year: 2024, subjectId: "c3", rows: rowsOf(4) });
    let state = stepScript(null, input(100));
    [106, 112, 112.1].forEach((tau) => {
      state = stepScript(state, input(tau));
    });
    expect(state.cam).toBeNull();
    expect(state.finisher.seen).toContain("c1");
  });

  test("deterministic by seed", () => {
    expect(runFinish(11)).toEqual(runFinish(11));
    expect(runFinish(11).map((s) => s.tau)).not.toEqual(runFinish(12).map((s) => s.tau));
  });

  test("drawn lengths depend on the seed and stay between minSec and maxSec", () => {
    const shot = { minSec: 2, maxSec: 4 };
    for (let seed = 0; seed < 50; seed += 1) {
      const len = drawnLength(shot, { seed, name: "finish", index: 0, carId: "c0" });
      expect(len).toBeGreaterThanOrEqual(2);
      expect(len).toBeLessThanOrEqual(4);
    }
    expect(drawnLength({ minSec: 1, until: "start:out" }, { seed: 1, name: "start", index: 0 })).toBeNull();
  });
});

describe("onboard inserts (inserts.onboard)", () => {
  const bahrain = circuitFor({ name: "Bahrain Grand Prix", circuit: "bahrain" }, 2024);
  const zones = zonesFor(bahrain);
  const cfg = broadcast.inserts.onboard;

  const runLaps = ({ seed = 5, year = 2024, laps = 6, blocked = () => false } = {}) => {
    let state = null;
    const inserts = [];
    for (let k = 0; k < laps * 900; k += 1) {
      const progress = k / 900;
      const tau = progress * 95;
      state = stepInsert(state, { carId: "c3", progress, tau, seed, year, zones, blocked: blocked(progress) });
      if (state.active && (!inserts.length || inserts[inserts.length - 1].end !== null)) inserts.push({ lap: state.lap, zone: state.zone, from: tau, end: null });
      if (!state.active && inserts.length && inserts[inserts.length - 1].end === null) inserts[inserts.length - 1].end = tau;
    }
    return inserts;
  };

  test("at most perLap a lap, only in zones of zoneKinds, within minSec..maxSec, deterministic by seed", () => {
    const a = runLaps();
    expect(a.length).toBeGreaterThan(0);
    const perLap = {};
    a.forEach((insert) => {
      perLap[insert.lap] = (perLap[insert.lap] || 0) + 1;
      expect(cfg.zoneKinds).toContain(zones.zones[insert.zone].kind);
      if (insert.end !== null) expect(insert.end - insert.from).toBeLessThanOrEqual(cfg.maxSec + 0.2);
    });
    Object.values(perLap).forEach((count) => expect(count).toBeLessThanOrEqual(cfg.perLap));
    expect(runLaps()).toEqual(a);
    expect(insertZonesFor(zones, { seed: 5, carId: "c3", lap: 2 })).toEqual(insertZonesFor(zones, { seed: 5, carId: "c3", lap: 2 }));
  });

  test("never in a fight, never in a season without that camera, never without zones", () => {
    expect(runLaps({ blocked: () => true })).toEqual([]);
    expect(runLaps({ year: 1976 })).toEqual([]);
    expect(stepInsert(null, { carId: "c3", progress: 0.5, tau: 1, seed: 1, year: 2024 }).active).toBe(false);
  });
});

describe("the director with scripts and inserts (CAM-4)", () => {
  test("snapshot.start gives the script the shot; without it the director films as before", () => {
    const rows = rowsOf(20);
    const shot = directorState("c3", rows, [], [], { start: startAt(12), tau: 0, seed: 1, year: 2024 });
    expect(shot).toMatchObject({ shotKind: "script", cameraId: "gridHigh", camType: "script", subjectIds: ["c3"], scParked: true });
    const plain = directorState("c3", rows, [], [], {});
    expect(plain.shotKind).toBe("zone");
    expect(plain.scParked).toBe(false);
  });

  test("at the flag the subject is the winner, then the car that crosses", () => {
    const rows = rowsOf(4, { finished: ["c0", "c1"] });
    const events = [{ type: "finished", carId: "c0", t: 100, pos: 1 }];
    let prev = directorState("c3", rows, events, [], { start: startAt(16), tau: 100, seed: 2, year: 2024 });
    expect(prev).toMatchObject({ shotKind: "script", subjectIds: ["c0"] });
    const more = [...events, { type: "finished", carId: "c1", t: 110, pos: 2 }];
    for (let tau = 100; tau <= 111; tau += 0.5) prev = directorState("c3", rows, more, [], { start: startAt(16), tau, seed: 2, year: 2024, prev });
    expect(prev).toMatchObject({ shotKind: "script", cameraId: "lineSide", subjectIds: ["c1"], reason: "finish" });
  });

  test("an insert cuts to the driver's view on a chosen straight zone", () => {
    const bahrain = circuitFor({ name: "Bahrain Grand Prix", circuit: "bahrain" }, 2024);
    const zones = zonesFor(bahrain);
    const lap = 1;
    const [zone] = insertZonesFor(zones, { seed: 9, carId: "c0", lap });
    const share = (zones.zones[zone].fromM + 1) / zones.lengthM;
    const rows = [{ car: { id: "c0" }, position: 1, pose: { progress: lap + share } }];
    const shot = directorState("c0", rows, [], [], { tau: 50, seed: 9, year: 2024, zones });
    expect(shot).toMatchObject({ shotKind: "insert", cameraId: broadcast.inserts.onboard.cam, camType: "onboard" });
  });
});

describe("script cameras on the track (three/cameras.js)", () => {
  const monza = circuitFor({ name: "Italian Grand Prix", circuit: "monza" }, 2005);

  test("every scriptRig camera gives a finite shot; the safety car waits behind the last slot", () => {
    const focus = { x: 0, y: 0, z: 0, heading: 0.3, speed: 0 };
    broadcast.scriptRig.cams.forEach((cam) => {
      const shot = scriptShot(cam.id, focus, monza, { gridCount: 20 });
      expect(shot).not.toBeNull();
      [shot.pos.x, shot.pos.y, shot.pos.z, shot.look.x, shot.look.z, shot.fov].forEach((value) => expect(Number.isFinite(value)).toBe(true));
      expect(shot.fov).toBeGreaterThanOrEqual(broadcast.scriptRig.fovDeg.min);
      expect(shot.fov).toBeLessThanOrEqual(broadcast.scriptRig.fovDeg.max);
    });
    expect(scriptShot("nope", focus, monza)).toBeNull();
    expect(scriptAnchorM("scParked", 20)).toBeLessThan(scriptAnchorM("gridBack", 20));
    expect(scriptAnchorM("gridBack", 20)).toBeLessThan(scriptAnchorM("pole", 20));
    const sc = scParkedPose(monza, 20);
    expect(sc.progress * monza.length).toBeCloseTo(monza.length + scriptAnchorM("scParked", 20), 3);
  });

  test("a rig:<type> shot takes the nearest trackside camera of that type", () => {
    const rig = buildZoneRig(monza);
    const pose = { x: rig[0].x, z: rig[0].z };
    const cam = rigCamOfType(rig, rig.find((entry) => !entry.moving).type, pose);
    expect(cam).not.toBeNull();
    expect(rig.every((entry) => entry.zoneKind !== undefined)).toBe(true);
    expect(rigCamOfType(rig, "noSuchType", pose)).toBeNull();
  });
});
