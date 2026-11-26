import { fallbackBootstrap } from "../../overcutTrayectoria/data/fallbackBootstrap";
import { reference } from "../data/reference";
import { createContext, createCareer, createWeekendRace, runPractice, runQualifyingSession } from "../engine/career";
import { classificationOf, runToFinish } from "../engine/race";
import { circuitFor } from "../engine/venue";
import { carAt, easedProgress, computedUntil, raceEndTime, standingsAt } from "./raceClock";

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
