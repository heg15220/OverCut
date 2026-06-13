import { fallbackBootstrap } from "../../overcutRacing/components/fallbackData";
import {
  prepareCareerBootstrap,
  generateContracts,
  createCareerSeason,
  simulateCareerRace,
  raceStateAtLap,
} from "./careerModeEngine";

const baseProfile = (name) => ({
  name,
  helmetColor: "#123456",
  rating: 62,
  reputation: 34,
  consistency: 58,
  aggression: 60,
  seasons: 0,
  status: "rookie",
  stats: { points: 0, wins: 0, podiums: 0, titles: 0, teams: [] },
});

const NAMES = ["Coherence A", "Coherence B", "Coherence C", "Coherence D", "Coherence E", "Coherence F"];
const SIM_CAP = 500;

// Run a deterministic but varied batch of simulated races over the fallback data.
const collectSimulations = () => {
  const bootstrap = prepareCareerBootstrap(fallbackBootstrap, true);
  const years = bootstrap.seasonYears || [];
  const runs = [];
  outer: for (const name of NAMES) {
    const profile = baseProfile(name);
    for (const year of years) {
      const contracts = generateContracts({ bootstrap, year, playerProfile: profile });
      if (!contracts.length) continue;
      const season = createCareerSeason({ bootstrap, profile, year, contract: contracts[0] });
      for (let raceIndex = 0; raceIndex < season.races.length; raceIndex += 1) {
        runs.push(simulateCareerRace({ season, raceIndex, profile }));
        if (runs.length >= SIM_CAP) break outer;
      }
    }
  }
  return runs;
};

describe("raceStateAtLap never reveals the future", () => {
  test("safety car, red flag and rain only become true at or after their lap", () => {
    const plan = {
      weather: "mixto",
      phases: [
        { fromLap: 1, condition: "seco" },
        { fromLap: 20, condition: "intermedios" },
        { fromLap: 30, condition: "seco" },
      ],
      scStart: 15,
      scEnd: 18,
      redFlagLap: 25,
      rainArrivalLap: 20,
      dryReturnLap: 30,
      weatherSwitches: [],
    };

    // Before anything happens.
    const early = raceStateAtLap(plan, 5);
    expect(early.scActive).toBe(false);
    expect(early.scHappenedBefore).toBe(false);
    expect(early.redFlagActive).toBe(false);
    expect(early.redFlagHappenedBefore).toBe(false);
    expect(early.rainArrived).toBe(false);
    expect(early.wet).toBe(false);
    expect(early.condition).toBe("seco");

    // Safety car window only.
    expect(raceStateAtLap(plan, 16).scActive).toBe(true);
    expect(raceStateAtLap(plan, 19).scActive).toBe(false);
    expect(raceStateAtLap(plan, 19).scHappenedBefore).toBe(true);

    // Rain window.
    expect(raceStateAtLap(plan, 19).wet).toBe(false);
    expect(raceStateAtLap(plan, 22).wet).toBe(true);
    expect(raceStateAtLap(plan, 22).rainArrived).toBe(true);

    // Dry returns.
    expect(raceStateAtLap(plan, 31).wet).toBe(false);
    expect(raceStateAtLap(plan, 31).dryReturned).toBe(true);

    // Red flag.
    expect(raceStateAtLap(plan, 24).redFlagHappenedBefore).toBe(false);
    expect(raceStateAtLap(plan, 25).redFlagActive).toBe(true);
  });
});

describe("simulated race events are temporally coherent", () => {
  const runs = collectSimulations();

  // Collect every event that violates an invariant, so the assertion stays out
  // of the loop (jest/no-conditional-expect) and a failure lists what broke.
  const violations = (predicate) => {
    const broken = [];
    runs.forEach((run) => {
      run.events.forEach((event) => {
        const reason = predicate(event, run);
        if (reason) broken.push({ lap: event.lap, reason, text: event.text });
      });
    });
    return broken;
  };

  test("produced a representative batch with safety car and rain races", () => {
    expect(runs.length).toBeGreaterThan(50);
    expect(runs.some((run) => run.conditions.scStart != null)).toBe(true);
    expect(runs.some((run) => run.conditions.rainArrivalLap != null)).toBe(true);
  });

  test("no safety car reference appears before the safety car is deployed", () => {
    const broken = violations((event, run) => {
      if (!/safety car/i.test(event.text)) return null;
      if (run.conditions.scStart == null) return "safety car mentioned but never deployed";
      if (event.lap < run.conditions.scStart) return `safety car mentioned on lap ${event.lap} before deployment on ${run.conditions.scStart}`;
      return null;
    });
    expect(broken).toEqual([]);
  });

  test("no red flag reference appears before the red flag", () => {
    const broken = violations((event, run) => {
      if (!/bandera roja/i.test(event.text)) return null;
      if (run.conditions.redFlagLap == null) return "red flag mentioned but never shown";
      if (event.lap < run.conditions.redFlagLap) return `red flag mentioned on lap ${event.lap} before lap ${run.conditions.redFlagLap}`;
      return null;
    });
    expect(broken).toEqual([]);
  });

  test("restart narration only happens after a neutralisation", () => {
    const broken = violations((event, run) => {
      if (!/resalida|salida parada|safety car se marcha/i.test(event.text)) return null;
      const state = raceStateAtLap(run.conditions, event.lap);
      return state.scHappenedBefore || state.redFlagHappenedBefore ? null : `restart narration on lap ${event.lap} with no prior neutralisation`;
    });
    expect(broken).toEqual([]);
  });

  test("rain narration only happens when the track is actually wet", () => {
    const broken = violations((event, run) => {
      if (!/gota|aquaplaning/i.test(event.text)) return null;
      return raceStateAtLap(run.conditions, event.lap).wet ? null : `rain narration on lap ${event.lap} while track is dry`;
    });
    expect(broken).toEqual([]);
  });
});
