/**
 * Menu music (AUD-C12, F1M24-CHINA §2.7; RF-3D-04, RNF-07, RNF-05): our own generative music,
 * only in menus. Nothing recorded and no motif of any game: a dorian progression over
 * `music.rootHz`, a three-voice pad, a bass on the root and a seeded arpeggio (audio.json
 * `music`, all NV, own design).
 *
 * Where it sounds is the mixer's business: the `music` bus follows the view snapshot's `music`
 * share (only `menu` has one, so live, pause, replay and fast forward are 0) under the viewer's
 * own music volume (SoundControl). This module only writes notes, and only while that share is
 * above zero.
 *
 * Determinism (RNF-05): each bar comes from its own stream, `${music.seed}::bar::${n}`
 * (overcutTrayectoria/engine/rng), so bar n always has the same notes and the music never
 * draws from the race audio's seeded stream; no unseeded draw and no wall clock (the audio
 * context's clock places the notes).
 *
 * Two layers: `musicBar(n)` (pure, tested) gives the notes of bar n; `createMenuMusic` renders
 * them on a bus with Web Audio, a bar ahead of the context clock.
 */

import audioData from "../../data/balance/audio.json";
import { createStream } from "../../../overcutTrayectoria/engine/rng";

const MUSIC = audioData.music;

/** Seconds of one beat and one bar at the configured tempo. */
export const barSecOf = (cfg = MUSIC) => (cfg.beatsPerBar * 60) / cfg.bpm;

/**
 * Hz of a scale degree (0 = the root; past the scale's length it climbs an octave) in `octave`
 * octaves above `rootHz`, equal temperament.
 */
export const degreeHz = (degree, octave = 0, cfg = MUSIC) => {
  const n = cfg.scale.length;
  const steps = cfg.scale[((degree % n) + n) % n] + 12 * Math.floor(degree / n);
  return cfg.rootHz * 2 ** ((steps + 12 * octave) / 12);
};

/**
 * The notes of bar `index` (0-based): { barSec, chord, notes: [{ voice, hz, start, durationSec,
 * attackSec, gain }] } with `start` in seconds from the bar's start. The pad holds the chord, the
 * bass repeats its root every `bass.noteBeats` beats, the arpeggio plays chord tones on a seeded
 * share (`arp.density`) of its steps, now and then an octave up.
 */
export const musicBar = (index, cfg = MUSIC) => {
  const bar = Math.max(0, Math.floor(Number(index) || 0));
  const barSec = barSecOf(cfg);
  const beatSec = barSec / cfg.beatsPerBar;
  const chord = cfg.progression[bar % cfg.progression.length];
  const notes = [];
  chord.forEach((degree) => {
    notes.push({ voice: "pad", hz: degreeHz(degree, cfg.pad.octave, cfg), start: 0, durationSec: barSec + cfg.pad.releaseSec, attackSec: cfg.pad.attackSec, gain: cfg.pad.gain / chord.length });
  });
  for (let beat = 0; beat < cfg.beatsPerBar; beat += cfg.bass.noteBeats) {
    notes.push({ voice: "bass", hz: degreeHz(chord[0], cfg.bass.octave, cfg), start: beat * beatSec, durationSec: Math.min(cfg.bass.noteBeats, cfg.beatsPerBar - beat) * beatSec * 0.9, attackSec: 0.02, gain: cfg.bass.gain });
  }
  const stream = createStream(`${cfg.seed}::bar::${bar}`);
  const stepSec = barSec / cfg.arp.stepsPerBar;
  for (let step = 0; step < cfg.arp.stepsPerBar; step += 1) {
    const play = stream.next() < cfg.arp.density;
    const pick = Math.min(chord.length - 1, Math.floor(stream.next() * chord.length));
    const up = stream.next() < 0.25 ? 1 : 0;
    if (play) notes.push({ voice: "arp", hz: degreeHz(chord[pick], cfg.arp.octave + up, cfg), start: step * stepSec, durationSec: cfg.arp.noteSec, attackSec: 0.01, gain: cfg.arp.gain });
  }
  return { barSec, chord, notes };
};

const WAVE = { pad: "triangle", bass: "sine", arp: "sine" };

/**
 * The music on `bus` (the mixer's music bus). `update(now, share)` once per view frame: while
 * `share` (the blended snapshot's music share) is above zero it keeps `lookaheadSec` of bars
 * scheduled ahead of `now`; at zero it stops writing (the bus has already faded it out) and the
 * next menu starts on a fresh bar. Returns how many notes it scheduled this call.
 */
export const createMenuMusic = (ctx, bus, cfg = MUSIC) => {
  const padTone = ctx.createBiquadFilter();
  padTone.type = "lowpass";
  padTone.frequency.value = cfg.pad.lowpassHz;
  padTone.connect(bus);
  let bar = 0;
  let nextAt = null;
  const play = (note, at) => {
    const t0 = at + note.start;
    const end = t0 + note.durationSec;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0, t0);
    env.gain.linearRampToValueAtTime(note.gain, t0 + Math.min(note.attackSec, note.durationSec * 0.5));
    env.gain.exponentialRampToValueAtTime(0.0001, end);
    env.connect(note.voice === "pad" ? padTone : bus);
    const osc = ctx.createOscillator();
    osc.type = WAVE[note.voice] || "sine";
    osc.frequency.setValueAtTime(note.hz, t0);
    osc.connect(env);
    osc.start(t0);
    osc.stop(end + 0.05);
  };
  return {
    update(now, share) {
      if (!(share > 0.001)) {
        nextAt = null;
        return 0;
      }
      if (nextAt === null) nextAt = now + 0.05;
      let count = 0;
      while (nextAt < now + cfg.lookaheadSec) {
        const { barSec, notes } = musicBar(bar, cfg);
        notes.forEach((note) => play(note, nextAt));
        count += notes.length;
        nextAt += barSec;
        bar += 1;
      }
      return count;
    },
    stop() {
      padTone.disconnect();
    },
  };
};
