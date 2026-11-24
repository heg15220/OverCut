/**
 * CAM-3 pit-sequence and garage-exit-presentation (F1M24-GAMEPLAY §2.5, §3.3; RF-3D-04,
 * RF-SIM-12, RF-WKD-02, RNF-05, RNF-07): the stop of the car on air told in the order of
 * broadcast.json sequences.pitStop, driven by the engine's own pit-lane phases; the garage exit
 * of a session as a chain of short shots; both on the race clock and seeded, and over the zones.
 */

import broadcast from "../../data/balance/broadcast.json";
import { weekendRaceArgs } from "../../engine/career";
import { PHASE_NAMES } from "../../engine/sim/pitLane";
import { weekend } from "../../engine/sim/simTestKit";
import { circuitFor } from "../../engine/venue";
import { createRaceSession } from "../../engine/worker/raceSession";
import { applyTick, mirrorOf } from "../../engine/worker/raceClient";
import { liveCarAt } from "../raceClock";
import { directorState } from "./directorState";
import { PIT_SEQUENCE_NAMES, boxPointOf, etaToBox, phasesOf, sequenceCameras, stepSequence, triggerFires } from "./pitSequence";

const PIT = broadcast.sequences.pitStop;
const GARAGE = broadcast.sequences.garageExit;

/** Runs a timeline of poses through the sequence: the cameras on air, in order, with how long each stayed. */
const film = (poseAt, { from = 0, to, step = 0.1, carId = "me", seed = 1 } = {}) => {
  let state = null;
  const shots = [];
  for (let tau = from; tau <= to + 1e-9; tau += step) {
    const pose = poseAt(tau);
    state = stepSequence(state, { carId, pose, tau, seed, etaSec: etaToBox(pose) });
    const cam = state.active ? state.cam : null;
    const last = shots[shots.length - 1];
    if (!last || last.cam !== cam) shots.push({ cam, from: tau });
    else last.to = tau;
  }
  shots.forEach((shot, k) => {
    shot.sec = (shots[k + 1]?.from ?? to) - shot.from;
  });
  return { shots, state };
};

/** A step-race stop, phase by phase (engine/sim/pitLane.js PHASE), as raceClock.liveCarAt hands it over. */
const raceStop = (tau) => {
  const lane = (pitPhase, extra = {}) => ({ x: tau, y: 0, heading: 0, progress: 3.95, inPit: true, pitPhase, v: 22, ...extra });
  if (tau < 10) return { x: tau, y: 0, heading: 0, progress: 3.9, inPit: false, pitPhase: null, v: 80 };
  if (tau < 13) return lane("ENTRY_ROAD", { v: 40 });
  if (tau < 20) return lane("LIMITER");
  if (tau < 21.8) return lane("BOX_APPROACH", { v: 22 - (tau - 20) * 12 });
  if (tau < 24.5) return lane("STATIONARY", { v: 0, stopped: true });
  if (tau < 26) return lane("RELEASE", { v: 10 });
  if (tau < 30) return lane("LIMITER");
  if (tau < 33) return lane("EXIT_ROAD", { v: 40 });
  return { x: tau, y: 0, heading: 0, progress: 4.02, inPit: false, pitPhase: null, v: 70 };
};

describe("broadcast.json sequences and pitRig (RNF-07)", () => {
  it("names only phases the engine has and cameras the pit rig (or the chase camera) has", () => {
    const rigIds = new Set(broadcast.pitRig.cams.map((cam) => cam.id));
    sequenceCameras().forEach((cam) => expect(rigIds.has(cam) || cam === "chase").toBe(true));
    const phases = new Set([...PHASE_NAMES, "GARAGE"]);
    const runPhases = new Set(["GARAGE", "GARAGE_EXIT", "OUT_LAP", "PUSH_PREP", "PUSH", "IN_LAP"]);
    PIT_SEQUENCE_NAMES.forEach((name) => {
      broadcast.sequences[name].shots.forEach((shot, k) => {
        const [kind, value] = shot.trigger.split(":");
        const known = kind === "pitPhase" ? phases.has(value) : kind === "runPhase" ? runPhases.has(value) : shot.trigger === "next" && k > 0;
        expect(known).toBe(true);
        expect(shot.maxSec ?? Infinity).toBeGreaterThanOrEqual(shot.minSec ?? 0);
      });
    });
    expect(PIT.crewLeadSec).toBeGreaterThan(0);
    expect(PIT.shots.filter((shot) => shot.lead)).toHaveLength(1);
  });

  it("reads phases from the pose: the engine's when it has them, the quick replay's and the session's otherwise", () => {
    expect(phasesOf({ inPit: true, pitPhase: "LIMITER" })).toMatchObject({ pitPhase: "LIMITER" });
    expect(phasesOf({ inPit: false })).toMatchObject({ pitPhase: "TRACK" });
    expect(phasesOf({ inPit: true, stopped: true })).toMatchObject({ pitPhase: "STATIONARY" });
    expect(phasesOf({ inPit: true }, { stopped: true })).toMatchObject({ pitPhase: "EXIT_ROAD" });
    expect(phasesOf({ inPit: true, garage: true })).toMatchObject({ pitPhase: "GARAGE", runPhase: "GARAGE" });
    expect(phasesOf({ inPit: true }, { fromGarage: true }).runPhase).toBe("GARAGE_EXIT");
    expect(phasesOf({ inPit: false }, { fromGarage: true }).runPhase).toBe("OUT_LAP");
    expect(phasesOf({ inPit: true, runPhase: "IN_LAP" }).runPhase).toBe("IN_LAP");
    expect(triggerFires("pitPhase:LIMITER", { pitPhase: "LIMITER" })).toBe(true);
    expect(triggerFires("next", { pitPhase: "LIMITER" })).toBe(false);
  });
});

describe("the stop of the car on air (sequences.pitStop)", () => {
  const { shots, state } = film(raceStop, { to: 45 });
  const onAir = shots.filter((shot) => shot.cam);

  it("goes entry → lane → crew → release → end of the lane → merge, then back to the zones", () => {
    expect(onAir.map((shot) => shot.cam)).toEqual(PIT.shots.map((shot) => shot.cam));
    expect(shots[shots.length - 1].cam).toBeNull();
    expect(state.active).toBe(false);
  });

  it("holds every shot at least its minSec and the last one no longer than its maxSec", () => {
    onAir.forEach((shot, k) => expect(shot.sec).toBeGreaterThanOrEqual((PIT.shots[k].minSec ?? 0) - 0.1 - 1e-9));
    expect(onAir[onAir.length - 1].sec).toBeLessThanOrEqual(PIT.shots[PIT.shots.length - 1].maxSec + 0.1 + 1e-9);
  });

  it("puts the crew shot on air crewLeadSec before the car stops, not later", () => {
    const crew = onAir.find((shot) => shot.cam === "garage");
    expect(crew.from).toBeLessThanOrEqual(21.8 - Math.min(PIT.crewLeadSec, 1.8) + 0.1 + 1e-9);
  });

  it("does not rewind when a phase comes back (LIMITER after the box) and does not restart in the lane after it ends", () => {
    expect(onAir.filter((shot) => shot.cam === "pitLaneHigh")).toHaveLength(1);
  });

  it("is the same on the same race clock, whatever the frame rate (RNF-05)", () => {
    const a = film(raceStop, { to: 45, step: 0.1 }).shots.filter((shot) => shot.cam).map((shot) => shot.cam);
    const b = film(raceStop, { to: 45, step: 0.05 }).shots.filter((shot) => shot.cam).map((shot) => shot.cam);
    expect(b).toEqual(a);
  });

  it("starts where the car is when the viewer picks it mid-stop", () => {
    const late = film(raceStop, { from: 22, to: 45 }).shots.filter((shot) => shot.cam).map((shot) => shot.cam);
    expect(late[0]).toBe("garage");
    expect(late.slice(1)).toEqual(["boxExit", "pitExit", "merge"]);
  });

  it("a quick-replay stop (no phases in the pose) is told too: lane, crew, end of the lane, merge", () => {
    const quick = (tau) => {
      const pose = raceStop(tau);
      const { pitPhase, v, ...rest } = pose;
      return rest;
    };
    const cams = film(quick, { to: 45 }).shots.filter((shot) => shot.cam).map((shot) => shot.cam);
    expect(cams).toEqual(["pitLaneHigh", "garage", "pitExit", "merge"]);
  });

  it("estimates where the car will stop from its speed while it brakes for the box", () => {
    const braking = { inPit: true, pitPhase: "BOX_APPROACH", v: 12, x: 0, y: 0, heading: 0 };
    expect(etaToBox(braking)).toBeCloseTo(12 / 12, 9);
    expect(boxPointOf(braking).x).toBeCloseTo((12 * 12) / (2 * 12), 9);
    expect(etaToBox({ inPit: true, stopped: true })).toBe(0);
    expect(etaToBox({ inPit: false })).toBe(Infinity);
  });
});

describe("a session car leaving its garage (sequences.garageExit, SES-2)", () => {
  const garageExit = (tau) => {
    if (tau < 5) return { x: 0, y: 0, heading: 0, inPit: true, garage: true, stopped: true, progress: 0 };
    if (tau < 22) return { x: tau, y: 0, heading: 0, inPit: true, progress: 0.01 };
    return { x: tau, y: 0, heading: 0, inPit: false, progress: 0.05 };
  };

  it("chains short shots with seeded lengths, then the merge, then back to the zones", () => {
    const { shots } = film(garageExit, { to: 40, seed: 11 });
    const onAir = shots.filter((shot) => shot.cam);
    expect(onAir.map((shot) => shot.cam).slice(0, 4)).toEqual(GARAGE.shots.slice(0, 4).map((shot) => shot.cam));
    expect(onAir[onAir.length - 1].cam).toBe("merge");
    onAir.slice(0, 3).forEach((shot, k) => {
      expect(shot.sec).toBeGreaterThanOrEqual(GARAGE.shots[k].minSec - 0.1 - 1e-9);
      expect(shot.sec).toBeLessThanOrEqual(GARAGE.shots[k].maxSec + 0.1 + 1e-9);
    });
    expect(shots[shots.length - 1].cam).toBeNull();
  });

  it("draws the lengths with the seed: same seed same cut, another seed another", () => {
    const cuts = (seed) => film(garageExit, { to: 40, seed }).shots.map((shot) => Math.round(shot.from * 10));
    expect(cuts(11)).toEqual(cuts(11));
    expect([cuts(12), cuts(13), cuts(14)].some((other) => JSON.stringify(other) !== JSON.stringify(cuts(11)))).toBe(true);
  });

  it("uses the session's own run phase when the pose carries it (§1.7 phase[i])", () => {
    const withRun = (tau) => ({ ...garageExit(tau), runPhase: tau < 5 ? "GARAGE" : tau < 22 ? "GARAGE_EXIT" : "OUT_LAP" });
    expect(film(withRun, { to: 40 }).shots.filter((shot) => shot.cam)[0].cam).toBe("garage");
  });

  it("a session car coming back to its garage gets no garage-exit sequence", () => {
    const inLap = (tau) => (tau < 5 ? { x: tau, y: 0, heading: 0, inPit: false } : tau < 15 ? { x: tau, y: 0, heading: 0, inPit: true } : { x: 0, y: 0, heading: 0, inPit: true, garage: true, stopped: true });
    const cams = film(inLap, { to: 30 }).shots.filter((shot) => shot.cam).map((shot) => shot.cam);
    expect(cams).not.toContain("pitWall");
    expect(cams).not.toContain("merge");
  });
});

describe("directorState runs the sequence over the zones (F1M24-GAMEPLAY §2.5 state machine)", () => {
  const RIG = [{ id: "corner-0", type: "corner", from: 0, to: 0.999, priority: 1 }];
  const rowsAt = (tau) => [
    { car: { id: "lead" }, position: 1, pose: { progress: 4.1, inPit: false } },
    { car: { id: "me", isUser: true }, position: 2, interval: 3, pose: raceStop(tau) },
  ];

  it("films the subject's stop with the pit cameras whatever happens to other cars, and the TV comes back after", () => {
    let prev = null;
    const cams = [];
    const inStop = [];
    for (let tau = 0; tau <= 45; tau += 0.25) {
      const events = tau > 15 && tau < 16 ? [{ type: "pass", carId: "lead", otherId: "x", at: tau }] : [];
      prev = directorState("me", rowsAt(tau), events, RIG, { now: tau, tau, prev, seed: 3 });
      if (cams[cams.length - 1] !== prev.cameraId) cams.push(prev.cameraId);
      if (tau > 10.5 && tau < 34) inStop.push(prev);
    }
    expect(inStop.length).toBeGreaterThan(0);
    inStop.forEach((state) => expect(state).toMatchObject({ shotKind: "pit", camType: "pit", subjectIds: ["me"] }));
    expect(cams).toEqual(["corner-0", ...PIT.shots.map((shot) => shot.cam), "corner-0"]);
  });
});

describe("driven by the engine: a real stop of the step race (raceClock.liveCarAt poses)", () => {
  it("the engine's phases run the whole sequence in order", () => {
    const w = weekend({ seed: "pit-sequence" });
    const args = weekendRaceArgs(w.career);
    const session = createRaceSession();
    const mirror = mirrorOf(session.handle({ type: "create", args }));
    const circuit = circuitFor(mirror.race, mirror.year);
    const me = args.entrants.find((entrant) => entrant.isUser).id;
    const car = mirror.cars.find((entry) => entry.id === me);
    session.handle({ type: "command", name: "requestPit", args: [me, "hard"] });
    let state = null;
    const cams = [];
    const phases = new Set();
    for (let k = 0; k < 1000 && !mirror.finished; k += 1) {
      applyTick(mirror, session.handle({ type: "step", seconds: 0.25 }));
      const pose = liveCarAt(mirror, car, mirror.clock, circuit, mirror.race.baseLap);
      if (pose.pitPhase) phases.add(pose.pitPhase);
      state = stepSequence(state, { carId: me, pose, tau: mirror.clock, seed: 5, etaSec: etaToBox(pose) });
      const cam = state.active ? state.cam : null;
      if (cams[cams.length - 1] !== cam) cams.push(cam);
      if (phases.has("EXIT_ROAD") && !pose.inPit && !state.active && cams.includes("merge")) break;
    }
    expect([...phases]).toEqual(expect.arrayContaining(["ENTRY_ROAD", "BOX_APPROACH", "STATIONARY", "RELEASE", "EXIT_ROAD"]));
    const onAir = cams.filter(Boolean);
    // In order, each once; the shot of a phase the 0.25 s steps can skip may be missing, never out of order.
    const order = PIT.shots.map((shot) => shot.cam);
    expect(onAir).toEqual(order.filter((cam) => onAir.includes(cam)));
    ["pitEntry", "garage", "boxExit", "pitExit", "merge"].forEach((cam) => expect(onAir).toContain(cam));
    expect(cams[cams.length - 1]).toBeNull();
  });
});
