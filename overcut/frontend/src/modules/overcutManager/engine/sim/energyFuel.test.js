/**
 * Energy and fuel in the step race (RF-SIM-04, RF-SIM-05, RF-CMD-01; SRS 4.2; SIM-FISICA §7 "Energía
 * y combustible"):
 *   - the store never breaks the era's regulations, measured step by step: KERS 2009/2012 60 kW and
 *     400 kJ a lap; ERS 2016/2024 120 kW, 2 MJ harvested and 4 MJ deployed a lap, a 4 MJ window;
 *     2026 the speed taper (nothing above 345 km/h without overtake), 8.5 MJ harvested a lap;
 *   - clipping: in the hybrid eras the deployment ends before the end of the long straights, and
 *     "deploy" reaches further down them than "harvest";
 *   - no store before 2009 or in 2010 (SRS 6.2);
 *   - the fuel the step race measures from the engine's load and rpm agrees with the quick mode's
 *     per-lap model (kg a lap x mix x pace) within ±5 % on green laps, era by era (SRS 4.2).
 */

import Ajv from "ajv";
import { deployKwAt, ersEndgameModeOf, fuelReserveKgOf, fuelSpendMixOf } from "../energy";
import { rivalCalls, runToFinish, stepLap } from "../race";
import { rulesFor } from "../rules";
import SC_BALANCE from "../../data/balance/race-strategy.json";
import strategySchema from "../packs/schema/race-strategy.schema.json";
import { fromQuickRace, setErs, snapshot, stepOnce } from "./index";
import { deployNeutralisation } from "./safetyCar";
import { packContext, weekend } from "./simTestKit";

let context = null;
beforeAll(async () => {
  context = await packContext();
});

/** A step race of `year`, run to the flag while `watch(state, shots)` sees every step's snapshot. */
const runWatched = (year, { circuit = null, seed = "energy", teamId = "williams", onStep = null } = {}) => {
  const { make, race } = weekend({ year, teamId, seed, circuit, context });
  const state = fromQuickRace(make(), { race });
  let guard = 0;
  while (!state.finished && guard < 200000) {
    stepOnce(state);
    if (onStep) onStep(state, snapshot(state));
    guard += 1;
  }
  return state;
};

/** Green laps (no pit, not lap 1, no SC spell) with their fuel and store entries. */
const greenLaps = (state) => {
  const spells = state.safetyCarSpells || [];
  const out = [];
  state.cars.forEach((car) =>
    car.history.forEach((entry, k) => {
      const previous = car.history[k - 1];
      if (entry.lap < 2 || entry.pit || previous?.pit || entry.retired || !entry.fuel) return;
      if (spells.some((spell) => spell.from < entry.end + 2 && (spell.to ?? Infinity) > entry.start - 2)) return;
      out.push({ car, entry });
    }),
  );
  return out;
};

const KMH = 3.6;

describe("RF-SIM-05 · the store never breaks the era's rules (step by step)", () => {
  const cases = [
    { year: 2009, power: 60, deploy: 0.4, harvest: null, store: 0.4 },
    { year: 2012, power: 60, deploy: 0.4, harvest: null, store: 0.4 },
    { year: 2016, power: 120, deploy: 4, harvest: 2, store: 4 },
    { year: 2024, power: 120, deploy: 4, harvest: 2, store: 4 },
    { year: 2026, power: 350, deploy: null, harvest: 8.5 + 0.5, store: 4 },
  ];
  cases.forEach(({ year, power, deploy, harvest, store }) => {
    it(`${year}: power ≤ ${power} kW (2026 by speed), ≤ ${deploy ?? "∞"} MJ out and ≤ ${harvest ?? "∞"} MJ in a lap, the store inside its ${store} MJ window`, () => {
      let worstPower = 0;
      let worstTaper = 0;
      let socLow = Infinity;
      let socHigh = -Infinity;
      let seen = 0;
      const state = runWatched(year, {
        onStep: (st, shots) => {
          const sim = st._sim;
          shots.forEach((shot, i) => {
            if (!shot.energy) return;
            seen += 1;
            const storeKw = sim.en.deployKw[i] - (shot.energy.deployKw > 0 ? sim.ers.spec.mguhDirectKw : 0);
            worstPower = Math.max(worstPower, shot.energy.deployKw, shot.energy.harvestKw);
            // 2026 (C5.2.8): never more than the curve at this speed (the overtake curve while that mode is live).
            if (year >= 2026 && storeKw > 0) worstTaper = Math.max(worstTaper, storeKw - deployKwAt(sim.ers.spec, shot.v * KMH, st.cars[i].overtakeActive));
            socLow = Math.min(socLow, shot.energy.soc);
            socHigh = Math.max(socHigh, shot.energy.soc);
          });
        },
      });
      expect(seen).toBeGreaterThan(1000);
      expect(worstPower).toBeLessThanOrEqual(power + 1e-6);
      expect(worstTaper).toBeLessThanOrEqual(1e-6);
      expect(socLow).toBeGreaterThanOrEqual(-1e-9);
      expect(socHigh).toBeLessThanOrEqual(store + 1e-9);
      const laps = state.cars.flatMap((car) => car.history.filter((entry) => entry.ers));
      expect(laps.length).toBeGreaterThan(100);
      expect(Math.max(...laps.map((entry) => entry.ers.deploy))).toBeLessThanOrEqual((deploy ?? Infinity) + 1e-3);
      expect(Math.max(...laps.map((entry) => entry.ers.harvest))).toBeLessThanOrEqual((harvest ?? Infinity) + 1e-3);
      // The store is really used: some deployment and some harvest every green lap on average.
      const mean = (key) => laps.reduce((sum, entry) => sum + entry.ers[key], 0) / laps.length;
      expect(mean("deploy")).toBeGreaterThan(0.05);
      expect(mean("harvest")).toBeGreaterThan(0.05);
    });
  });

  it("no store before 2009 nor in 2010 (SRS 6.2)", () => {
    [2008, 2010].forEach((year) => {
      const { make, race } = weekend({ year, teamId: "williams", seed: "none", context });
      const state = fromQuickRace(make(), { race });
      for (let k = 0; k < 400; k += 1) stepOnce(state);
      expect(state._sim.ers).toBeNull();
      snapshot(state).forEach((shot) => expect(shot.energy).toBeNull());
    });
  });
});

describe("RF-SIM-05 / RF-CMD-01 · clipping at the end of the long straights", () => {
  it("2016 Monza: the deployment ends before the top of the straights, and 'deploy' reaches further than 'harvest'", () => {
    const { make, race } = weekend({ year: 2016, teamId: "williams", seed: "clip", circuit: "monza", context });
    const state = fromQuickRace(make(), { race });
    const user = state.cars.findIndex((car) => car.isUser);
    const sim = state._sim;
    let clipV = 0;
    let deployV = 0;
    let clips = 0;
    let deploying = 0;
    const kBy = {};
    let guard = 0;
    while (!state.finished && guard < 60000) {
      stepOnce(state);
      guard += 1;
      const lap = sim.laps[user];
      if (lap === 5 && kBy.deploy === undefined) {
        setErs(state, state.cars[user].id, "deploy");
        kBy.deploy = -1;
      }
      if (lap === 6 && kBy.deploy === -1) kBy.deploy = sim.en.kCar[user];
      if (lap === 8 && kBy.harvest === undefined) {
        setErs(state, state.cars[user].id, "harvest");
        kBy.harvest = -1;
      }
      if (lap === 9 && kBy.harvest === -1) kBy.harvest = sim.en.kCar[user];
      if (lap > 10) break;
      const shot = snapshot(state)[user];
      if (!shot.energy || state.safetyCar) continue;
      if (shot.energy.clipping) {
        clips += 1;
        clipV += shot.v;
      } else if (shot.energy.deployKw > 0) {
        deploying += 1;
        deployV += shot.v;
      }
    }
    expect(clips).toBeGreaterThan(20);
    expect(deploying).toBeGreaterThan(20);
    // Clipping happens where the car is fastest: the ends of the straights.
    expect(clipV / clips).toBeGreaterThan(deployV / deploying);
    expect(kBy.deploy).toBeGreaterThan(kBy.harvest);
  });
});

// ------------------------------------------------------------------ SIM-C5 / GS-09

/** Laps of fuel on board over the flag's reserve, in kg, of the AI cars that ran the whole race. */
const flagDeltas = (state) => {
  const kgPerLap = state.fuelSpec.kgPerLap;
  const reserve = fuelReserveKgOf(state.year);
  return state.cars
    .filter((car) => !car.isUser && car.status !== "retired" && car.status !== "dsq" && car.history.filter((entry) => !entry.retired).length >= state.laps)
    .map((car) => car.fuel * kgPerLap - reserve);
};

/**
 * A quick race with a safety car forced out at the start of lap `from + 1` for `laps` laps. Returns the
 * AI cars that, when it came out, had their next planned stop within the window, and whether each
 * stopped under it.
 */
const forcedScRace = ({ year, seed, circuit = null, share = 0.32, laps = 4, step = false }) => {
  const { make, race } = weekend({ year, teamId: "williams", seed, circuit, context });
  const windowOf = (state, from) =>
    state.cars
      // The next planned stop after the safety car's laps (a stop planned under it is no decision), within the window.
      .filter((car) => {
        const next = car.plan.stops.find((stop) => stop > from);
        return !car.isUser && car.status === "running" && next > from + laps && next - (from + 1) <= SC_BALANCE.scStop.windowLaps;
      })
      .map((car) => car.id);
  if (!step) {
    const state = make();
    const from = Math.round(state.laps * share);
    while (state.lap < from && !state.finished) stepLap(state);
    const windowed = windowOf(state, from);
    if (!state.safetyCar) state.safetyCar = { laps, virtual: false };
    state.events.push({ type: "sc", lap: from + 1, forced: true });
    runToFinish(state);
    return { state, windowed, from };
  }
  const state = fromQuickRace(make(), { race });
  const sim = state._sim;
  const from = Math.round(state.laps * share);
  let guard = 0;
  while (!state.finished && sim.leaderLap < from + 1 && guard < 400000) {
    stepOnce(state);
    guard += 1;
  }
  const windowed = windowOf(state, from);
  const deployLap = sim.leaderLap;
  const before = state.events.length;
  deployNeutralisation(state, { virtual: false, reason: "accident", share: 0.4, corner: 4, rules: sim.rules, lap: deployLap });
  state.events.slice(before).forEach((event) => {
    if (event.type === "sc") event.forced = true;
  });
  state.events.push({ type: "sc", lap: deployLap, forced: true });
  if (sim.neutral && !sim.neutral.virtual) sim.neutral.cleanupUntil = sim.clock + race.baseLap * (laps - 1);
  while (!state.finished && guard < 400000) {
    stepOnce(state);
    guard += 1;
  }
  return { state, windowed, from };
};

/**
 * Whether the race had a neutralisation of its own besides the forced one (a late SC, or a second one, saves fuel no
 * window can burn any more: it is not what the criterion measures).
 */
const otherNeutralisation = ({ state }) => state.events.some((event) => (event.type === "sc" || event.type === "vsc" || event.type === "red") && !event.forced);

/** Of the windowed cars, the ones with a stop from the safety car's lap to `to`. */
const stoppedUnder = ({ state, windowed, from }, to) =>
  windowed.filter((id) => {
    const car = state.cars.find((entry) => entry.id === id);
    return car.history.some((entry) => entry.pit && entry.lap > from && entry.lap <= to);
  });

describe("SIM-C5 / GS-09 · strategy under the safety car and at the flag (RF-SIM-13, RF-SIM-04, RF-SIM-05)", () => {
  it("race-strategy.json passes its schema and cites a status for every value it cannot source", () => {
    const validate = new Ajv({ allErrors: true, strict: true }).compile(strategySchema);
    expect(validate(SC_BALANCE)).toBe(true);
    ["takeStatus", "chanceStatus", "earlyLapStatus", "virtualStatus"].forEach((key) => expect(SC_BALANCE.scStop[key]).toBeTruthy());
  });

  it("fuelSpendMixOf: lean when short, standard outside the window, the mix closest to the reserve inside it", () => {
    const mixes = { lean: { burn: 0.93 }, standard: { burn: 1 }, rich: { burn: 1.07 } };
    const cfg = { laps: 15, windowShare: 0.5, holdLaps: 10 };
    expect(fuelSpendMixOf({ fuel: 29.5, remaining: 30, reserve: 0.5, mixes, cfg }).mix).toBe("lean");
    // 40 laps to go and half a lap over: the window burns it later.
    expect(fuelSpendMixOf({ fuel: 41, remaining: 40, reserve: 0.5, mixes, cfg }).mix).toBe("standard");
    // More than the window can burn (2 laps over > 15 x 0.07 x 0.5 + one lap's extra): it starts now.
    expect(fuelSpendMixOf({ fuel: 42.5, remaining: 40, reserve: 0.5, mixes, cfg }).mix).toBe("rich");
    // The opening holdLaps keep the start's margin (fuel.margin 1.2 laps over a 0.3-lap reserve), the
    // same car after them burns it down to the window's line; on a push lap it is not short (lean).
    expect(fuelSpendMixOf({ fuel: 57.2, remaining: 56, reserve: 0.3, lapsRun: 0, mixes, cfg }).mix).toBe("standard");
    expect(fuelSpendMixOf({ fuel: 47.2, remaining: 46, reserve: 0.3, lapsRun: 10, mixes, cfg }).mix).toBe("rich");
    expect(fuelSpendMixOf({ fuel: 57.2, remaining: 56, reserve: 0.3, lapsRun: 3, lapBurn: 1.02, mixes, cfg }).mix).toBe("standard");
    // Within one lap of the rich mix's extra over the line: standard (no flicker).
    expect(fuelSpendMixOf({ fuel: 41.07, remaining: 40, reserve: 0.5, mixes, cfg }).mix).toBe("standard");
    expect(fuelSpendMixOf({ fuel: 11, remaining: 10, reserve: 0.5, mixes, cfg }).mix).toBe("rich");
    // The last lap: rich only if it lands closer to the reserve.
    expect(fuelSpendMixOf({ fuel: 1.53, remaining: 1, reserve: 0.5, mixes, cfg }).mix).toBe("standard");
    expect(fuelSpendMixOf({ fuel: 1.56, remaining: 1, reserve: 0.5, mixes, cfg }).mix).toBe("rich");
    // Same input, same answer (no draws).
    expect(fuelSpendMixOf({ fuel: 11, remaining: 10, reserve: 0.5, mixes, cfg })).toEqual(fuelSpendMixOf({ fuel: 11, remaining: 10, reserve: 0.5, mixes, cfg }));
  });

  it("ersEndgameModeOf: the last two laps of a fight empty the store; never with KERS, nor earlier", () => {
    const ers = rulesFor(2024);
    const kers = rulesFor(2012);
    const y26 = rulesFor(2026);
    const fight = { battery: 8, gapAhead: 0.6, gapBehind: 3 };
    expect(ersEndgameModeOf(ers, fight, 2)).toBe("deploy");
    expect(ersEndgameModeOf(ers, fight, 3)).toBeNull();
    expect(ersEndgameModeOf(kers, { ...fight, battery: 100 }, 1)).toBeNull();
    expect(ersEndgameModeOf(ers, { battery: 8, gapAhead: 5, gapBehind: 5 }, 1)).toBeNull();
    expect(ersEndgameModeOf(ers, { battery: 60, gapAhead: 5, gapBehind: 5 }, 1)).toBe("deploy");
    if (y26.energy.overtakeMode) expect(ersEndgameModeOf(y26, { battery: 30, gapAhead: 0.5, gapBehind: 4 }, 1)).toBe("overtake");
    expect(ersEndgameModeOf(rulesFor(2008), fight, 1)).toBeNull();
  });

  it("rivalCalls: a hybrid at 20 % in a fight on the last lap deploys instead of harvesting", () => {
    const { make } = weekend({ year: 2024, teamId: "williams", seed: "endgame", context });
    const state = make();
    const car = state.cars.find((entry) => !entry.isUser);
    Object.assign(car, { battery: 20, gapAhead: 0.5, gapBehind: 2 });
    rivalCalls(state, car, state.laps);
    expect(car.ersMode).toBe("deploy");
    Object.assign(car, { battery: 20, gapAhead: 0.5, gapBehind: 2 });
    rivalCalls(state, car, Math.round(state.laps / 2));
    expect(car.ersMode).toBe("harvest");
  });

  const SEEDS = Array.from({ length: 32 }, (_, k) => `gs09-${k}`);

  it("32 seeds with a forced SC (quick mode, 2024 at half distance and 2019 at a third): ≥ 60 % of the cars with their next stop within 15 laps bring it forward under it", () => {
    [
      { year: 2024, share: 0.5 },
      { year: 2019, share: 0.32 },
    ].forEach(({ year, share }) => {
      let windowed = 0;
      let stopped = 0;
      SEEDS.forEach((seed) => {
        const run = forcedScRace({ year, seed, share });
        windowed += run.windowed.length;
        stopped += stoppedUnder(run, run.from + 4).length;
      });
      expect(windowed).toBeGreaterThan(100);
      expect(stopped / windowed).toBeGreaterThanOrEqual(0.6);
    });
  });

  it("32 seeds with a forced SC at a third of the race (2024 quick mode): |Δfuel| ≤ 0.5 kg at the flag", () => {
    const deltas = [];
    let clean = 0;
    SEEDS.forEach((seed) => {
      const run = forcedScRace({ year: 2024, seed });
      if (otherNeutralisation(run)) return;
      clean += 1;
      deltas.push(...flagDeltas(run.state));    });
    expect(clean).toBeGreaterThanOrEqual(8);
    expect(deltas.length).toBeGreaterThan(clean * 10);
    const worst = Math.max(...deltas.map(Math.abs));
    expect(worst).toBeLessThanOrEqual(0.5);
  });

  it("2012 (no fuel limit, KERS) and a step race with a forced SC (2024): |Δfuel| ≤ 0.5 kg at the flag, the SC stops taken", () => {
    // 2012 burns 2.8 kg a lap: a 4-lap SC at a third of the race saves as much as the rich mix can burn in the rest of it on a tyre-saving pace (the physical limit, race-energy.json lapsNote); 3 laps keeps the check about the controller.
    const runs2012 = SEEDS.map((seed) => forcedScRace({ year: 2012, seed, laps: 3 })).filter((run) => !otherNeutralisation(run));
    const y2012 = runs2012.flatMap((run) => flagDeltas(run.state));
    expect(runs2012.length).toBeGreaterThanOrEqual(4);
    expect(Math.max(...y2012.map(Math.abs))).toBeLessThanOrEqual(0.5);
    const run = forcedScRace({ year: 2024, seed: "gs09-step", step: true });
    if (run.windowed.length >= 5) expect(stoppedUnder(run, run.from + 5).length / run.windowed.length).toBeGreaterThanOrEqual(0.5);
    if (!otherNeutralisation(run)) {
      const deltas = flagDeltas(run.state);
      expect(deltas.length).toBeGreaterThan(8);
      expect(Math.max(...deltas.map(Math.abs))).toBeLessThanOrEqual(0.5);
    }
  });

  it("the stops under the SC and the fuel at the flag are reproducible by seed (RF-SIM-15)", () => {
    const a = forcedScRace({ year: 2024, seed: "gs09-same" });
    const b = forcedScRace({ year: 2024, seed: "gs09-same" });
    expect(a.state.cars.map((car) => car.history.filter((entry) => entry.pit).map((entry) => entry.lap))).toEqual(b.state.cars.map((car) => car.history.filter((entry) => entry.pit).map((entry) => entry.lap)));
    expect(flagDeltas(a.state)).toEqual(flagDeltas(b.state));
  });
});

describe("RF-SIM-04 / SRS 4.2 · the step race measures the fuel the quick mode books", () => {
  const cases = [
    { year: 1988, circuit: null },
    { year: 2005, circuit: null },
    { year: 2012, circuit: null },
    { year: 2016, circuit: "bahrain" },
    { year: 2024, circuit: "monza" },
    { year: 2026, circuit: null },
  ];
  cases.forEach(({ year, circuit }) => {
    it(`${year}${circuit ? ` ${circuit}` : ""}: measured / model on green laps within ±5 %`, () => {
      const state = runWatched(year, { circuit, seed: "fuel" });
      const laps = greenLaps(state).filter(({ entry }) => entry.fuel.model > 0);
      expect(laps.length).toBeGreaterThan(300);
      const measured = laps.reduce((sum, { entry }) => sum + entry.fuel.kg, 0);
      const model = laps.reduce((sum, { entry }) => sum + entry.fuel.model, 0);
      expect(measured / model).toBeGreaterThan(0.95);
      expect(measured / model).toBeLessThan(1.05);
    });
  });
});
