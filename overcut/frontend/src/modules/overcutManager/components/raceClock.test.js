import { fallbackBootstrap } from "../../overcutTrayectoria/data/fallbackBootstrap";
import { reference } from "../data/reference";
import { createContext, createCareer, createWeekendRace, currentRace, runPractice, runQualifyingSession } from "../engine/career";
import { classificationOf, runToFinish } from "../engine/race";
import { circuitFor } from "../engine/venue";
import LIVE_VIEW from "../data/balance/live-view.json";
import { weekendRaceArgs } from "../engine/career";
import { packContext, weekend } from "../engine/sim/simTestKit";
import { createRaceSession } from "../engine/worker/raceSession";
import { applyTick, mirrorOf } from "../engine/worker/raceClient";
import { CLOCK_MODES, carAt, clockModeOf, continuityLimit, createContinuity, easedProgress, computedUntil, liveCarAt, movedMetres, nextLiveTau, raceEndTime, standingsAt } from "./raceClock";

const context = createContext(fallbackBootstrap, reference);

const finishedRace = (year, teamId, seed) => {
  const career = createCareer(context, { year, teamId, seed });
  runPractice(career, {});
  runQualifyingSession(career, {});
  const state = createWeekendRace(career);
  runToFinish(state);
  return state;
};

describe("the broadcast clock", () => {
  it("moves every car forward round the lap, from the grid to the flag", () => {
    const state = finishedRace(2024, "ferrari", "clock1");
    const circuit = circuitFor(state.race, state.year);
    const end = raceEndTime(state);
    state.cars.forEach((car) => {
      let last = -Infinity;
      for (let tau = 0; tau < end; tau += end / 400) {
        const pose = carAt(car, tau, circuit, state.race.baseLap);
        if (pose.parked) break;
        expect(pose.progress).toBeGreaterThanOrEqual(last - 1e-6);
        expect(Number.isFinite(pose.x) && Number.isFinite(pose.y)).toBe(true);
        last = pose.progress;
      }
    });
  });

  it("takes a stopping car through the pit lane and its box", () => {
    const state = finishedRace(2024, "ferrari", "clock2");
    const circuit = circuitFor(state.race, state.year);
    const car = state.cars.find((entry) => entry.history.some((lap) => lap.pit));
    const lap = car.history.find((entry) => entry.pit);
    let inPit = false;
    let stopped = false;
    for (let tau = lap.start; tau < lap.end; tau += 0.25) {
      const pose = carAt(car, tau, circuit, state.race.baseLap);
      inPit = inPit || Boolean(pose.inPit);
      stopped = stopped || Boolean(pose.stopped);
    }
    expect(inPit).toBe(true);
    expect(stopped).toBe(true);
  });

  it("shows the official result once everyone has taken the flag", () => {
    const state = finishedRace(1988, "williams", "clock3");
    const circuit = circuitFor(state.race, state.year);
    const rows = standingsAt(state.cars, raceEndTime(state) + 1, circuit, state.race.baseLap);
    const official = classificationOf(state).filter((row) => row.status === "finished" && !row.penalty);
    const shown = rows.filter((row) => !row.out && !row.car.penalty).map((row) => row.car.id);
    expect(shown.slice(0, 3)).toEqual(official.slice(0, 3).map((row) => row.id));
    expect(computedUntil(state)).toBe(Infinity);
  });
});


describe("live progress between engine snapshots (no stumbles)", () => {
  const shot = (clock, p, v) => ({ clock, p: [p], v: [v] });
  test("keeps the step's distance, never leaves it and makes the speed continuous at the ends", () => {
    const a = shot(10, 1.0, 80);
    const b = shot(10.25, 1.003, 40);
    expect(easedProgress(a, b, 0, 0)).toBeCloseTo(1.0, 12);
    expect(easedProgress(a, b, 1, 0)).toBeCloseTo(1.003, 12);
    for (let k = 0; k <= 20; k += 1) {
      const p = easedProgress(a, b, k / 20, 0);
      expect(p).toBeGreaterThanOrEqual(1.0);
      expect(p).toBeLessThanOrEqual(1.003);
    }
    // Braking: it covers more of the step early than a straight line would.
    expect(easedProgress(a, b, 0.25, 0)).toBeGreaterThan(1.0 + 0.003 * 0.25);
    // Speed at the start of the step ~ the snapshot's (the slope over a tiny f).
    const slope0 = (easedProgress(a, b, 1e-4, 0) - 1.0) / 1e-4;
    expect(slope0 / 0.003).toBeCloseTo(80 / 60, 2);
  });
  test("falls back to the straight line without speeds or when still", () => {
    expect(easedProgress({ clock: 0, p: [1] }, { clock: 1, p: [2] }, 0.25, 0)).toBeCloseTo(1.25, 12);
    expect(easedProgress(shot(0, 1, 0), shot(1, 1, 0), 0.5, 0)).toBe(1);
  });
});

// ---------------------------------------------------------------- GS-01 continuity (HUD-C1)

describe("GS-01 · the clock's mode and the continuity guard (RF-SIM-01, RF-3D-03, RNF-05)", () => {
  const config = { enabled: true, k: 1.2, marginM: 2, fallbackSpeedFactor: 1.6 };
  const real = circuitFor(currentRace(createCareer(context, { year: 2024, teamId: "ferrari", seed: "gs01-unit" })), 2024);
  // The real geometry (the catch-up places the car on the lap), a round 5 km for the sums.
  const circuit = { ...real, length: 5000 };
  const road = (progress, v = 80) => ({ x: progress * 5000, y: 0, heading: 0, progress, v, lateral: 0 });

  test("live, replay and seek", () => {
    expect(CLOCK_MODES).toEqual(["live", "replay", "seek"]);
    expect(clockModeOf({})).toBe("live");
    expect(clockModeOf({ replay: true })).toBe("replay");
    expect(clockModeOf({ replay: true, seeking: true })).toBe("seek");
  });

  test("the live clock only runs forward and never past the engine", () => {
    expect(nextLiveTau(10, 1 / 60, 4)).toBeCloseTo(10 + 4 / 60, 12);
    expect(nextLiveTau(10, 1 / 60, 4, (value) => Math.min(value, 10.02))).toBeCloseTo(10.02, 12);
    // A held engine (or a limit behind the pictures) holds the clock; it never goes back.
    expect(nextLiveTau(10, 1 / 60, 4, () => 9)).toBe(10);
    expect(nextLiveTau(10, -1, 4)).toBe(10);
  });

  test("the limit is v·Δt·k + m", () => {
    expect(continuityLimit(80, 0.25, config)).toBeCloseTo(80 * 0.25 * 1.2 + 2, 12);
    expect(continuityLimit(-5, 1, config)).toBe(2);
  });

  test("a jump in live is drawn as a catch-up at the limit, a seek places the car at once", () => {
    const guard = createContinuity({ circuit, lapRef: 90, config });
    const car = { id: "a" };
    guard.frame(0, "live");
    expect(guard.pose(car, 0, road(0.1))).toMatchObject({ progress: 0.1 });
    // 205 m in one 1/60 s frame (the China capture): held to the limit.
    const dt = 1 / 60;
    guard.frame(dt, "live");
    const shown = guard.pose(car, dt, road(0.1 + 205 / 5000));
    expect((shown.progress - 0.1) * 5000).toBeCloseTo(continuityLimit(80, dt, config), 6);
    expect(shown.continuity).toBe("catchUp");
    expect(guard.stats.corrected).toBe(1);
    // The same τ gives the same pose (the tower, the map and the 3D view agree).
    expect(guard.pose(car, dt, road(0.5))).toBe(shown);
    // Another instant (the replay buffer's samples) gets the engine's own pose, untouched.
    const other = road(0.3);
    expect(guard.pose(car, 0.5, other)).toBe(other);
    // A seek: at once.
    guard.frame(10, "seek");
    expect(guard.pose(car, 10, road(0.9))).toMatchObject({ progress: 0.9 });
    expect(guard.stats.seeks).toBe(1);
  });

  test("off the road (pit lane, parked) it moves in a straight line, at the limit", () => {
    const guard = createContinuity({ circuit, lapRef: 90, config });
    const car = { id: "p" };
    guard.frame(0, "live");
    guard.pose(car, 0, { x: 0, y: 0, heading: 0, progress: 3.2, v: 20, inPit: true });
    guard.frame(0.1, "live");
    const shown = guard.pose(car, 0.1, { x: 0, y: 30, heading: 0, progress: 3.21, v: 20, parked: true });
    expect(Math.hypot(shown.x, shown.y)).toBeCloseTo(continuityLimit(20, 0.1, config), 6);
  });

  test("in a replay the guard keeps its memory and lets the pose through", () => {
    const guard = createContinuity({ circuit, lapRef: 90, config });
    const car = { id: "r" };
    guard.frame(5, "live");
    guard.pose(car, 5, road(0.2));
    guard.frame(5, "replay");
    const replayed = road(0.1);
    expect(guard.pose(car, 5, replayed)).toBe(replayed);
    guard.frame(5.02, "live");
    expect(guard.pose(car, 5.02, road(0.2 + 1 / 5000)).continuity).toBeUndefined();
    expect(guard.stats.tauBack).toBe(0);
  });

  test("switched off, the trail is drawn as it is", () => {
    const guard = createContinuity({ circuit, lapRef: 90, config: { ...config, enabled: false } });
    guard.frame(0, "live");
    guard.pose({ id: "a" }, 0, road(0.1));
    guard.frame(0.01, "live");
    const raw = road(0.6);
    expect(guard.pose({ id: "a" }, 0.01, raw)).toBe(raw);
  });
});

describe("GS-01 · a step race watched live at 60 Hz: no car moves further than its speed allows", () => {
  let packs = null;
  beforeAll(async () => {
    packs = await packContext();
  });

  // Acceptance of GS-01 (F1M24-CHINA §3.1): 45 min at 60 Hz in `live`, |Δs| ≤ v·Δt·1.2 + 2 m, τ monotone.
  const MINUTES = Number(process.env.GS01_MINUTES || 45);
  test(`China 2013, ${MINUTES} min of race at ×1, 60 frames a second`, () => {
    const config = LIVE_VIEW.continuity;
    const { career } = weekend({ year: 2013, teamId: "ferrari", seed: "gs01", circuit: "shanghai", context: packs });
    const session = createRaceSession();
    const mirror = mirrorOf(session.handle({ type: "create", args: weekendRaceArgs(career) }));
    const circuit = circuitFor(mirror.race, mirror.year);
    const lapRef = mirror.race.baseLap;
    const guard = createContinuity({ circuit, lapRef, config });
    const shown = new Map();
    const fallback = (circuit.length / lapRef) * config.fallbackSpeedFactor;
    let tau = 0;
    let raw = 0;
    let violations = 0;
    let tauBack = 0;
    const end = MINUTES * 60;
    const dt = 1 / 60;
    while (tau < end && !(mirror.finished && tau > raceEndTime(mirror))) {
      while (!mirror.finished && mirror.clock < tau + 1) applyTick(mirror, session.handle({ type: "step", seconds: 0.5 }));
      const next = nextLiveTau(tau, dt, 1, (value) => (mirror.finished ? value : Math.min(value, mirror.clock)));
      if (next < tau) tauBack += 1;
      const step = next - tau;
      tau = next;
      guard.frame(tau, "live");
      for (const car of mirror.cars) {
        const pose = liveCarAt(mirror, car, tau, circuit, lapRef);
        const drawn = guard.pose(car, tau, pose);
        const before = shown.get(car.id);
        if (before && step > 0) {
          const speed = Math.max(Number.isFinite(pose.v) ? pose.v : fallback, Number.isFinite(before.raw.v) ? before.raw.v : fallback);
          const allowed = continuityLimit(speed, step, config);
          if (Math.abs(movedMetres(before.drawn, drawn, circuit)) > allowed + 1e-6) violations += 1;
          if (Math.abs(movedMetres(before.raw, pose, circuit)) > allowed + 1e-6) raw += 1;
        }
        shown.set(car.id, { drawn, raw: pose });
      }
    }
    // eslint-disable-next-line no-console
    console.log(`GS-01: ${guard.stats.frames} frames, ${raw} raw jumps over the limit, ${guard.stats.corrected} drawn as catch-ups, max excess ${guard.stats.maxExcessM.toFixed(1)} m`);
    expect(guard.stats.frames).toBeGreaterThan(Math.min(end, raceEndTime(mirror)) * 60 * 0.95);
    expect(tauBack).toBe(0);
    expect(guard.stats.tauBack).toBe(0);
    expect(violations).toBe(0);
    // What the guard still has to smooth is a few metres (pit-lane joints, a car pulling off to park);
    // before the start fix the whole field slid back 141 m from the line to its slots in 0,25 s.
    expect(guard.stats.maxExcessM).toBeLessThan(10);
    expect(raw).toBeLessThan(guard.stats.frames * 1e-3);
  }, 600000);
});
