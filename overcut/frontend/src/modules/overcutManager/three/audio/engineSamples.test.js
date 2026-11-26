/**
 * Recorded engines (engineSamples.js; RF-3D-04, RNF-03, RNF-04, RNF-07, SRS 3.3 / 6.2 / 7.3).
 */

import audioData from "../../data/balance/audio.json";
import soundManifest from "../../data/manager-sounds.json";
import { engineSpecFor, safetyCarRowFor, safetyCarSpecFor } from "./engineSynth";
import {
  bankAllowed,
  bankEntry,
  binWeights,
  channelGains,
  createSampledVoice,
  layerWeights,
  loadEngineBank,
  loopRate,
  parseWav,
  recordedAvailable,
  sampleBankFor,
  sampleTargets,
  sliceBank,
} from "./engineSamples";

const SAMPLES = audioData.samples;
const local = { isPublic: false };
const spec = (year, formula, extra = {}) => engineSpecFor(year, { id: extra.id || null, formula, manufacturer: extra.manufacturer || null });

describe("bank data (RNF-07, SRS 3.3, 7.3)", () => {
  test("every rule and safety-car row names a bank of the manifest; every safety-car key is a row of audio.json", () => {
    SAMPLES.cars.forEach((rule) => [].concat(rule.bank).forEach((id) => expect(bankEntry(id)).not.toBeNull()));
    const rows = audioData.safetyCar.cars.map((row) => row.id);
    Object.entries(SAMPLES.safetyCar)
      .filter(([key]) => key !== "$comment")
      .forEach(([row, bank]) => {
        expect(rows).toContain(row);
        expect(bankEntry(bank)).not.toBeNull();
      });
  });

  test("the manifest's banks: contiguous loops, rising pitch, riskRipped and with their author", () => {
    expect(soundManifest.banks.length).toBeGreaterThan(0);
    soundManifest.banks.forEach((bank) => {
      expect(bank.riskRipped).toBe(true);
      expect(bank.author).toBeTruthy();
      expect(bank.source).toBeTruthy();
      if (bank.link !== null) expect(bank.link).toMatch(/^https:\/\//);
      let next = 0;
      ["accel", "decel", "idle"].forEach((layer) => {
        const rows = bank.layers[layer];
        expect(rows.length).toBeGreaterThan(0);
        rows.forEach((row) => {
          expect(row.offset).toBe(next);
          expect(row.length).toBeGreaterThan(0);
          expect(Math.abs(row.rpm - row.hz * 120)).toBeLessThanOrEqual(1);
          next += row.length;
        });
      });
      bank.layers.accel.slice(1).forEach((row, i) => expect(row.hz).toBeGreaterThan(bank.layers.accel[i].hz));
    });
  });

  test("public builds never load a riskRipped bank", () => {
    soundManifest.banks.forEach((bank) => expect(bankAllowed(bank, { isPublic: true })).toBe(false));
    expect(recordedAvailable({ isPublic: true })).toBe(false);
    expect(recordedAvailable(local)).toBe(true);
    expect(sampleBankFor(spec(2005, "3.0 V10"), { isPublic: true })).toBeNull();
  });
});

describe("which engine sounds recorded (SRS 6.2: nothing out of its era)", () => {
  test("each era's engines get their recording (F1 2020 first), by maker where the mod has one", () => {
    expect(sampleBankFor(spec(1976, "3.0 F12"), local)).toBe("f20-flat12-312t2");
    expect(sampleBankFor(spec(1976, "3.0 V8"), local)).toBe("f20-dfv-v8");
    expect(sampleBankFor(spec(1976, "3.0 V12"), local)).toBe("f20-v12-1990");
    expect(sampleBankFor(spec(1986, "1.5 V6 turbo"), local)).toBe("f20-v6-turbo-mp44");
    expect(sampleBankFor(spec(1986, "1.5 L4 turbo"), local)).toBe("f20-v6-turbo-mp44");
    expect(sampleBankFor(spec(1988, "3.5 V8"), local)).toBe("f20-dfv-v8");
    expect(sampleBankFor(spec(1990, "3.5 W12"), local)).toBe("f20-v12-1990");
    expect(sampleBankFor(spec(1992, "3.5 V12"), local)).toBe("f20-v12-1990");
    expect(sampleBankFor(spec(1992, "3.5 V10", { manufacturer: "renault" }), local)).toBe("f20-v10-williams");
    expect(sampleBankFor(spec(1992, "3.5 V10", { manufacturer: "honda" }), local)).toBe("f20-v10-1990");
    expect(sampleBankFor(spec(1994, "3.5 V8", { manufacturer: "ford" }), local)).toBe("f20-ford-v8");
    expect(sampleBankFor(spec(1998, "3.0 V10"), local)).toBe("f20-v10-mp413");
    expect(sampleBankFor(spec(2004, "3.0 V10"), local)).toBe("f20-v10");
    expect(sampleBankFor(spec(2006, "3.0 V10"), local)).toBe("f20-v10");
    expect(sampleBankFor(spec(2006, "2.4 V8", { manufacturer: "bmw" }), local)).toBe("f20-v8");
    expect(sampleBankFor(spec(2010, "2.4 V8", { manufacturer: "renault" }), local)).toBe("f20-v8-renault");
    expect(sampleBankFor(spec(2010, "2.4 V8", { manufacturer: "ferrari" }), local)).toBe("f20-v8-f10");
    expect(sampleBankFor(spec(2012, "2.4 V8", { manufacturer: "mercedes" }), local)).toBe("f20-v8-mp425");
    expect(sampleBankFor(spec(2012, "2.4 V8", { manufacturer: "cosworth" }), local)).toBe("f20-v8");
    expect(sampleBankFor(spec(2014, "1.6 V6 turbo hybrid"), local)).toBe("f20-v6-hybrid");
    expect(sampleBankFor(spec(2026, "1.6 V6 turbo hybrid"), local)).toBe("f20-v6-hybrid");
  });

  test("a rule's preference list falls back to the next bank the manifest has", () => {
    const manifest = { banks: soundManifest.banks.filter((bank) => !bank.id.startsWith("f20-")) };
    expect(sampleBankFor(spec(2004, "3.0 V10"), local, SAMPLES, manifest)).toBe("f1-v10");
    expect(sampleBankFor(spec(2016, "1.6 V6 turbo hybrid"), local, SAMPLES, manifest)).toBe("f1-v6-hybrid");
    expect(sampleBankFor(spec(2010, "2.4 V8"), local, SAMPLES, manifest)).toBeNull();
  });

  test("every pack engine sounds on a bank of its own cylinder count (turbos aside)", () => {
    const fs = require("fs");
    const path = require("path");
    const dir = path.join(__dirname, "../../data/seasons");
    fs.readdirSync(dir)
      .filter((name) => /^\d{4}\.json$/.test(name))
      .forEach((name) => {
        const year = Number(name.slice(0, 4));
        const pack = JSON.parse(fs.readFileSync(path.join(dir, name), "utf8"));
        (pack.teams || []).forEach((team) =>
          (team.engines || []).forEach((engine) => {
            const s = engineSpecFor(year, engine);
            const id = sampleBankFor(s, local);
            const bank = id && bankEntry(id);
            if (bank && bank.cylinders && s.engine.aspiration === "na") expect([year, engine.formula, bank.cylinders]).toEqual([year, engine.formula, s.engine.cylinders]);
          }),
        );
      });
  });

  test("no turbo recording on an atmospheric season and no hybrid recording before 2014", () => {
    for (let year = 1966; year <= 2026; year += 1) {
      ["3.0 V8", "3.5 V10", "3.0 V10", "2.4 V8", "3.5 V12", "3.0 F12"].forEach((formula) => {
        const id = sampleBankFor(spec(year, formula), local);
        expect(["f1-v6-turbo-1988", "f1-v6-hybrid", "f20-v6-turbo-mp44", "f20-v6-hybrid"]).not.toContain(id);
      });
      if (year < 2014) expect(["f1-v6-hybrid", "f20-v6-hybrid"]).not.toContain(sampleBankFor(spec(year, "1.6 V6 turbo hybrid"), local));
    }
  });

  test("the safety car sounds as its season's road car; none before 1993", () => {
    expect(safetyCarSpecFor(1990)).toBeNull();
    expect(sampleBankFor(safetyCarSpecFor(2012), local)).toBe("sc-v8-sls");
    expect(sampleBankFor(safetyCarSpecFor(2018), local)).toBe("sc-v8tt-amggt");
    expect(sampleBankFor(safetyCarSpecFor(2007), local)).toBe("sc-v8-m156");
    expect(safetyCarRowFor(1996).id).toBe("c36-amg");
    expect(sampleBankFor(safetyCarSpecFor(1996), local)).toBeNull();
  });
});

describe("pure maths", () => {
  const bins = [{ hz: 40 }, { hz: 50 }, { hz: 62.5 }];

  test("speed bins: equal power between neighbours, one loop past either end", () => {
    expect(binWeights(bins, 30)).toEqual([{ index: 0, weight: 1 }]);
    expect(binWeights(bins, 90)).toEqual([{ index: 2, weight: 1 }]);
    expect(binWeights(bins, 0)).toEqual([]);
    const mid = binWeights(bins, Math.sqrt(40 * 50));
    expect(mid.map((w) => w.index)).toEqual([0, 1]);
    expect(mid[0].weight).toBeCloseTo(mid[1].weight, 6);
    [41, 47, 55, 60].forEach((hz) => {
      const power = binWeights(bins, hz).reduce((sum, w) => sum + w.weight ** 2, 0);
      expect(power).toBeCloseTo(1, 6);
    });
  });

  test("load: overrun plays the decel sweep, throttle the accel one", () => {
    expect(layerWeights(0)).toEqual({ accel: 0, decel: 1 });
    expect(layerWeights(1).accel).toBeCloseTo(1, 6);
    const half = layerWeights((SAMPLES.load.decelBelow + SAMPLES.load.accelAbove) / 2);
    expect(half.accel ** 2 + half.decel ** 2).toBeCloseTo(1, 6);
  });

  test("pitch: exact while the recording covers the revs; scaled sweep and partial follow above it", () => {
    const covered = sampleTargets({ revLimit: 15000 }, 15868, 12000);
    expect(covered.bankHz).toBeCloseTo(100, 6);
    expect(covered.follow).toBe(1);
    expect(loopRate({ hz: 100 }, covered)).toBeCloseTo(1, 6);
    const above = sampleTargets({ revLimit: 20000 }, 10000, 20000);
    expect(above.bankHz).toBeCloseTo(10000 / 120, 6);
    expect(above.follow).toBeCloseTo(2 ** SAMPLES.pitchFollow, 6);
    expect(loopRate({ hz: 10000 / 120 }, above)).toBeCloseTo(Math.min(SAMPLES.maxRate, 2 ** SAMPLES.pitchFollow), 6);
    expect(loopRate({ hz: 100 }, { bankHz: 1, follow: 1 })).toBe(SAMPLES.minRate);
  });

  test("onboard brings the engine channel up and the exhaust down", () => {
    const out = channelGains(0);
    const cockpit = channelGains(1);
    expect(cockpit.engine).toBeGreaterThan(out.engine);
    expect(cockpit.exhaust).toBeLessThan(out.exhaust);
  });
});

const wavBytes = (frames, rate = 32000) => {
  const channels = 2;
  const buffer = new ArrayBuffer(44 + frames.length * 2 * channels);
  const view = new DataView(buffer);
  const text = (at, s) => [...s].forEach((c, i) => view.setUint8(at + i, c.charCodeAt(0)));
  text(0, "RIFF");
  view.setUint32(4, 36 + frames.length * 4, true);
  text(8, "WAVE");
  text(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, rate, true);
  view.setUint32(28, rate * 4, true);
  view.setUint16(32, 4, true);
  view.setUint16(34, 16, true);
  text(36, "data");
  view.setUint32(40, frames.length * 4, true);
  frames.forEach(([l, r], i) => {
    view.setInt16(44 + i * 4, l, true);
    view.setInt16(46 + i * 4, r, true);
  });
  return buffer;
};

const fakeBuffer = (channels, length, rate) => {
  const data = Array.from({ length: channels }, () => new Float32Array(length));
  return { length, sampleRate: rate, duration: length / rate, data, copyToChannel: (src, c) => data[c].set(src) };
};

const entry = {
  id: "test",
  file: "sounds/engines/test.wav",
  sha256: "abc",
  riskRipped: true,
  layers: {
    accel: [{ hz: 40, rpm: 4800, offset: 0, length: 2 }, { hz: 50, rpm: 6000, offset: 2, length: 2 }],
    decel: [{ hz: 40, rpm: 4800, offset: 4, length: 1 }],
    idle: [{ hz: 20, rpm: 2400, offset: 5, length: 1 }],
  },
};

describe("bank files", () => {
  test("a 16-bit stereo WAV parses to its frames", () => {
    const wav = parseWav(wavBytes([[16384, -16384], [0, 32767]]));
    expect(wav.sampleRate).toBe(32000);
    expect(wav.frames).toBe(2);
    expect(Array.from(wav.channels[0])).toEqual([0.5, 0]);
    expect(wav.channels[1][0]).toBe(-0.5);
    expect(() => parseWav(new ArrayBuffer(8))).toThrow();
  });

  test("a bank slices into one buffer per loop, the idle under the lowest accel loop", () => {
    const wav = parseWav(wavBytes([[1, 1], [2, 2], [3, 3], [4, 4], [5, 5], [6, 6]]));
    const bank = sliceBank(entry, wav, fakeBuffer);
    expect(bank.topRpm).toBe(6000);
    expect(bank.layers.accel.map((bin) => bin.hz)).toEqual([20, 40, 50]);
    expect(bank.layers.accel[2].buffer.data[0][0]).toBeCloseTo(3 / 32768, 9);
    expect(bank.layers.decel).toHaveLength(1);
  });

  test("loads once per context; an unknown bank rejects and is retried later", async () => {
    const manifest = { baseUrl: "/manager-assets/", banks: [entry] };
    const fetchBytes = jest.fn(() => Promise.resolve(wavBytes([[1, 1], [2, 2], [3, 3], [4, 4], [5, 5], [6, 6]])));
    const ctx = { createBuffer: fakeBuffer };
    const a = await loadEngineBank(ctx, "test", { fetchBytes, manifest, isPublic: false });
    const b = await loadEngineBank(ctx, "test", { fetchBytes, manifest, isPublic: false });
    expect(a).toBe(b);
    expect(fetchBytes).toHaveBeenCalledTimes(1);
    expect(fetchBytes.mock.calls[0][0]).toMatch(/\/manager-assets\/sounds\/engines\/test\.wav\?v=abc$/);
    await expect(loadEngineBank(ctx, "missing", { fetchBytes, manifest, isPublic: false })).rejects.toThrow();
    await expect(loadEngineBank({ createBuffer: fakeBuffer }, "test", { fetchBytes, manifest, isPublic: true })).rejects.toThrow();
  });
});

describe("recorded voice (mocked Web Audio)", () => {
  const param = (value = 0) => ({ value, setTargetAtTime: jest.fn(), setValueAtTime: jest.fn(), linearRampToValueAtTime: jest.fn(), cancelScheduledValues: jest.fn() });
  const node = (extra = {}) => ({ connect: jest.fn((target) => target), disconnect: jest.fn(), start: jest.fn(), stop: jest.fn(), ...extra });
  const makeCtx = () => {
    const ctx = { sources: 0 };
    ctx.createGain = () => node({ gain: param(1) });
    ctx.createBiquadFilter = () => node({ frequency: param(), Q: param() });
    ctx.createChannelSplitter = () => node();
    ctx.createOscillator = () => node({ frequency: param() });
    ctx.createBufferSource = () => {
      ctx.sources += 1;
      return node({ buffer: null, loop: false, playbackRate: param(1) });
    };
    return ctx;
  };
  const bank = sliceBank(entry, parseWav(wavBytes([[1, 1], [2, 2], [3, 3], [4, 4], [5, 5], [6, 6]])), fakeBuffer);
  const carSpec = spec(2005, "3.0 V10");

  test("at most two speeds per layer sound at once, and silent loops are released", () => {
    const ctx = makeCtx();
    let seed = 0;
    const voice = createSampledVoice(ctx, () => (seed = (seed + 0.37) % 1));
    voice.assign(bank, carSpec);
    voice.update({ rpm: 5400, load: 1 }, { gain: 1, doppler: 1, interior: 0, lowpassHz: 8000, time: 0 });
    expect(voice.playing).toBeLessThanOrEqual(2);
    voice.update({ rpm: 3000, load: 0.4 }, { gain: 1, time: 0.1 });
    expect(voice.playing).toBeLessThanOrEqual(4);
    voice.silence(1);
    voice.silence(1 + SAMPLES.releaseSec + 0.01);
    expect(voice.playing).toBe(0);
    expect(() => voice.stop()).not.toThrow();
  });
});
