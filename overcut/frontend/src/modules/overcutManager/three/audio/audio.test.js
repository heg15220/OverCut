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
  shiftCutGain, shiftEnvelope, shiftProfileFor, pitLimiterFor, pitHoldKmh, limiterDepthOf, rpmInGear, createEngineVoice,
} from "./engineSynth";
import { assignVoices, blendMix, busGains, cameraListener, cameraMix, cameraUsable, createMixer, cutEnvelope, dbToGain, makeupDb, onboardLoudness, distanceGain, dopplerFactor, fastForwardOn, listenerFor, loadSettings, resolveView, saveSettings, selectVoices, settingsCurrent, sliderToGain, transitionAt, viewMix, viewTransition } from "./mixer";
import { createFastForwardBed, fastForwardBedLevel } from "./fastForwardBed";
import { crowdLevel, rainOf, swellFor, windOf, airGunsOn, squeals, fieldBedOf, kerbRumble, startLightsStep, gridRevsOf, gridRevsFor, trackBedOf, onePoleLowpass, createAmbience } from "./ambience";
import { createRaceAudio, engineOff, impactHeard, teamEnginesOf } from "./index";
import { heldGear, loadOf } from "./engineSynth";
import { mixLevels } from "./levels";
import { KERB_FILES, kerbZonesFor, onKerb } from "./kerbs";
import kerbsSchema from "../../engine/packs/schema/kerbs.schema.json";
import splinesData from "../../data/splines.json";

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
    // Pit limiter: a fixed gear, the pit limiter on (not the rev limiter).
    const pit = driveStep(spec, null, { x: 0, y: 0, v: 80 / 3.6, pitPhase: "LIMITER" }, 0.1, 0.1);
    expect(pit.gear).toBeGreaterThanOrEqual(1);
    expect(pit.pitLimiter).toBe(true);
    expect(pit.limiter).toBe(false);
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
    // AUD-4 adds the ui bus to the saved mix: an old save without it gets its defaults.
    // AUD-C12 adds the menu music level the same way.
    expect(loadSettings(fake)).toEqual({ master: 0.3, engine: 1, ambience: 0, muted: true, ui: audioData.mixer.defaults.ui, uiMuted: audioData.mixer.defaults.uiMuted, recorded: audioData.mixer.defaults.recorded, music: audioData.mixer.defaults.music });
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
  createDelay() {
    this.delays = (this.delays || 0) + 1;
    return node({ delayTime: param() });
  }
  createDynamicsCompressor() {
    return node({ threshold: param(), knee: param(), ratio: param() });
  }
  createChannelMerger() {
    return node();
  }
  createChannelSplitter() {
    return node();
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

describe("smooth drive from the engine's powertrain (no stumbles)", () => {
  test("a gear flicking back within the hold never sounds as a shift; a held one does", () => {
    const s = { gear: 3 };
    expect(heldGear(s, { gear: 4 }, 0.016)).toBe(3);
    expect(heldGear(s, { gear: 3 }, 0.016)).toBe(3);
    expect(heldGear(s, { gear: 4 }, 0.016)).toBe(3);
    let g = 3;
    for (let k = 0; k < 5 && g === 3; k += 1) g = heldGear(s, { gear: 4 }, 0.016);
    expect(g).toBe(4);
  });

  test("the load follows the engine's pedals, braking is overrun, and it eases instead of jumping", () => {
    const s = { load: 0, v: 50 };
    const first = loadOf(s, { throttle: 1, brake: 0 }, 50, -30, 0.016);
    expect(first).toBeGreaterThan(0);
    expect(first).toBeLessThan(0.5);
    expect(loadOf({ load: 1, v: 50 }, { throttle: 0.9, brake: 0.4 }, 50, 0, 1)).toBe(0);
    expect(loadOf({ v: 50 }, { throttle: 0.7 }, 50, -30, 0.016)).toBeCloseTo(0.7, 6);
  });

  test("driveStep keeps the voice's gear and revs together while a new gear is not yet held", () => {
    const spec = engineSpecFor(2013, { formula: "2.4 V8" });
    let st = driveStep(spec, null, { x: 0, y: 0, v: 70, rpm: 17000, gear: 5, throttle: 1 }, 0.016, 0.016);
    st = driveStep(spec, st, { x: 1, y: 0, v: 70.2, rpm: 15500, gear: 6, throttle: 1 }, 0.016, 0.016);
    expect(st.gear).toBe(5);
    expect(st.shifted).toBe(false);
    expect(st.rpm).toBe(17000);
  });
});

describe("engines that are off (retired, garage, after the flag)", () => {
  test("a parked retired car is silent from the moment it stops; a running or pitting car is not", () => {
    expect(engineOff({ parked: true, v: 0 })).toBe(true);
    expect(engineOff({ garage: true })).toBe(true);
    expect(engineOff({ gone: true })).toBe(true);
    expect(engineOff({ finished: true }, { v: 0 })).toBe(true);
    expect(engineOff({ finished: true }, { v: 40 })).toBe(false);
    expect(engineOff({ inPit: true, stopped: true, v: 0 })).toBe(false);
    expect(engineOff({ v: 60 })).toBe(false);
  });
});

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
    ["engineSynth.js", "engineSamples.js", "mixer.js", "ambience.js", "index.js", "levels.js", "kerbs.js", "uiSounds.js", "fastForwardBed.js"].forEach((file) => {
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

// ------------------------------------------------------------------ AUD-1: shift shape, blips, pit limiter

describe("shift shape per era and maker (shift-shape-per-pu, RF-3D-04, RNF-07, SRS 6.2)", () => {
  test("every season of every audio era has a catch-all profile; makers before their era", () => {
    const first = audioData.eras[0].from;
    const last = audioData.eras[audioData.eras.length - 1].to;
    for (let year = first; year <= last; year += 1) {
      const rows = audioData.shiftProfiles.filter((row) => year >= row.from && year <= row.to);
      const catchAll = rows.findIndex((row) => Object.keys(row.match).length === 0);
      expect(catchAll).toBeGreaterThanOrEqual(0);
      const order = audioData.shiftProfiles.indexOf(rows[catchAll]);
      const shadowed = audioData.shiftProfiles.filter(
        (row, index) => index > order && year >= row.from && year <= row.to && Object.keys(row.match).length !== 0,
      );
      expect(shadowed).toEqual([]);
    }
    audioData.shiftProfiles.forEach((row) => expect(/NV|f312t|mp44|f640|openf1/.test(row.source)).toBe(true));
  });

  test("H-pattern before 1989, semi-automatic after, seamless last; the era's cut length by default", () => {
    const h = engineSpecFor(1976, { formula: "3.0 F12" });
    const semi = engineSpecFor(1995, { formula: "3.0 V10" });
    const seamless = engineSpecFor(2024, { formula: "1.6 V6 turbo hybrid" });
    expect(h.shift.id).toBe("h-pattern");
    expect(semi.shift.id).toBe("semi-auto");
    expect(seamless.shift.id).toBe("seamless");
    expect(h.shift.glideMs).toBeGreaterThan(semi.shift.glideMs);
    expect(semi.shift.glideMs).toBeGreaterThan(seamless.shift.glideMs);
    expect(h.shift.transient.ms).toBe(eraFor(1976).shiftCutMs);
    expect(seamless.shift.transient.ms).toBe(eraFor(2024).shiftCutMs);
  });

  test("a maker's row wins over the era's, matched on the pack's f1db manufacturer or engine id", () => {
    const rows = [
      { id: "maker", from: 2024, to: 2024, match: { manufacturer: "ferrari" }, glideMs: 50, transient: { kind: "pop", db: 2, ms: 30 }, source: "test" },
      { id: "unit", from: 2024, to: 2024, match: { engineId: "honda-rbpt-h001" }, glideMs: 45, transient: { kind: "cut", db: -6 }, source: "test" },
      { id: "era", from: 2022, to: 2025, match: {}, glideMs: 40, transient: { kind: "cut", db: -7 }, source: "test" },
    ];
    expect(shiftProfileFor(2024, { manufacturer: "ferrari" }, 15, rows).id).toBe("maker");
    expect(shiftProfileFor(2024, { engineId: "honda-rbpt-h001", manufacturer: "honda-rbpt" }, 15, rows)).toEqual({ id: "unit", glideMs: 45, transient: { kind: "cut", db: -6, ms: 15 } });
    expect(shiftProfileFor(2024, { manufacturer: "mercedes" }, 15, rows).id).toBe("era");
    expect(shiftProfileFor(2023, { manufacturer: "ferrari" }, 15, rows).id).toBe("era");
    expect(shiftProfileFor(2030, {}, 15, rows)).toBeNull();
    // The pack carries the f1db manufacturer through teamEnginesOf.
    const engines = Object.values(teamEnginesOf(packOf(2024)));
    expect(engines.every((engine) => typeof engine.manufacturer === "string")).toBe(true);
  });

  test("the pitch ramps linearly over glideMs; a cut dips and recovers, a pop jumps and settles", () => {
    const spec = engineSpecFor(2024, { formula: "1.6 V6 turbo hybrid" });
    const at = 10;
    const env = shiftEnvelope(spec, { fromHz: 100, toHz: 88 }, at);
    expect(env.frequency).toEqual([[at, 100], [at + spec.shift.glideMs / 1000, 88]]);
    expect(env.gain[0][1]).toBeCloseTo(10 ** (spec.shift.transient.db / 20), 9);
    expect(env.gain[1]).toEqual([at + spec.shift.transient.ms / 1000, 1]);
    // AUD-C12: the seamless profile then rebounds (transient.rebound) and ends at 1.
    const reboundMs = spec.shift.transient.rebound ? spec.shift.transient.rebound.ms : 0;
    expect(env.gain[env.gain.length - 1]).toEqual([at + (spec.shift.transient.ms + reboundMs) / 1000, 1]);
    expect(env.until).toBeCloseTo(at + Math.max(spec.shift.glideMs, spec.shift.transient.ms + reboundMs) / 1000, 9);
    // No previous pitch (a voice just re-pointed): it starts at the target, no swoop from another car.
    expect(shiftEnvelope(spec, { fromHz: null, toHz: 88 }, at).frequency[0]).toEqual([at, 88]);
    const pop = { ...spec, shift: { id: "p", glideMs: 40, transient: { kind: "pop", db: 3, ms: 30 } } };
    expect(shiftCutGain(pop, 0)).toBeGreaterThan(1);
    expect(shiftCutGain(pop, 0.015)).toBeLessThan(shiftCutGain(pop, 0));
    expect(shiftCutGain(pop, 0.03)).toBe(1);
  });
});

describe("downshift blips (downshift-blips, RF-3D-04, RNF-07)", () => {
  const { blipPct, blipMs, minSpacingSec } = audioData.voicing.downshift;

  test("a downshift overshoots the new pitch by blipPct at half blipMs and comes back", () => {
    const spec = engineSpecFor(2024, { formula: "1.6 V6 turbo hybrid" });
    const env = shiftEnvelope(spec, { fromHz: 80, toHz: 92, blip: true }, 5);
    expect(env.frequency[1][0]).toBeCloseTo(5 + blipMs / 2000, 9);
    expect(env.frequency[1][1]).toBeCloseTo(92 * (1 + blipPct), 9);
    expect(env.frequency[2][1]).toBe(92);
    expect(env.gain[1][1]).toBeGreaterThan(1);
    expect(env.gain[env.gain.length - 1][1]).toBe(1);
  });

  test("driveStep: direction from the gear between two poses, blips only down and not closer than real downshifts", () => {
    const spec = engineSpecFor(2024, { formula: "1.6 V6 turbo hybrid" });
    const pose = (gear) => ({ x: 0, y: 0, v: 50, gear, rpm: 10000 });
    let s = driveStep(spec, null, pose(7), 0.1, 0.1);
    s = driveStep(spec, s, pose(8), 0.1, 0.1);
    expect(s.shiftDir).toBe(1);
    expect(s.blip).toBe(false);
    s = driveStep(spec, s, pose(7), 0.1, 0.1);
    expect(s.shiftDir).toBe(-1);
    expect(s.blip).toBe(true);
    // Another downshift sooner than minSpacingSec: no second blip.
    const soon = minSpacingSec / 2;
    s = driveStep(spec, s, pose(6), soon, soon);
    expect(s.shiftDir).toBe(-1);
    expect(s.blip).toBe(false);
    s = driveStep(spec, s, pose(5), minSpacingSec, minSpacingSec);
    expect(s.blip).toBe(true);
  });

  test("the same poses give the same blips (RF-SIM-15, RNF-05)", () => {
    const spec = engineSpecFor(2012, { formula: "2.4 V8" });
    const run = () => {
      let s = null;
      const out = [];
      for (let i = 0; i < 300; i += 1) {
        const v = (320 - Math.abs(150 - i) * 1.8) / 3.6;
        s = driveStep(spec, s, { x: 0, y: 0, v }, 0.1, 0.1);
        out.push(`${s.gear}${s.blip ? "*" : ""}`);
      }
      return out.join(",");
    };
    expect(run()).toBe(run());
    // Braking from the top back to a hairpin goes down the box, with blips.
    expect(run()).toMatch(/\*/);
    expect(run().split(",").pop()).toMatch(/^[1-3]/);
  });
});

describe("pit limiter tone (pit-limiter-tone, RF-3D-04, RF-SIM-12, RNF-07, SRS 6.2)", () => {
  const spec2024 = engineSpecFor(2024, { formula: "1.6 V6 turbo hybrid" });

  test("the limit comes from the rules (era-defaults/pack): 80 km/h in 2024, 60 at Monaco, none before 1994", () => {
    expect(spec2024.pitLimiter.kmh).toBe(80);
    expect(engineSpecFor(2024, { formula: "1.6 V6 turbo hybrid" }, { circuitId: "monaco" }).pitLimiter.kmh).toBe(60);
    expect(pitLimiterFor(1990).kmh).toBeNull();
    expect(pitLimiterFor(2005).kmh).toBe(100);
  });

  test("the fixed pit gear comes from race-powertrain.json eras[].pitLimiter when it exists (PT-1 contract)", () => {
    expect(pitLimiterFor(2024, {}, { eras: [{ from: 2022, to: 2025, pitLimiter: { gear: 2, rpm: 7000 } }] }).gear).toBe(2);
    expect(pitLimiterFor(2024, {}, { eras: [{ from: 2022, to: 2025 }] }).gear).toBeNull();
    const fixed = { ...spec2024, pitLimiter: { kmh: 80, gear: 2 } };
    const s = driveStep(fixed, null, { x: 0, y: 0, v: 80 / 3.6, pitPhase: "LIMITER" }, 0.1, 0.1);
    expect(s.gear).toBe(2);
    expect(s.rpm).toBeCloseTo(rpmInGear(fixed, 2, 80, fixed.refTopKmh), 6);
    // pose.gear (the engine's own powertrain) wins over everything.
    const own = driveStep(fixed, null, { x: 0, y: 0, v: 80 / 3.6, pitPhase: "LIMITER", gear: 3 }, 0.1, 0.1);
    expect(own.gear).toBe(3);
  });

  test("flat tone: the same rpm all along the lane, whatever the speed jitter and the gear the car came in", () => {
    const along = (startGear) => {
      let s = { gear: startGear, rpm: 9000, v: 80 / 3.6, load: 0, turbo: 0, topKmh: spec2024.refTopKmh, x: null, y: null, shiftAt: -1 };
      const rpms = [];
      for (let i = 0; i < 40; i += 1) {
        const kmh = 80 * (1 + 0.03 * Math.sin(i));
        s = driveStep(spec2024, s, { x: 0, y: 0, v: kmh / 3.6, pitPhase: "LIMITER" }, 0.1, 0.1);
        rpms.push(s.rpm);
      }
      return rpms;
    };
    const entry = along(8);
    const exit = along(1);
    expect(Math.max(...entry) - Math.min(...entry)).toBe(0);
    expect(entry[entry.length - 1]).toBe(exit[exit.length - 1]);
  });

  test("no audible modulation: flutter depth ≈ 0 and far below the rev limiter's bounce", () => {
    const { flutterDepth } = audioData.voicing.pitLimiter;
    expect(flutterDepth).toBeLessThanOrEqual(0.02);
    expect(limiterDepthOf({ pitLimiter: true, limiter: false })).toBe(flutterDepth);
    expect(limiterDepthOf({ pitLimiter: false, limiter: true })).toBe(audioData.voicing.limiterDepth);
    expect(limiterDepthOf({ pitLimiter: false, limiter: false })).toBe(0);
    expect(20 * Math.log10(1 - flutterDepth)).toBeGreaterThan(-0.2);
  });

  test("a circuit exception the view was not told about: hold the speed the car entered at", () => {
    expect(pitHoldKmh(80, 79)).toBe(80);
    expect(pitHoldKmh(80, 60)).toBe(60);
    expect(pitHoldKmh(80, NaN)).toBe(80);
  });

  test("before pit-lane limits (SRS 6.2) there is no limiter tone; leaving the limiter hands back to the gearbox", () => {
    const spec = engineSpecFor(1990, { formula: "3.5 V10" });
    const s = driveStep(spec, null, { x: 0, y: 0, v: 120 / 3.6, pitPhase: "LIMITER" }, 0.1, 0.1);
    expect(s.pitLimiter).toBe(false);
    expect(limiterDepthOf(s)).toBe(0);
    const inLane = driveStep(spec2024, null, { x: 0, y: 0, v: 80 / 3.6, pitPhase: "LIMITER" }, 0.1, 0.1);
    const out = driveStep(spec2024, inLane, { x: 0, y: 0, v: 90 / 3.6, pitPhase: "EXIT_ROAD" }, 0.1, 0.1);
    expect(out.pitLimiter).toBe(false);
    expect(out.pitKmh).toBeNull();
  });

  test("the synth no longer holds a pit gear of its own (§1.5)", () => {
    expect(audioData.voicing.pitLimiterGear).toBeUndefined();
    expect(fs.readFileSync(path.join(__dirname, "engineSynth.js"), "utf8")).not.toMatch(/pitLimiterGear/);
  });
});

describe("engine voice automation (mocked Web Audio)", () => {
  class RecordingContext extends FakeContext {
    constructor() {
      super();
      this.oscs = [];
    }

    createOscillator() {
      const osc = super.createOscillator();
      this.oscs.push(osc);
      return osc;
    }
  }

  test("a gear change schedules the glide ramp; the pit limiter runs the flat flutter, not the bounce", () => {
    const ctx = new RecordingContext();
    const voice = createEngineVoice(ctx, ctx.createBuffer(1, 8), null);
    const spec = engineSpecFor(2024, { formula: "1.6 V6 turbo hybrid" });
    voice.assign(spec);
    const [osc] = ctx.oscs;
    const lfo = ctx.oscs[ctx.oscs.length - 1];
    const mix = (time) => ({ gain: 1, doppler: 1, interior: 0, lowpassHz: 12000, time, crackle: 0 });
    voice.update({ gear: 7, rpm: 11800, load: 1, shifted: false }, mix(1));
    voice.update({ gear: 8, rpm: 10600, load: 1, shifted: true, blip: false }, mix(1.1));
    expect(osc.frequency.setValueAtTime).toHaveBeenCalledWith(cycleFrequency(11800), 1.1);
    expect(osc.frequency.linearRampToValueAtTime).toHaveBeenCalledWith(cycleFrequency(10600), 1.1 + spec.shift.glideMs / 1000);
    // During the glide the smoothing does not overwrite the ramp.
    osc.frequency.setTargetAtTime.mockClear();
    voice.update({ gear: 8, rpm: 10650, load: 1, shifted: false }, mix(1.1 + spec.shift.glideMs / 2000));
    expect(osc.frequency.setTargetAtTime).not.toHaveBeenCalled();
    voice.update({ gear: 2, rpm: 7000, load: 0.4, shifted: false, pitLimiter: true }, mix(3));
    expect(lfo.frequency.setTargetAtTime).toHaveBeenLastCalledWith(audioData.voicing.pitLimiter.flutterHz, 3, audioData.voicing.smoothingSec);
    voice.update({ gear: 8, rpm: 15000, load: 1, shifted: false, limiter: true }, mix(4));
    expect(lfo.frequency.setTargetAtTime).toHaveBeenLastCalledWith(audioData.voicing.limiterHz, 4, audioData.voicing.smoothingSec);
    voice.stop();
  });
});

// ------------------------------------------------------------------ AUD-2: mix per view, field bed, kerbs and wind

describe("mix per view (mix-snapshots-per-view, RF-3D-04, RNF-02, RNF-07, RNF-09)", () => {
  test("the view: the screen's own, paused while stopped, the map camera's; live cameras keep their mix", () => {
    expect(resolveView({ view: "replay", mode: "tcam" })).toBe("replay");
    expect(resolveView({ view: "menu", playing: false, mode: "tv" })).toBe("menu");
    expect(resolveView({ playing: false, mode: "tv" })).toBe("paused");
    expect(resolveView({ mode: "map" })).toBe("map");
    expect(resolveView({ mode: "tv" })).toBeNull();
    expect(resolveView({ view: "no-such-view", mode: "chase" })).toBeNull();
    ["map", "paused", "replay", "menu"].forEach((name) => expect(audioData.mixer.views.snapshots[name]).toBeDefined());
    // A snapshot only overrides what it names: the replay keeps the onboard's own shares.
    const replay = viewMix("tcam", "replay");
    expect(replay.focus).toBe(cameraMix("tcam").focus);
    expect(replay.engineDb).toBe(audioData.mixer.views.snapshots.replay.engineDb);
    expect(viewMix("tv", null)).toMatchObject({ engineDb: 0, bedDb: 0, view: null });
  });

  test("a cut crossfades: from the old mix at 0, the new at 1, between in between (lowpass in log)", () => {
    const a = viewMix("tv");
    const b = viewMix("tcam");
    expect(blendMix(null, b, 0)).toBe(b);
    expect(blendMix(a, b, 0).focus).toBeCloseTo(a.focus, 9);
    expect(blendMix(a, b, 1)).toBe(b);
    const half = blendMix(a, b, 0.5);
    expect(half.crowd).toBeCloseTo((a.crowd + b.crowd) / 2, 9);
    expect(half.lowpassHz).toBeCloseTo(Math.sqrt(a.lowpassHz * b.lowpassHz), 6);
    expect(half.listener).toBe(b.listener);
  });

  test("the TV ear is the camera on air: three.js (x, height, z) to the mixer's (x, y, up), height over the target", () => {
    const tv = viewMix("tv");
    const camera = { id: "t3", kind: "tower", mode: "tv", position: { x: 120, y: 58, z: -40 }, target: { x: 0, y: 50, z: 0 } };
    expect(cameraUsable(camera, "tv", tv)).toBe(true);
    expect(cameraUsable({ ...camera, mode: "chase" }, "tv", tv)).toBe(false); // left over from another camera
    expect(cameraUsable(camera, "tcam", viewMix("tcam"))).toBe(false); // onboards ride with the car
    expect(cameraUsable(null, "tv", tv)).toBe(false);
    const ear = cameraListener(camera);
    expect(ear).toMatchObject({ x: 120, y: -40, vx: 0, vy: 0, id: "t3" });
    expect(ear.z).toBeCloseTo(8 + audioData.mixer.views.cameraListener.sourceUpM, 9); // the circuit's altitude does not count
    // Same camera panning along: a velocity; a cut: a still ear.
    const next = cameraListener({ ...camera, position: { x: 130, y: 58, z: -40 } }, ear, 0.5);
    expect(next.vx).toBeCloseTo(20, 9);
    const cut = cameraListener({ ...camera, id: "t4", position: { x: 400, y: 58, z: -40 } }, ear, 0.5);
    expect(cut.vx).toBe(0);
    const flung = cameraListener({ ...camera, position: { x: 2000, y: 58, z: -40 } }, ear, 0.1);
    expect(Math.hypot(flung.vx, flung.vy)).toBeCloseTo(audioData.mixer.views.cameraListener.maxSpeed, 6);
  });

  // §2.1 (reference video, conf. A): only the relations between views are the target, never the game's dBFS.
  const field = (n = 20) => Array.from({ length: n }, (_, i) => ({ id: `c${i}`, x: -i * 45, y: (i % 2) * 3, heading: 0, v: 70, firingHz: 1000 }));
  const farTv = { id: "t9", kind: "tower", mode: "tv", position: { x: 0, y: 8, z: 150 }, target: { x: 0, y: 0.5, z: 0 } };
  const level = (scene) => mixLevels({ focusId: "c0", cars: field(), kmh: 250, ...scene }).totalDb;

  // AUD-C4 (F1M24-CHINA §2.7): the daytime reference puts onboard 8 dB over TV (14 at night in Bahrain,
  // the 12-15 dB of F1M24-GAMEPLAY §2.1); with the track bed the target is now 8-12 dB.
  test("offline mix: onboard 8-12 dB over the far TV camera (AUD-C4), the map at least 15 dB under TV", () => {
    const onboard = level({ mode: "tcam" });
    const tv = level({ mode: "tv", camera: farTv });
    const map = level({ mode: "map" });
    expect(onboard - tv).toBeGreaterThanOrEqual(8);
    expect(onboard - tv).toBeLessThanOrEqual(12);
    expect(tv - map).toBeGreaterThanOrEqual(15);
  });

  test("offline mix: pause and menus drop the engines to a low bed; the replay sounds like its camera, a little lower", () => {
    const onboard = level({ mode: "tcam" });
    const map = level({ mode: "map" });
    const paused = mixLevels({ focusId: "c0", cars: field(), mode: "tcam", playing: false, kmh: 250 });
    const menu = mixLevels({ focusId: "c0", cars: field(), mode: "tv", view: "menu", camera: farTv, kmh: 250 });
    expect(paused.view).toBe("paused");
    expect(paused.engineDb).toBeLessThan(-60);
    expect(menu.engineDb).toBeLessThan(-60);
    expect(paused.totalDb).toBeLessThan(map);
    expect(menu.totalDb).toBeLessThan(map);
    const replay = level({ mode: "tcam", view: "replay" });
    expect(onboard - replay).toBeGreaterThan(0);
    expect(onboard - replay).toBeLessThanOrEqual(6);
  });

  test("offline mix: the TV ear on the real camera is loud when that camera is close; the post still works without one", () => {
    const near = { ...farTv, position: { x: 10, y: 3, z: 15 } };
    expect(level({ mode: "tv", camera: near })).toBeGreaterThan(level({ mode: "tv", camera: farTv }) + 6);
    expect(Number.isFinite(level({ mode: "tv" }))).toBe(true);
  });
});

describe("field bed (field-bed-start, RF-3D-04, RNF-02, RNF-07)", () => {
  const ear = { x: 0, y: 0, z: 1 };
  const pack = (n, spacing) => Array.from({ length: n }, (_, i) => ({ id: `c${i}`, x: 20 + i * spacing, y: 0, firingHz: 900 + i * 10 }));
  test("louder with more cars near and none of the voiced ones; silent with nobody near", () => {
    const bed = audioData.ambience.fieldBed;
    const voiced = ["c0", "c1", "c2", "c3", "c4", "c5"];
    const grid = fieldBedOf(pack(22, 8), ear, voiced);
    const strung = fieldBedOf(pack(22, 120), ear, voiced);
    expect(grid.level).toBeGreaterThan(strung.level * 2);
    expect(grid.cars).toBe(16);
    expect(grid.level).toBeLessThanOrEqual(bed.maxLevel);
    expect(fieldBedOf(pack(6, 8), ear, voiced).level).toBe(0);
    expect(fieldBedOf(pack(3, bed.nearbyMetres), { x: -bed.nearbyMetres * 2, y: 0 }, []).level).toBe(0);
    expect(grid.hz).toBeGreaterThanOrEqual(bed.minHz);
    expect(grid.hz).toBeLessThanOrEqual(bed.maxHz);
    expect(fieldBedOf(pack(22, 8).map((car) => ({ ...car, gone: true })), ear, []).level).toBe(0);
  });

  test("the start is the loudest track mix: the whole pack together over the same cars strung out", () => {
    const grid = Array.from({ length: 22 }, (_, i) => ({ id: `c${i}`, x: -Math.floor(i / 2) * 8, y: (i % 2 ? -1 : 1) * 2.6, heading: 0, v: 20, firingHz: 600 }));
    const strung = grid.map((car, i) => ({ ...car, x: -i * 180 }));
    const camera = { id: "g", mode: "tv", position: { x: 30, y: 6, z: 20 }, target: { x: 0, y: 0.5, z: 0 } };
    const start = mixLevels({ mode: "tv", focusId: "c0", cars: grid, camera });
    const later = mixLevels({ mode: "tv", focusId: "c0", cars: strung, camera });
    expect(start.engineDb).toBeGreaterThan(later.engineDb + 3);
  });
});

describe("kerbs and wind (kerbs-wind, RF-3D-03, RF-3D-04, RNF-07)", () => {
  test("wind reaches 8 kHz at full speed (the 2-8 kHz band on board)", () => {
    expect(audioData.ambience.wind.highHz).toBe(8000);
    expect(windOf(audioData.ambience.wind.fullKmh, 1).hz).toBe(8000);
  });

  test("every kerbs.json passes its schema and matches its calibrated spline", () => {
    const validate = new Ajv({ allErrors: true, strict: true }).compile(kerbsSchema);
    const files = Object.values(KERB_FILES);
    expect(files.length).toBe(Object.keys(splinesData.splines).length);
    files.forEach((data) => {
      expect(validate(data) ? null : validate.errors).toBeNull();
      const spline = splinesData.splines[data.splineId];
      expect(spline).toBeDefined();
      expect(Math.abs(data.lengthM - spline.lengthM) / spline.lengthM).toBeLessThan(0.01);
      data.kerbs.forEach((kerb) => {
        expect(kerb.fromM).toBeLessThan(data.lengthM + 1);
        expect(kerb.toM).toBeLessThanOrEqual(data.lengthM + 2);
      });
      expect(data.kerbs.length).toBeGreaterThan(5);
    });
  });

  test("on a kerb inside a zone and near that side's edge; the sign is splines.json's (+ = right)", () => {
    const zones = kerbZonesFor({ splineId: "x" }, { x: { splineId: "x", lengthM: 1000, kerbs: [{ fromM: 100, toM: 140, side: "right", edgeM: 6 }, { fromM: 980, toM: 20, side: "left", edgeM: 5 }] } });
    expect(zones).toHaveLength(2);
    const reach = audioData.ambience.kerb.reachM;
    expect(onKerb(zones, 3.12, 6 - reach + 0.1, reach)).toBe(true); // lap 3, 120 m, on the right edge
    expect(onKerb(zones, 3.12, -(6 - reach + 0.1), reach)).toBe(false); // wrong side
    expect(onKerb(zones, 3.12, 0, reach)).toBe(false); // mid track
    expect(onKerb(zones, 3.2, 6, reach)).toBe(false); // outside the zone
    expect(onKerb(zones, 4.005, -5, reach)).toBe(true); // across the line, left
    expect(onKerb(zones, 4.005, undefined, reach)).toBe(false); // quick mode: no lateral
    expect(kerbZonesFor({ id: "procedural" })).toEqual([]);
    expect(kerbZonesFor(null)).toEqual([]);
    expect(kerbZonesFor({ id: "spline:bahrain-1" }).length).toBe(KERB_FILES["bahrain-1"].kerbs.length);
  });

  test("the rumble follows the speed over the bumps and is silent off the kerb or slow", () => {
    const kerb = audioData.ambience.kerb;
    expect(kerbRumble(200, false).gain).toBe(0);
    expect(kerbRumble(kerb.minKmh - 1, true).gain).toBe(0);
    const fast = kerbRumble(200, true);
    expect(fast.gain).toBe(kerb.gain);
    expect(fast.hz).toBeCloseTo(200 / 3.6 / kerb.stripeM, 6);
    expect(kerbRumble(120, true).hz).toBeLessThan(fast.hz);
    // AUD-C8: measured on the mesh (Shanghai, extract_kerbs.py v2); before, pending.
    expect(kerb.stripeStatus).toBe("measured");
  });
});

describe("AUD-2 controller (mocked Web Audio)", () => {
  afterEach(() => {
    delete window.AudioContext;
  });

  test("camera bus, views, cuts and the kerb in a 22-car race stay cheap (RNF-02)", () => {
    window.AudioContext = FakeContext;
    const cameraBus = { current: null };
    const data = KERB_FILES["bahrain-1"];
    const kerb = data.kerbs.find((k) => k.side === "right");
    const share = (kerb.fromM + 1) / data.lengthM;
    const audio = createRaceAudio({ seed: "aud2", year: 2012, cameraBus, circuit: { splineId: "bahrain-1" } });
    expect(audio.start()).toBe(true);
    const cars = Array.from({ length: 22 }, (_, i) => ({ id: `c${i}`, teamId: "t", pose: { x: -i * 10, y: 0, heading: 0, v: 60, progress: 2 + share, lateral: i === 0 ? kerb.edgeM : 0 } }));
    const begin = process.hrtime.bigint();
    for (let f = 0; f < 300; f += 1) {
      cameraBus.current = { id: f < 150 ? "t1" : "t2", kind: "tower", mode: "tv", position: { x: 77 + f, y: 9, z: -33 }, target: { x: 0, y: 0.5, z: 0 } };
      const view = f < 100 ? null : f < 200 ? "replay" : "menu";
      audio.frame({ tau: f / 10, playing: f < 250, mode: f % 50 < 40 ? "tv" : "map", focusId: "c0", cars, view });
    }
    const ms = Number(process.hrtime.bigint() - begin) / 1e6;
    expect(ms / 300).toBeLessThan(2);
    audio.dispose();
  });

  test("the listener sits on the camera on air in TV and on the virtual post without one", () => {
    let made = null;
    class Spy extends FakeContext {
      constructor() {
        super();
        made = this;
      }
    }
    window.AudioContext = Spy;
    const cars = [{ id: "c0", teamId: "t", pose: { x: 0, y: 0, heading: 0, v: 60 } }];
    const withCamera = createRaceAudio({ seed: "aud2", year: 2012 });
    withCamera.start();
    withCamera.frame({ tau: 0, mode: "tv", focusId: "c0", cars, camera: { id: "t1", mode: "tv", position: { x: 1234, y: 9, z: -33 }, target: { x: 0, y: 0, z: 0 } } });
    expect(made.listener.positionX.setTargetAtTime).toHaveBeenLastCalledWith(1234, expect.any(Number), expect.any(Number));
    expect(made.listener.positionZ.setTargetAtTime).toHaveBeenLastCalledWith(-33, expect.any(Number), expect.any(Number));
    expect(made.delays).toBe(audioData.ambience.fieldBed.combs.length);
    withCamera.dispose();
    const post = createRaceAudio({ seed: "aud2", year: 2012 });
    post.start();
    post.frame({ tau: 0, mode: "tv", focusId: "c0", cars });
    expect(made.listener.positionX.setTargetAtTime).toHaveBeenLastCalledWith(audioData.mixer.cameras.mix.tv.ahead, expect.any(Number), expect.any(Number));
    post.dispose();
  });
});

// ------------------------------------------------------------------ AUD-3: start lights and grid revs

describe("start lights (start-lights-sound-and-timing, RF-SIM-10, RF-SIM-15, RNF-05, RNF-07)", () => {
  const LIGHTS = audioData.ambience.startLights;
  const GRID = audioData.ambience.gridRevs;

  test("one hit per light that comes on; none without snapshot.start, on first sight, on a skip or at lights out", () => {
    expect(startLightsStep(null, null)).toEqual({ seen: null, hits: [] });
    expect(startLightsStep(3, undefined)).toEqual({ seen: null, hits: [] });
    let step = startLightsStep(null, { phase: "grid", lights: 0, t: 0 });
    expect(step).toEqual({ seen: 0, hits: [] });
    const heard = [];
    for (let n = 1; n <= 5; n += 1) {
      step = startLightsStep(step.seen, { phase: "lights", lights: n, t: n });
      heard.push(...step.hits);
      // The same light on the next frame does not sound again.
      step = startLightsStep(step.seen, { phase: "lights", lights: n, t: n + 0.1 });
      expect(step.hits).toEqual([]);
    }
    expect(heard).toEqual([1, 2, 3, 4, 5]);
    expect(startLightsStep(5, { phase: "out", lights: 0, t: 7 }).hits).toEqual([]);
    // Sound turned on mid-sequence: the lights already lit are not replayed.
    expect(startLightsStep(null, { phase: "lights", lights: 3, t: 3 })).toEqual({ seen: 3, hits: [] });
    expect(startLightsStep(1, { phase: "lights", lights: 4, t: 4 }, { reset: true }).hits).toEqual([]);
    // At high speed several lights in one frame: each still sounds.
    expect(startLightsStep(2, { phase: "lights", lights: 5, t: 5 }).hits).toEqual([3, 4, 5]);
    expect(startLightsStep(4, { phase: "lights", lights: 9, t: 5 }).hits).toEqual([5]);
    expect(LIGHTS.maxLights).toBe(5);
  });

  test("grid revs: idle on the grid, rise from the first light to a hold inside the OpenF1 2023-2024 range", () => {
    const spec = engineSpecFor(2024, { formula: "1.6 V6 turbo hybrid" });
    const entry = gridRevsFor(2024);
    expect(entry.status).toBe("sourced");
    expect(audioData.sources[entry.source]).toMatch(/api\.openf1\.org/);
    expect(gridRevsOf(spec, null, 0)).toBeNull();
    expect(gridRevsOf(spec, { phase: "out", lights: 0 }, 1)).toBeNull();
    expect(gridRevsOf(spec, { phase: "formation", lights: 0 }, 1)).toBeNull();
    [0, 0.5, 1].forEach((share) => {
      const pick = { idle: share, hold: share };
      const idle = gridRevsOf(spec, { phase: "grid", lights: 0 }, -1, pick);
      expect(idle.rpm).toBeGreaterThanOrEqual(entry.idleRpm[0]);
      expect(idle.rpm).toBeLessThanOrEqual(entry.idleRpm[1]);
      expect(idle.load).toBe(0);
      const before = gridRevsOf(spec, { phase: "lights", lights: GRID.fromLight - 1 }, -1, pick);
      expect(before.rpm).toBeCloseTo(idle.rpm, 6);
      const mid = gridRevsOf(spec, { phase: "lights", lights: GRID.fromLight }, entry.riseSec / 2, pick);
      const held = gridRevsOf(spec, { phase: "lights", lights: 5 }, entry.riseSec * 3, pick);
      expect(mid.rpm).toBeGreaterThan(idle.rpm);
      expect(mid.rpm).toBeLessThan(held.rpm);
      expect(held.rpm).toBeGreaterThanOrEqual(entry.holdRpm[0]);
      expect(held.rpm).toBeLessThanOrEqual(Math.min(entry.holdRpm[1], spec.revLimit));
      expect(held.load).toBeCloseTo(entry.holdLoad, 6);
    });
  });

  test("era coherence (SRS §6): only measured years use the measured ranges; the others keep their era's own rpm", () => {
    GRID.byEra.forEach((entry) => {
      expect(entry.from).toBeGreaterThanOrEqual(2023); // OpenF1 car_data starts in 2023
      expect(entry.idleRpm[0]).toBeLessThan(entry.idleRpm[1]);
      expect(entry.holdRpm[0]).toBeLessThan(entry.holdRpm[1]);
      expect(entry.holdRpm[1]).toBeLessThanOrEqual(engineSpecFor(entry.from, { formula: "1.6 V6 turbo hybrid" }).revLimit);
    });
    expect(GRID.fallback.status).toBe("pending");
    [1976, 1988, 2005, 2012, 2018, 2026].forEach((year) => {
      expect(gridRevsFor(year)).toBeNull();
      const spec = engineSpecFor(year);
      expect(gridRevsOf(spec, { phase: "grid", lights: 0 }, -1).rpm).toBe(spec.idleRpm);
      expect(gridRevsOf(spec, { phase: "lights", lights: 5 }, 10).rpm).toBeCloseTo(spec.launchRpm, 6);
    });
  });

  class LightsContext extends FakeContext {
    constructor() {
      super();
      this.oscs = [];
      LightsContext.last = this;
    }

    createOscillator() {
      const osc = super.createOscillator();
      this.oscs.push(osc);
      return osc;
    }
  }
  const thumps = (ctx) => ctx.oscs.filter((osc) => osc.frequency.setValueAtTime.mock.calls.some(([hz]) => hz === LIGHTS.thump.hz)).length;
  const grid = (year) => {
    const teams = Object.keys(teamEnginesOf(packOf(year)));
    return Array.from({ length: 20 }, (_, i) => ({ id: `c${i}`, teamId: teams[i % teams.length], pose: { x: -8 * i, y: i % 2 ? 4 : -4, heading: 0, v: 0 } }));
  };
  // Grid, then lights 1..5 a second apart, then out after a hold: 0.1 s frames.
  const startAt = (tau) => (tau < 2 ? { phase: "grid", lights: 0, t: tau } : tau < 7 ? { phase: "lights", lights: Math.floor(tau - 2) + 1, t: tau } : tau < 8.4 ? { phase: "lights", lights: 5, t: tau } : { phase: "out", lights: 0, t: tau });
  const run = (year, { withStart = true, playing = true, omit = false } = {}) => {
    window.AudioContext = LightsContext;
    const audio = createRaceAudio({ seed: "aud3", year, engines: teamEnginesOf(packOf(year)) });
    audio.start();
    const ctx = LightsContext.last;
    const cars = grid(year);
    for (let f = 0; f < 90; f += 1) {
      const tau = f / 10;
      ctx.currentTime = tau;
      const frame = { tau, playing, mode: "tv", focusId: "c0", cars, started: false };
      if (!omit) frame.start = withStart ? startAt(tau) : null;
      audio.frame(frame);
    }
    audio.dispose();
    return ctx;
  };
  afterEach(() => {
    delete window.AudioContext;
  });

  test("five lights sound five thumps and tones; lights out is silent; nothing at all without snapshot.start", () => {
    const ctx = run(2024);
    expect(thumps(ctx)).toBe(5);
    const tones = ctx.oscs.filter((osc) => osc.frequency.setValueAtTime.mock.calls.some(([hz]) => hz === LIGHTS.tone.hz));
    expect(tones.length).toBe(5);
    expect(thumps(run(2024, { withStart: false }))).toBe(0);
    expect(thumps(run(2024, { omit: true }))).toBe(0);
    // Paused: the lights do not sound (the clock is stopped, nothing is live).
    expect(thumps(run(2024, { playing: false }))).toBe(0);
  });

  test("absent snapshot.start keeps today's sound; the same seed gives the same grid (RF-SIM-15, RNF-05)", () => {
    const calls = (ctx) => JSON.stringify(ctx.oscs.map((osc) => osc.frequency.setTargetAtTime.mock.calls));
    expect(calls(run(2024, { withStart: false }))).toBe(calls(run(2024, { omit: true })));
    const a = calls(run(2024));
    expect(calls(run(2024))).toBe(a);
    expect(a).not.toBe(calls(run(2024, { withStart: false })));
  });
});

// ------------------------------------------------------------------ AUD-C-1: licences, fast forward and cuts (F1M24-CHINA §2.6, §2.7)

const VIEWS_CFG = audioData.mixer.views;
const FF_CFG = VIEWS_CFG.fastForward;
const CUT_CFG = VIEWS_CFG.cut;
const toDbOf = (gain) => 20 * Math.log10(Math.max(gain, 1e-9));

/**
 * The engine bus trim as the live graph moves it: one view frame every `frameMs`, the blended
 * target set with setTargetAtTime(tau) (exact one-pole between frames), from `fromMix` to
 * `toMix` through `transition`. Returns [{ ms, db }].
 */
const trimTrace = (fromMix, toMix, transition, { frameMs = 1000 / 60, totalMs = 2000 } = {}) => {
  let gain = dbToGain(fromMix.engineDb);
  let target = gain;
  const out = [];
  // Read the gain every millisecond; the target only moves on a view frame.
  for (let ms = 0; ms <= totalMs; ms += 1) {
    if (ms % frameMs < 1) {
      const step = transitionAt(transition, ms);
      target = dbToGain(blendMix(fromMix, toMix, step.k).engineDb + step.db);
    }
    out.push({ ms, db: toDbOf(gain) });
    gain += (target - gain) * (1 - Math.exp(-1 / 1000 / transition.tauSec));
  }
  return out;
};

/** A FakeContext that keeps every gain node it makes (to read what the buses were set to). */
const gainSpy = () => {
  const box = { made: null };
  class Spy extends FakeContext {
    constructor() {
      super();
      box.made = this;
      this.gains = [];
    }
    createGain() {
      const gain = super.createGain();
      this.gains.push(gain);
      return gain;
    }
  }
  box.Spy = Spy;
  return box;
};

describe("AUD-C10 recorded engines off by default (SRS 3.3, 7.3; F1M24-CHINA §1.4 rule 6)", () => {
  test("defaults: synthesised (recorded false, samples off) while any bank is riskRipped or has no licence", () => {
    expect(audioData.mixer.defaults.recorded).toBe(false);
    expect(audioData.samples.enabledByDefault).toBe(false);
    expect(loadSettings(null).recorded).toBe(false);
  });

  test("a mix saved before settingsVersion keeps its volumes but not the old default recorded: true", () => {
    const store = new Map();
    const fake = { getItem: (key) => (store.has(key) ? store.get(key) : null), setItem: (key, value) => store.set(key, value) };
    store.set(audioData.mixer.storageKey, JSON.stringify({ master: 0.4, engine: 0.5, ambience: 0.2, muted: false, recorded: true }));
    expect(loadSettings(fake)).toMatchObject({ master: 0.4, engine: 0.5, recorded: false });
    // The viewer's own choice, saved now, is kept.
    saveSettings({ ...loadSettings(fake), recorded: true }, fake);
    expect(settingsCurrent(JSON.parse(store.get(audioData.mixer.storageKey)))).toBe(true);
    expect(loadSettings(fake).recorded).toBe(true);
  });
});

describe("AUD-C1 fast forward (RF-CMD-04, RF-3D-04, RNF-02, RNF-07)", () => {
  afterEach(() => {
    delete window.AudioContext;
  });

  test("the view follows the speed at any camera; screen views and the pause come first; no speed is x1", () => {
    expect(resolveView({ speed: 8 })).toBe("fastForward");
    expect(resolveView({ speed: FF_CFG.minSpeed, mode: "tcam" })).toBe("fastForward");
    expect(resolveView({ speed: 8, mode: "map" })).toBe("fastForward");
    expect(resolveView({ speed: 2, mode: "tv" })).toBeNull();
    expect(resolveView({ mode: "tv" })).toBeNull();
    expect(resolveView({ speed: 16, playing: false })).toBe("paused");
    expect(resolveView({ speed: 16, view: "replay" })).toBe("replay");
    expect(fastForwardOn(undefined)).toBe(false);
    expect(fastForwardOn(null)).toBe(false);
  });

  test("onboard is at least 15 dB over the fast-forward mix; the voices are silent and the bed takes their place", () => {
    const cars = Array.from({ length: 20 }, (_, i) => ({ id: `c${i}`, x: -i * 45, y: (i % 2) * 3, heading: 0, v: 70, firingHz: 1000 }));
    const onboard = mixLevels({ mode: "tcam", focusId: "c0", cars, kmh: 250 });
    const ff = mixLevels({ mode: "tcam", focusId: "c0", cars, kmh: 250, speed: 8 });
    expect(ff.view).toBe("fastForward");
    expect(onboard.totalDb - ff.totalDb).toBeGreaterThanOrEqual(15);
    const mix = viewMix("tcam", "fastForward");
    expect(mix.focus).toBe(0);
    expect(mix.field).toBe(0);
    expect(fastForwardBedLevel(mix)).toBeGreaterThan(0);
    expect(fastForwardBedLevel(viewMix("tcam"))).toBe(0);
  });

  test("asymmetric fades: -18 dB within 60 ms going in; at least 600 ms to come back", () => {
    const onboard = viewMix("tcam");
    const ff = viewMix("tcam", "fastForward");
    const into = trimTrace(onboard, ff, viewTransition(null, "fastForward"));
    const down = into.find((point) => point.db <= -18);
    expect(down).toBeDefined();
    expect(down.ms).toBeLessThanOrEqual(60);
    const back = viewTransition("fastForward", null);
    expect(back).toMatchObject({ holdMs: FF_CFG.holdMs, ms: FF_CFG.releaseMs });
    const out = trimTrace(ff, onboard, back);
    const up = out.find((point) => point.db >= -3);
    expect(up).toBeDefined();
    expect(up.ms).toBeGreaterThanOrEqual(600);
    // Flat during the hold.
    out.filter((point) => point.ms <= FF_CFG.holdMs).forEach((point) => expect(point.db).toBeLessThanOrEqual(ff.engineDb + 0.5));
  });

  test("the ui bus (radio, alerts, clicks) is untouched by the view: no trim on it, only the engine, ambience and bed", () => {
    const ctx = new FakeContext();
    const mixer = createMixer(ctx);
    const before = mixer.ui.gain.setTargetAtTime.mock.calls.length;
    mixer.applyView(viewMix("tcam", "fastForward"), 0, viewTransition(null, "fastForward"));
    mixer.applyView(viewMix("tv"), 1, { extraDb: CUT_CFG.gapDb });
    expect(mixer.ui.gain.setTargetAtTime.mock.calls.length).toBe(before);
    expect(mixer.fastForward.gain.setTargetAtTime).toHaveBeenCalledWith(1, 0, FF_CFG.attackTauMs / 1000);
    expect(Object.keys(viewMix("tv", "fastForward"))).not.toContain("ui");
  });

  test("the bed: two reads of the seeded noise, decorrelated in time, to the left and the right; fixed pitch", () => {
    const ctx = new FakeContext();
    const sources = [];
    const make = ctx.createBufferSource.bind(ctx);
    ctx.createBufferSource = () => {
      const src = make();
      sources.push(src);
      return src;
    };
    const noise = { duration: 2 };
    const bus = node();
    const bed = createFastForwardBed(ctx, bus, noise);
    expect(sources).toHaveLength(2);
    expect(sources[0].start).toHaveBeenCalledWith(0, 0);
    expect(sources[1].start).toHaveBeenCalledWith(0, FF_CFG.bed.decorrelateSec);
    expect(createFastForwardBed(ctx, bus, noise, null)).toBeNull();
    expect(() => bed.stop()).not.toThrow();
  });

  test("controller: x8 frames raise the bed; the same frames at x1 never do", () => {
    const spy = gainSpy();
    window.AudioContext = spy.Spy;
    const cars = Array.from({ length: 6 }, (_, i) => ({ id: `c${i}`, teamId: "t", pose: { x: -i * 12, y: 0, heading: 0, v: 70 } }));
    const run = (speed) => {
      const audio = createRaceAudio({ seed: "ff", year: 2013 });
      audio.start();
      for (let f = 0; f < 60; f += 1) {
        spy.made.currentTime = f / 60;
        audio.frame({ tau: f / 60, mode: "tcam", focusId: "c0", cars, speed: f < 10 ? 1 : speed });
      }
      const raised = spy.made.gains.some((gain) => gain.gain.setTargetAtTime.mock.calls.some(([value, , tau]) => value === 1 && tau === FF_CFG.attackTauMs / 1000));
      audio.dispose();
      return raised;
    };
    expect(run(8)).toBe(true);
    expect(run(1)).toBe(false);
  });
});

describe("AUD-C2 camera cuts (RF-3D-04, RNF-07)", () => {
  afterEach(() => {
    delete window.AudioContext;
  });

  test("cutEnvelope dips to gapDb and back: 0 at the cut, the gap held, 0 after", () => {
    const samples = Array.from({ length: 1201 }, (_, ms) => cutEnvelope(ms));
    expect(Math.min(...samples)).toBeLessThanOrEqual(CUT_CFG.gapDb);
    expect(cutEnvelope(0)).toBe(0);
    expect(cutEnvelope(CUT_CFG.outMs + CUT_CFG.gapMs / 2)).toBe(CUT_CFG.gapDb);
    expect(cutEnvelope(CUT_CFG.outMs + CUT_CFG.gapMs + CUT_CFG.inMs + 1)).toBe(0);
    // Quick to go, slow to come back.
    expect(CUT_CFG.outMs).toBeLessThan(CUT_CFG.inMs);
  });

  test("a cut in the same view dips (the new mix enters at the bottom); fast forward, pause and menus crossfade; views keep their fades", () => {
    const cut = viewTransition(null, null, { cut: true });
    expect(cut.kind).toBe("cut");
    expect(transitionAt(cut, CUT_CFG.outMs - 1).k).toBe(0);
    expect(transitionAt(cut, CUT_CFG.outMs).k).toBe(1);
    expect(transitionAt(cut, CUT_CFG.outMs + CUT_CFG.gapMs + CUT_CFG.inMs).done).toBe(true);
    expect(viewTransition("fastForward", "fastForward", { cut: true }).kind).toBe("crossfade");
    expect(viewTransition("menu", "menu", { cut: true }).kind).toBe("crossfade");
    expect(viewTransition(null, "replay", { cut: true })).toMatchObject({ kind: "view", ms: VIEWS_CFG.snapshotFadeMs });
    // Without a cut block, the old crossfade.
    const noCut = { ...VIEWS_CFG, cut: undefined };
    expect(viewTransition(null, null, { cut: true }, noCut)).toMatchObject({ kind: "crossfade", ms: VIEWS_CFG.crossfadeMs });
  });

  test("controller: another focus car in the same camera dips the buses to the gap; the first frame does not", () => {
    const spy = gainSpy();
    window.AudioContext = spy.Spy;
    const gap = dbToGain(CUT_CFG.gapDb);
    const dipped = () => spy.made.gains.some((gain) => gain.gain.setTargetAtTime.mock.calls.some(([value]) => Math.abs(value - gap) < 1e-6));
    const cars = Array.from({ length: 4 }, (_, i) => ({ id: `c${i}`, teamId: "t", pose: { x: -i * 12, y: 0, heading: 0, v: 70 } }));
    const audio = createRaceAudio({ seed: "cut", year: 2013 });
    audio.start();
    for (let f = 0; f < 30; f += 1) {
      spy.made.currentTime = f / 60;
      audio.frame({ tau: f / 60, mode: "tcam", focusId: "c0", cars });
    }
    expect(dipped()).toBe(false);
    for (let f = 30; f < 60; f += 1) {
      spy.made.currentTime = f / 60;
      audio.frame({ tau: f / 60, mode: "tcam", focusId: "c1", cars });
    }
    expect(dipped()).toBe(true);
    audio.dispose();
  });
});

// ------------------------------------------------------------------ AUD-C4: loudness and beds

describe("AUD-C4 loudness and track bed (RF-3D-04, RNF-07, RNF-09; F1M24-CHINA §2.7)", () => {
  const LOUD = audioData.mixer.loudness;
  const TRACK = audioData.ambience.trackBed;
  const field = (n = 20, spacing = 45) => Array.from({ length: n }, (_, i) => ({ id: `c${i}`, x: -i * spacing, y: (i % 2) * 3, heading: 0, v: 70, firingHz: 1000 }));
  const farTv = { id: "t9", kind: "tower", mode: "tv", position: { x: 0, y: 8, z: 150 }, target: { x: 0, y: 0.5, z: 0 } };
  const levels = (scene) => mixLevels({ focusId: "c0", cars: field(), kmh: 250, ...scene });

  test("the makeup lifts the last onboard measurement into the target's tolerance; pending until Playwright re-measures", () => {
    expect(makeupDb()).toBeCloseTo(LOUD.onboardTargetDbfs - LOUD.measuredOnboardDbfs, 6);
    const onboard = onboardLoudness();
    expect(onboard.inside).toBe(true);
    expect(Math.abs(onboard.dbfs - LOUD.onboardTargetDbfs)).toBeLessThanOrEqual(LOUD.tolerance);
    expect(LOUD.status).toBe("pending");
    expect(audioData.sources[LOUD.source]).toBeTruthy();
    expect(makeupDb(null)).toBe(0);
    expect(onboardLoudness(null).inside).toBe(false);
  });

  test("the makeup sits between master and the limiter (mocked Web Audio)", () => {
    const ctx = new FakeContext();
    const gains = [];
    const make = ctx.createGain.bind(ctx);
    ctx.createGain = () => {
      const gain = make();
      gains.push(gain);
      return gain;
    };
    let comp = null;
    const makeComp = ctx.createDynamicsCompressor.bind(ctx);
    ctx.createDynamicsCompressor = () => {
      comp = makeComp();
      return comp;
    };
    createMixer(ctx);
    const [master, makeup] = gains;
    expect(master.connect).toHaveBeenCalledWith(makeup);
    expect(makeup.gain.value).toBeCloseTo(dbToGain(makeupDb()), 9);
    expect(makeup.connect).toHaveBeenCalledWith(comp);
    expect(comp.connect).toHaveBeenCalledWith(ctx.destination);
  });

  test("the track bed: present in TV, helicopter and chase, absent on board and on the map", () => {
    expect(trackBedOf(viewMix("tv"))).toBeCloseTo(TRACK.gain, 9);
    expect(trackBedOf(viewMix("heli"))).toBeGreaterThan(0);
    expect(trackBedOf(viewMix("chase"))).toBeGreaterThan(0);
    expect(trackBedOf(viewMix("tcam"))).toBe(0);
    expect(trackBedOf(viewMix("map"))).toBe(0);
    expect(trackBedOf(null)).toBe(0);
    expect(TRACK.status).toBe("NV");
  });

  test("offline mix: onboard - TV 8-12 dB; TV wide (correlation <= 0.8), onboard mono (>= 0.95)", () => {
    const onboard = levels({ mode: "tcam" });
    const tv = levels({ mode: "tv", camera: farTv });
    expect(onboard.totalDb - tv.totalDb).toBeGreaterThanOrEqual(8);
    expect(onboard.totalDb - tv.totalDb).toBeLessThanOrEqual(12);
    expect(tv.correlation).toBeLessThanOrEqual(0.8);
    expect(levels({ mode: "tv" }).correlation).toBeLessThanOrEqual(0.8);
    expect(onboard.correlation).toBeGreaterThanOrEqual(0.95);
  });

  test("the TV is never silent between passes: with every car far away it stays within 15 dB of the onboard mix", () => {
    const onboard = levels({ mode: "tcam" });
    const empty = mixLevels({ focusId: "c0", cars: field(20, 2000).map((car, i) => ({ ...car, x: -5000 - i * 2000 })), kmh: 0, mode: "tv", camera: farTv });
    expect(onboard.totalDb - empty.totalDb).toBeLessThanOrEqual(15);
    // Pause and menus still trim it with the ambience (bedDb).
    const paused = mixLevels({ focusId: "c0", cars: field(), mode: "tv", camera: farTv, playing: false });
    expect(paused.ambienceDb).toBeLessThan(levels({ mode: "tv", camera: farTv }).ambienceDb);
  });

  test("one-pole low-pass: unity at DC and -3 dB at its corner (the -6 dB/octave slope)", () => {
    const fs = 48000;
    const { feedforward, feedback } = onePoleLowpass(TRACK.lowpassHz, fs);
    const at = (hz) => {
      const w = (2 * Math.PI * hz) / fs;
      const re = 1 + feedback[1] * Math.cos(w);
      const im = -feedback[1] * Math.sin(w);
      return feedforward[0] / Math.hypot(re, im);
    };
    expect(at(0)).toBeCloseTo(1, 9);
    expect(20 * Math.log10(at(TRACK.lowpassHz))).toBeCloseTo(-3, 0);
    // An octave apart well above the corner: about 6 dB less.
    expect(20 * Math.log10(at(8 * TRACK.lowpassHz) / at(4 * TRACK.lowpassHz))).toBeCloseTo(-6, 0);
  });

  test("graph: crowd and track bed read the seeded noise at two offsets into L and R (mocked Web Audio)", () => {
    const ctx = new FakeContext();
    const sources = [];
    const makeSource = ctx.createBufferSource.bind(ctx);
    ctx.createBufferSource = () => {
      const src = makeSource();
      sources.push(src);
      return src;
    };
    const mergers = [];
    ctx.createChannelMerger = () => {
      const merger = node();
      mergers.push(merger);
      return merger;
    };
    const iir = [];
    ctx.createIIRFilter = (ff, fb) => {
      iir.push([ff, fb]);
      return node();
    };
    const noise = { duration: 2 };
    const bus = node();
    const amb = createAmbience(ctx, bus, noise, node());
    // Crowd and track bed: two reads each, the second one decorrelateSec later.
    const offsets = sources.slice(0, 4).map((src) => src.start.mock.calls[0]);
    expect(offsets).toEqual([[0, 0], [0, audioData.ambience.crowd.decorrelateSec], [0, 0], [0, TRACK.decorrelateSec]]);
    expect(mergers).toHaveLength(2);
    // One first-order low-pass per channel.
    const pole = onePoleLowpass(TRACK.lowpassHz, ctx.sampleRate);
    expect(iir).toEqual([[pole.feedforward, pole.feedback], [pole.feedforward, pole.feedback]]);
    expect(() => amb.update({ time: 0, crowd: 0.2, crowdShare: 1, wind: { gain: 0, hz: 300 }, rain: 0, guns: 0, trackBed: 0.2 })).not.toThrow();
    expect(() => amb.update({ time: 0, crowd: 0.2, crowdShare: 1, wind: { gain: 0, hz: 300 }, rain: 0, guns: 0 })).not.toThrow();
    amb.stop();
    // Without a merger or an IIR filter (an old browser), mono and a biquad: still builds.
    const old = new FakeContext();
    delete old.createChannelMerger;
    old.createChannelMerger = undefined;
    expect(() => createAmbience(old, node(), noise, node()).stop()).not.toThrow();
  });

  test("controller: the stereo beds draw nothing from the seeded stream (RF-SIM-15, RNF-05)", () => {
    const run = () => {
      window.AudioContext = FakeContext;
      const audio = createRaceAudio({ seed: "audc4", year: 2013 });
      audio.start();
      const cars = field(6).map((car) => ({ id: car.id, teamId: "t", pose: { x: car.x, y: car.y, heading: 0, v: 70 } }));
      for (let f = 0; f < 60; f += 1) audio.frame({ tau: f / 10, mode: f < 30 ? "tv" : "heli", focusId: "c0", cars });
      audio.dispose();
      delete window.AudioContext;
      return true;
    };
    expect(run()).toBe(true);
    const text = fs.readFileSync(path.join(__dirname, "ambience.js"), "utf8");
    expect(text).not.toMatch(/Math\.random|Date\.now|performance\.now/);
  });
});

describe("AUD-C11 impacts only for confirmed contacts (RF-SIM-07, RF-SIM-09, RF-3D-04)", () => {
  test("a pass without overlap has no impact; a confirmed contact has one", () => {
    expect(impactHeard({ type: "contact", carId: "a", confirmed: false })).toBe(false);
    expect(impactHeard({ type: "contact", carId: "a", confirmed: true })).toBe(true);
    // The quick mode (engine/race.js) does not mark its contacts: they keep the impact.
    expect(impactHeard({ type: "contact", carId: "a" })).toBe(true);
    expect(impactHeard({ type: "pass", carId: "a" })).toBe(false);
    expect(impactHeard(null)).toBe(false);
  });
});
