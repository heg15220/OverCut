/**
 * Interface and radio sounds (AUD-4, radio-ui-sounds, F1M24-GAMEPLAY §2.1; RF-CMD-03,
 * RNF-07, RNF-08; RF-SIM-15/RNF-05): the shots of each cue inside the ranges of the spec
 * (click 5-30 ms, whoosh 0.4-0.7 s, the radio in the telephone band and without a voice),
 * which frames call for which cue, the delegated click, the own bus silenced on its own, and
 * that none of it moves the seeded engines. Web Audio is mocked.
 */

import fs from "fs";
import path from "path";
import audioData from "../../data/balance/audio.json";
import { alertLevelOf, clickCueFor, createUiCueState, cueLength, cueShots, uiCuesStep } from "./uiSounds";
import { busGains, loadSettings, saveSettings } from "./mixer";
import { createRaceAudio, teamEnginesOf } from "./index";

const UI = audioData.ui;
const pack2012 = JSON.parse(fs.readFileSync(path.join(__dirname, "../../data/seasons/2012.json"), "utf8"));

describe("cue shots (radio-ui-sounds, RNF-07)", () => {
  test("click 5-30 ms, whoosh 0.4-0.7 s sweeping up in and down out, alert a rising stair", () => {
    const click = cueShots("click");
    expect(cueLength(click)).toBeGreaterThanOrEqual(0.005);
    expect(cueLength(click)).toBeLessThanOrEqual(0.03);
    const into = cueShots("whoosh", { direction: "in" });
    const out = cueShots("whoosh", { direction: "out" });
    expect(cueLength(into)).toBeGreaterThanOrEqual(0.4);
    expect(cueLength(into)).toBeLessThanOrEqual(0.7);
    expect(into[0].filter.endHz).toBeGreaterThan(into[0].filter.hz);
    expect(out[0].filter.endHz).toBeLessThan(out[0].filter.hz);
    Object.entries(UI.alert.levels).forEach(([level, spec]) => {
      const tones = cueShots("alert", { level });
      expect(tones).toHaveLength(spec.steps);
      tones.slice(1).forEach((tone, i) => {
        expect(tone.hz).toBeGreaterThan(tones[i].hz);
        expect(tone.start).toBeGreaterThan(tones[i].start);
      });
    });
    expect(cueShots("alert", { level: "nope" })).toEqual([]);
    expect(cueShots("voice")).toEqual([]);
  });

  test("radio without a voice: open tone, static inside the 300-3000 Hz band, close tone", () => {
    const shots = cueShots("radio");
    const noise = shots.filter((shot) => shot.type === "noise");
    const tones = shots.filter((shot) => shot.type === "tone");
    expect(noise).toHaveLength(1);
    expect(tones).toHaveLength(2);
    const { hz, q } = noise[0].filter;
    // A band-pass of centre f0 and Q has a bandwidth of f0 / Q: the band's width.
    expect(hz).toBeGreaterThan(UI.radio.band.lowHz);
    expect(hz).toBeLessThan(UI.radio.band.highHz);
    expect(hz / q).toBeCloseTo(UI.radio.band.highHz - UI.radio.band.lowHz, 6);
    // No voice: nothing pitched under the band (a voice's f0 sits near 100-250 Hz).
    tones.forEach((tone) => expect(tone.hz).toBeGreaterThan(UI.radio.band.lowHz));
    expect(tones[1].start).toBeGreaterThanOrEqual(noise[0].start + noise[0].durationSec - 1e-9);
    expect(cueShots("radio", { alert: true }).filter((shot) => shot.type === "tone")).toHaveLength(3);
  });

  test("every alert event names a level; the era's events come from the engine (SRS 6)", () => {
    Object.values(UI.alert.events).forEach((level) => expect(UI.alert.levels[level]).toBeDefined());
    Object.values(UI.alert.levels).forEach((level) => expect(level.steps).toBeLessThanOrEqual(UI.alert.steps.length));
    expect(UI.$comment).toMatch(/NV/);
  });

  test("no Math.random or wall clock in the interface sounds (RF-SIM-15, RNF-05)", () => {
    const text = fs.readFileSync(path.join(__dirname, "uiSounds.js"), "utf8");
    expect(text).not.toMatch(/Math\.random|Date\.now|new Date|performance\.now/);
  });
});

describe("which frames call for a cue", () => {
  test("alerts from the engine's log: nothing on the first frame, the highest level wins, cooldown holds", () => {
    expect(alertLevelOf({ type: "sc" })).toBe("high");
    expect(alertLevelOf({ type: "pass" })).toBeNull();
    const state = createUiCueState();
    const log = [{ type: "sc" }, { type: "pass" }];
    expect(uiCuesStep(state, { events: log }, 0)).toEqual([]);
    log.push({ type: "investigation" });
    expect(uiCuesStep(state, { events: log }, 1)).toEqual([{ kind: "alert", opts: { level: "low" } }]);
    log.push({ type: "investigation" }, { type: "vsc" });
    // Within the cooldown: silent, and those events are not kept for later.
    expect(uiCuesStep(state, { events: log }, 1 + UI.alert.cooldownSec / 2)).toEqual([]);
    log.push({ type: "penalty" }, { type: "red" });
    expect(uiCuesStep(state, { events: log }, 10)).toEqual([{ kind: "alert", opts: { level: "high" } }]);
    expect(uiCuesStep(state, { events: log }, 20)).toEqual([]);
  });

  test("radio per new message (feed keys or engine messages); absent list, no radio", () => {
    const state = createUiCueState();
    const feed = [{ key: "r-3-fuel-0" }];
    expect(uiCuesStep(state, { events: [], radio: feed }, 0)).toEqual([]);
    expect(uiCuesStep(state, { events: [], radio: feed }, 5)).toEqual([]);
    expect(uiCuesStep(state, { events: [], radio: [{ key: "r-4-hot-0", alert: true }, ...feed] }, 6)).toEqual([{ kind: "radio", opts: { alert: true } }]);
    const engine = createUiCueState();
    uiCuesStep(engine, { events: [], radio: [{ lap: 3, carId: "c1", kind: "fuel" }] }, 0);
    expect(uiCuesStep(engine, { events: [], radio: [{ lap: 3, carId: "c1", kind: "fuel" }, { lap: 5, carId: "c1", kind: "cliff" }] }, 4)).toEqual([{ kind: "radio", opts: { alert: false } }]);
    const none = createUiCueState();
    for (let f = 0; f < 5; f += 1) expect(uiCuesStep(none, { events: [] }, f)).toEqual([]);
  });

  test("whoosh into and out of the replay and on a skip forward; never more than maxPerFrame", () => {
    const state = createUiCueState();
    expect(uiCuesStep(state, { events: [], view: null }, 0)).toEqual([]);
    expect(uiCuesStep(state, { events: [], view: "replay" }, 1)).toEqual([{ kind: "whoosh", opts: { direction: "in" } }]);
    expect(uiCuesStep(state, { events: [], view: null }, 5)).toEqual([{ kind: "whoosh", opts: { direction: "out" } }]);
    expect(uiCuesStep(state, { events: [], view: "paused" }, 9)).toEqual([]);
    expect(uiCuesStep(state, { events: [], view: null, skipped: true }, 12)).toEqual([{ kind: "whoosh", opts: { direction: "in" } }]);
    const busy = createUiCueState();
    const log = [];
    uiCuesStep(busy, { events: log, radio: [], view: null }, 0);
    log.push({ type: "sc" });
    const cues = uiCuesStep(busy, { events: log, radio: [{ key: "a" }], view: "replay" }, 3);
    expect(cues).toHaveLength(Math.min(3, UI.maxPerFrame));
    expect(cues[0].kind).toBe("alert");
  });

  test("clicks: enabled buttons and tabs click; disabled ones, plain text and data-ui-sound='off' do not", () => {
    document.body.innerHTML = `
      <div><button id="b"><span id="inner">x</span></button><button id="d" disabled>y</button><div role="tab" id="tab">t</div><p id="text">p</p></div>
      <div data-ui-sound="off"><button id="quiet">q</button></div>`;
    expect(clickCueFor(document.getElementById("b"))).toBe("click");
    expect(clickCueFor(document.getElementById("inner"))).toBe("click");
    expect(clickCueFor(document.getElementById("tab"))).toBe("click");
    expect(clickCueFor(document.getElementById("d"))).toBeNull();
    expect(clickCueFor(document.getElementById("text"))).toBeNull();
    expect(clickCueFor(document.getElementById("quiet"))).toBeNull();
    expect(clickCueFor(null)).toBeNull();
    document.body.innerHTML = "";
  });
});

describe("own bus, silenced on its own (Silenciable por separado)", () => {
  test("uiMuted zeroes only the ui bus; the master mute zeroes everything; saved per viewer", () => {
    const base = audioData.mixer.defaults;
    const loud = busGains(base);
    const quiet = busGains({ ...base, uiMuted: true });
    expect(loud.ui).toBeGreaterThan(0);
    expect(quiet.ui).toBe(0);
    ["master", "engine", "ambience"].forEach((key) => expect(quiet[key]).toBe(loud[key]));
    expect(busGains({ ...base, muted: true }).master).toBe(0);
    const store = new Map();
    const fake = { getItem: (key) => (store.has(key) ? store.get(key) : null), setItem: (key, value) => store.set(key, value) };
    saveSettings({ ...base, ui: 0.25, uiMuted: true }, fake);
    expect(loadSettings(fake)).toMatchObject({ ui: 0.25, uiMuted: true });
    saveSettings({ ...base, ui: "loud", uiMuted: "yes" }, fake);
    expect(loadSettings(fake)).toMatchObject({ ui: base.ui, uiMuted: base.uiMuted });
  });
});

// ------------------------------------------------------------------ mocked Web Audio

const param = (value = 0) => ({ value, setTargetAtTime: jest.fn(), setValueAtTime: jest.fn(), linearRampToValueAtTime: jest.fn(), exponentialRampToValueAtTime: jest.fn(), cancelScheduledValues: jest.fn() });
const node = (extra = {}) => ({ connect: jest.fn((target) => target), disconnect: jest.fn(), start: jest.fn(), stop: jest.fn(), ...extra });
class UiContext {
  constructor() {
    this.currentTime = 0;
    this.sampleRate = 8000;
    this.state = "running";
    this.destination = node();
    this.listener = { positionX: param(), positionY: param(), positionZ: param(), forwardX: param(), forwardY: param(), forwardZ: param(), upX: param(), upY: param(), upZ: param() };
    this.oscs = [];
    this.gains = [];
    this.sources = 0;
    UiContext.last = this;
  }

  createGain() {
    const gain = node({ gain: param(1) });
    this.gains.push(gain);
    return gain;
  }

  createBiquadFilter() {
    return node({ frequency: param(), Q: param() });
  }

  createOscillator() {
    const osc = node({ frequency: param(), setPeriodicWave: jest.fn() });
    this.oscs.push(osc);
    return osc;
  }

  createBufferSource() {
    this.sources += 1;
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
    return node({ delayTime: param() });
  }

  createDynamicsCompressor() {
    return node({ threshold: param(), knee: param(), ratio: param() });
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

describe("controller with the interface cues (mocked Web Audio)", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });
  afterEach(() => {
    delete window.AudioContext;
    window.localStorage.clear();
  });

  const engines = teamEnginesOf(pack2012);
  const teams = Object.keys(engines);
  const race = (withCues, settings = null) => {
    window.localStorage.clear();
    window.AudioContext = UiContext;
    const audio = createRaceAudio({ seed: "aud4", year: 2012, engines });
    if (settings) audio.setSettings(settings);
    audio.start();
    const ctx = UiContext.last;
    const made = ctx.oscs.length;
    const madeSources = ctx.sources;
    const log = [];
    const radio = [];
    for (let f = 0; f < 120; f += 1) {
      const tau = f / 10;
      ctx.currentTime = tau;
      if (f === 30) log.push({ type: "sc", carId: "c2" });
      if (f === 60) log.push({ type: "pass", carId: "c1" });
      if (f === 50) radio.push({ key: `r-${f}` });
      const cars = Array.from({ length: 12 }, (_, i) => ({ id: `c${i}`, teamId: teams[i % teams.length], pose: { x: 60 * tau - i * 15, y: 0, heading: 0, v: 60 } }));
      const frame = { tau, playing: true, mode: "tv", focusId: "c0", cars, events: log.slice(), started: true };
      if (withCues) {
        frame.radio = radio.slice();
        frame.view = f >= 80 && f < 100 ? "replay" : null;
        if (f === 90) audio.cue("click");
      }
      audio.frame(frame);
    }
    audio.dispose();
    return { ctx, made, extraOscs: ctx.oscs.length - made, extraSources: ctx.sources - madeSources };
  };
  const voicesOf = ({ ctx, made }) => JSON.stringify(ctx.oscs.slice(0, made).map((osc) => osc.frequency.setTargetAtTime.mock.calls));

  test("the cues sound and never move the seeded engines (RF-SIM-15, RNF-05)", () => {
    const plain = race(false);
    const cued = race(true);
    expect(voicesOf(cued)).toBe(voicesOf(plain));
    // Both runs alert on the SC; on top: radio (2 tones and static), click (tone and noise), two whooshes (noise).
    expect(cued.extraOscs - plain.extraOscs).toBe(2 + 1);
    expect(cued.extraSources - plain.extraSources).toBe(1 + 1 + 2);
  });

  test("without radio, view or cue calls the frame sounds exactly as before AUD-4 (only the log's alerts)", () => {
    const a = race(false);
    const b = race(false);
    expect(voicesOf(a)).toBe(voicesOf(b));
    expect(a.extraOscs).toBe(UI.alert.levels.high.steps);
    expect(a.extraSources).toBe(0);
  });

  test("muting the interface silences every cue and leaves the engines alone", () => {
    const muted = race(true, { uiMuted: true });
    const plain = race(false);
    expect(muted.extraOscs).toBe(0);
    expect(muted.extraSources).toBe(0);
    expect(voicesOf(muted)).toBe(voicesOf(plain));
    const masterMuted = race(true, { muted: true });
    expect(masterMuted.extraOscs).toBe(0);

    window.localStorage.clear();
    window.AudioContext = UiContext;
    const audio = createRaceAudio({ seed: "aud4" });
    expect(audio.cue("click")).toBe(false); // not started
    audio.start();
    expect(audio.cue("click")).toBe(true);
    expect(audio.cue("click")).toBe(false); // cooldown, same context time
    UiContext.last.currentTime = 5;
    audio.setSettings({ uiMuted: true });
    expect(audio.cue("click")).toBe(false);
    expect(audio.cue("nonsense")).toBe(false);
    audio.dispose();
  });
});
