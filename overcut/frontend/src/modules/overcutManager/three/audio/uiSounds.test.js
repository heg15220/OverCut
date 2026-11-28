/**
 * Interface and radio sounds (AUD-4, radio-ui-sounds, F1M24-GAMEPLAY §2.1; RF-CMD-03,
 * RNF-07, RNF-08; RF-SIM-15/RNF-05): the shots of each cue inside the ranges of the spec
 * (click 5-30 ms, whoosh 0.4-0.7 s, the radio without a voice; AUD-C3: its sequence, wide band
 * and side of the driver's panel),
 * which frames call for which cue, the delegated click, the own bus silenced on its own, and
 * that none of it moves the seeded engines. Web Audio is mocked.
 */

import fs from "fs";
import path from "path";
import audioData from "../../data/balance/audio.json";
import { alertLevelOf, clickCueFor, createUiCueState, cueLength, cueShots, panFromDb, panGains, playCue, radioPanOf, radioSideOf, radioTimeline, uiCuesStep } from "./uiSounds";
import { radioLevels } from "./levels";
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

  test("radio without a voice (AUD-C3): whoosh, motif, gap, static in a wide band, tail", () => {
    const shots = cueShots("radio");
    const noise = shots.filter((shot) => shot.type === "noise");
    const tones = shots.filter((shot) => shot.type === "tone");
    const seq = UI.radio.sequence;
    expect(noise.map((shot) => shot.phase)).toEqual(["whoosh", "static"]);
    expect(tones).toHaveLength(seq.motif.notes.length + 1);
    // The static: high-pass at the band's low edge, low-pass at its high edge.
    const stat = noise[1];
    expect(stat.filters.map((f) => [f.type, f.hz])).toEqual([["highpass", UI.radio.band.lowHz], ["lowpass", UI.radio.band.highHz]]);
    // No voice: nothing pitched under the band (a voice's f0 sits near 100-250 Hz).
    tones.forEach((tone) => expect(tone.hz).toBeGreaterThan(UI.radio.band.lowHz));
    // The whoosh sweeps up; the tail closes after the static.
    expect(noise[0].filter.endHz).toBeGreaterThan(noise[0].filter.hz);
    const tail = tones[tones.length - 1];
    expect(tail.phase).toBe("tail");
    expect(tail.start).toBeGreaterThanOrEqual(stat.start + stat.durationSec - 1e-9);
    // An alert repeats the motif's first note.
    const alert = cueShots("radio", { alert: true }).filter((shot) => shot.phase === "motif");
    expect(alert).toHaveLength(seq.motif.notes.length + 1);
    expect(alert[0].hz).toBe(alert[1].hz);
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
    expect(uiCuesStep(state, { events: [], radio: [{ key: "r-4-hot-0", alert: true }, ...feed] }, 6)).toEqual([{ kind: "radio", opts: { alert: true, pan: 0 } }]);
    const engine = createUiCueState();
    uiCuesStep(engine, { events: [], radio: [{ lap: 3, carId: "c1", kind: "fuel" }] }, 0);
    expect(uiCuesStep(engine, { events: [], radio: [{ lap: 3, carId: "c1", kind: "fuel" }, { lap: 5, carId: "c1", kind: "cliff" }] }, 4)).toEqual([{ kind: "radio", opts: { alert: false, pan: 0 } }]);
    const none = createUiCueState();
    for (let f = 0; f < 5; f += 1) expect(uiCuesStep(none, { events: [] }, f)).toEqual([]);
  });

  test("sting into and out of the replay (AUD-C12; whoosh without ui.sting), whoosh on a skip forward, thump into a pause; never more than maxPerFrame", () => {
    const state = createUiCueState();
    expect(uiCuesStep(state, { events: [], view: null }, 0)).toEqual([]);
    expect(uiCuesStep(state, { events: [], view: "replay" }, 1)).toEqual([{ kind: "sting", opts: { direction: "in" } }]);
    expect(uiCuesStep(state, { events: [], view: null }, 5)).toEqual([{ kind: "sting", opts: { direction: "out" } }]);
    expect(uiCuesStep(state, { events: [], view: "paused" }, 9)).toEqual([{ kind: "pause", opts: {} }]);
    expect(uiCuesStep(state, { events: [], view: null, skipped: true }, 12)).toEqual([{ kind: "whoosh", opts: { direction: "in" } }]);
    // Without a sting block the replay keeps its whoosh (AUD-4).
    const noSting = { ...UI, sting: undefined };
    const old = createUiCueState();
    uiCuesStep(old, { events: [], view: null }, 0, noSting);
    expect(uiCuesStep(old, { events: [], view: "replay" }, 1, noSting)).toEqual([{ kind: "whoosh", opts: { direction: "in" } }]);
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
    // Both runs alert on the SC; on top: radio (AUD-C3: motif notes and tail; whoosh and static),
    // click (tone and noise), two stings (AUD-C12: sweep noise, hit tone, shimmer tones).
    const radioTones = UI.radio.sequence.motif.notes.length + 1;
    const stingTones = 1 + UI.sting.shimmer.notes.length;
    expect(cued.extraOscs - plain.extraOscs).toBe(radioTones + 1 + 2 * stingTones);
    expect(cued.extraSources - plain.extraSources).toBe(2 + 1 + 2);
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

// ------------------------------------------------------------------ AUD-C3: the radio's sequence and side

describe("AUD-C3 radio (RF-CMD-03, RF-WKD-02, RNF-07, RNF-08; F1M24-CHINA §2.7)", () => {
  const MS5 = 0.005;
  test("the sequence: each phase starts where the timeline says (±5 ms), in the order whoosh, motif, gap, static, tail", () => {
    [false, true].forEach((alert) => {
      const line = radioTimeline({ alert });
      const shots = cueShots("radio", { alert });
      const seq = UI.radio.sequence;
      const first = (phase) => shots.find((shot) => shot.phase === phase);
      expect(Math.abs(first("whoosh").start - line.whoosh.start)).toBeLessThanOrEqual(MS5);
      expect(Math.abs(first("motif").start - line.motif.start)).toBeLessThanOrEqual(MS5);
      expect(Math.abs(first("static").start - line.static.start)).toBeLessThanOrEqual(MS5);
      expect(Math.abs(first("tail").start - line.tail.start)).toBeLessThanOrEqual(MS5);
      // The phases follow one another; the gap is silent (no shot starts or sounds inside it).
      expect(line.motif.start).toBeCloseTo(line.whoosh.end, 9);
      expect(line.static.start - line.motif.end).toBeCloseTo(seq.gapSec, 9);
      shots.forEach((shot) => {
        const end = shot.start + shot.durationSec;
        expect(end <= line.gap.start + MS5 || shot.start >= line.gap.end - MS5).toBe(true);
      });
      // Motif notes evenly spaced, the plain motif rising.
      const notes = shots.filter((shot) => shot.phase === "motif");
      notes.slice(1).forEach((note, i) => expect(note.start - notes[i].start).toBeCloseTo(seq.motif.spacingSec, 9));
      if (!alert) notes.slice(1).forEach((note, i) => expect(note.hz).toBeGreaterThan(notes[i].hz));
      expect(cueLength(shots)).toBeCloseTo(line.tail.end, 9);
    });
  });

  test("a wide band of our own: at least 4 kHz wide, never the telephone band", () => {
    const { lowHz, highHz } = UI.radio.band;
    expect(highHz - lowHz).toBeGreaterThanOrEqual(4000);
    expect(highHz).toBeGreaterThan(3400);
    expect(UI.radio.status).toBe("NV");
    // Our own motif: not the four notes of the reference.
    expect(UI.radio.sequence.motif.notes.length).not.toBe(4);
  });

  test("the side of the panel: car 2 (right card) pan >= +0.5, car 1 (left card) <= -0.5; unknown centred", () => {
    const panels = ["ham", "ver"];
    expect(panFromDb(UI.radio.pan.db)).toBeGreaterThanOrEqual(0.5);
    expect(radioPanOf({ carId: "ver" }, panels)).toBeGreaterThanOrEqual(0.5);
    expect(radioPanOf({ carId: "ham" }, panels)).toBeLessThanOrEqual(-0.5);
    expect(radioPanOf({ carId: "other" }, panels)).toBe(0);
    expect(radioPanOf({ carId: "ver" }, null)).toBe(0);
    expect(radioPanOf(null, panels)).toBe(0);
    // The message's own panel or side wins over the list.
    expect(radioSideOf({ carId: "ver", panel: 0 }, panels)).toBe("left");
    expect(radioSideOf({ carId: "ham", side: "right" }, panels)).toBe("right");
    // With the option off, centred.
    expect(radioPanOf({ carId: "ver" }, panels, { ...UI, radio: { ...UI.radio, pan: { byPanelSide: false, db: 8 } } })).toBe(0);
    // Equal power: R - L at the configured pan is the configured dB; the Playwright check asks >= 4 dB.
    const { left, right } = panGains(panFromDb(UI.radio.pan.db));
    expect(20 * Math.log10(right / left)).toBeCloseTo(UI.radio.pan.db, 6);
    expect(left ** 2 + right ** 2).toBeCloseTo(1, 9);
    const r = radioLevels({ message: { carId: "ver" }, panels });
    expect(r.rightDb - r.leftDb).toBeGreaterThanOrEqual(4);
  });

  test("the radio's level does not depend on the view or the speed (1x and 8x within 1 dB)", () => {
    const at1 = radioLevels({ message: { carId: "ver" }, panels: ["ham", "ver"] });
    const at8 = radioLevels({ message: { carId: "ver" }, panels: ["ham", "ver"], speed: 8, view: "fastForward" });
    expect(Math.abs(at1.db - at8.db)).toBeLessThanOrEqual(1);
    expect(Number.isFinite(at1.db)).toBe(true);
  });

  test("one cue for the messages that arrive together, on the side of the alert one", () => {
    const state = createUiCueState();
    const panels = ["c0", "c1"];
    uiCuesStep(state, { events: [], radio: [], panels }, 0);
    const [cue] = uiCuesStep(state, { events: [], radio: [{ lap: 4, carId: "c0", kind: "gap" }, { lap: 4, carId: "c1", kind: "cliff", alert: true }], panels }, 3);
    expect(cue.kind).toBe("radio");
    expect(cue.opts.alert).toBe(true);
    expect(cue.opts.pan).toBeGreaterThanOrEqual(0.5);
  });

  test("session radio (SES-C1 shape): a new segment's first message sounds even with the same lap, car and kind", () => {
    const state = createUiCueState();
    const q1 = [{ lap: 2, carId: "c0", kind: "session-lap", t: 312.5, segment: 0 }];
    uiCuesStep(state, { events: [], radio: q1 }, 0);
    expect(uiCuesStep(state, { events: [], radio: q1 }, 2)).toEqual([]);
    const q2 = [{ lap: 2, carId: "c0", kind: "session-lap", t: 140.2, segment: 1 }];
    expect(uiCuesStep(state, { events: [], radio: q2 }, 4)).toEqual([{ kind: "radio", opts: { alert: false, pan: 0 } }]);
  });

  test("playCue pans the whole cue through one StereoPannerNode, and is centred without one", () => {
    const made = [];
    const mk = (extra = {}) => ({ connect: jest.fn((target) => target), start: jest.fn(), stop: jest.fn(), ...extra });
    const p = () => ({ value: 0, setValueAtTime: jest.fn(), linearRampToValueAtTime: jest.fn(), exponentialRampToValueAtTime: jest.fn() });
    const ctx = {
      currentTime: 0,
      createGain: () => mk({ gain: p() }),
      createOscillator: () => mk({ frequency: p() }),
      createBufferSource: () => mk(),
      createBiquadFilter: () => mk({ frequency: p(), Q: p() }),
      createStereoPanner: () => {
        const panner = mk({ pan: p() });
        made.push(panner);
        return panner;
      },
    };
    const bus = mk();
    expect(playCue(ctx, bus, {}, "radio", { pan: 0.5 }, 0)).toBe(cueShots("radio").length);
    expect(made).toHaveLength(1);
    expect(made[0].pan.setValueAtTime).toHaveBeenCalledWith(0.5, 0);
    expect(made[0].connect).toHaveBeenCalledWith(bus);
    playCue(ctx, bus, {}, "radio", { pan: 0 }, 0);
    expect(made).toHaveLength(1);
    const old = { ...ctx, createStereoPanner: undefined };
    expect(playCue(old, bus, {}, "radio", { pan: -0.5 }, 0)).toBeGreaterThan(0);
  });

  test("controller: panels in the frame put the radio on its driver's side (mocked Web Audio)", () => {
    window.localStorage.clear();
    class PanContext extends UiContext {
      createStereoPanner() {
        const panner = node({ pan: param() });
        (this.panners = this.panners || []).push(panner);
        return panner;
      }
    }
    window.AudioContext = PanContext;
    const audio = createRaceAudio({ seed: "audc3", year: 2024 });
    audio.start();
    const ctx = UiContext.last;
    const cars = [{ id: "c0", teamId: "t", pose: { x: 0, y: 0, heading: 0, v: 60 } }, { id: "c1", teamId: "t", pose: { x: -20, y: 0, heading: 0, v: 60 } }];
    const radio = [];
    [1, 8].forEach((speed, k) => {
      for (let f = 0; f < 20; f += 1) {
        const tau = k * 20 + f / 10;
        ctx.currentTime = tau;
        if (f === 10) radio.push({ lap: k + 1, carId: "c1", kind: "gap" });
        audio.frame({ tau, mode: "tv", focusId: "c0", cars, radio: radio.slice(), panels: ["c0", "c1"], speed });
      }
    });
    expect(ctx.panners).toHaveLength(2);
    ctx.panners.forEach((panner) => expect(panner.pan.setValueAtTime.mock.calls[0][0]).toBeGreaterThanOrEqual(0.5));
    audio.dispose();
    delete window.AudioContext;
  });
});