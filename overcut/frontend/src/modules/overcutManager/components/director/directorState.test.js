/**
 * The pure TV director (RF-3D-04, RNF-07, RNF-09; F1M24-GAMEPLAY §2.5 director-follow-focus,
 * CAM-1): broadcast.json passes its complete schema, and with the focused car fixed the TV
 * never films another subject unless "follow the action" is switched on.
 */

import Ajv from "ajv";
import schema from "../../engine/packs/schema/broadcast.schema.json";
import broadcast from "../../data/balance/broadcast.json";
import cameraData from "../../data/balance/cameras.json";
import { arbitrate, battlesOf, cameraFor, directorState, isOwnIncident, mayInterrupt, rivalOf, shotClassOf } from "./directorState";
import { stepScript, untilFires } from "./raceScripts";
import { scRestartCameras, scRestartShotLength, stepScRestart, trainFraming } from "./scSequence";
import { circuitFor } from "../../engine/venue";
import { zonesFor } from "../../three/cameraZones";
import { battlesIn } from "../raceClock";

// A small seeded generator for the test fields (RF-SIM-15: no Math.random in tests either).
const lcg = (seed) => {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
};

const RIG = [
  { id: "braking-0", type: "braking", from: 0.0, to: 0.2, priority: 3 },
  { id: "corner-1", type: "corner", from: 0.15, to: 0.45, priority: 2 },
  { id: "straight-2", type: "straight", from: 0.4, to: 0.8, priority: 1 },
  { id: "grandstand-3", type: "grandstand", from: 0.75, to: 1.02, priority: 4 },
];

/** A timing field of `n` cars, leader first, with gaps that put some of them in fights. */
const fieldOf = (rand, n = 20, { userIndex = 7 } = {}) => {
  const rows = [];
  let progress = 0.9;
  for (let i = 0; i < n; i += 1) {
    const interval = i === 0 ? undefined : rand() < 0.4 ? rand() * 0.9 : 1 + rand() * 4;
    progress -= (interval ?? 0) * 0.0006 + 0.0005;
    rows.push({
      car: { id: `c${i}`, isUser: i === userIndex },
      position: i + 1,
      interval,
      lapsDown: 0,
      out: false,
      pose: { progress: ((progress % 1) + 1) % 1, inPit: rand() < 0.05, gone: false },
    });
  }
  return rows;
};

const followOn = { ...broadcast.director, followAction: { ...broadcast.director.followAction, enabled: true } };

describe("broadcast.json (RNF-07)", () => {
  test("passes its complete schema", () => {
    const validate = new Ajv({ allErrors: true, strict: true }).compile(schema);
    const ok = validate(broadcast);
    expect(validate.errors).toBeNull();
    expect(ok).toBe(true);
  });

  test("follow the action is off by default; every block another package wires is marked", () => {
    expect(broadcast.director.followAction.enabled).toBe(false);
    ["cycleOrder", "defaultView", "rigTemplate", "framing", "zonesPolicy", "replay", "scLights"].forEach((key) => expect(["pending", "current", "sourced"]).toContain(broadcast[key].status));
    Object.values(broadcast.sequences).forEach((sequence) => expect(sequence.status).toBe("pending"));
    expect(broadcast.inserts.onboard.status).toBe("pending");
  });

  test("the camera cycle names only cameras that exist", () => {
    const known = new Set(["tv", "chase", "drone", "heli", ...cameraData.onboard.filter((entry) => !entry.replayOnly).map((entry) => entry.id)]);
    broadcast.cycleOrder.cameras.forEach((id) => expect(known.has(id)).toBe(true));
  });
});

describe("directorState (F1M24-GAMEPLAY §2.5)", () => {
  test("with a fixed focus the TV never films another subject (300 seeded fields)", () => {
    for (let seed = 1; seed <= 300; seed += 1) {
      const rand = lcg(seed);
      const rows = fieldOf(rand);
      const focusId = `c${Math.floor(rand() * rows.length)}`;
      let prev = null;
      for (let tick = 0; tick < 5; tick += 1) {
        const shot = directorState(focusId, rows, [], RIG, { now: tick * 3, prev });
        expect(shot.subjectIds[0]).toBe(focusId);
        expect(shot.reason).toBe("focus");
        expect(shot.subjectIds.length).toBeLessThanOrEqual(2);
        prev = shot;
      }
    }
  });

  test("frames the rival with the focused car when they are racing", () => {
    const rows = fieldOf(lcg(5));
    rows[4].interval = 0.4;
    rows[4].pose.inPit = false;
    rows[3].pose.inPit = false;
    rows[2].pose.inPit = false;
    rows[3].interval = 2;
    rows[5].interval = 3;
    const attacker = directorState("c4", rows, [], RIG, {});
    expect(attacker).toMatchObject({ shotKind: "battle", subjectIds: ["c4", "c3"] });
    const defender = directorState("c3", rows, [], RIG, {});
    expect(defender.subjectIds).toEqual(["c3", "c4"]);
  });

  test("the SIM-4 battle state, when the snapshot has it, decides the fight", () => {
    const rows = fieldOf(lcg(9)).map((row) => ({ ...row, pose: { ...row.pose, inPit: false } }));
    rows[6].battle = "DEFENDING";
    rows[6].interval = 0.2;
    expect(rivalOf(rows, "c6")).toBe("c7");
    rows[6].battle = "FOLLOWING";
    expect(rivalOf(rows, "c6")).toBeNull();
    expect(directorState("c6", rows, [], RIG, {}).shotKind).toBe("zone");
  });

  test("a car in the pit lane is a pit shot; a retired focus hands over to the leader", () => {
    const rows = fieldOf(lcg(3));
    rows[2].pose.inPit = true;
    expect(directorState("c2", rows, [], RIG, {})).toMatchObject({ shotKind: "pit", subjectIds: ["c2"], reason: "focus" });
    rows[2].out = true;
    expect(directorState("c2", rows, [], RIG, {})).toMatchObject({ subjectIds: ["c0"], reason: "focusGone" });
    expect(directorState(null, rows, [], RIG, {}).reason).toBe("leader");
    expect(directorState("c1", [], [], RIG, {})).toMatchObject({ shotKind: "none", subjectIds: [] });
  });

  test("keeps the camera on air while the car is still in its stretch, else the highest priority", () => {
    expect(cameraFor(RIG, 0.17).id).toBe("braking-0");
    expect(cameraFor(RIG, 0.17, "corner-1").id).toBe("corner-1");
    expect(cameraFor(RIG, 0.5, "corner-1").id).toBe("straight-2");
    expect(cameraFor(RIG, 0.01).id).toBe("grandstand-3");
    expect(cameraFor([], 0.3)).toBeNull();
  });

  test("follow the action (opt-in) takes the user's fight and holds it holdSec", () => {
    const rows = fieldOf(lcg(11), 20, { userIndex: 9 }).map((row) => ({ ...row, pose: { ...row.pose, inPit: false } }));
    rows.forEach((row, i) => {
      if (i) row.interval = 2;
    });
    rows[3].interval = 0.5;
    rows[9].interval = 0.6;
    const first = directorState("c15", rows, [], RIG, { now: 100 }, followOn);
    expect(first).toMatchObject({ reason: "followAction", subjectIds: ["c9", "c8"] });
    expect(first.hold).toEqual({ id: "c9", until: 100 + broadcast.director.followAction.holdSec });
    // The user's fight ends; the hold keeps nothing that is no longer a fight.
    rows[9].interval = 2;
    const next = directorState("c15", rows, [], RIG, { now: 101, prev: first }, followOn);
    expect(next.subjectIds[0]).toBe("c3");
  });

  test("battlesOf matches raceClock.battlesIn on the same rows", () => {
    for (let seed = 1; seed <= 50; seed += 1) {
      const rows = fieldOf(lcg(seed));
      const ours = battlesOf(rows).map((battle) => [battle.attacker.car.id, battle.defender.car.id]);
      const theirs = battlesIn(rows).map((battle) => [battle.attacker.car.id, battle.defender.car.id]);
      expect(ours).toEqual(theirs);
    }
  });

  test("pure: the same inputs give the same shot, and the rows are not touched", () => {
    const rows = fieldOf(lcg(21));
    const before = JSON.stringify(rows);
    const a = directorState("c5", rows, [], RIG, { now: 4 });
    const b = directorState("c5", rows, [], RIG, { now: 4 });
    expect(a).toEqual(b);
    expect(JSON.stringify(rows)).toBe(before);
  });
});

// ------------------------------------------------------------------------------------------
// CAM-C3 (F1M24-CHINA §2.5 / §3.3; VIEW-13 and VIEW-10, the script; RF-3D-04, RF-SIM-10, RF-SIM-15,
// RNF-05, RNF-07): priorities with override and restore, the sting, the restart behind the safety
// car with the train, and the start script startLightsLow → startHigh, deterministic by seed.

const PRI = broadcast.directorPriorities;
const lineRows = (n, { inPit = -1, progress = 5.5 } = {}) =>
  Array.from({ length: n }, (_, i) => ({ car: { id: `c${i}`, isUser: i === 3 }, position: i + 1, interval: i ? 3 : undefined, lapsDown: 0, out: false, pose: { progress: progress - 0.004 * i, inPit: i === inPit, gone: false } }));
const LOCK = Object.freeze({ cameraId: "tcam", camType: "onboard", focusId: "c3", mode: "camera", fovDeg: 72 });

describe("director priorities (CAM-C3, VIEW-13)", () => {
  test("the order of broadcast.json: the flag and the own incident override a locked camera, the rest never", () => {
    expect(PRI.order).toEqual(["finish", "ownIncident", "userLock", "pitSeq", "zones"]);
    expect(mayInterrupt("finish", { userLocked: true })).toBe(true);
    expect(mayInterrupt("ownIncident", { userLocked: true })).toBe(true);
    expect(mayInterrupt("pitSeq", { userLocked: true })).toBe(false);
    expect(mayInterrupt("zones", { userLocked: true })).toBe(false);
    ["finish", "ownIncident", "pitSeq", "zones"].forEach((kind) => expect(mayInterrupt(kind, { userLocked: false })).toBe(true));
    // An override on a class below the lock does not let it jump the lock.
    const cfg = { ...PRI, override: { ...PRI.override, pitSeq: true } };
    expect(mayInterrupt("pitSeq", { userLocked: true }, cfg)).toBe(false);
  });

  test("every shot kind of the director has a class, the scripts by name", () => {
    Object.values(PRI.shotClass).forEach((kind) => expect(PRI.order).toContain(kind));
    expect(shotClassOf({ shotKind: "script", script: { name: "finish" } })).toBe("finish");
    expect(shotClassOf({ shotKind: "script", script: { name: "start" } })).toBe("pitSeq");
    expect(shotClassOf({ shotKind: "script", scRestartOn: true, script: { name: null } })).toBe("pitSeq");
    expect(shotClassOf({ shotKind: "pit" })).toBe("pitSeq");
    expect(shotClassOf({ shotKind: "battle" })).toBe("zones");
    expect(shotClassOf(null)).toBe("zones");
  });

  test("own incident: an error or a retirement of a car of the player; a rival's or a pass is not", () => {
    expect(isOwnIncident({ trigger: "mistake", subjectId: "c3" }, ["c3"])).toBe(true);
    expect(isOwnIncident({ trigger: "dnf", subjectId: "c9", otherId: "c3" }, new Set(["c3"]))).toBe(true);
    expect(isOwnIncident({ trigger: "mistake", subjectId: "c9" }, ["c3"])).toBe(false);
    expect(isOwnIncident({ trigger: "pass", subjectId: "c3" }, ["c3"])).toBe(false);
    expect(isOwnIncident({ trigger: "mistake", subjectId: "c3" })).toBe(false);
  });

  test("arbitrate saves the user's state once and hands back that exact state when the interruption ends", () => {
    let arb = arbitrate(null, { active: ["zones"], userLock: LOCK });
    expect(arb).toEqual({ onAir: "userLock", saved: null, restore: null, dropLock: false });
    arb = arbitrate(arb, { active: ["pitSeq"], userLock: LOCK });
    expect(arb.onAir).toBe("userLock");
    arb = arbitrate(arb, { active: ["ownIncident", "pitSeq"], userLock: LOCK });
    expect(arb.onAir).toBe("ownIncident");
    expect(arb.saved).toBe(LOCK);
    // The viewer's state as it was at the interruption, even if a later step reports another one.
    arb = arbitrate(arb, { active: ["finish", "ownIncident"], userLock: { ...LOCK, cameraId: "chase" } });
    expect(arb.onAir).toBe("finish");
    expect(arb.saved).toBe(LOCK);
    arb = arbitrate(arb, { active: ["zones"], userLock: LOCK });
    expect(arb).toEqual({ onAir: "userLock", saved: null, restore: LOCK, dropLock: false });
    arb = arbitrate(arb, { active: ["zones"], userLock: LOCK });
    expect(arb.restore).toBeNull();
    // restore "zones": the lock is dropped instead.
    const zonesCfg = { ...PRI, restore: "zones" };
    const hit = arbitrate(null, { active: ["finish"], userLock: LOCK }, zonesCfg);
    expect(arbitrate(hit, { active: ["zones"], userLock: LOCK }, zonesCfg)).toMatchObject({ restore: null, dropLock: true });
  });

  test("directorState: the locked camera holds over the pit lane, the own replay overrides it and restores it exactly", () => {
    const users = ["c3"];
    const run = (steps) => {
      let prev = null;
      return steps.map(({ rows, replay = null, userLock = LOCK }, k) => {
        prev = directorState("c3", rows, [], RIG, { now: k, tau: k, prev, seed: 4, year: 2024, userLock, replay, userIds: users });
        return prev;
      });
    };
    const replay = { trigger: "mistake", subjectId: "c3", otherId: null };
    const rival = { trigger: "mistake", subjectId: "c7", otherId: null };
    const shots = run([
      { rows: lineRows(10) },
      { rows: lineRows(10, { inPit: 3 }) },
      { rows: lineRows(10), replay: rival },
      { rows: lineRows(10), replay },
      { rows: lineRows(10), replay },
      { rows: lineRows(10) },
      { rows: lineRows(10) },
    ]);
    expect(shots[0]).toMatchObject({ shotKind: "user", cameraId: "tcam", camType: "onboard", subjectIds: ["c3"] });
    expect(shots[1]).toMatchObject({ shotKind: "user", priority: { onAir: "userLock" } });
    expect(shots[2]).toMatchObject({ shotKind: "user", priority: { onAir: "userLock", saved: null } });
    expect(shots[3]).toMatchObject({ shotKind: "replay", cameraId: null, subjectIds: ["c3"], priority: { onAir: "ownIncident" } });
    expect(shots[3].priority.saved).toEqual(LOCK);
    expect(shots[4].priority.saved).toEqual(LOCK);
    expect(shots[5]).toMatchObject({ shotKind: "user", cameraId: LOCK.cameraId, camType: LOCK.camType });
    expect(shots[5].priority.restore).toEqual(LOCK);
    expect(shots[6].priority.restore).toBeNull();
  });

  test("directorState: the chequered flag overrides a locked camera", () => {
    const rows = lineRows(4).map((row, i) => ({ ...row, pose: { ...row.pose, finished: i === 0 } }));
    const events = [{ type: "finished", carId: "c0", t: 100, pos: 1 }];
    const shot = directorState("c3", rows, events, RIG, { tau: 100, seed: 2, year: 2024, userLock: LOCK, userIds: ["c3"] });
    expect(shot).toMatchObject({ shotKind: "script", subjectIds: ["c0"], priority: { onAir: "finish" } });
    expect(shot.priority.saved).toEqual(LOCK);
  });

  test("without a lock or a replay the director films exactly as before (only `priority` is added)", () => {
    const run = (extra) => {
      let prev = null;
      const out = [];
      for (let k = 0; k < 120; k += 1) {
        prev = directorState("c3", lineRows(10, { progress: 5.2 + k * 0.004, inPit: k > 60 && k < 70 ? 3 : -1 }), [], RIG, { now: k / 4, tau: k / 4, prev, seed: 5, year: 2024, ...extra });
        out.push([prev.shotKind, prev.cameraId, prev.camType, prev.subjectIds.join()]);
      }
      return out;
    };
    expect(run({ userLock: null, replay: null })).toEqual(run({}));
    const shot = directorState("c3", lineRows(10), [], RIG, {});
    expect(shot.priority).toEqual({ onAir: "zones", saved: null, restore: null, dropLock: false });
  });
});

describe("the sting (CAM-C3, VIEW-13)", () => {
  test("one constant sting of 1,6-1,8 s, inside the 1,5-2,1 s of the acceptance check", () => {
    expect(broadcast.replay.stingSec).toBeGreaterThanOrEqual(1.6);
    expect(broadcast.replay.stingSec).toBeLessThanOrEqual(1.8);
  });
});

/** The engine's snapshot.sc of a neutralisation (SIM-5 shape): in this lap at 20 s, restart at 50 s, gone at 52 s. */
const scOf = (t) => {
  if (t < 5) return null;
  const s = 0.2 + t * 0.001;
  if (t < 12) return { phase: "PICKUP", s, v: 40, lap: 6, lightsOn: true };
  if (t < 20) return { phase: "TRAIN", s, v: 38, lap: 6, lightsOn: true };
  if (t < 50) return { phase: "IN_THIS_LAP", s, v: 38, lap: 7, lightsOn: false };
  if (t < 52) return { phase: "RESTART", s, v: 0, lap: 8, lightsOn: false };
  return null;
};

describe("the restart behind the safety car (CAM-C3, VIEW-13: sequences.scRestart, framing.train)", () => {
  const SEQ = broadcast.sequences.scRestart;
  const runRestart = ({ seed = 3, year = 2024, sc = scOf, until = 70 } = {}) => {
    let state = null;
    const cuts = [];
    for (let k = 0; k < until * 10; k += 1) {
      const t = k / 10;
      state = stepScRestart(state, { sc: sc(t), tau: t, seed, year });
      const key = state.active ? state.cam : null;
      const last = cuts[cuts.length - 1];
      if (!last || last.key !== key) cuts.push({ key, t });
    }
    return cuts;
  };

  test("its shots name cameras the view films and only exist with a safety car", () => {
    SEQ.shots.forEach((shot) => expect(shot.requires).toBe("safetyCar"));
    scRestartCameras().forEach((cam) => expect(cam === "heli" || cam === "chase" || broadcast.rigTemplate.types.some((entry) => `rig:${entry.type}` === cam)).toBe(true));
  });

  test("side of the train at 'in this lap', then above, then head-on at the restart; then the zones", () => {
    const cuts = runRestart();
    expect(cuts[0]).toEqual({ key: null, t: 0 });
    expect(cuts[1]).toMatchObject({ key: "rig:lateralTrack" });
    expect(cuts[1].t).toBeCloseTo(20, 6);
    expect(cuts[2].key).toBe("heli");
    expect(cuts[2].t - 20).toBeCloseTo(scRestartShotLength(SEQ.shots[0], { seed: 3, restart: 1, index: 0 }), 0);
    const restart = cuts.find((cut) => cut.key === "rig:headOn");
    expect(restart.t).toBeCloseTo(50, 6);
    expect(cuts[cuts.length - 1].key).toBeNull();
    // The restart shot runs to its end though the engine drops snapshot.sc at 52 s.
    const end = cuts[cuts.length - 1].t;
    expect(Math.abs(end - 50 - scRestartShotLength(SEQ.shots[2], { seed: 3, restart: 1, index: 2 }))).toBeLessThanOrEqual(0.11);
  });

  test("deterministic by seed (RNF-05); nothing before 1993 or without snapshot.sc", () => {
    expect(runRestart({ seed: 11 })).toEqual(runRestart({ seed: 11 }));
    expect(runRestart({ seed: 11 }).map((cut) => cut.t)).not.toEqual(runRestart({ seed: 12 }).map((cut) => cut.t));
    expect(runRestart({ year: 1990 }).every((cut) => cut.key === null)).toBe(true);
    expect(runRestart({ sc: () => null }).every((cut) => cut.key === null)).toBe(true);
  });

  test("directorState gives it as a script shot of the leader, below the start and finish scripts", () => {
    let prev = null;
    let seen = null;
    for (let k = 0; k < 300; k += 1) {
      const t = k / 10;
      prev = directorState("c3", lineRows(10), [], RIG, { now: t, tau: t, prev, seed: 3, year: 2024, sc: scOf(t) });
      if (t >= 20.5 && !seen) seen = prev;
    }
    expect(seen).toMatchObject({ shotKind: "script", cameraId: "rig:lateralTrack", camType: "rig", scRestartOn: true, subjectIds: ["c0"] });
    expect(shotClassOf(seen)).toBe("pitSeq");
  });

  test("the train: the subject and the cars nose to tail with it, front first, at most maxCars, only in its phases", () => {
    const train = broadcast.framing.train;
    const rows = lineRows(10);
    const framed = trainFraming(rows, "c3", { sc: { phase: "TRAIN", v: 38 }, lengthM: 5000 });
    expect(framed).toEqual({ kind: "train", ids: ["c0", "c1", "c2", "c3"].slice(0, train.maxCars), share: train.trainShare });
    expect(trainFraming(rows, "c8", { sc: { phase: "TRAIN", v: 38 }, lengthM: 5000 }).ids).toEqual(["c5", "c6", "c7", "c8"]);
    // Without the lap length the interval and the safety car's speed give the gaps.
    expect(trainFraming(rows, "c3", { sc: { phase: "TRAIN", v: 38 } }).ids).toEqual(["c0", "c1", "c2", "c3"]);
    expect(trainFraming(rows, "c3", { sc: { phase: "TRAIN", v: 38 }, lengthM: 1e6 })).toBeNull();
    expect(trainFraming(rows, "c3", { sc: { phase: "DEPLOYED", v: 38 }, lengthM: 5000 })).toBeNull();
    expect(trainFraming(rows, "c3", { sc: null, lengthM: 5000 })).toBeNull();
    const shot = directorState("c3", rows, [], RIG, { tau: 15, seed: 1, year: 2024, sc: scOf(15), lengthM: 5000 });
    expect(shot.framing).toMatchObject({ kind: "train" });
    expect(shot.framing.ids).toContain("c3");
    expect(directorState("c3", rows, [], RIG, { tau: 15, seed: 1, year: 2024 }).framing).toBeUndefined();
  });
});

describe("the start script: startLightsLow → startHigh (CAM-C3, VIEW-10)", () => {
  const bahrain = circuitFor({ name: "Bahrain Grand Prix", circuit: "bahrain" }, 2024);
  const zones = zonesFor(bahrain);
  const OUT = 15.3;
  const startOf = (t) => (t < 10 ? { phase: "grid", lights: 0, t } : t < OUT ? { phase: "lights", lights: Math.min(5, 1 + Math.floor(t - 10)), t } : { phase: "out", lights: 0, t: OUT });
  const speed = 70;
  const rowsAt = (t) => Array.from({ length: 6 }, (_, i) => ({ car: { id: `c${i}`, isUser: i === 3 }, position: i + 1, pose: { progress: (Math.max(0, t - OUT) * speed - 8 * i - 1) / zones.lengthM } }));
  const run = (seed, { withZones = true } = {}) => {
    let state = null;
    const cuts = [];
    for (let k = 0; k < 400; k += 1) {
      const t = k / 10;
      const start = startOf(t);
      const tau = start.phase === "out" ? t - OUT : 0;
      state = stepScript(state, { start, events: [], tau, seed, year: 2024, subjectId: "c3", rows: rowsAt(t), zones: withZones ? zones : undefined });
      const key = state.active ? `${state.name}:${state.cam}` : "tv";
      const last = cuts[cuts.length - 1];
      if (!last || last.key !== key) cuts.push({ key, t });
    }
    return cuts;
  };

  test("the low lights shot from the first light to lights out plus holdShotSec, then the high shot until the leader brakes for T1", () => {
    const cuts = run(5);
    const low = cuts.find((cut) => cut.key === "start:startLightsLow");
    expect(low.t).toBeCloseTo(10, 6);
    const high = cuts.find((cut) => cut.key === "start:startHigh");
    expect(high.t).toBeCloseTo(OUT + broadcast.sequences.start.holdShotSec, 6);
    const after = cuts[cuts.indexOf(high) + 1];
    const braking = zones.zones.find((zone) => zone.kind === "braking" && zone.fromM > 0);
    const reach = OUT + (braking.fromM + 1) / speed;
    const shot = broadcast.sequences.start.shots[1];
    const expected = Math.min(Math.max(reach, high.t + shot.minSec), high.t + shot.maxSec);
    expect(Math.abs(after.t - expected)).toBeLessThanOrEqual(0.11);
    expect(after.key).toBe("start:rig:corner");
  });

  test("deterministic by seed: the same seed films the same start, another seed other lengths; without zones maxSec ends the high shot", () => {
    expect(run(5)).toEqual(run(5));
    expect(run(5).map((cut) => cut.t)).not.toEqual(run(6).map((cut) => cut.t));
    const blind = run(5, { withZones: false });
    const high = blind.find((cut) => cut.key === "start:startHigh");
    const after = blind[blind.indexOf(high) + 1];
    expect(after.t - high.t).toBeCloseTo(broadcast.sequences.start.shots[1].maxSec, 6);
  });

  test("untilFires: the hold after lights out and the braking zone", () => {
    const out = { phase: "out", lights: 0, t: OUT };
    expect(untilFires("start:out", { start: out, outAt: OUT, now: OUT + 0.5, hold: 1 })).toBe(false);
    expect(untilFires("start:out", { start: out, outAt: OUT, now: OUT + 1, hold: 1 })).toBe(true);
    expect(untilFires("start:out", { start: out, outAt: OUT, now: OUT, hold: null })).toBe(true);
    expect(untilFires("start:out", { start: { phase: "lights", lights: 5, t: 14 }, outAt: null, now: 14, hold: 1 })).toBe(false);
    const braking = zones.zones.find((zone) => zone.kind === "braking" && zone.fromM > 0);
    const at = (m) => [{ car: { id: "c0" }, pose: { progress: m / zones.lengthM } }];
    expect(untilFires("zone:braking", { rows: at(braking.fromM + 1), subjectId: "c0", zones })).toBe(true);
    expect(untilFires("zone:braking", { rows: at(-5), subjectId: "c0", zones })).toBe(false);
    expect(untilFires("zone:braking", { rows: at(braking.fromM + 1), subjectId: "c0" })).toBe(false);
  });
});
