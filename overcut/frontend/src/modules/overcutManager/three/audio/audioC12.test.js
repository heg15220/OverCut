/**
 * AUD-C-4 (F1M24-CHINA §2.6, §2.7, §3.3 wave 4): timbre per maker (AUD-C6) and polish (AUD-C12).
 * RF-3D-04, RNF-07 (every value in audio.json with its schema), RNF-08 (texts ES/EN), RNF-05
 * (seeded, no Math.random), SRS §6.2 (no turbo or MGU-H outside their years).
 *
 * Acceptance (§3.1):
 *  - AUD-C6: in 2013 the Renault, Ferrari and Mercedes engines differ by ≥ 3 dB in some order
 *    1-12 of the cycle frequency; no turbo in 2013, a turbo in 1986.
 *  - AUD-C12: the pause's shots; music = 0 live. (The Playwright check of the wheel's lights
 *    against the audio, ≤ 0,1 s, waits for CAM-C4's wheel display, wave 5.)
 */

import fs from "fs";
import path from "path";
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import audioData from "../../data/balance/audio.json";
import broadcastData from "../../data/balance/broadcast.json";
import { createEngineVoice, engineSpecFor, eraFor, harmonicWeights, manufacturerVoicingFor, shiftCutGain, shiftEnvelope, voiceWithTrims } from "./engineSynth";
import { busGains, loadSettings, resolveView, saveSettings, viewMix } from "./mixer";
import { createUiCueState, cueLength, cueShots, stingSecOf, uiCuesStep } from "./uiSounds";
import { barSecOf, createMenuMusic, degreeHz, musicBar } from "./music";
import { createRaceAudio, teamEnginesOf } from "./index";
import SoundControl from "./SoundControl";

const SEASONS = path.join(__dirname, "../../data/seasons");
const packYears = fs
  .readdirSync(SEASONS)
  .filter((name) => /^\d{4}\.json$/.test(name))
  .map((name) => Number(name.slice(0, 4)));
const packOf = (year) => JSON.parse(fs.readFileSync(path.join(SEASONS, `${year}.json`), "utf8"));
const UI = audioData.ui;
const db = (ratio) => 20 * Math.log10(ratio);

/** Harmonic weights of a spec, normalised to unit energy (the PeriodicWave normalises too). */
const spectrum = (spec) => {
  const w = harmonicWeights(spec.engine.cylinders, spec.voice, spec.halfOrder, audioData.voicing.maxHarmonics, null);
  const energy = Math.sqrt(w.reduce((sum, x) => sum + x * x, 0));
  return Array.from(w, (x) => x / energy);
};

const engineOfMaker = (pack, maker) => Object.values(teamEnginesOf(pack)).find((engine) => engine.manufacturer === maker);

describe("AUD-C6 timbre per maker (RF-3D-04, RNF-07, SRS §6.2)", () => {
  const pack2013 = packOf(2013);
  const makers = ["renault", "ferrari", "mercedes"];
  const specs = Object.fromEntries(makers.map((maker) => [maker, engineSpecFor(2013, engineOfMaker(pack2013, maker))]));

  test("the 2013 pack carries the three makers (f1db engines) and each has its own row", () => {
    makers.forEach((maker) => {
      expect(engineOfMaker(pack2013, maker)).toBeDefined();
      expect(specs[maker].voicing).toBe(`${maker}-v8`);
    });
    audioData.voicing.byManufacturer.forEach((row) => {
      expect(row.status).toMatch(/NV|pending|sourced|measured/);
      expect(row.source.length).toBeGreaterThan(3);
      expect(row.from).toBeLessThanOrEqual(row.to);
    });
  });

  test("2013: Renault, Ferrari and Mercedes differ by ≥ 3 dB in some order 1-12", () => {
    for (let i = 0; i < makers.length; i += 1) {
      for (let j = i + 1; j < makers.length; j += 1) {
        const a = spectrum(specs[makers[i]]);
        const b = spectrum(specs[makers[j]]);
        let widest = 0;
        for (let n = 1; n <= 12; n += 1) widest = Math.max(widest, Math.abs(db(a[n] / b[n])));
        expect(widest).toBeGreaterThanOrEqual(3);
      }
    }
  });

  test("a maker's trims are only dB on the profile: same engine, same spectrum; no row, the cylinder profile", () => {
    expect(spectrum(engineSpecFor(2013, engineOfMaker(pack2013, "ferrari")))).toEqual(spectrum(specs.ferrari));
    const base = audioData.voicing.byCylinders["8"];
    expect(voiceWithTrims(base, 0.28, null)).toEqual({ voice: base, halfOrder: 0.28 });
    const plain = engineSpecFor(2013, { formula: "2.4 V8", id: "x", manufacturer: "nobody" });
    expect(plain.voicing).toBeNull();
    expect(plain.voice).toEqual(base);
    // Outside the rows' years the maker sounds as its cylinders (a 2014 Mercedes V6 hybrid).
    expect(manufacturerVoicingFor(2014, { manufacturer: "mercedes", cylinders: 6 })).toBeNull();
    // The 2006 Toro Rosso's restricted Cosworth V10 is not the Cosworth V8 row.
    expect(manufacturerVoicingFor(2006, { manufacturer: "cosworth", cylinders: 10 })).toBeNull();
  });

  test("no turbo in 2013 and a turbo on every 1986 engine; no turbo or MGU-H before 2014 outside 1977-1988 (every pack)", () => {
    Object.values(teamEnginesOf(pack2013)).forEach((engine) => expect(engineSpecFor(2013, engine).turbo).toBeNull());
    const engines1986 = Object.values(teamEnginesOf(packOf(1986)));
    expect(engines1986.length).toBeGreaterThan(5);
    engines1986.forEach((engine) => expect(engineSpecFor(1986, engine).turbo).not.toBeNull());
    packYears.forEach((year) => {
      Object.values(teamEnginesOf(packOf(year))).forEach((engine) => {
        const spec = engineSpecFor(year, engine);
        if (year < 2014 && !(year >= 1977 && year <= 1988)) expect(spec.turbo).toBeNull();
        if (year < 2014 || year > 2025) expect(spec.electric?.mguh || 0).toBe(0);
      });
    });
    // A maker's row has no key that could switch on a turbo or a hybrid part (schema too).
    audioData.voicing.byManufacturer.forEach((row) => expect(Object.keys(row).sort()).toEqual(expect.arrayContaining(["from", "to", "match", "overtoneTrim", "halfOrderTrim"])));
    audioData.voicing.byManufacturer.forEach((row) => ["turbo", "electric", "mguh"].forEach((key) => expect(row[key]).toBeUndefined()));
  });

  test("each maker gets its own wave on a pooled voice; the same maker reuses it (mocked Web Audio)", () => {
    const param = () => ({ value: 0, setTargetAtTime: jest.fn(), setValueAtTime: jest.fn(), linearRampToValueAtTime: jest.fn(), cancelScheduledValues: jest.fn() });
    const node = (extra = {}) => ({ connect: jest.fn((target) => target), disconnect: jest.fn(), start: jest.fn(), stop: jest.fn(), ...extra });
    const waves = [];
    const ctx = {
      createGain: () => node({ gain: param() }),
      createBiquadFilter: () => node({ frequency: param(), Q: param() }),
      createBufferSource: () => node({ buffer: null, loop: false }),
      createPeriodicWave: (real) => {
        const wave = { real: Array.from(real) };
        waves.push(wave);
        return wave;
      },
      createOscillator: () => node({ frequency: param(), setPeriodicWave: jest.fn() }),
    };
    const made = [];
    const make = ctx.createOscillator;
    ctx.createOscillator = () => {
      const osc = make();
      made.push(osc);
      return osc;
    };
    const voice = createEngineVoice(ctx, {}, null);
    const engineOsc = made[0];
    voice.assign(specs.renault);
    voice.assign(specs.ferrari);
    voice.assign(specs.ferrari);
    expect(engineOsc.setPeriodicWave).toHaveBeenCalledTimes(2);
    expect(waves).toHaveLength(2);
    expect(waves[0].real).not.toEqual(waves[1].real);
  });
});

describe("AUD-C12 shift rebound (seamless, NV)", () => {
  const seamless = engineSpecFor(2013, { formula: "2.4 V8", manufacturer: "renault" });
  const rebound = seamless.shift.transient.rebound;
  const cutSec = seamless.shift.transient.ms / 1000;

  test("only the seamless profile has it, and its shape: dip, back to 1, a small overshoot, back to 1", () => {
    expect(rebound).toEqual(audioData.shiftProfiles.find((row) => row.id === "seamless").transient.rebound);
    expect(engineSpecFor(1995, { formula: "3.0 V10" }).shift.transient.rebound).toBeUndefined();
    expect(shiftCutGain(seamless, 0)).toBeLessThan(1);
    expect(shiftCutGain(seamless, cutSec)).toBeCloseTo(1, 9);
    const peak = shiftCutGain(seamless, cutSec + rebound.ms / 2000);
    expect(db(peak)).toBeCloseTo(rebound.db, 6);
    expect(shiftCutGain(seamless, cutSec + rebound.ms / 1000)).toBe(1);
    expect(shiftCutGain(seamless, cutSec + rebound.ms / 1000 + 0.01)).toBe(1);
  });

  test("the scheduled upshift carries the overshoot; a downshift keeps its blip and no rebound", () => {
    const up = shiftEnvelope(seamless, { fromHz: 150, toHz: 120 }, 10);
    const peakGain = Math.max(...up.gain.map(([, value]) => value));
    expect(db(peakGain)).toBeCloseTo(rebound.db, 6);
    expect(up.gain[up.gain.length - 1]).toEqual([10 + cutSec + rebound.ms / 1000, 1]);
    expect(up.until).toBeCloseTo(10 + Math.max(seamless.shift.glideMs / 1000, cutSec + rebound.ms / 1000), 9);
    const down = shiftEnvelope(seamless, { fromHz: 100, toHz: 130, blip: true }, 10);
    expect(Math.max(...down.gain.map(([, value]) => value))).toBeCloseTo(10 ** (audioData.voicing.downshift.blipGainDb / 20), 9);
  });
});

describe("AUD-C12 pause, sting and menu music", () => {
  test("the pause's shots: a falling low thump and a low body, within its length", () => {
    const shots = cueShots("pause");
    const thump = shots.find((shot) => shot.layer === "thump");
    const body = shots.find((shot) => shot.layer === "body");
    expect(thump.type).toBe("tone");
    expect(thump.hz).toBeLessThan(200);
    expect(thump.endHz).toBeLessThan(thump.hz);
    expect(body.type).toBe("noise");
    expect(body.filter.type).toBe("lowpass");
    expect(body.filter.hz).toBeLessThanOrEqual(1000);
    expect(cueLength(shots)).toBeCloseTo(UI.pause.durationSec, 9);
    expect(UI.pause.durationSec).toBeGreaterThanOrEqual(0.1);
    expect(UI.pause.durationSec).toBeLessThanOrEqual(0.4);
  });

  test("the thump sounds going from live to a pause or a menu, never between them, on the way back or on the first frame", () => {
    const state = createUiCueState();
    expect(uiCuesStep(state, { events: [], view: "paused" }, 0)).toEqual([]);
    expect(uiCuesStep(state, { events: [], view: null }, 1)).toEqual([]);
    expect(uiCuesStep(state, { events: [], view: "paused" }, 2)).toEqual([{ kind: "pause", opts: {} }]);
    expect(uiCuesStep(state, { events: [], view: "menu" }, 3)).toEqual([]);
    expect(uiCuesStep(state, { events: [], view: null }, 4)).toEqual([]);
    expect(uiCuesStep(state, { events: [], view: "menu" }, 5)).toEqual([{ kind: "pause", opts: {} }]);
    // Behind its cooldown.
    uiCuesStep(state, { events: [], view: null }, 5.1);
    expect(uiCuesStep(state, { events: [], view: "paused" }, 5.2)).toEqual([]);
  });

  test("the sting: three layers on broadcast.json replay.stingSec, the one source of its length", () => {
    expect(stingSecOf()).toBe(broadcastData.replay.stingSec);
    expect(stingSecOf(UI, {})).toBe(UI.sting.fallbackSec);
    const into = cueShots("sting", { direction: "in" });
    expect(new Set(into.map((shot) => shot.layer))).toEqual(new Set(["sweep", "hit", "shimmer"]));
    expect(Math.abs(cueLength(into) - broadcastData.replay.stingSec)).toBeLessThanOrEqual(0.001);
    expect(Math.abs(cueLength(cueShots("sting", { stingSec: 1.2 })) - 1.2)).toBeLessThanOrEqual(0.001);
    const sweepIn = into.find((shot) => shot.layer === "sweep");
    const sweepOut = cueShots("sting", { direction: "out" }).find((shot) => shot.layer === "sweep");
    expect(sweepIn.filter.endHz).toBeGreaterThan(sweepIn.filter.hz);
    expect(sweepOut.filter.endHz).toBeLessThan(sweepOut.filter.hz);
    into.forEach((shot) => expect(shot.start).toBeGreaterThanOrEqual(0));
  });

  test("with the overlay's phases, the sting sounds on stingIn and stingOut only", () => {
    const state = createUiCueState();
    uiCuesStep(state, { events: [], view: null }, 0);
    expect(uiCuesStep(state, { events: [], view: "replay", replayPhase: "stingIn" }, 1)).toEqual([{ kind: "sting", opts: { direction: "in" } }]);
    expect(uiCuesStep(state, { events: [], view: "replay", replayPhase: "content" }, 3)).toEqual([]);
    expect(uiCuesStep(state, { events: [], view: "replay", replayPhase: "stingOut" }, 9)).toEqual([{ kind: "sting", opts: { direction: "out" } }]);
    expect(uiCuesStep(state, { events: [], view: null, replayPhase: null }, 11)).toEqual([]);
  });

  test("music = 0 live: every view but the menu has no music share", () => {
    ["tv", "chase", "tcam", "heli", "map"].forEach((mode) => {
      expect(viewMix(mode, resolveView({ mode, playing: true })).music).toBe(0);
      expect(viewMix(mode, resolveView({ mode, playing: true, speed: 8 })).music).toBe(0);
      expect(viewMix(mode, "replay").music).toBe(0);
      expect(viewMix(mode, resolveView({ mode, playing: false })).music).toBe(0);
    });
    expect(viewMix("tv", "menu").music).toBeGreaterThan(0);
  });

  test("music volume: a saved level, a default, through the master mute", () => {
    expect(loadSettings(null).music).toBe(audioData.mixer.defaults.music);
    const store = new Map();
    const fake = { getItem: (key) => (store.has(key) ? store.get(key) : null), setItem: (key, value) => store.set(key, value) };
    saveSettings({ ...loadSettings(null), music: 0.2 }, fake);
    expect(loadSettings(fake).music).toBe(0.2);
    expect(busGains({ ...loadSettings(null), music: 0 }).music).toBe(0);
    expect(busGains({ ...loadSettings(null), muted: true }).master).toBe(0);
  });

  test("musicBar: seeded per bar (same bar, same notes), in the scale, the length of one bar", () => {
    expect(musicBar(5)).toEqual(musicBar(5));
    const arps = new Set(Array.from({ length: 8 }, (_, i) => JSON.stringify(musicBar(i).notes.filter((note) => note.voice === "arp").map((note) => note.start))));
    expect(arps.size).toBeGreaterThan(1);
    const cfg = audioData.music;
    const allowed = new Set();
    for (let octave = -1; octave <= 5; octave += 1) cfg.scale.forEach((step, k) => allowed.add(degreeHz(k, octave).toFixed(3)));
    for (let bar = 0; bar < 16; bar += 1) {
      const { barSec, notes } = musicBar(bar);
      expect(barSec).toBeCloseTo(barSecOf(), 9);
      notes.forEach((note) => {
        expect(allowed.has(note.hz.toFixed(3))).toBe(true);
        expect(note.start).toBeLessThan(barSec);
      });
    }
    const source = fs.readFileSync(path.join(__dirname, "music.js"), "utf8");
    expect(source).not.toMatch(/Math\.random|Date\.now|performance\.now/);
  });

  test("createMenuMusic writes nothing at share 0 and keeps a lookahead of bars at share > 0", () => {
    const param = () => ({ value: 0, setValueAtTime: jest.fn(), linearRampToValueAtTime: jest.fn(), exponentialRampToValueAtTime: jest.fn() });
    const node = (extra = {}) => ({ connect: jest.fn((target) => target), disconnect: jest.fn(), start: jest.fn(), stop: jest.fn(), ...extra });
    let oscs = 0;
    const ctx = {
      createGain: () => node({ gain: param() }),
      createBiquadFilter: () => node({ frequency: param(), Q: param() }),
      createOscillator: () => {
        oscs += 1;
        return node({ frequency: param() });
      },
    };
    const music = createMenuMusic(ctx, node());
    expect(music.update(0, 0)).toBe(0);
    expect(oscs).toBe(0);
    const first = music.update(1, 1);
    expect(first).toBe(musicBar(0).notes.length);
    expect(oscs).toBe(first);
    // Still inside the scheduled bar: nothing new.
    expect(music.update(1.1, 1)).toBe(0);
  });
});

// ------------------------------------------------------------------ the controller (mocked Web Audio)

const param = (value = 0) => ({ value, setTargetAtTime: jest.fn(), setValueAtTime: jest.fn(), linearRampToValueAtTime: jest.fn(), exponentialRampToValueAtTime: jest.fn(), cancelScheduledValues: jest.fn() });
const node = (extra = {}) => ({ connect: jest.fn((target) => target), disconnect: jest.fn(), start: jest.fn(), stop: jest.fn(), ...extra });
class C12Context {
  constructor() {
    this.currentTime = 0;
    this.sampleRate = 8000;
    this.state = "running";
    this.destination = node();
    this.listener = { positionX: param(), positionY: param(), positionZ: param(), forwardX: param(), forwardY: param(), forwardZ: param(), upX: param(), upY: param(), upZ: param() };
    this.oscs = 0;
    C12Context.last = this;
  }
  createGain() {
    return node({ gain: param(1) });
  }
  createBiquadFilter() {
    return node({ frequency: param(), Q: param() });
  }
  createOscillator() {
    this.oscs += 1;
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
    return node({ delayTime: param() });
  }
  createChannelSplitter() {
    return node();
  }
  createChannelMerger() {
    return node();
  }
  createDynamicsCompressor() {
    return node({ threshold: param(), knee: param(), ratio: param() });
  }
  resume() {
    return Promise.resolve();
  }
  close() {
    return Promise.resolve();
  }
}

describe("AUD-C12 controller: no music live, music in the menu (mocked Web Audio)", () => {
  afterEach(() => {
    delete window.AudioContext;
  });

  test("a live race schedules no music note; the menu does; the pause thumps once", () => {
    window.localStorage.clear();
    window.AudioContext = C12Context;
    const pack = packOf(2013);
    const engines = teamEnginesOf(pack);
    const teams = Object.keys(engines);
    const audio = createRaceAudio({ seed: "c12", year: 2013, engines });
    audio.start();
    const ctx = C12Context.last;
    const cars = (tau) => Array.from({ length: 8 }, (_, i) => ({ id: `c${i}`, teamId: teams[i % teams.length], pose: { x: 60 * tau - i * 15, y: 0, heading: 0, v: 60 } }));
    const base = ctx.oscs;
    for (let f = 0; f < 60; f += 1) {
      ctx.currentTime = f / 10;
      audio.frame({ tau: f / 10, playing: true, mode: f % 20 < 10 ? "tv" : "tcam", focusId: "c0", cars: cars(f / 10), speed: f > 40 ? 8 : 1 });
    }
    expect(ctx.oscs - base).toBe(0);
    // Pause: one thump (one tone), no music.
    ctx.currentTime = 6.1;
    audio.frame({ tau: 6, playing: false, mode: "tv", focusId: "c0", cars: cars(6) });
    expect(ctx.oscs - base).toBe(1);
    for (let f = 0; f < 10; f += 1) {
      ctx.currentTime = 6.2 + f / 10;
      audio.frame({ tau: 6, playing: false, mode: "tv", focusId: "c0", cars: cars(6) });
    }
    expect(ctx.oscs - base).toBe(1);
    // A menu: music notes.
    ctx.currentTime = 8;
    audio.frame({ tau: 6, playing: false, view: "menu", mode: "tv", focusId: "c0", cars: cars(6) });
    expect(ctx.oscs - base).toBeGreaterThan(1);
    audio.dispose();
  });
});

describe("AUD-C12 SoundControl (RNF-08)", () => {
  test("the mix has a menu-music slider that updates the viewer's level", () => {
    const update = jest.fn();
    const audio = { supported: true, enabled: true, enable: jest.fn(), update, settings: { ...loadSettings(null) }, recordedAvailable: false };
    render(<SoundControl audio={audio} />);
    fireEvent.click(screen.getByRole("button"));
    const slider = screen.getByLabelText(/Música de los menús|Menu music/);
    fireEvent.change(slider, { target: { value: "0.25" } });
    expect(update).toHaveBeenCalledWith({ music: 0.25 });
  });
});

describe("AUD-C-4 data (RNF-07)", () => {
  test("every new block is marked NV or pending and names its source or design", () => {
    expect(UI.pause.status).toBe("NV");
    expect(UI.sting.status).toBe("NV");
    expect(audioData.music.status).toBe("NV");
    expect(audioData.shiftProfiles.find((row) => row.id === "seamless").source).toMatch(/rebound/);
    expect(eraFor(2013).turbo).toBeFalsy();
  });
});
