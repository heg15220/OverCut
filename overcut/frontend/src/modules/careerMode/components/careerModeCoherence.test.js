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

  // Safety cars and red flags now come from several sources (the global plan and
  // the dynamic incidents), all consolidated into raceStateAtLap. The oracle is
  // that consolidated state: a flag may only be mentioned while it is active or
  // after it has already been shown — never before any such flag exists.
  test("no safety car reference appears before any safety car is deployed", () => {
    const broken = violations((event, run) => {
      // "Virtual Safety Car" is a VSC, a different neutralisation; ignore it here.
      if (!/safety car/i.test(event.text) || /virtual safety car/i.test(event.text)) return null;
      const state = raceStateAtLap(run.conditions, event.lap);
      return state.scActive || state.scHappenedBefore
        ? null
        : `safety car mentioned on lap ${event.lap} with no safety car deployed`;
    });
    expect(broken).toEqual([]);
  });

  test("no red flag reference appears before any red flag", () => {
    const broken = violations((event, run) => {
      if (!/bandera roja/i.test(event.text)) return null;
      const state = raceStateAtLap(run.conditions, event.lap);
      return state.redFlagActive || state.redFlagHappenedBefore
        ? null
        : `red flag mentioned on lap ${event.lap} with no red flag shown`;
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

describe("narrated player position is a single source of truth", () => {
  const runs = collectSimulations();

  // The final marker event is the one declaring the real classified position.
  const finalMarkerIndex = (run) => run.events.findIndex((event) => event.finalPlayerPosition);

  test("the narrated position converges to the classified result (no end-of-race teleport)", () => {
    const broken = [];
    runs.forEach((run) => {
      const finalIdx = finalMarkerIndex(run);
      if (finalIdx <= 0) return;
      const finalPosition = run.events[finalIdx].playerPosition;
      const before = run.events[finalIdx - 1].playerPosition;
      const gap = Math.abs(before - finalPosition);
      // The lap before classifying, the narrated position must already be in the
      // neighbourhood of where the driver actually finishes.
      if (gap > 5) broken.push({ before, finalPosition, gap, race: run.race.name });
    });
    expect(broken).toEqual([]);
  });

  test("the narrated position never teleports between consecutive events", () => {
    const broken = [];
    runs.forEach((run) => {
      for (let i = 1; i < run.events.length; i += 1) {
        const jump = Math.abs(run.events[i].playerPosition - run.events[i - 1].playerPosition);
        if (jump > 8) broken.push({ jump, lap: run.events[i].lap, race: run.race.name });
      }
    });
    expect(broken).toEqual([]);
  });
});

describe("retirements are narrated once and drivers never revive", () => {
  const runs = collectSimulations();

  // Name of the driver who retires in this event, or null if it is not a
  // retirement. Covers every retirement template the engine can emit.
  const retireeOf = (text) => {
    const patterns = [
      /^(.+?) se accidenta solo y abandona/,
      /^(.+?) colisiona con .+? y abandona/,
      /^(.+?) abandona por un problema de /,
      /^(.+?) abandona por un problema mecanico/,
      /^(.+?) queda fuera de carrera/,
    ];
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  // Rivals named in an incident text but who are NOT the one retiring here, so
  // they are asserted to still be on track at this lap.
  const mentionedRivals = (text) => {
    const collide = text.match(/^.+? colisiona con (.+?) y abandona/);
    if (collide) return [collide[1]];
    const touch = text.match(/^(.+?) y (.+?) se tocan/);
    if (touch) return [touch[1], touch[2]];
    return [];
  };

  test("no driver is narrated as retiring more than once", () => {
    const broken = [];
    runs.forEach((run) => {
      const counts = new Map();
      run.events.forEach((event) => {
        const name = retireeOf(event.text);
        if (name) counts.set(name, (counts.get(name) || 0) + 1);
      });
      counts.forEach((count, name) => {
        if (count > 1) broken.push({ race: run.race.name, name, count });
      });
    });
    expect(broken).toEqual([]);
  });

  test("no driver is mentioned in an incident after retiring", () => {
    const broken = [];
    runs.forEach((run) => {
      const retiredAt = new Map();
      run.events.forEach((event) => {
        const name = retireeOf(event.text);
        if (name && !retiredAt.has(name)) retiredAt.set(name, event.lap);
      });
      run.events.forEach((event) => {
        mentionedRivals(event.text).forEach((name) => {
          const retireLap = retiredAt.get(name);
          if (retireLap != null && retireLap < event.lap) {
            broken.push({ race: run.race.name, name, retireLap, mentionedLap: event.lap });
          }
        });
      });
    });
    expect(broken).toEqual([]);
  });
});

describe("race neutralisation flags never contradict each other", () => {
  const runs = collectSimulations();

  test("no green flag is narrated while the race is still neutralised", () => {
    const broken = [];
    runs.forEach((run) => {
      run.events.forEach((event) => {
        if (event.type !== "green") return;
        const state = raceStateAtLap(run.conditions, event.lap);
        if (state.scActive || state.vscActive || state.redFlagActive || state.yellowActive) {
          broken.push({ race: run.race.name, lap: event.lap, text: event.text });
        }
      });
    });
    expect(broken).toEqual([]);
  });

  test("at most one green flag is narrated per lap", () => {
    const broken = [];
    runs.forEach((run) => {
      const perLap = new Map();
      run.events.forEach((event) => {
        if (event.type !== "green") return;
        perLap.set(event.lap, (perLap.get(event.lap) || 0) + 1);
      });
      perLap.forEach((count, lap) => {
        if (count > 1) broken.push({ race: run.race.name, lap, count });
      });
    });
    expect(broken).toEqual([]);
  });
});

describe("battle narration is coherent with the running order", () => {
  const runs = collectSimulations();
  const battlesOf = (run) => run.events.filter((event) => event.category === "battle");
  const ordinalIn = (text) => {
    const match = text.match(/(\d+)º/);
    return match ? Number(match[1]) : null;
  };

  test("the batch actually produces battle events", () => {
    expect(runs.some((run) => battlesOf(run).length > 0)).toBe(true);
  });

  test("every announced battle position is inside the field", () => {
    const broken = [];
    runs.forEach((run) => {
      const fieldSize = run.results.length;
      battlesOf(run).forEach((event) => {
        const ordinal = ordinalIn(event.text);
        if (ordinal == null) return;
        if (ordinal < 1 || ordinal > fieldSize) broken.push({ race: run.race.name, ordinal, fieldSize, text: event.text });
      });
    });
    expect(broken).toEqual([]);
  });

  test("battles only happen while the race is green", () => {
    const broken = [];
    runs.forEach((run) => {
      battlesOf(run).forEach((event) => {
        const state = raceStateAtLap(run.conditions, event.lap);
        if (state.scActive || state.vscActive || state.redFlagActive || state.yellowActive) {
          broken.push({ race: run.race.name, lap: event.lap, text: event.text });
        }
      });
    });
    expect(broken).toEqual([]);
  });

  test("a player's own overtake announces the very position shown on the label", () => {
    const broken = [];
    runs.forEach((run) => {
      battlesOf(run)
        .filter((event) => Number.isFinite(event.playerOvertakeOrdinal))
        .forEach((event) => {
          if (event.playerOvertakeOrdinal !== event.playerPosition) {
            broken.push({ race: run.race.name, ordinal: event.playerOvertakeOrdinal, label: event.playerPosition });
          }
          if (ordinalIn(event.text) !== event.playerOvertakeOrdinal) {
            broken.push({ race: run.race.name, reason: "text mismatch", text: event.text });
          }
        });
    });
    expect(broken).toEqual([]);
  });

  test("every player battle updates the live track position from the narrated battle state", () => {
    const broken = [];
    runs.forEach((run) => {
      battlesOf(run)
        .filter((event) => Number.isFinite(event.playerPositionOverride))
        .forEach((event) => {
          if (event.playerPosition !== event.playerPositionOverride) {
            broken.push({
              race: run.race.name,
              lap: event.lap,
              label: event.playerPosition,
              override: event.playerPositionOverride,
              text: event.text,
            });
          }
        });
    });
    expect(broken).toEqual([]);
  });
});
