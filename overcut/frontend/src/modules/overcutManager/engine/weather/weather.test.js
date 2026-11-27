/**
 * Dynamic weather and wet physics (RF-SIM-11, RF-SIM-03, RF-SIM-09, RF-HQ-02; SRS 2.3 point 6;
 * RNF-07 tunables in data/balance/race-weather.json and data/weather/climate.json with schemas;
 * RF-SIM-15 / RNF-05 determinism; SRS 4.2 both modes share the water).
 *
 *   - both data files match their schemas; seven states; every climate row is a distribution;
 *   - grip: slick/inter cross at the measured 1.11 × dry pace and inter/wet at 1.27 (OpenF1),
 *     the engine's tyre choice is the quickest tyre at every water depth, a tyre past its
 *     Pirelli water capacity floats;
 *   - water: rain fills it, temperature and cars dry it, the line dries before the rest, and the
 *     fitted drying reproduces the real drying times (Montreal 2024, Silverstone 2025) ±15 %;
 *   - climate: the share of 2023-2025 races that need wet tyres sits in the 95 % interval of the
 *     real count (8 of 70, OpenF1); Bahrain is drier than Spa;
 *   - the forecast's error shrinks with the weather centre's accuracy;
 *   - GS-13 (F1M24-CHINA §2.10): the evacuation by tyre generation covers every playable year, the
 *     crossovers keep 1.10-1.12 and 1.27 in every era, the capacity of 2024 beats 2014's, the
 *     inter/dry ratio of the Chinese SQ 2024 (OpenF1 9668) sits in the inter's window, and the
 *     track cools 6-7 °C in 30 min under rain;
 *   - the same seed gives the same afternoon; the quick and step races share the water and the
 *     step race exposes it for the view;
 *   - WX-C2 / GS-11 (F1M24-CHINA §2.9, §3.1): the spray loss is within ±30 % of what OpenF1's wet
 *     races 2023-2025 measure (__fixtures__/openf1-wet-spray.json, spray_from_openf1.py) and 0 in
 *     the dry; `sprayAt` is pure, 0 in the dry, monotone in water and speed and in 0..1; the
 *     snapshot's spray is the same with the same seed.
 */

import Ajv from "ajv";
import W from "../../data/balance/race-weather.json";
import CLIMATE from "../../data/weather/climate.json";
import schema from "../packs/schema/race-weather.schema.json";
import climateSchema from "../packs/schema/weather-climate.schema.json";
import SQ_CHINA_2024 from "./__fixtures__/openf1-9668.json";
import WET_SPRAY from "./__fixtures__/openf1-wet-spray.json";
import {
  INTER_CAPACITY_MM, SLICK_INTER_MM, STATES, WET_CAPACITY_MM, aquaplaningOf, capacityFor, climateFor, depthOfWetness, evacuationFor, forecastOf, gripRatio, rainChanceOf,
  rainTrackTargetOf, relaxTrackTemp, sprayAt, sprayLevelOf, sprayLossOf, sprayRiskOf, tyreForDepth, tyreForWetness, waterStep, weatherSnapshot, weatherTimeline, wetnessOfDepth,
} from "./index";
import { createRace, tyreTime } from "../race";
import { fromQuickRace, runStepToFinish, weatherNow } from "../sim";
import { loadSeasonPack } from "../packs/seasonPacks";
import { weekend } from "../sim/simTestKit";
import { createContext, seasonWorld, weekendRaceArgs } from "../career";
import { fallbackBootstrap } from "../../../overcutTrayectoria/data/fallbackBootstrap";
import { reference } from "../../data/reference";

const ajv = () => new Ajv({ allErrors: true, strict: false });

describe("RNF-07 · race-weather.json and climate.json", () => {
  it("match their schemas", () => {
    const a = ajv().compile(schema);
    expect(a(W) || a.errors).toBe(true);
    const b = ajv().compile(climateSchema);
    expect(b(CLIMATE) || b.errors).toBe(true);
  });

  it("has seven states from sunny to heavy rain, rain rising with the state (SRS 2.3 point 6)", () => {
    expect(STATES.map((state) => state.id)).toEqual(["sunny", "cloudy", "overcast", "drizzle", "light", "moderate", "heavy"]);
    for (let k = W.states.rainFrom + 1; k < STATES.length; k += 1) expect(STATES[k].rainMmPerHour).toBeGreaterThan(STATES[k - 1].rainMmPerHour);
  });

  it("every circuit-month climate is a distribution and a Markov matrix", () => {
    const sum = (row) => row.reduce((total, value) => total + value, 0);
    Object.values(CLIMATE.circuits).forEach((months) =>
      Object.values(months).forEach((climate) => {
        expect(sum(climate.start)).toBeCloseTo(1, 2);
        climate.matrix.forEach((row) => expect(sum(row)).toBeCloseTo(1, 2));
      }),
    );
  });
});

describe("RF-SIM-03 / RF-SIM-11 · grip by compound against water (OpenF1, Pirelli)", () => {
  it("slick and inter cross at the measured 1.11, inter and wet at 1.27", () => {
    expect(gripRatio("soft", SLICK_INTER_MM)).toBeCloseTo(W.grip.slickInterRatio, 3);
    expect(gripRatio("inter", SLICK_INTER_MM)).toBeCloseTo(W.grip.slickInterRatio, 3);
    expect(gripRatio("inter", INTER_CAPACITY_MM)).toBeCloseTo(W.grip.interWetRatio, 3);
    expect(gripRatio("wet", INTER_CAPACITY_MM)).toBeCloseTo(W.grip.interWetRatio, 3);
    // The measured crossovers sit within 3 % of the model's (race-weather.json measured.openf1).
    W.measured.openf1.slickInterCrossovers.forEach((row) => expect(Math.abs((row.inter + row.slick) / 2 / W.grip.slickInterRatio - 1)).toBeLessThan(0.03));
    W.measured.openf1.interWetCrossovers.forEach((row) => expect(Math.abs((row.inter + row.wet) / 2 / W.grip.interWetRatio - 1)).toBeLessThan(0.03));
  });

  it("the water capacity of inter and wet comes from Pirelli's litres per second (~0.95 and ~2.5 mm on the fit's scale)", () => {
    expect(INTER_CAPACITY_MM).toBeGreaterThan(0.9);
    expect(INTER_CAPACITY_MM).toBeLessThan(1);
    expect(WET_CAPACITY_MM).toBeGreaterThan(2.4);
    expect(WET_CAPACITY_MM).toBeLessThan(2.55);
    expect(aquaplaningOf("inter", INTER_CAPACITY_MM * 0.9)).toBe(0);
    expect(aquaplaningOf("inter", INTER_CAPACITY_MM * 1.5)).toBeGreaterThan(0);
    expect(aquaplaningOf("soft", INTER_CAPACITY_MM)).toBeGreaterThan(aquaplaningOf("inter", INTER_CAPACITY_MM));
  });

  it("the engine's tyre choice is the quickest tyre at every depth (fresh tyres, race.js tyreTime)", () => {
    const wrong = [];
    for (let h = 0.01; h < 2.4; h += 0.03) {
      const w = wetnessOfDepth(h);
      expect(depthOfWetness(w)).toBeCloseTo(h, 6);
      const times = ["soft", "inter", "wet"].map((compound) => ({ compound, time: tyreTime({ compound, age: 3, wetness: w, year: 2024, baseLap: 90 }) }));
      const best = times.reduce((a, b) => (b.time < a.time ? b : a)).compound;
      const chosen = tyreForWetness(w) || "soft";
      const margin = Math.abs(h - SLICK_INTER_MM) < 0.02 || Math.abs(h - INTER_CAPACITY_MM) < 0.06;
      if (!margin && chosen !== best) wrong.push({ h, chosen, best });
    }
    expect(wrong).toEqual([]);
  });
});

describe("RF-SIM-11 · water on the track", () => {
  const dryTo = (from, to, opts) => {
    let h = from;
    let minutes = 0;
    while (h > to && minutes < 600) {
      h = waterStep(h, { rain: 0, minutes: 0.5, ...opts });
      minutes += 0.5;
    }
    return minutes;
  };
  const depthAt = (compound, ratio) => {
    let lo = 0;
    let hi = 3;
    for (let k = 0; k < 60; k += 1) {
      const mid = (lo + hi) / 2;
      if (gripRatio(compound, mid) < ratio) lo = mid;
      else hi = mid;
    }
    return (lo + hi) / 2;
  };

  it("rises with rain, more with heavier rain, and stays bounded", () => {
    const after = (rain) => waterStep(0, { rain, trackC: 22, cars: 20, minutes: 60 });
    expect(after(STATES[4].rainMmPerHour)).toBeGreaterThan(SLICK_INTER_MM);
    expect(after(STATES[6].rainMmPerHour)).toBeGreaterThan(after(STATES[5].rainMmPerHour));
    expect(after(STATES[5].rainMmPerHour)).toBeGreaterThan(after(STATES[4].rainMmPerHour));
    expect(after(200)).toBeLessThanOrEqual(W.water.maxMm);
  });

  it("dries faster on a hot track and with more cars; the racing line dries first", () => {
    expect(dryTo(0.6, SLICK_INTER_MM, { trackC: 40, cars: 20 })).toBeLessThan(dryTo(0.6, SLICK_INTER_MM, { trackC: 15, cars: 20 }));
    expect(dryTo(0.6, SLICK_INTER_MM, { trackC: 25, cars: 20 })).toBeLessThan(dryTo(0.6, SLICK_INTER_MM, { trackC: 25, cars: 5 }));
    expect(dryTo(0.6, SLICK_INTER_MM, { trackC: 25, cars: 20 })).toBeLessThan(dryTo(0.6, SLICK_INTER_MM, { trackC: 25, line: false }));
  });

  it("reproduces the real drying times of OpenF1 races ±15 % (Montreal 2024, Silverstone 2025)", () => {
    W.measured.openf1.drying.forEach((row) => {
      const compound = row.compound === "slick" ? "soft" : row.compound;
      const sim = dryTo(depthAt(compound, row.from), row.toCrossover ? SLICK_INTER_MM : depthAt(compound, row.to), { trackC: 25, cars: 20 });
      expect(Math.abs(sim / row.minutes - 1)).toBeLessThan(0.15);
    });
  });
});

describe("RF-SIM-11 · climate and the afternoon", () => {
  let context;
  beforeAll(async () => {
    const loaded = await Promise.all([2023, 2024, 2025].map((year) => loadSeasonPack(year)));
    context = createContext(fallbackBootstrap, reference, Object.fromEntries(loaded.map(({ pack }) => [pack.year, pack])));
  });

  it("2023-2025: the share of races needing wet tyres is inside the 95 % interval of the real 8 of 70 (OpenF1)", () => {
    let draws = 0;
    let wet = 0;
    [2023, 2024, 2025].forEach((year) =>
      seasonWorld(context, year, "probe").races.forEach((race) => {
        for (let s = 0; s < 12; s += 1) {
          const t = weatherTimeline({ race, laps: race.laps, seed: `wx-${year}-${race.round}-${s}`, cars: 20 });
          draws += 1;
          if (t.wetness.some((value) => value >= W.wetness.atSlickInter)) wet += 1;
        }
      }),
    );
    const share = wet / draws;
    // eslint-disable-next-line no-console
    console.log(`RF-SIM-11: races with wet tyres 2023-2025 sim ${(share * 100).toFixed(1)} % / real ${((100 * W.measured.usage.wetTyreRaces) / W.measured.usage.races).toFixed(1)} %`);
    // Exact Poisson 95 % interval for 8 events: 3.45-15.76, over 70 races.
    expect(share).toBeGreaterThan(3.45 / 70);
    expect(share).toBeLessThan(15.76 / 70);
  });

  it("Bahrain is drier than Spa, by the circuit's own ERA5 climate", () => {
    const bahrain = climateFor({ packCircuitId: "bahrain", date: "2024-03-02" });
    const spa = climateFor({ packCircuitId: "spa-francorchamps", date: "2024-07-28" });
    expect(rainChanceOf(bahrain, 2)).toBeLessThan(rainChanceOf(spa, 2) / 4);
    expect(climateFor({ packCircuitId: "nowhere" }).key).toBe("global");
  });

  it("is deterministic per seed (RF-SIM-15) and changes with the seed", () => {
    const race = { packCircuitId: "spa-francorchamps", date: "2021-08-29", baseLap: 110, laps: 44, lengthKm: 7 };
    const a = weatherTimeline({ race, laps: 44, seed: "same" });
    expect(weatherTimeline({ race, laps: 44, seed: "same" })).toEqual(a);
    const states = new Set(Array.from({ length: 30 }, (_, k) => weatherTimeline({ race, laps: 44, seed: `s${k}` }).states.join(",")));
    expect(states.size).toBeGreaterThan(5);
  });

  it("RF-HQ-02: a better weather centre gives a smaller forecast error", () => {
    const race = { packCircuitId: "silverstone", date: "2024-07-07", baseLap: 92, laps: 52 };
    const error = (accuracy) => {
      let sum = 0;
      for (let k = 0; k < 80; k += 1) {
        const t = weatherTimeline({ race, laps: 52, seed: `f${k}`, accuracy });
        const truth = t.states.some((state) => state >= W.states.rainFrom) ? 100 : 0;
        sum += Math.abs(t.forecast - truth) + Math.abs(t.forecastShiftLaps) * 3;
      }
      return sum / 80;
    };
    expect(error(0.9)).toBeLessThan(error(0.55));
    const t = weatherTimeline({ race, laps: 52, seed: "f1" });
    expect(forecastOf({ timeline: t, climateChance: 0.3, accuracy: 1, baseLap: 92, seed: "f1" }).outlook).toEqual(t.wetness);
  });
});

describe("RF-SIM-11 · both race modes in the rain (SRS 4.2)", () => {
  it("start in light rain: both modes start on wet-weather tyres, share the water and the step race exposes it", () => {
    const w = weekend({ seed: "rain", year: 2024, circuit: "silverstone" });
    const args = { ...weekendRaceArgs(w.career), weatherStart: 4 };
    const quick = createRace(args);
    const step = fromQuickRace(createRace(args), { race: w.race });
    expect(step.weather).toEqual(quick.weather);
    expect(quick.cars.every((car) => car.compound === "inter" || car.compound === "wet")).toBe(true);
    runStepToFinish(step);
    const now = weatherNow(step);
    expect(now).toEqual(expect.objectContaining({ state: expect.any(String), waterMm: expect.any(Number), offLineMm: expect.any(Number), rainIntensity: expect.any(Number) }));
    expect(now.sectorsMm).toHaveLength(3);
    // The line is never wetter than the rest of the track (the cars dry it).
    step.weather.water.forEach((h, lap) => expect(h).toBeLessThanOrEqual(step.weather.offLine[lap] + 1e-9));
  });
});

describe("GS-13 · water evacuation by tyre generation (RF-SIM-03, RF-SIM-11, SRS §6; Pirelli, OpenF1 9668)", () => {
  const EV = W.grip.evacuation;
  const PLAYABLE = [1976, 1986, 1988, ...Array.from({ length: 25 }, (_, k) => 1990 + k), 2016, ...Array.from({ length: 9 }, (_, k) => 2018 + k)];

  it("the eras are ordered, contiguous, cover every playable season and cite a source when measured", () => {
    EV.eras.forEach((era, k) => {
      expect(era.to).toBeGreaterThanOrEqual(era.from);
      expect(era.from).toBe(k > 0 ? EV.eras[k - 1].to + 1 : era.from);
      expect(era.status === "measured" ? era.source : "https://").toMatch(/^https:\/\//);
      expect(era.status !== "measured" ? era.note.length : 21).toBeGreaterThan(20);
    });
    PLAYABLE.forEach((year) => expect(EV.eras.some((era) => year >= era.from && year <= era.to)).toBe(true));
    // Pirelli's 2014 figure for the Pirelli years before the wider tyres; nothing published before 2011.
    expect(evacuationFor(2014)).toEqual(expect.objectContaining({ inter: 25, wet: 65, status: "measured" }));
    expect(evacuationFor(2005).status).toBe("NV");
    expect(evacuationFor(null)).toBe(evacuationFor(EV.calibrationYear));
  });

  it("capacity 2024 > 2014 for the inter and the wet, by Pirelli's litres per second of each generation", () => {
    const y2014 = capacityFor(2014);
    const y2024 = capacityFor(2024);
    expect(y2024.interMm).toBeGreaterThan(y2014.interMm);
    expect(y2024.wetMm).toBeGreaterThan(y2014.wetMm);
    // 25 l/s at 316 km/h against 37.5 l/s at 300 km/h; 65 at 316 against 85 at 300.
    expect(y2014.interMm / y2024.interMm).toBeCloseTo((25 / 316) / (37.5 / 300), 9);
    expect(y2014.wetMm / y2024.wetMm).toBeCloseTo((65 / 316) / (85 / 300), 9);
    // The calibration era is exactly the fitted model (what the engine reads without a year).
    expect(y2024.interMm).toBe(INTER_CAPACITY_MM);
    expect(y2024.wetMm).toBe(WET_CAPACITY_MM);
    // The same water costs the 2014 inter more than the 2024 one.
    expect(gripRatio("inter", 0.5, 2014)).toBeGreaterThan(gripRatio("inter", 0.5, 2024));
    expect(aquaplaningOf("inter", 0.8, 2014)).toBeGreaterThan(0);
    expect(aquaplaningOf("inter", 0.8, 2024)).toBe(0);
    expect(sprayLevelOf(0.6, 2014)).toBeGreaterThan(sprayLevelOf(0.6, 2024));
  });

  it("in every playable year slick/inter cross at 1.10-1.12 and inter/wet at 1.27, and tyreForDepth is the quickest", () => {
    PLAYABLE.forEach((year) => {
      const cap = capacityFor(year);
      const slickInter = gripRatio("soft", cap.slickInterMm, year);
      expect(slickInter).toBeGreaterThanOrEqual(1.1);
      expect(slickInter).toBeLessThanOrEqual(1.12);
      expect(gripRatio("inter", cap.slickInterMm, year)).toBeCloseTo(slickInter, 6);
      expect(gripRatio("inter", cap.interMm, year)).toBeCloseTo(W.grip.interWetRatio, 6);
      expect(gripRatio("wet", cap.interMm, year)).toBeCloseTo(W.grip.interWetRatio, 6);
      for (let h = 0.01; h < cap.wetMm; h += 0.05) {
        if (Math.abs(h - cap.slickInterMm) < 0.01 || Math.abs(h - cap.interMm) < 0.01) continue;
        const times = ["soft", "inter", "wet"].map((compound) => [compound, gripRatio(compound, h, year)]);
        const best = times.reduce((a, b) => (b[1] < a[1] ? b : a))[0];
        expect([year, h, tyreForDepth(h, year) || "soft"]).toEqual([year, h, best]);
      }
    });
  });

  it("without a year the engine keeps the calibration era (what race.js and stepRace.js read today)", () => {
    [0, 0.1, 0.5, 1.2, 2.5].forEach((h) => ["soft", "inter", "wet"].forEach((compound) => expect(gripRatio(compound, h)).toBe(gripRatio(compound, h, EV.calibrationYear))));
    [0.2, 0.5, 0.8].forEach((w) => expect(tyreForDepth(depthOfWetness(w))).toBe(tyreForWetness(w)));
    const t = weatherTimeline({ race: { packCircuitId: "shanghai", date: "2014-04-20", laps: 54 }, laps: 54, seed: "gs13" });
    expect(t.year).toBe(2014);
    expect(t.capacity.interMm).toBeCloseTo(capacityFor(2014).interMm, 9);
  });

  it("Chinese SQ 2024 (OpenF1 9668): inter/dry 1.23-1.27 lies in the 2024 inter's window, inter the quickest there", () => {
    const ratio = SQ_CHINA_2024.laps.interOverDry;
    expect(ratio).toBeGreaterThanOrEqual(1.23);
    expect(ratio).toBeLessThanOrEqual(1.27);
    // The depth at which the 2024 inter laps at that ratio sits between the two crossovers: the
    // inter the teams ran is the model's choice too.
    const cap = capacityFor(2024);
    const h = ((ratio - W.grip.interDryRatio) / (W.grip.interWetRatio - W.grip.interDryRatio)) * cap.interMm;
    expect(gripRatio("inter", h, 2024)).toBeCloseTo(ratio, 6);
    expect(tyreForDepth(h, 2024)).toBe("inter");
    expect(gripRatio("inter", h, 2024)).toBeLessThan(gripRatio("wet", h, 2024));
    expect(gripRatio("inter", h, 2024)).toBeLessThan(gripRatio("soft", h, 2024));
    // With the 2014 inter the same water already calls for the full wet.
    expect(tyreForDepth(h, 2014)).toBe("wet");
    // The race-control sequence of the spec: wet track before DRS disabled.
    expect(SQ_CHINA_2024.messages.wetTrack[0].min).toBeLessThan(SQ_CHINA_2024.messages.drsDisabled[0].min);
  });

  it("the track cools 6-7 °C in 30 min under rain towards air + trackOverAirRain (OpenF1 9668)", () => {
    const c = SQ_CHINA_2024.cooling;
    const target = rainTrackTargetOf(c.airAtEndC);
    const drop30 = c.fromC - relaxTrackTemp(c.fromC, target, 30);
    expect(drop30).toBeGreaterThanOrEqual(6);
    expect(drop30).toBeLessThanOrEqual(7);
    expect(Math.abs(relaxTrackTemp(c.fromC, target, c.minutes) - c.toC)).toBeLessThan(0.5);
    // The per-lap relaxation race.js applies is the same constant at a 2-minute wet lap.
    expect(1 - Math.exp(-2 / W.temperature.relaxTauMin)).toBeCloseTo(W.temperature.relaxPerLap, 2);
  });
});


describe("WX-C2 · GS-11 spray calibrated with OpenF1 (F1M24-CHINA §2.9; RF-SIM-11, RF-SIM-06, RNF-05, RNF-07)", () => {
  const samples = WET_SPRAY.races.flatMap((race) => race.samples);
  const wet = samples.filter((sample) => sample[3] === "wet");
  const dry = samples.filter((sample) => sample[3] === "dry");
  const mean = (values) => values.reduce((a, b) => a + b, 0) / values.length;
  const window = WET_SPRAY.method.windowSec;

  it("the fixture is real data with enough laps from several wet races, and the engine reads the measurement's window", () => {
    expect(WET_SPRAY.status).toBe("measured");
    expect(WET_SPRAY.races.length).toBeGreaterThanOrEqual(5);
    expect(wet.length).toBeGreaterThanOrEqual(100);
    expect(dry.length).toBeGreaterThanOrEqual(100);
    const outside = samples.filter(([gap, level]) => !(gap >= 0 && gap < window && level >= 0 && level <= 1));
    expect(outside).toEqual([]);
    expect(W.spray.windowSec).toBe(window);
    expect(W.spray.status).toBe("measured");
    expect(W.spray.nvKeys).toContain("incident");
  });

  it("the engine's spray loss on the measured wet laps is within ±30 % of what they really lost over the dry laps", () => {
    // Measured: following within the window costs more on a wet track than on a dry one (where
    // only the dirty air, charged apart by the engine, costs).
    const measured = mean(wet.map((s) => s[2])) - mean(dry.map((s) => s[2]));
    expect(measured).toBeGreaterThan(0);
    expect(measured).toBeCloseTo(WET_SPRAY.result.extraSec, 3);
    expect(W.spray.calibration.extraSec).toBeCloseTo(WET_SPRAY.result.extraSec, 3);
    // The engine on the same laps: the water whose spray level is the lap's, at the lap's gap.
    const engine = mean(wet.map(([gap, level]) => sprayLossOf(level * INTER_CAPACITY_MM, gap)));
    expect(W.spray.calibration.tolerance).toBe(0.3);
    expect(Math.abs(engine - measured) / measured).toBeLessThanOrEqual(W.spray.calibration.tolerance);
    // The figure sits inside the bootstrap interval of the measurement.
    expect(W.spray.lossSec).toBeGreaterThanOrEqual(WET_SPRAY.result.ci95[0]);
    expect(W.spray.lossSec).toBeLessThanOrEqual(WET_SPRAY.result.ci95[1]);
  });

  it("no spray loss, no spray risk and no spray in the dry; none beyond the window", () => {
    [0, 0.3, 1, 1.49].forEach((gap) => {
      expect(sprayLossOf(0, gap)).toBe(0);
      expect(sprayRiskOf(0, gap)).toBe(1);
    });
    expect(sprayLossOf(0.8, window)).toBe(0);
    expect(sprayLossOf(0.8, 3)).toBe(0);
    expect(sprayLossOf(0.8, null)).toBe(0);
    expect(sprayLossOf(0.8, 0)).toBeCloseTo(W.spray.lossSec * sprayLevelOf(0.8), 9);
    [undefined, 0, 120, 300].forEach((kmh) => expect(sprayAt(0, { kmh })).toBe(0));
    expect(sprayAt(-0.2)).toBe(0);
  });

  it("sprayAt is pure, in 0..1, monotone in water and in speed, the water level without a speed", () => {
    let last = -1;
    const broken = [];
    for (let h = 0; h <= 3; h += 0.05) {
      const value = sprayAt(h, { kmh: 250 });
      if (!(value >= last && value >= 0 && value <= 1) || sprayAt(h, { kmh: 250 }) !== value || sprayAt(h) !== sprayLevelOf(h)) broken.push(h);
      last = value;
    }
    last = -1;
    for (let kmh = 0; kmh <= 360; kmh += 10) {
      const value = sprayAt(0.5, { kmh });
      if (!(value >= last)) broken.push(kmh);
      last = value;
    }
    expect(broken).toEqual([]);
    expect(sprayAt(0.5, { kmh: 0 })).toBe(0);
    // At the inter's capacity and the speed the evacuation was fitted at, the full spray.
    expect(sprayAt(INTER_CAPACITY_MM, { kmh: W.grip.evacuation.fit.atKmh })).toBeCloseTo(1, 9);
    // The tyre generation: the 2014 inter clears less water, the same water throws more spray level.
    expect(sprayAt(0.6, { year: 2014 })).toBeGreaterThan(sprayAt(0.6, { year: 2024 }));
  });

  it("the snapshot's spray is the timeline's water through sprayAt and the same with the same seed (RNF-05)", () => {
    const race = { packCircuitId: "spa", date: "2025-07-27", laps: 44 };
    const shots = (seed) => {
      const weather = weatherTimeline({ race, laps: 44, seed, cars: 20 });
      return Array.from({ length: 45 }, (_, lap) => weatherSnapshot({ weather, lap: 0, evolution: 0 }, lap));
    };
    const a = shots("wx-c2");
    expect(shots("wx-c2")).toEqual(a);
    const wrong = a.filter((shot) => shot.spray !== Math.round(sprayAt(shot.waterMm) * 1000) / 1000 && Math.abs(shot.spray - sprayAt(shot.waterMm)) > 1e-3);
    expect(wrong).toEqual([]);
    expect(a.filter((shot) => !(shot.spray >= 0 && shot.spray <= 1))).toEqual([]);
  });
});
