/**
 * Race sound (RF-3D-04 live view; RNF-02 cost; RNF-07 data; RF-SIM-15/RNF-05 seeded
 * randomness; SRS 6.2 nothing outside its era). The pure parts: data and schema, era and
 * engine selection from the f1db formulas of every season pack, real rev limits, firing
 * frequency, gearbox, Doppler and distance, mixer curves and settings, ambience
 * envelopes. Web Audio itself is mocked.
 */

import fs from "fs";
import path from "path";
import Ajv from "ajv";
import schema from "../../engine/packs/schema/audio.schema.json";
import audioData from "../../data/balance/audio.json";
import {
  cycleFrequency, driveStep, engineSpecFor, eraFor, firingFrequency, gearSpeeds, harmonicWeights, hybridTones, loadFromAccel, nextGear, parseFormula, rpmByYear,
  shiftCutGain,
} from "./engineSynth";
import { assignVoices, busGains, cameraMix, distanceGain, dopplerFactor, listenerFor, loadSettings, saveSettings, selectVoices, sliderToGain } from "./mixer";
import { crowdLevel, rainOf, swellFor, windOf, airGunsOn, squeals } from "./ambience";
import { createRaceAudio, teamEnginesOf } from "./index";

const SEASONS = path.join(__dirname, "../../data/seasons");
const packYears = fs
  .readdirSync(SEASONS)
  .filter((name) => /^\d{4}\.json$/.test(name))
  .map((name) => Number(name.slice(0, 4)));
const packOf = (year) => JSON.parse(fs.readFileSync(path.join(SEASONS, `${year}.json`), "utf8"));

describe("audio.json (RNF-07)", () => {
  test("passes its JSON schema", () => {
    const validate = new Ajv({ allErrors: true, strict: true }).compile(schema);
    const ok = validate(audioData);
    expect(validate.errors).toBeNull();
    expect(ok).toBe(true);
  });

  test("eras cover every playable season once, gearboxes are consistent", () => {
    const eras = audioData.eras;
    for (let i = 1; i < eras.length; i += 1) expect(eras[i].from).toBe(eras[i - 1].to + 1);
    packYears.forEach((year) => expect(eraFor(year).from <= year && eraFor(year).to >= year).toBe(true));
    eras.forEach((era) => {
      expect(era.gearShares).toHaveLength(era.gears);
      expect(era.gearShares[era.gears - 1]).toBe(1);
      era.gearShares.slice(1).forEach((share, i) => expect(share).toBeGreaterThan(era.gearShares[i]));
      era.engines.forEach((rule) => {
        expect(rule.source.length).toBeGreaterThan(3);
        // Either a fixed limit and shift point, or yearly anchors and a shift share.
        expect(Boolean(rule.revLimit) !== Boolean(rule.revLimitByYear)).toBe(true);
        if (rule.revLimit) expect(rule.revLimit).toBeGreaterThanOrEqual(rule.shiftRpm);
      });
    });
  });

  test("every figure without a source is marked NV", () => {
    audioData.eras.forEach((era) => era.engines.forEach((rule) => expect(/NV|f1Engines|f312t|mp44|f640|str1|pu20|dfv/.test(rule.source)).toBe(true)));
  });
});

describe("era coherence (SRS 6.2)", () => {
  test("turbo whine only on charged engines, hybrid parts only in their years", () => {
    packYears.forEach((year) => {
      const pack = packOf(year);
      Object.values(teamEnginesOf(pack)).forEach((engine) => {
        const spec = engineSpecFor(year, engine);
        const charged = /turbo/.test(engine.formula);
        expect(Boolean(spec.turbo)).toBe(charged);
        const hybridYears = year === 2009 || (year >= 2011 && year <= 2013) || year >= 2014;
        expect(Boolean(spec.electric)).toBe(hybridYears);
        // MGU-H 2014-2025 only (dropped for 2026).
        expect((spec.electric?.mguh || 0) > 0).toBe(year >= 2014 && year <= 2025);
      });
    });
  });

  test("every pack engine (f1db formula) parses and has a voicing", () => {
    packYears.forEach((year) => {
      packOf(year).teams.forEach((team) =>
        team.engines.forEach((engine) => {
          const parsed = parseFormula(engine.formula);
          expect(parsed).not.toBeNull();
          expect(audioData.voicing.byCylinders[String(parsed.cylinders)]).toBeDefined();
        }),
      );
    });
  });

  test("a 1990 grid sounds mixed: V8, V10 and V12 side by side", () => {
    const cyl = new Set(Object.values(teamEnginesOf(packOf(1990))).map((engine) => engineSpecFor(1990, engine).engine.cylinders));
    expect([...cyl].sort((a, b) => a - b)).toEqual(expect.arrayContaining([8, 10, 12]));
  });
});

describe("real rev limits per era", () => {
  const limit = (year, formula, id) => engineSpecFor(year, { formula, id });
  test("V10 2005 >20,000, V8 2006 20,000, Toro Rosso V10 16,700, 19,000 in 2007, 18,000 from 2009", () => {
    expect(limit(2005, "3.0 V10").revLimit).toBe(20000);
    expect(limit(2003, "3.0 V10").revLimit).toBe(19200);
    expect(limit(2006, "2.4 V8").revLimit).toBe(20000);
    expect(limit(2006, "3.0 V10", "cosworth-tj2006-30-v10").revLimit).toBe(16700);
    expect(limit(2007, "2.4 V8").revLimit).toBe(19000);
    expect(limit(2009, "2.4 V8").revLimit).toBe(18000);
    expect(limit(2012, "2.4 V8").revLimit).toBe(18000);
  });
  test("hybrid: 15,000 limit but shifts near 12,000; 1976 flat-12 12,500; 1988 turbo 12,500", () => {
    const hybrid = limit(2016, "1.6 V6 turbo hybrid");
    expect(hybrid.revLimit).toBe(15000);
    expect(hybrid.shiftRpm).toBe(12000);
    expect(hybrid.gears).toBe(8);
    expect(hybrid.gearingPerTrack).toBe(false);
    expect(limit(2026, "1.6 V6 turbo hybrid").turbo.maxShaftRpm).toBe(150000);
    expect(limit(1976, "3.0 F12").revLimit).toBe(12500);
    expect(limit(1988, "1.5 V6 turbo").revLimit).toBe(12500);
    expect(limit(1988, "3.5 V8").turbo).toBeNull();
  });
  test("rpm anchors interpolate and hold outside", () => {
    expect(rpmByYear({ 1995: 15500, 2003: 19200 }, 1999)).toBe(17350);
    expect(rpmByYear({ 1995: 15500, 2003: 19200 }, 1990)).toBe(15500);
    expect(rpmByYear({ 1995: 15500, 2003: 19200 }, 2010)).toBe(19200);
  });
});

describe("engine maths", () => {
  test("firing frequency = rpm/60 × cylinders/2", () => {
    expect(firingFrequency(19000, 10)).toBeCloseTo(1583.33, 1);
    expect(firingFrequency(18000, 8)).toBeCloseTo(1200, 6);
    expect(firingFrequency(12000, 6)).toBeCloseTo(600, 6);
    expect(firingFrequency(12500, 12)).toBeCloseTo(1250, 6);
    // Harmonic `cylinders` of the cycle frequency is the firing note.
    expect(cycleFrequency(18000) * 8).toBeCloseTo(firingFrequency(18000, 8), 6);
  });

  test("the firing harmonic leads the wave", () => {
    const spec = engineSpecFor(2005, { formula: "3.0 V10" });
    const w = harmonicWeights(10, spec.voice, spec.halfOrder);
    const loudest = w.indexOf(Math.max(...w));
    expect(loudest).toBe(10);
    expect(w[20]).toBeGreaterThan(w[7]);
    expect(w[0]).toBe(0);
  });

  test("gearbox: shifts up at the shift point, down with hysteresis, limiter past top speed", () => {
    const spec = engineSpecFor(2012, { formula: "2.4 V8" });
    const speeds = gearSpeeds(spec);
    let gear = 1;
    let last = null;
    for (let kmh = 5; kmh <= speeds[6]; kmh += 2) {
      last = nextGear(spec, gear, kmh);
      expect(last.rpm).toBeLessThanOrEqual(spec.revLimit);
      expect(last.gear).toBeGreaterThanOrEqual(gear);
      gear = last.gear;
    }
    expect(gear).toBe(7);
    expect(last.rpm).toBeGreaterThan(spec.shiftRpm * 0.97);
    // Past the top speed of the last gear: the rev limiter.
    expect(nextGear(spec, 7, speeds[6] * 1.03).limiter).toBe(true);
    // Hysteresis: a little under the 6th-gear top does not drop to 6th.
    expect(nextGear(spec, 7, speeds[5] * 0.95).gear).toBe(7);
    expect(nextGear(spec, 7, speeds[5] * 0.5).gear).toBeLessThan(7);
    // Pulling away the clutch holds the launch rpm.
    expect(nextGear(spec, 1, 5).rpm).toBe(spec.launchRpm);
  });

  test("driveStep reads pose.rpm/gear when the engine has a powertrain, else derives them", () => {
    const spec = engineSpecFor(2024, { formula: "1.6 V6 turbo hybrid" });
    const own = driveStep(spec, null, { x: 0, y: 0, v: 50, rpm: 11000, gear: 5 }, 0.1, 0.1);
    expect(own.rpm).toBe(11000);
    expect(own.gear).toBe(5);
    // No `v` (quick replay): speed from position over race time.
    let s = driveStep(spec, null, { x: 0, y: 0 }, 0, 0);
    s = driveStep(spec, s, { x: 8, y: 0 }, 0.1, 0.1);
    expect(s.v).toBeCloseTo(80, 6);
    expect(s.gear).toBeGreaterThan(4);
    // Pit limiter: low gear, limiter on.
    const pit = driveStep(spec, null, { x: 0, y: 0, v: 80 / 3.6, pitPhase: "LIMITER" }, 0.1, 0.1);
    expect(pit.gear).toBe(audioData.voicing.pitLimiterGear);
    expect(pit.limiter).toBe(true);
    // Stationary in the box: idle.
    expect(driveStep(spec, null, { x: 0, y: 0, v: 0, pitPhase: "STATIONARY" }, 0.1, 0.1).rpm).toBe(spec.idleRpm);
  });

  test("calibration: rpm at real top speeds (SIM-FISICA §4.2) sits where the era ran", () => {
    // Monza 2012, 346 km/h race top: a V8 near its 18,000 limit in 7th (gearing chosen per track).
    const v8 = engineSpecFor(2012, { formula: "2.4 V8" });
    let s = null;
    for (let i = 0; i < 60; i += 1) s = driveStep(v8, s, { x: 0, y: 0, v: Math.min(346, 200 + i * 4) / 3.6 }, 0.1, 0.1);
    expect(s.gear).toBe(7);
    expect(s.rpm).toBeGreaterThan(17000);
    expect(s.rpm).toBeLessThanOrEqual(18000);
    // Bahrain 2024, 332 km/h: fixed ratios for the season, under the ~12,000 the hybrids use (f1Engines).
    const v6 = engineSpecFor(2024, { formula: "1.6 V6 turbo hybrid" });
    const bahrain = nextGear(v6, 8, 332);
    expect(bahrain.gear).toBe(8);
    expect(bahrain.rpm).toBeGreaterThan(10500);
    expect(bahrain.rpm).toBeLessThanOrEqual(12000);
    // Monza 2005, 372.6 km/h record: a V10 just under 20,000.
    const v10 = engineSpecFor(2005, { formula: "3.0 V10" });
    expect(nextGear(v10, 7, 372.6).rpm).toBeGreaterThan(18500);
  });

  test("load, shift cut and hybrid tones", () => {
    expect(loadFromAccel(-10)).toBe(0);
    expect(loadFromAccel(5)).toBe(1);
    const spec = engineSpecFor(2014, { formula: "1.6 V6 turbo hybrid" });
    expect(shiftCutGain(spec, 0)).toBeLessThan(0.5);
    expect(shiftCutGain(spec, 1)).toBe(1);
    // MGU-K tops at 50,000 rpm at the 15,000 limit (FIA 2014 PU guide).
    expect(hybridTones(spec, 15000, 1).electricHz * 60).toBeCloseTo(50000, -2);
    expect(hybridTones(spec, 12000, 1).turboHz).toBeCloseTo(125000 / 60, 6);
    expect(hybridTones(engineSpecFor(2005, { formula: "3.0 V10" }), 18000, 1)).toEqual({ turboHz: 0, electricHz: 0 });
  });
});

describe("mixer", () => {
  test("volume curve: 0 is silence, 1 unity, linear in dB between", () => {
    expect(sliderToGain(0)).toBe(0);
    expect(sliderToGain(1)).toBe(1);
    expect(20 * Math.log10(sliderToGain(0.5))).toBeCloseTo(audioData.mixer.volumeCurve.minDb / 2, 6);
    for (let v = 0.05; v < 1; v += 0.05) expect(sliderToGain(v + 0.05)).toBeGreaterThan(sliderToGain(v));
    expect(busGains({ master: 1, engine: 1, ambience: 1, muted: true }).master).toBe(0);
  });

  test("settings persist per viewer and survive broken storage", () => {
    const store = new Map();
    const fake = { getItem: (key) => (store.has(key) ? store.get(key) : null), setItem: (key, value) => store.set(key, value) };
    saveSettings({ master: 0.3, engine: 2, ambience: -1, muted: true }, fake);
    expect(loadSettings(fake)).toEqual({ master: 0.3, engine: 1, ambience: 0, muted: true });
    const broken = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    };
    expect(loadSettings(broken)).toEqual(audioData.mixer.defaults);
    expect(() => saveSettings({ master: 0.5 }, broken)).not.toThrow();
    expect(loadSettings({ getItem: () => "{not json" })).toEqual(audioData.mixer.defaults);
  });

  test("inverse distance law and Doppler", () => {
    const ref = audioData.mixer.distance.refDistance;
    expect(distanceGain(0)).toBe(1);
    expect(distanceGain(ref)).toBe(1);
    expect(distanceGain(100)).toBeLessThan(distanceGain(50));
    // 80 m/s straight at a still ear: 343 / 263.
    const ear = { x: 100, y: 0, z: 0 };
    expect(dopplerFactor({ x: 0, y: 0, vx: 80, vy: 0 }, ear)).toBeCloseTo(343 / 263, 6);
    expect(dopplerFactor({ x: 200, y: 0, vx: 80, vy: 0 }, ear)).toBeCloseTo(343 / 423, 6);
    // Riding along with the source: no shift.
    expect(dopplerFactor({ x: 0, y: 0, vx: 80, vy: 0 }, { ...ear, vx: 80, vy: 0 })).toBeCloseTo(1, 6);
    // Passing sideways: no radial speed.
    expect(dopplerFactor({ x: 0, y: 0, vx: 0, vy: 80 }, ear)).toBeCloseTo(1, 6);
  });

  test("voices: focus first, nearest next, never more than the pool; cars keep their voice", () => {
    const cars = Array.from({ length: 22 }, (_, i) => ({ id: `c${i}`, x: i * 20, y: 0 }));
    const ids = selectVoices(cars, { x: 0, y: 0, z: 1 }, "c21");
    expect(ids).toHaveLength(audioData.mixer.maxVoices);
    expect(ids[0]).toBe("c21");
    expect(ids.slice(1)).toEqual(["c0", "c1", "c2", "c3", "c4"]);
    const a = assignVoices([null, null, null], ["x", "y"], 3);
    const b = assignVoices(a, ["z", "y"], 3);
    expect(b[a.indexOf("y")]).toBe("y");
    expect(b).toContain("z");
  });

  test("every LiveRace camera has a mix; the TV post stays put until the car is past", () => {
    ["tv", "chase", "drone", "heli", "tcam", "visor", "nose", "tcamRear", "map", "follow"].forEach((mode) => expect(audioData.mixer.cameras.mix[cameraMix(mode).group]).toBeDefined());
    expect(cameraMix("visor").group).toBe("onboard");
    const tv = cameraMix("tv");
    const first = listenerFor(tv, { x: 0, y: 0, heading: 0, v: 80 });
    expect(first.x).toBeCloseTo(tv.ahead, 6);
    const later = listenerFor(tv, { x: tv.ahead + 10, y: 0, heading: 0, v: 80 }, first.post);
    expect(later.post).toBe(first.post);
    const moved = listenerFor(tv, { x: tv.ahead + tv.passBehind + 1, y: 0, heading: 0, v: 80 }, first.post);
    expect(moved.post).not.toBe(first.post);
    const onboard = listenerFor(cameraMix("tcam"), { x: 5, y: 7, heading: 0, v: 60 });
    expect(onboard).toMatchObject({ x: 5, y: 7, vx: 60 });
  });
});

describe("ambience", () => {
  test("crowd swells and fades back to the bed", () => {
    const crowd = audioData.ambience.crowd;
    expect(crowdLevel([], 0)).toBe(crowd.base);
    const swell = [{ at: 0, amount: 0.5 }];
    expect(crowdLevel(swell, crowd.attackSec)).toBeCloseTo(crowd.base + 0.5, 6);
    expect(crowdLevel(swell, crowd.attackSec + crowd.decaySec * 5)).toBeLessThan(crowd.base + 0.01);
    expect(swellFor({ type: "lead" })).toBe(crowd.swell.lead);
    expect(swellFor({ type: "pass" }, 5000)).toBeLessThan(swellFor({ type: "pass" }, 0));
    expect(swellFor({ type: "pit" })).toBe(0);
  });

  test("rain with wetness, wind with speed, guns on the wheels stage, squeal on lock-ups", () => {
    expect(rainOf(0)).toBe(0);
    expect(rainOf(1)).toBeCloseTo(audioData.ambience.rain.gain, 6);
    expect(rainOf(0.6)).toBeGreaterThan(rainOf(0.3));
    expect(windOf(300, 1).gain).toBeCloseTo(audioData.ambience.wind.gain, 6);
    expect(windOf(0, 1).gain).toBe(0);
    expect(airGunsOn("wheels")).toBe(true);
    expect(airGunsOn("refuel")).toBe(false);
    expect(squeals("lockup")).toBe(true);
    expect(squeals("wide")).toBe(false);
  });
});

// ------------------------------------------------------------------ mocked Web Audio

const param = (value = 0) => ({ value, setTargetAtTime: jest.fn(), setValueAtTime: jest.fn(), linearRampToValueAtTime: jest.fn(), exponentialRampToValueAtTime: jest.fn(), cancelScheduledValues: jest.fn() });
const node = (extra = {}) => {
  const n = { connect: jest.fn((target) => target), disconnect: jest.fn(), start: jest.fn(), stop: jest.fn(), ...extra };
  return n;
};
class FakeContext {
  constructor() {
    FakeContext.made += 1;
    this.currentTime = 0;
    this.sampleRate = 8000;
    this.state = "running";
    this.destination = node();
    this.listener = { positionX: param(), positionY: param(), positionZ: param(), forwardX: param(), forwardY: param(), forwardZ: param(), upX: param(), upY: param(), upZ: param() };
    this.oscillators = 0;
  }
  createGain() {
    return node({ gain: param(1) });
  }
  createBiquadFilter() {
    return node({ frequency: param(), Q: param() });
  }
  createOscillator() {
    this.oscillators += 1;
    return node({ frequency: param(), setPeriodicWave: jest.fn() });
  }
  createBufferSource() {
    return node({ buffer: null, loop: false });
  }
  createBuffer(channels, length) {
    const data = new Float32Array(length);
    return { getChannelData: () => data };
  }
  createPeriodicWave() {
    return {};
  }
  createPanner() {
    return node({ positionX: param(), positionY: param(), positionZ: param() });
  }
  createDynamicsCompressor() {
    return node({ threshold: param(), knee: param(), ratio: param() });
  }
  resume() {
    return Promise.resolve();
  }
  suspend() {
    return Promise.resolve();
  }
  close() {
    this.state = "closed";
    return Promise.resolve();
  }
}
FakeContext.made = 0;

describe("race audio controller (mocked Web Audio)", () => {
  afterEach(() => {
    delete window.AudioContext;
  });

  test("silent until started from a gesture; a 22-car frame stays within the voice pool and is cheap (RNF-02)", () => {
    window.AudioContext = FakeContext;
    const audio = createRaceAudio({ seed: "test", year: 2012, engines: teamEnginesOf(packOf(2012)) });
    const teams = Object.keys(teamEnginesOf(packOf(2012)));
    const cars = (t) => Array.from({ length: 22 }, (_, i) => ({ id: `c${i}`, teamId: teams[i % teams.length], pose: { x: 60 * t - i * 15, y: 0, heading: 0, v: 60, incident: i === 3 && t > 5 ? "lockup" : null } }));
    audio.frame({ tau: 0, cars: cars(0) });
    expect(FakeContext.made).toBe(0);
    expect(audio.start()).toBe(true);
    const ctx = FakeContext.made;
    const begin = process.hrtime.bigint();
    for (let f = 0; f < 600; f += 1) {
      audio.frame({ tau: f / 10, playing: true, mode: f < 300 ? "tv" : "tcam", focusId: "c0", cars: cars(f / 10), wetness: 0.4, events: f > 100 ? [{ type: "pass", carId: "c1" }, { type: "contact", carId: "c2" }] : [], started: f > 10 });
    }
    const ms = Number(process.hrtime.bigint() - begin) / 1e6;
    expect(ctx).toBe(1);
    expect(ms / 600).toBeLessThan(2);
    audio.dispose();
  });

  test("seeded: no Math.random or Date in the audio code (RF-SIM-15, RNF-05)", () => {
    ["engineSynth.js", "mixer.js", "ambience.js", "index.js"].forEach((file) => {
      const text = fs.readFileSync(path.join(__dirname, file), "utf8");
      expect(text).not.toMatch(/Math\.random|Date\.now|new Date/);
    });
  });

  test("without Web Audio it declines quietly", () => {
    const audio = createRaceAudio({ year: 2005 });
    expect(audio.start()).toBe(false);
    expect(() => audio.frame({ tau: 1, cars: [] })).not.toThrow();
  });
});
