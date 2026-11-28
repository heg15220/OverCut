/**
 * AUD-C-3 (docs/manager/F1M24-CHINA.md §2.7, §2.9, §3.3 wave 3): pit lane, kerbs and rain.
 *
 *   AUD-C7 (RF-SIM-12, RF-3D-04, RNF-07): two gun hits per wheel on the engine's stage times
 *          (±10 ms), the limiter the same on the way in and out (≤ 0.5 %), its cut on the
 *          `pitExitLine` event (±1 frame), the engine idling lower in the box. The pose's
 *          `pitStage {name, t, ...}` and the `pitExitLine` events come from PIT-C2 / SIM-C3: here
 *          they are synthetic snapshots built from engine/sim/pitStop.js's own plan.
 *   AUD-C8 (RF-3D-03, RF-3D-04, RNF-07): Shanghai's bump pitch measured on the mesh
 *          (kerbs.json stripeM, status measured), `kerbRumble(250, true).hz = v / stripeM` under
 *          maxHz 160, and the kerb found on the engine's distance from the spline (racing line +
 *          lateral, §1.5): at least 4 kerbs per lap on the racing line (the unit side of the
 *          Playwright check, which stays pending).
 *   AUD-C5 (RF-SIM-11, RF-3D-04, RNF-05, RNF-07): no rain and 1 mm on the line: drops 0, spray > 0;
 *          the engine 150-1,500 Hz at least 6 dB over the rain; the TV rain's centroid ≤ 5 kHz
 *          (offline model of the same filters); seeded grains.
 */

import Ajv from "ajv";
import audioData from "../../data/balance/audio.json";
import schema from "../../engine/packs/schema/audio.schema.json";
import kerbsSchema from "../../engine/packs/schema/kerbs.schema.json";
import { createStream } from "../../../overcutTrayectoria/engine/rng";
import { rulesFor } from "../../engine/rules";
import { circuitFor } from "../../engine/venue";
import { lineAt, positionAt } from "../../engine/trackData";
import { planStop, stageInfoAt, stopEvents } from "../../engine/sim/pitStop";
import { driveStep, engineSpecFor } from "./engineSynth";
import { distanceGain, viewMix } from "./mixer";
import {
  bandShare, centroidOf, dropGrains, dropsFilters, dropsOf, filteredSpectrum, idleGainOf, kerbRumble, limiterPhaseOf, pitEventTime, pitSoundStep, pitStageEvents, pitStageName,
  createPitSoundState, rainShareOf, sprayFilters, sprayLevelFor, sprayVoiceOf, airGunsOn,
} from "./ambience";
import { KERB_FILES, axisOffsetOf, kerbAt, kerbZonesFor, onKerb, stripeOf } from "./kerbs";
import { createRaceAudio } from "./index";

const AMB = audioData.ambience;
const FRAME = 1 / 60;
const KMH = 3.6;

// ------------------------------------------------------------------ mocked Web Audio (as audio.test.js)
const param = (value = 0) => ({ value, setTargetAtTime: jest.fn(), setValueAtTime: jest.fn(), linearRampToValueAtTime: jest.fn(), exponentialRampToValueAtTime: jest.fn(), cancelScheduledValues: jest.fn() });
const node = (extra = {}) => ({ connect: jest.fn((target) => target), disconnect: jest.fn(), start: jest.fn(), stop: jest.fn(), ...extra });
class FakeContext {
  constructor() {
    this.currentTime = 0;
    this.sampleRate = 8000;
    this.state = "running";
    this.destination = node();
    this.listener = { positionX: param(), positionY: param(), positionZ: param(), forwardX: param(), forwardY: param(), forwardZ: param(), upX: param(), upY: param(), upZ: param() };
    this.oscillators = 0;
    this.sources = 0;
    FakeContext.last = this;
  }
  createGain() {
    return node({ gain: param(1) });
  }
  createBiquadFilter() {
    return node({ frequency: param(), Q: param(), gain: param() });
  }
  createOscillator() {
    this.oscillators += 1;
    return node({ frequency: param(), setPeriodicWave: jest.fn() });
  }
  createBufferSource() {
    this.sources += 1;
    return node({ buffer: null, loop: false, playbackRate: param(1) });
  }
  createBuffer(channels, length) {
    const data = new Float32Array(length);
    return { getChannelData: () => data, duration: length / this.sampleRate };
  }
  createPeriodicWave() {
    return {};
  }
  createPanner() {
    return node({ positionX: param(), positionY: param(), positionZ: param() });
  }
  createDelay() {
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

afterEach(() => {
  delete window.AudioContext;
});

describe("AUD-C-3 data (RNF-07)", () => {
  test("audio.json passes its schema with the pit events, the rain layers and the camera rain shares", () => {
    const validate = new Ajv({ allErrors: true, strict: true }).compile(schema);
    expect(validate(audioData) ? null : validate.errors).toBeNull();
    expect(Object.keys(AMB.pit.events.shots).sort()).toEqual(["gunOff", "gunOn", "jackDown", "jackUp", "release"]);
    Object.values(audioData.mixer.cameras.mix).forEach((mix) => expect(mix.rain).toEqual(expect.objectContaining({ drops: expect.any(Number), spray: expect.any(Number), lowpassHz: expect.any(Number) })));
    // The heaviest state's rate is the reference of the drops, read from race-weather.json.
    expect(AMB.rain.drops.fullMmPerHour).toBe(12);
  });
});

// ------------------------------------------------------------------ AUD-C7
describe("AUD-C7 pit stop by stages (RF-SIM-12, RF-3D-04)", () => {
  const plan = planStop({ rules: rulesFor(2024), crew: 60, tyres: true, stream: createStream("audc7") });
  const truth = stopEvents(plan);
  const wheelsStage = plan.stages.find((s) => s.stage === "wheels");
  const T0 = 1000.0123; // race time the car stopped in its box

  // What the view hears: a 60 Hz frame clock (offset from the stop so no frame falls on an event).
  const run = (stageAtTime, { frames = Math.ceil((plan.stationary + 1) / FRAME), phase = "STATIONARY" } = {}) => {
    const memo = createPitSoundState();
    const heard = [];
    for (let k = 0; k < frames; k += 1) {
      const tau = T0 - 0.0071 + k * FRAME;
      const stop = tau - T0;
      const stage = stop >= 0 ? stageAtTime(stop) : null;
      const pose = { pitStage: stage, pitPhase: stop >= 0 && stop < plan.stationary ? phase : "RELEASE" };
      heard.push(...pitSoundStep(memo, "car", pose, tau));
    }
    return heard;
  };

  test("two hits per wheel within ±10 ms of the engine's own times (stage info with the stop's events)", () => {
    const heard = run((t) => {
      const info = stageInfoAt(plan, t);
      return info && { ...info, events: truth };
    });
    expect(heard.filter((e) => e.kind === "gunOff")).toHaveLength(4);
    expect(heard.filter((e) => e.kind === "gunOn")).toHaveLength(4);
    ["fl", "fr", "rl", "rr"].forEach((wheel) => {
      const hits = heard.filter((e) => e.wheel === wheel);
      expect(hits.map((e) => e.kind)).toEqual(["gunOff", "gunOn"]);
      hits.forEach((hit) => {
        const real = truth.find((e) => e.kind === hit.kind && e.wheel === wheel);
        expect(Math.abs(hit.at - (T0 + real.t))).toBeLessThanOrEqual(0.01);
      });
    });
    ["jackUp", "jackDown", "release"].forEach((kind) => {
      const one = heard.filter((e) => e.kind === kind);
      expect(one).toHaveLength(1);
      expect(Math.abs(one[0].at - (T0 + truth.find((e) => e.kind === kind).t))).toBeLessThanOrEqual(0.01);
    });
  });

  test("with the wheels' own times on the stage, each wheel's gunOn sits on its own end (±10 ms)", () => {
    const heard = run((t) => {
      const info = stageInfoAt(plan, t);
      return info && info.name === "wheels" ? { ...info, wheels: wheelsStage.wheels } : info;
    });
    wheelsStage.wheels.forEach((corner) => {
      const on = heard.find((e) => e.kind === "gunOn" && e.wheel === corner.wheel);
      const off = heard.find((e) => e.kind === "gunOff" && e.wheel === corner.wheel);
      expect(Math.abs(off.at - (T0 + corner.start))).toBeLessThanOrEqual(0.01);
      expect(Math.abs(on.at - (T0 + corner.start + corner.duration))).toBeLessThanOrEqual(0.01);
    });
  });

  test("PIT-C2's bare stage info still gives two hits per wheel; the old string stage too, to a frame", () => {
    const info = run((t) => stageInfoAt(plan, t));
    expect(info.filter((e) => e.kind === "gunOff")).toHaveLength(4);
    expect(info.filter((e) => e.kind === "gunOn")).toHaveLength(4);
    // gunOff at the stage start exactly; gunOn at the end of the stage (the slowest wheel).
    info.filter((e) => e.kind === "gunOff").forEach((e) => expect(Math.abs(e.at - (T0 + wheelsStage.start))).toBeLessThanOrEqual(0.01));
    info.filter((e) => e.kind === "gunOn").forEach((e) => expect(Math.abs(e.at - (T0 + wheelsStage.start + wheelsStage.duration))).toBeLessThanOrEqual(0.01));
    const old = run((t) => {
      const i = stageInfoAt(plan, t);
      return i ? i.name : null;
    });
    expect(old.filter((e) => e.kind === "gunOff")).toHaveLength(4);
    expect(old.filter((e) => e.kind === "gunOn")).toHaveLength(4);
    old.filter((e) => e.kind === "gunOff").forEach((e) => expect(Math.abs(e.at - (T0 + wheelsStage.start))).toBeLessThanOrEqual(FRAME + 1e-9));
  });

  test("each one-shot once per stop, a new stop sounds again, a skip drops what is stale", () => {
    const memo = createPitSoundState();
    const pose = (t) => ({ pitStage: stageInfoAt(plan, t), pitPhase: "STATIONARY" });
    const tWheels = wheelsStage.start + 0.05;
    expect(pitSoundStep(memo, "a", pose(tWheels), T0 + tWheels).filter((e) => e.kind === "gunOff")).toHaveLength(4);
    expect(pitSoundStep(memo, "a", pose(tWheels + FRAME), T0 + tWheels + FRAME)).toEqual([]);
    expect(pitSoundStep(memo, "a", { pitStage: null, pitPhase: "EXIT_ROAD" }, T0 + 10)).toEqual([]);
    expect(pitSoundStep(memo, "a", pose(tWheels), T0 + 100 + tWheels).filter((e) => e.kind === "gunOff")).toHaveLength(4);
    // Seen first well into the stage (a seek): its start is stale, nothing plays.
    const late = createPitSoundState();
    const t = wheelsStage.start + AMB.pit.events.staleSec + 0.3;
    const lateGuns = t < wheelsStage.start + wheelsStage.duration ? pitSoundStep(late, "b", pose(t), T0 + t).filter((e) => e.kind === "gunOff") : [];
    expect(lateGuns).toEqual([]);
    expect(pitStageEvents(null, 5)).toEqual([]);
    expect(pitStageName({ name: "wheels", t: 0.3 })).toBe("wheels");
    expect(airGunsOn({ name: "wheels" })).toBe(true);
    expect(airGunsOn("refuel")).toBe(false);
  });

  test("the audio clock: an event ahead plays its race seconds later over the speed; one behind, now", () => {
    expect(pitEventTime(10, 100, 100.2, 1)).toBeCloseTo(10.2, 12);
    expect(pitEventTime(10, 100, 100.2, 4)).toBeCloseTo(10.05, 12);
    expect(pitEventTime(10, 100, 99.9, 1)).toBe(10);
    expect(pitEventTime(10, 100, 100.2, 0)).toBeCloseTo(10.2, 12);
  });

  test("the limiter sounds the same on the way in and out (≤ 0.5 %) and cuts on pitExitLine (±1 frame)", () => {
    const spec = engineSpecFor(2013, null);
    expect(spec.pitLimiter.kmh).toBeGreaterThan(0);
    const limit = spec.pitLimiter.kmh / KMH;
    let state = null;
    const rpmAt = [];
    const exitAt = 50.0071;
    let cutFrame = null;
    let firstPast = null;
    // Into the lane on the limiter, stopped in the box, out on the limiter; the snapshot says EXIT_ROAD 0.12 s
    // late (half a step), the event gives the line's own time.
    for (let k = 0; k < 60 * 60; k += 1) {
      const tau = k * FRAME;
      let phase;
      let v;
      if (tau < 10) [phase, v] = ["LIMITER", limit];
      else if (tau < 13) [phase, v] = ["STATIONARY", 0];
      else if (tau < 14) [phase, v] = ["RELEASE", limit * (tau - 13)];
      else if (tau < exitAt + 0.12) [phase, v] = ["LIMITER", limit];
      else [phase, v] = ["EXIT_ROAD", limit + (tau - exitAt) * 8];
      const used = limiterPhaseOf({ pitPhase: phase }, exitAt, tau);
      state = driveStep(spec, state, { x: tau * 20, y: 0, heading: 0, v, pitPhase: used }, FRAME, FRAME);
      if (tau > 9 && tau < 10) rpmAt.push(["in", state.rpm]);
      if (tau > 30 && tau < 31) rpmAt.push(["out", state.rpm]);
      if (firstPast === null && tau >= exitAt) firstPast = k;
      if (cutFrame === null && tau > 14 && !state.pitLimiter) cutFrame = k;
    }
    const mean = (side) => {
      const list = rpmAt.filter(([s]) => s === side).map(([, r]) => r);
      return list.reduce((a, b) => a + b, 0) / list.length;
    };
    expect(Math.abs(mean("in") - mean("out")) / mean("in")).toBeLessThanOrEqual(0.005);
    expect(Math.abs(cutFrame - firstPast)).toBeLessThanOrEqual(1);
    // Without the event, the snapshot's own phase (as before).
    expect(limiterPhaseOf({ pitPhase: "LIMITER" }, undefined, 60)).toBe("LIMITER");
    expect(limiterPhaseOf({ pitPhase: "EXIT_ROAD" }, 50, 49.9)).toBe("LIMITER");
    expect(limiterPhaseOf({ pitPhase: "LIMITER" }, 50, 50 + AMB.pit.events.exitWindowSec + 1)).toBe("LIMITER");
  });

  test("standing in the box the engine idles pit.idleDb lower", () => {
    expect(idleGainOf({ pitPhase: "STATIONARY" })).toBeCloseTo(10 ** (AMB.pit.idleDb / 20), 12);
    expect(idleGainOf({ pitPhase: "QUEUE" })).toBeLessThan(1);
    expect(idleGainOf({ pitPhase: "LIMITER" })).toBe(1);
    expect(idleGainOf({})).toBe(1);
  });

  test("the controller plays the stop's eleven one-shots once, from synthetic snapshots (mocked Web Audio)", () => {
    window.AudioContext = FakeContext;
    const audio = createRaceAudio({ seed: "audc7", year: 2024 });
    audio.start();
    const ctx = FakeContext.last;
    const before = ctx.oscillators;
    const cars = (tau) => {
      const t = tau - T0;
      const inStop = t >= 0 && t < plan.stationary;
      return [{ id: "c0", teamId: "t", pose: { x: 0, y: 0, heading: 0, v: inStop ? 0 : 20, pitPhase: inStop ? "STATIONARY" : "LIMITER", inPit: true, pitStage: inStop ? { ...stageInfoAt(plan, t), events: truth } : null } }];
    };
    for (let k = 0; k < Math.ceil((plan.stationary + 2) / FRAME); k += 1) {
      const tau = T0 - 0.5 + k * FRAME;
      ctx.currentTime = k * FRAME;
      audio.frame({ tau, mode: "tcam", focusId: "c0", cars: cars(tau), events: [{ type: "pitExitLine", carId: "c0", line: "limit", t: T0 + 30 }] });
    }
    // gunOff ×4, gunOn ×4, jackUp, jackDown, release: one oscillator each (gun hammer or thump).
    expect(ctx.oscillators - before).toBe(truth.length);
    audio.dispose();
  });
});

// ------------------------------------------------------------------ AUD-C8
describe("AUD-C8 kerbs measured on the mesh (RF-3D-03, RF-3D-04)", () => {
  const shanghai = KERB_FILES["shanghai-1"];

  test("Shanghai's kerbs.json carries the bump pitch measured on the mesh and passes its schema", () => {
    const validate = new Ajv({ allErrors: true, strict: true }).compile(kerbsSchema);
    expect(validate(shanghai) ? null : validate.errors).toBeNull();
    expect(shanghai.generator).toBe("extract_kerbs.py v2");
    expect(shanghai.stripeStatus).toBe("measured");
    expect(shanghai.stripeM).toBeGreaterThan(0.2);
    expect(shanghai.stripeM).toBeLessThan(3);
    expect(shanghai.stripe.kerbsMeasured).toBeGreaterThanOrEqual(10);
    expect(stripeOf({ splineId: "shanghai-1" })).toBe(shanghai.stripeM);
    // The audio.json fallback is that measurement, with its source, and maxHz is 160.
    expect(AMB.kerb.stripeM).toBe(shanghai.stripeM);
    expect(AMB.kerb.stripeStatus).toBe("measured");
    expect(AMB.kerb.maxHz).toBe(160);
  });

  test("kerbRumble(250, true).hz = v / stripeM, under maxHz", () => {
    const hz = kerbRumble(250, true).hz;
    expect(hz).toBeCloseTo(250 / KMH / shanghai.stripeM, 6);
    expect(hz).toBeLessThanOrEqual(AMB.kerb.maxHz);
    expect(kerbRumble(250, true, AMB.kerb, shanghai.stripeM).hz).toBeCloseTo(250 / KMH / shanghai.stripeM, 6);
    // A kerb's own pitch wins over the circuit's.
    expect(kerbRumble(200, true, AMB.kerb, 0.9).hz).toBeCloseTo(200 / KMH / 0.9, 6);
    const zones = kerbZonesFor({ splineId: "shanghai-1" });
    zones.forEach((zone) => expect(zone.stripeM).toBeGreaterThan(0));
  });

  test("the distance from the spline is the engine's: axisOffset, else line + lateral, else lineAt + lateral", () => {
    expect(axisOffsetOf({ axisOffset: 4.2, lineOffset: 1, lateral: 1 })).toBe(4.2);
    expect(axisOffsetOf({ lineOffset: 3, lateral: 0.5 })).toBe(3.5);
    expect(axisOffsetOf({ lateral: 0.5 })).toBe(0.5); // no circuit: as before
    expect(Number.isNaN(axisOffsetOf({}))).toBe(true);
    const circuit = circuitFor({ circuit: "shanghai" }, 2024);
    [0.05, 0.31, 0.62, 0.9].forEach((P) => {
      expect(axisOffsetOf({ progress: 3 + P, lateral: 0.4 }, circuit)).toBeCloseTo(positionAt(circuit, 3 + P, 0.4).axisOffset, 9);
    });
  });

  test("on the racing line at Shanghai the focus car is on a kerb at least 4 times a lap; on the bare lateral it never was", () => {
    const circuit = circuitFor({ circuit: "shanghai" }, 2024);
    expect(circuit.splineId || circuit.id).toMatch(/shanghai-1/);
    const zones = kerbZonesFor(circuit);
    const reach = AMB.kerb.reachM;
    const count = (offsetOf) => {
      let on = false;
      let hits = 0;
      const steps = Math.ceil(circuit.length / 0.5);
      for (let k = 0; k < steps; k += 1) {
        const P = k / steps;
        const now = Boolean(kerbAt(zones, P, offsetOf(P), reach));
        if (now && !on) hits += 1;
        on = now;
      }
      return hits;
    };
    const onLine = count((P) => axisOffsetOf({ progress: P, lateral: 0 }, circuit));
    expect(onLine).toBeGreaterThanOrEqual(4);
    expect(count(() => 0)).toBe(0);
    expect(onKerb(zones, 0.5, NaN, reach)).toBe(false);
    expect(lineAt(circuit, 0.5, 0).offset).toEqual(expect.any(Number));
  });
});

// ------------------------------------------------------------------ AUD-C5
describe("AUD-C5 rain: drops and spray (RF-SIM-11, RF-3D-04, RNF-05)", () => {
  const dry1mm = { state: "cloudy", rainRate: 0, waterMm: { line: 1, off: 1.4, sectors: [1, 1, 1] } };
  const heavy = { state: "heavy", rainRate: 12, waterMm: { line: 2.5, off: 3, sectors: [2.5, 2.5, 2.5] } };

  test("no rain and 1 mm on the line: drops 0, spray > 0 (a drying track hisses, nothing falls)", () => {
    expect(dropsOf(dry1mm)).toBe(0);
    const level = sprayLevelFor({ weather: dry1mm, year: 2024 });
    expect(level).toBeGreaterThan(0);
    expect(sprayVoiceOf(level, 250, "intermediate").gain).toBeGreaterThan(0);
    // The engine's own spray (snapshot.spray[i] by index, by id, or on the car) wins over the water on the line.
    expect(sprayLevelFor({ car: { id: "a" }, index: 1, spray: [0.1, 0.7], weather: dry1mm })).toBe(0.7);
    expect(sprayLevelFor({ car: { id: "a" }, spray: { a: 0.3 } })).toBe(0.3);
    expect(sprayLevelFor({ car: { id: "a", spray: 0.2 }, spray: [0.9], index: 0 })).toBe(0.2);
    expect(sprayLevelFor({ weather: { rainRate: 0, waterMm: { line: 0 } } })).toBe(0);
    expect(sprayVoiceOf(1, 10).gain).toBe(0); // stopped: no spray
  });

  test("drops follow the rain rate (or the state's), heavier is louder; without weather, the wetness as before", () => {
    expect(dropsOf({ state: "light" })).toBeGreaterThan(0);
    expect(dropsOf(heavy)).toBeCloseTo(AMB.rain.drops.gain, 9);
    expect(dropsOf(heavy)).toBeGreaterThan(dropsOf({ rainRate: 1.5 }));
    expect(dropsOf({ state: "sunny" })).toBe(0);
    expect(dropsOf(null, 0)).toBe(0);
    expect(dropsOf(null, 1)).toBeCloseTo(AMB.rain.drops.gain, 9);
  });

  test("seeded drop grains: same seed, same grains; none without rain", () => {
    const a = createStream("rain::grains").next;
    const b = createStream("rain::grains").next;
    const ga = Array.from({ length: 30 }, () => dropGrains(a, 0.2, FRAME));
    const gb = Array.from({ length: 30 }, () => dropGrains(b, 0.2, FRAME));
    expect(ga).toEqual(gb);
    expect(ga.flat().length).toBeGreaterThan(0);
    ga.flat().forEach((g) => {
      expect(g.delay).toBeLessThan(FRAME);
      expect(g.durationSec).toBeGreaterThanOrEqual(AMB.rain.drops.grains.durationSec[0]);
    });
    expect(dropGrains(a, 0, FRAME)).toEqual([]);
  });

  // Offline model: each source is unit RMS times its gain (as levels.js); the engine's power sits in
  // 150-1,500 Hz (the firing frequency and its first orders at racing revs), the rain's share of that band
  // comes from its own filters (the same specs the graph builds).
  const engineVsRainDb = (mode, metres) => {
    const mix = viewMix(mode);
    const share = rainShareOf(mix);
    const atEar = mix.listener === "car";
    const dist = atEar ? 1 : distanceGain(metres);
    const engine = (mix.focus * dist) ** 2;
    const dropsSpectrum = filteredSpectrum(dropsFilters(share.lowpassHz));
    const tone = AMB.rain.spray.byCompound.intermediate;
    const spraySpectrum = filteredSpectrum(sprayFilters(tone));
    const drops = (dropsOf(heavy) * share.drops) ** 2 * bandShare(dropsSpectrum, 150, 1500);
    const sprayGain = sprayVoiceOf(sprayLevelFor({ weather: heavy, year: 2024 }), 280, "intermediate").gain * share.spray;
    // The focus car's spray and a car alongside (the field share), at the focus car's distance.
    const spray = ((sprayGain * dist) ** 2 + (sprayGain * mix.field * dist) ** 2) * bandShare(spraySpectrum, 150, 1500);
    return { db: 10 * Math.log10(engine / (drops + spray)), dropsSpectrum, spraySpectrum, drops: (dropsOf(heavy) * share.drops) ** 2, spray: (sprayGain * dist) ** 2 };
  };

  test.each([
    ["tcam", 0],
    ["chase", 0],
    ["tv", 30],
    ["heli", 140],
  ])("heavy rain, %s: the engine 150-1,500 Hz at least 6 dB over drops and spray", (mode, metres) => {
    expect(engineVsRainDb(mode, metres).db).toBeGreaterThanOrEqual(6);
  });

  test("the TV rain's centroid is at most 5 kHz (before: a 4.5 kHz high-pass, 9.5 kHz measured)", () => {
    const { dropsSpectrum, spraySpectrum, drops, spray } = engineVsRainDb("tv", 30);
    expect(centroidOf([{ spectrum: dropsSpectrum, power: drops }, { spectrum: spraySpectrum, power: spray }])).toBeLessThanOrEqual(5000);
    // The old layer, for the record: a 4.5 kHz high-pass sits well above.
    expect(centroidOf([{ spectrum: filteredSpectrum([{ type: "highpass", hz: 4500, q: 0.4 }]), power: 1 }])).toBeGreaterThan(5000);
  });

  test("on board the drops go through the halo's low-pass", () => {
    expect(rainShareOf(viewMix("tcam")).lowpassHz).toBeLessThan(rainShareOf(viewMix("tv")).lowpassHz);
    expect(rainShareOf({}).lowpassHz).toBe(AMB.rain.drops.lowpassHz);
  });

  test("the controller hears weather and spray from synthetic snapshots, deterministic and cheap (mocked Web Audio)", () => {
    const runOnce = () => {
      window.AudioContext = FakeContext;
      const audio = createRaceAudio({ seed: "audc5", year: 2024 });
      audio.start();
      const ctx = FakeContext.last;
      const cars = Array.from({ length: 22 }, (_, i) => ({ id: `c${i}`, teamId: "t", compound: i % 2 ? "wet" : "intermediate", pose: { x: -i * 8, y: 0, heading: 0, v: 70 } }));
      const begin = process.hrtime.bigint();
      for (let f = 0; f < 240; f += 1) {
        ctx.currentTime = f * FRAME;
        audio.frame({ tau: f * FRAME, mode: f < 120 ? "tcam" : "tv", focusId: "c0", cars, weather: f < 120 ? heavy : dry1mm, spray: cars.map(() => 0.6) });
      }
      const ms = Number(process.hrtime.bigint() - begin) / 1e6;
      const made = ctx.sources;
      audio.dispose();
      return { ms, made };
    };
    const a = runOnce();
    const b = runOnce();
    expect(a.made).toBe(b.made); // the same grains with the same seed and frames
    expect(a.ms / 240).toBeLessThan(3);
  });
});
