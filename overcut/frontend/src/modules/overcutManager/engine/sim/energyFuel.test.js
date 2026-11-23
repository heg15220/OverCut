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

import { deployKwAt } from "../energy";
import { fromQuickRace, setErs, snapshot, stepOnce } from "./index";
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
