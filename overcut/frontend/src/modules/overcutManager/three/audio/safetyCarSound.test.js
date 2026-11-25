/**
 * AUD-5 sc-vsc-sound (RF-SIM-10, RNF-07, SRS 6.2; F1M24-GAMEPLAY §2.11, §3.3): the safety car's
 * voice per season and the alert with «radio» when the SC or VSC is deployed and withdrawn.
 * Acceptance: no safety car voice before 1993 (and no VSC cue before 2015).
 */

import fs from "fs";
import path from "path";
import audioData from "../../data/balance/audio.json";
import { driveStep, engineSpecFor, neutralisationsOf, safetyCarRowFor, safetyCarSpecFor } from "./engineSynth";
import { SAFETY_CAR_ID, createScCueState, scCarOf, scCuesStep, scOnTrack, scPoseOf } from "./safetyCarSound";
import { createRaceAudio } from "./index";
import { poseAt } from "../../engine/trackGeometry";

const SC = audioData.safetyCar;
const FIRST = 1976;
const LAST = 2026;
const kinds = (cues) => cues.map((cue) => `${cue.kind}${cue.opts.level ? `:${cue.opts.level}` : ""}`);

describe("safety car voice per season (sc-vsc-sound, RF-SIM-10, SRS 6.2)", () => {
  test("no safety car voice before 1993; one for every season from 1993 to 2026", () => {
    for (let year = FIRST; year <= LAST; year += 1) {
      const spec = safetyCarSpecFor(year);
      if (year < 1993) {
        expect(neutralisationsOf(year).safetyCar).toBe(false);
        expect(spec).toBeNull();
      } else {
        expect(neutralisationsOf(year).safetyCar).toBe(true);
        expect(spec).not.toBeNull();
        expect(spec.safetyCar).toBe(true);
      }
    }
  });

  test("the rows start in 1993, do not overlap and leave no season without a car", () => {
    const rows = [...SC.cars].sort((a, b) => a.from - b.from);
    expect(rows[0].from).toBe(1993);
    rows.forEach((row, i) => {
      expect(row.to).toBeGreaterThanOrEqual(row.from);
      if (i > 0) expect(row.from).toBe(rows[i - 1].to + 1);
    });
    expect(rows[rows.length - 1].to).toBeGreaterThanOrEqual(LAST);
    // Written from memory: every row says so until it is checked (CLAUDE.md, §1.4 rule 4).
    rows.forEach((row) => {
      expect(row.status === "sourced" || (row.status === "pending" && row.note)).toBeTruthy();
      expect(audioData.sources[row.source]).toBeTruthy();
    });
  });

  test("a road car: its own engine, idle under its shift point, no hybrid, turbo only on a turbo", () => {
    const spec2012 = safetyCarSpecFor(2012);
    const f1 = engineSpecFor(2012, { id: "renault", formula: "2.4 V8" });
    expect(spec2012.engine.cylinders).toBe(safetyCarRowFor(2012).formula.includes("V8") ? 8 : spec2012.engine.cylinders);
    expect(spec2012.revLimit).toBeLessThan(f1.revLimit);
    expect(spec2012.electric).toBeNull();
    expect(spec2012.turbo).toBeNull();
    expect(safetyCarSpecFor(2020).turbo).not.toBeNull();
    expect(spec2012.idleRpm).toBeLessThan(spec2012.shiftRpm);
    expect(spec2012.gears).toBe(spec2012.gearShares.length);
    // It drives through the same gearbox as the F1 cars.
    const state = driveStep(spec2012, null, { x: 0, y: 0, heading: 0, v: 50 }, 0.1, 0.016);
    expect(state.rpm).toBeGreaterThanOrEqual(spec2012.idleRpm);
    expect(state.rpm).toBeLessThanOrEqual(spec2012.revLimit);
  });
});

describe("where the safety car sounds from (snapshot.sc, §1.7)", () => {
  const circuit = {
    length: 400,
    points: [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }, { x: 0, y: 100 }],
    dist: [0, 100, 200, 300, 400],
    heading: [0, Math.PI / 2, Math.PI, -Math.PI / 2],
    speed: [50, 50, 50, 50],
  };

  test("x/y of the snapshot, then the view's pose, then s on the circuit; otherwise nowhere", () => {
    expect(scPoseOf({ phase: "TRAIN", x: 3, y: 4, v: 30 })).toMatchObject({ x: 3, y: 4, v: 30 });
    expect(scPoseOf({ phase: "TRAIN", s: 50, v: 30 }, { pose: { x: 7, y: 8, heading: 1 } })).toMatchObject({ x: 7, y: 8, heading: 1, v: 30 });
    const onLap = scPoseOf({ phase: "TRAIN", s: 50, v: 30 }, { circuit });
    // The same point the view's geometry gives for that distance (trackGeometry.poseAt).
    const at = poseAt(circuit, 50 / 400);
    expect(onLap).toEqual({ x: at.x, y: at.y, heading: at.heading, v: 30 });
    expect(onLap.x).toBeCloseTo(50, 0);
    expect(scPoseOf({ phase: "TRAIN", s: 50 })).toBeNull();
    expect(scPoseOf(null)).toBeNull();
  });

  test("only on the road and only in a season with a safety car", () => {
    const sc = { phase: "TRAIN", x: 1, y: 2, v: 40 };
    expect(scOnTrack(sc)).toBe(true);
    expect(scOnTrack({ ...sc, phase: "RESTART" })).toBe(false);
    expect(scCarOf(safetyCarSpecFor(2012), sc)).toMatchObject({ id: SAFETY_CAR_ID });
    expect(scCarOf(safetyCarSpecFor(1990), sc)).toBeNull();
    expect(scCarOf(safetyCarSpecFor(2012), null)).toBeNull();
  });
});

describe("alert and radio when the SC/VSC is deployed and withdrawn", () => {
  const run = (year, frames) => {
    const state = createScCueState();
    return frames.map((frame) => kinds(scCuesStep(state, { year, ...frame })));
  };

  test("SC: deploy once, withdraw once (in this lap), nothing on the first frame", () => {
    const out = run(2012, [{}, { sc: { phase: "DEPLOYED" } }, { sc: { phase: "TRAIN" } }, { sc: { phase: "IN_THIS_LAP" } }, { sc: { phase: "IN_THIS_LAP" } }, { sc: { phase: "RESTART" } }, {}]);
    expect(out).toEqual([[], ["alert:high", "radio"], [], ["alert:low", "radio"], [], [], []]);
    // Opening the view in the middle of a safety car: no burst.
    expect(run(2012, [{ sc: { phase: "TRAIN" } }, { sc: { phase: "TRAIN" } }])).toEqual([[], []]);
  });

  test("an SC that vanishes without its in-this-lap still warns it is withdrawn", () => {
    expect(run(2012, [{}, { sc: { phase: "TRAIN" } }, {}])).toEqual([[], ["alert:high", "radio"], ["alert:low", "radio"]]);
  });

  test("VSC: deploy and ending, only from 2015", () => {
    const frames = [{}, { vsc: { ending: false } }, { vsc: { ending: true } }, {}];
    expect(run(2015, frames)).toEqual([[], ["alert:high", "radio"], ["alert:low", "radio"], []]);
    expect(run(2014, frames)).toEqual([[], [], [], []]);
  });

  test("no safety car cue before 1993", () => {
    for (let year = FIRST; year < 1993; year += 1) {
      expect(run(year, [{}, { sc: { phase: "DEPLOYED" } }, { sc: { phase: "IN_THIS_LAP" } }, {}]).flat()).toEqual([]);
    }
  });

  test("seeded: no Math.random or Date in the new code (RF-SIM-15, RNF-05)", () => {
    const text = fs.readFileSync(path.join(__dirname, "safetyCarSound.js"), "utf8");
    expect(text).not.toMatch(/Math\.random|Date\.now|new Date/);
  });
});

// ------------------------------------------------------------------ controller (mocked Web Audio)

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
    this.panners = [];
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
    const panner = node({ positionX: param(), positionY: param(), positionZ: param() });
    this.panners.push(panner);
    return panner;
  }
  createDelay() {
    return node({ delayTime: param() });
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

describe("race audio controller with the safety car (mocked Web Audio)", () => {
  let made;
  beforeEach(() => {
    made = [];
    window.AudioContext = class extends FakeContext {
      constructor() {
        super();
        made.push(this);
      }
    };
  });
  afterEach(() => {
    delete window.AudioContext;
  });

  const cars = (t) => Array.from({ length: 4 }, (_, i) => ({ id: `c${i}`, teamId: null, pose: { x: 40 * t - i * 20, y: 0, heading: 0, v: 40 } }));
  const SC_X = 77.25;
  // Frames where the SC comes out at t = 1 and is called in at t = 3; returns the oscillators
  // the interface cues started and whether any panner was ever put at the safety car.
  const play = (year) => {
    const audio = createRaceAudio({ seed: "aud5", year });
    audio.start();
    const ctx = made[made.length - 1];
    const base = ctx.oscillators;
    for (let f = 0; f <= 40; f += 1) {
      const t = f / 10;
      ctx.currentTime = t * 2;
      const sc = t >= 1 ? { phase: t >= 3 ? "IN_THIS_LAP" : "TRAIN", x: SC_X, y: 0, v: 45, lap: 5, lightsOn: true } : null;
      audio.frame({ tau: t, playing: true, mode: "tv", focusId: "c0", cars: cars(t), sc });
    }
    const atSc = ctx.panners.some((panner) => panner.positionX.setTargetAtTime.mock.calls.some(([x]) => x === SC_X) || panner.positionX.setValueAtTime.mock.calls.some(([x]) => x === SC_X) || panner.positionX.value === SC_X);
    audio.dispose();
    return { cueOscillators: ctx.oscillators - base, atSc };
  };

  test("2012: the safety car is voiced where the engine puts it and deploying and withdrawing sound", () => {
    const { cueOscillators, atSc } = play(2012);
    expect(cueOscillators).toBeGreaterThan(0);
    expect(atSc).toBe(true);
  });

  test("1990: no safety car voice and no cue (SC from 1993)", () => {
    const { cueOscillators, atSc } = play(1990);
    expect(cueOscillators).toBe(0);
    expect(atSc).toBe(false);
  });

  test("without snapshot.sc nothing changes: no voice placed 90 m ahead of the leader", () => {
    const audio = createRaceAudio({ seed: "aud5", year: 2012 });
    audio.start();
    const ctx = made[made.length - 1];
    const base = ctx.oscillators;
    for (let f = 0; f <= 20; f += 1) audio.frame({ tau: f / 10, cars: cars(f / 10) });
    expect(ctx.oscillators - base).toBe(0);
    audio.dispose();
  });
});
