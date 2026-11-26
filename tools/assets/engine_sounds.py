"""Recorded engine banks for the live view (RF-3D-04, RNF-03, RNF-04).

Downloads the banks listed in engine_sounds.config.json from their repository at the pinned
commit, reads each GTA V sound bank (.awc, "ADAT", PCM 16-bit, not encrypted) and turns its
granular rev sweeps into short loops at fixed engine speeds, which the browser crossfades and
pitch-shifts by rpm (three/audio/engineSamples.js).

The bank format, as far as this script needs it:
  header      'ADAT', u16 version, u16 flags, i32 streamCount, i32 dataOffset
  flags & 1   u16 chunkIndex[streamCount]
  per stream  u32 info: id = info & 0x1FFFFFFF (joaat of the wave name), chunkCount = info >> 29
  per chunk   u64 info: type = >> 56, size = (>> 28) & 0x0FFFFFFF, offset = & 0x0FFFFFFF
  0x55 data   PCM s16le mono
  0xFA format u32 samples, i32 loop, u16 rate, ...; codec u8 at +15 (0 = PCM)
  0x5A grains (size - 4) / 12 records of u32 start sample, f32 pitch (Hz), u16, u16
A grain is one four-stroke cycle (two turns), so its pitch is rpm / 120: the sweep of the
Formula 1 V10 tops out at 132 Hz, 15.900 rpm; the MP4/4 V6 at 103 Hz, 12.400 rpm.

Per bank and layer (accel, decel) it writes loops at engine speeds spaced by `binRatio`; each
loop is `loopSec` worth of consecutive cycles around that speed, every cycle resampled to the
same period so the loop has one exact pitch, and the wrap crossfaded into the cycle that
follows it in the recording. Left channel: engine (intake side), right: exhaust. The idle
layer is the recording's idle cycles. One stereo WAV per bank in
overcut/frontend/public/manager-assets/sounds/engines/ (not in git) and the manifest
data/manager-sounds.json (in git).

    python tools/assets/engine_sounds.py            # download what is missing and build
    python tools/assets/engine_sounds.py --only f1-v10
"""

import argparse
import hashlib
import json
import os
import re
import struct
import sys
import urllib.request
import wave
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[2]
HERE = Path(__file__).resolve().parent
CONFIG = HERE / "engine_sounds.config.json"
CACHE = HERE / ".cache" / "engine_sounds"
FRONTEND = ROOT / "overcut" / "frontend"
OUT_DIR = FRONTEND / "public" / "manager-assets" / "sounds" / "engines"
MANIFEST = FRONTEND / "src" / "modules" / "overcutManager" / "data" / "manager-sounds.json"


def joaat(text):
    h = 0
    for c in text.lower().encode():
        h = (h + c) & 0xFFFFFFFF
        h = (h + (h << 10)) & 0xFFFFFFFF
        h ^= h >> 6
    h = (h + (h << 3)) & 0xFFFFFFFF
    h ^= h >> 11
    return (h + (h << 15)) & 0xFFFFFFFF


WAVES = {name: joaat(name) & 0x1FFFFFFF for name in ("engine_accel", "exhaust_accel", "engine_decel", "exhaust_decel", "engine_idle", "exhaust_idle")}


def read_awc(blob):
    magic, _version, flags, count, _data = struct.unpack_from("<IHHii", blob, 0)
    if magic != 0x54414441:
        raise ValueError("not an unencrypted ADAT bank")
    p = 16 + (2 * count if flags & 1 else 0)
    infos = []
    for _ in range(count):
        (v,) = struct.unpack_from("<I", blob, p)
        p += 4
        infos.append((v & 0x1FFFFFFF, v >> 29))
    streams = {}
    for sid, chunks in infos:
        table = {}
        for _ in range(chunks):
            (v,) = struct.unpack_from("<Q", blob, p)
            p += 8
            table[(v >> 56) & 0xFF] = ((v >> 28) & 0x0FFFFFFF, v & 0x0FFFFFFF)
        streams[sid] = table
    return streams


def stream_of(blob, table):
    """{ rate, pcm (float -1..1), grains: [(start, hz)] } of one granular stream."""
    fsize, foff = table[0xFA]
    rate = struct.unpack_from("<H", blob, foff + 8)[0]
    codec = blob[foff + 15]
    if codec != 0:
        raise ValueError(f"codec {codec} is not PCM")
    dsize, doff = table[0x55]
    pcm = np.frombuffer(blob, dtype="<i2", count=dsize // 2, offset=doff).astype(np.float64) / 32768.0
    gsize, goff = table[0x5A]
    grains = [struct.unpack_from("<If", blob, goff + 12 * i) for i in range(max(0, (gsize - 4) // 12))]
    grains = [(int(s), float(hz)) for s, hz in grains if s < len(pcm)]
    return {"rate": rate, "pcm": pcm, "grains": grains}


def cycle(stream, index, length):
    """Cycle `index` of the stream resampled to `length` samples (linear)."""
    starts = stream["grains"]
    a = starts[index][0]
    b = starts[index + 1][0] if index + 1 < len(starts) else min(len(stream["pcm"]), a + int(round(stream["rate"] / starts[index][1])))
    src = stream["pcm"][a:b]
    if len(src) < 2:
        return np.zeros(length)
    return np.interp(np.linspace(0, len(src) - 1, length, endpoint=False), np.arange(len(src)), src)


def nearest(stream, hz):
    pitches = np.array([g[1] for g in stream["grains"][:-1]])
    return int(np.argmin(np.abs(pitches - hz)))


def loop_at(stream, centre, cycles, length, seam):
    """`cycles` consecutive cycles around grain `centre`, each `length` samples, the wrap crossfaded."""
    last = len(stream["grains"]) - 2
    first = max(0, min(centre - cycles // 2, last - cycles))
    body = np.concatenate([cycle(stream, first + k, length) for k in range(cycles + 1)])
    loop = body[: cycles * length].copy()
    w = min(seam, length)
    ramp = np.linspace(0.0, 1.0, w)
    # The wrap goes from the loop's last sample to its first: make its start continue the cycle after the loop.
    loop[:w] = body[cycles * length : cycles * length + w] * (1 - ramp) + loop[:w] * ramp
    return loop


def pitch_range(stream):
    hz = [g[1] for g in stream["grains"][:-1]]
    return min(hz), max(hz)


def bins_for(lo, hi, ratio):
    out = [lo]
    while out[-1] * ratio < hi:
        out.append(out[-1] * ratio)
    if hi / out[-1] > 1.03:
        out.append(hi)
    return out


def build_layer(engine, exhaust, targets, opts, sr):
    loops = []
    for hz in targets:
        length = max(16, int(round(sr / hz)))
        exact = sr / length
        cycles = max(opts["minCycles"], int(round(opts["loopSec"] * exact)))
        left = loop_at(engine, nearest(engine, exact), cycles, length, opts["seamSamples"])
        right = loop_at(exhaust, nearest(exhaust, exact), cycles, length, opts["seamSamples"])
        loops.append({"hz": exact, "data": np.stack([left, right], axis=1)})
    return loops


def idle_layer(engine, exhaust, opts, sr):
    hz = float(np.mean([g[1] for g in engine["grains"]] + [g[1] for g in exhaust["grains"]]))
    length = max(16, int(round(sr / hz)))
    cycles = max(2, min(len(engine["grains"]), len(exhaust["grains"])) - 2)
    left = loop_at(engine, cycles // 2, cycles, length, opts["seamSamples"])
    right = loop_at(exhaust, cycles // 2, cycles, length, opts["seamSamples"])
    return {"hz": sr / length, "data": np.stack([left, right], axis=1)}


def fetch(config, bank):
    path = CACHE / Path(bank["awc"]).name
    if path.exists() and path.stat().st_size > 0:
        return path
    CACHE.mkdir(parents=True, exist_ok=True)
    url = f"https://raw.githubusercontent.com/{config['repo']}/{config['commit']}/{bank['awc']}"
    print(f"  download {url}")
    with urllib.request.urlopen(url) as response:
        path.write_bytes(response.read())
    return path


def build_bank(config, bank):
    opts = config["output"]
    sr = opts["sampleRate"]
    blob = fetch(config, bank).read_bytes()
    streams = read_awc(blob)
    s = {name: stream_of(blob, streams[sid]) for name, sid in WAVES.items()}
    # Everything at one rate first, so a cycle's length in samples is its pitch at `sr`.
    for name, stream in s.items():
        if stream["rate"] != sr:
            scale = sr / stream["rate"]
            n = int(len(stream["pcm"]) * scale)
            stream["pcm"] = np.interp(np.arange(n) / scale, np.arange(len(stream["pcm"])), stream["pcm"])
            stream["grains"] = [(int(round(a * scale)), hz) for a, hz in stream["grains"]]
            stream["rate"] = sr

    layers = {}
    for layer in ("accel", "decel"):
        eng, exh = s[f"engine_{layer}"], s[f"exhaust_{layer}"]
        lo = max(pitch_range(eng)[0], pitch_range(exh)[0])
        hi = min(pitch_range(eng)[1], pitch_range(exh)[1])
        layers[layer] = build_layer(eng, exh, bins_for(lo, hi, opts["binRatio"]), opts, sr)
    layers["idle"] = [idle_layer(s["engine_idle"], s["exhaust_idle"], opts, sr)]

    return write_bank(
        layers,
        opts,
        {
            "id": bank["id"],
            "label": bank["label"],
            "author": bank["author"],
            "link": bank["link"],
            "source": f"https://github.com/{config['repo']}/blob/{config['commit']}/{bank['awc']}",
            "license": config["license"],
            "riskRipped": config["riskRipped"],
        },
    )


def cycle_spread_db(loop, period):
    """Spread (dB, p90 - p10) of the loudness of the cycles of a mono loop."""
    k = max(1, int(round(len(loop) / period)))
    p = len(loop) / k
    rms = np.array([np.sqrt(np.mean(loop[int(i * p) : int((i + 1) * p)] ** 2)) for i in range(k)]) + 1e-9
    db = 20 * np.log10(rms)
    return float(np.percentile(db, 90) - np.percentile(db, 10))


def even_cycles(data, hz, sr, limit):
    """
    Even out the loudness of the cycles of a loop (each channel): a gain per cycle towards the
    loop's median, at most `limit` either way, eased linearly between cycle centres and round the
    wrap, so the loop no longer pumps once per repeat.
    """
    n = len(data)
    k = max(1, int(round(n * hz / sr)))
    p = n / k
    out = data.copy()
    centres = (np.arange(k) + 0.5) * p
    t = np.arange(n)
    for c in range(data.shape[1]):
        rms = np.array([np.sqrt(np.mean(data[int(i * p) : int((i + 1) * p), c] ** 2)) for i in range(k)]) + 1e-9
        g = np.clip(np.median(rms) / rms, 1 / limit, limit)
        xs = np.concatenate([[centres[-1] - n], centres, [centres[0] + n]])
        gs = np.concatenate([[g[-1]], g, [g[0]]])
        out[:, c] = data[:, c] * np.interp(t, xs, gs)
    return out


def write_bank(layers, opts, meta):
    """One stereo WAV for the bank's loops and its manifest entry."""
    sr = opts["sampleRate"]
    # One gain for the whole bank: the recording's own balance between speeds and layers stays.
    peak = max(float(np.max(np.abs(loop["data"]))) for loops in layers.values() for loop in loops) or 1.0
    gain = 10 ** (opts["peakDbfs"] / 20) / peak
    frames = []
    entries = {}
    offset = 0
    for layer, loops in layers.items():
        entries[layer] = []
        for loop in loops:
            data = np.clip(even_cycles(loop["data"], loop["hz"], sr, opts.get("evenLimit", 2.0)) * gain, -1, 1)
            frames.append(data)
            entries[layer].append({"hz": round(loop["hz"], 3), "rpm": int(round(loop["hz"] * 120)), "offset": offset, "length": len(data)})
            offset += len(data)
    pcm = (np.concatenate(frames) * 32767).astype("<i2")
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    out = OUT_DIR / f"{meta['id']}.wav"
    with wave.open(str(out), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes(pcm.tobytes())
    data = out.read_bytes()
    accel = entries["accel"]
    print(f"  {meta['id']}: {len(accel)} accel + {len(entries['decel'])} decel loops, {accel[0]['rpm']}-{accel[-1]['rpm']} rpm, {len(data) / 1e6:.2f} MB")
    return {
        "id": meta["id"],
        "file": f"sounds/engines/{meta['id']}.wav",
        "bytes": len(data),
        "sha256": hashlib.sha256(data).hexdigest(),
        "sampleRate": sr,
        "channels": ["engine", "exhaust"],
        **{key: value for key, value in meta.items() if key != "id"},
        "layers": entries,
    }


# ------------------------------------------------------------------ F1 2020 mod (.bdl)


def read_bdl(blob):
    """The 'egoer' records of a Codemasters 'bndl': { cylinders, rate, pcm }."""
    if blob[:4] != b"bndl":
        raise ValueError("not a bndl bundle")
    starts = [m.start() for m in re.finditer(re.escape(b"egoer\x00\x00\x00"), blob)] + [len(blob)]
    out = []
    for k in range(len(starts) - 1):
        at = starts[k]
        rate = struct.unpack_from("<I", blob, at + 0x34)[0]
        cylinders, table = struct.unpack_from("<II", blob, at + 0x40)
        begin = at + 8 + table
        count = (starts[k + 1] - begin) // 2
        pcm = np.frombuffer(blob, dtype="<i2", count=count, offset=begin).astype(np.float64) / 32768.0
        out.append({"cylinders": cylinders, "rate": rate, "pcm": pcm})
    return out


def nsdf_frames(x, sr, hop, win, fmin=25, fmax=450):
    """Normalised square difference per frame (McLeod), lags sr/fmax..sr/fmin."""
    lo, hi = int(sr / fmax), int(sr / fmin)
    taus = np.arange(hi + 2)
    rows = []
    for i in range(0, len(x) - win, hop):
        s = x[i : i + win]
        ac = np.fft.irfft(np.abs(np.fft.rfft(s, 2 * win)) ** 2)[: hi + 2]
        sq = np.concatenate([[0.0], np.cumsum(s * s)])
        # m(tau) = sum over j < win - tau of x_j^2 + x_(j+tau)^2
        m = sq[win - taus] + (sq[win] - sq[taus])
        rows.append(2 * ac / np.maximum(m, 1e-12))
    return rows, lo, hi


def peaks_of(row, lo, hi, keep=8, floor=0.2):
    seg = row[lo:hi]
    idx = np.where((seg[1:-1] > seg[:-2]) & (seg[1:-1] >= seg[2:]) & (seg[1:-1] > floor))[0] + 1
    if not len(idx):
        return [(np.nan, 0.0)]
    idx = idx[np.argsort(seg[idx])[::-1][:keep]]
    out = []
    for p in idx:
        a, b, c = seg[p - 1], seg[p], seg[p + 1]
        d = a - 2 * b + c
        out.append((lo + p + (0.5 * (a - c) / d if d else 0.0), float(b)))
    return out


def track_pitch(x, sr, hop=240, win=4096, jump_cost=60.0):
    """Pitch of a rev sweep over time: NSDF peaks joined by Viterbi (an octave jump costs `jump_cost`), smoothed in log."""
    rows, lo, hi = nsdf_frames(x, sr, hop, win)
    cands = [peaks_of(row, lo, hi) for row in rows]
    cost = np.array([1 - v for _, v in cands[0]])
    back = []
    for t in range(1, len(cands)):
        pl = np.array([lag for lag, _ in cands[t - 1]])
        cl = np.array([lag for lag, _ in cands[t]])
        with np.errstate(invalid="ignore"):
            jump = np.abs(np.log2(cl[:, None] / pl[None, :]))
        jump = np.where(np.isnan(jump), 0.5, jump)
        total = cost[None, :] + jump_cost * jump
        arg = np.argmin(total, axis=1)
        cost = total[np.arange(len(cl)), arg] + np.array([1 - v for _, v in cands[t]])
        back.append(arg)
    path = [int(np.argmin(cost))]
    for arg in reversed(back):
        path.append(int(arg[path[-1]]))
    path.reverse()
    lag = np.array([cands[t][j][0] for t, j in enumerate(path)])
    conf = np.array([cands[t][j][1] for t, j in enumerate(path)])
    raw = sr / lag
    good = np.isfinite(raw)
    raw = np.where(good, raw, np.interp(np.arange(len(raw)), np.where(good)[0], raw[good]))
    lf = np.log(raw)
    k = 21
    padded = np.pad(lf, k // 2, mode="edge")
    med = np.array([np.median(padded[i : i + k]) for i in range(len(lf))])
    ker = np.hanning(41)
    ker /= ker.sum()
    smooth = np.exp(np.convolve(np.pad(med, 20, mode="edge"), ker, mode="valid"))
    times = (np.arange(len(raw)) * hop + win / 2) / sr
    return {"t": times, "f": smooth, "raw": raw, "conf": conf}


def sweep_part(track, rising, step=10, max_miss=30):
    """
    The clean sweep inside a take, as [a, b) frames: the run that covers the widest pitch range
    while each good frame stays within a few percent of the last one in the sweep's direction
    (rising for accel, falling for overrun), tolerating `max_miss` frames that are not. The
    frames it skipped get their pitch interpolated from the good ones (track["clean"]).
    """
    f, raw, conf = track["f"], track["raw"], track["conf"]
    # The last frames see the end of the take (and the window running off it): never part of a sweep.
    n = len(f) - max(5, len(f) // 100)
    up, down = (1.04, 0.99) if rising else (1.01, 0.96)
    best = (0.0, 0, 1, [0])
    for start in range(0, n - 1, step):
        if conf[start] < 0.5:
            continue
        good = [start]
        last = raw[start]
        miss = 0
        for i in range(start + 1, n):
            if conf[i] >= 0.4 and last * down <= raw[i] <= last * up:
                good.append(i)
                last = raw[i]
                miss = 0
            else:
                miss += 1
                if miss > max_miss:
                    break
        span = abs(np.log(raw[good[-1]] / raw[good[0]]))
        if span > best[0]:
            best = (span, good[0], good[-1] + 1, good)
    _, a, b, good = best
    line = np.log(np.interp(np.arange(a, b), good, raw[good]))
    ker = np.hanning(41)
    ker /= ker.sum()
    clean = f.copy()
    clean[a:b] = np.exp(np.convolve(np.pad(line, 20, mode="edge"), ker, mode="valid"))
    track["clean"] = clean
    return a, b


def flattened(x, sr_in, track, centre_t, hz, cycles, sr_out):
    """`cycles` cycles around `centre_t`, resampled so the pitch is exactly `hz` at `sr_out` (phase-locked to the track)."""
    t_samples = np.arange(len(x)) / sr_in
    f = np.interp(t_samples, track["t"], track["f"])
    phase = np.cumsum(f) / sr_in
    centre = np.interp(centre_t, t_samples, phase)
    count = int(round((cycles + 3) * sr_out / hz))
    target = centre - (cycles + 3) / 2 + np.arange(count) * hz / sr_out
    t_out = np.interp(target, phase, t_samples)
    return np.interp(t_out * sr_in, np.arange(len(x)), x)


def best_loop(y, period, cycles, seam):
    """A loop of about `cycles` periods whose end flows into its start (length by cross-correlation), wrap crossfaded."""
    a = int(round(period))
    want = cycles * period
    w2 = int(round(2 * period))
    head = y[a : a + w2]
    best, best_len = -2.0, int(round(want))
    for length in range(int(want - 0.6 * period), int(want + 0.6 * period) + 1):
        tail = y[a + length : a + length + w2]
        if len(tail) < w2:
            break
        c = float(np.dot(head, tail) / (np.linalg.norm(head) * np.linalg.norm(tail) + 1e-12))
        if c > best:
            best, best_len = c, length
    loop = y[a : a + best_len].copy()
    w = min(seam, best_len // 2)
    ramp = np.linspace(0.0, 1.0, w)
    loop[:w] = y[a + best_len : a + best_len + w] * (1 - ramp) + loop[:w] * ramp
    return loop


def bdl_layer(takes, tracks, parts, rising, targets, opts):
    """Loops at `targets` (Hz, in cycle units) for one load: left from the first take, right from the second."""
    sr = opts["sampleRate"]
    loops = []
    for hz in targets:
        period = sr / hz
        cycles = max(opts["minCycles"], int(round(opts["loopSec"] * hz)))
        sides = []
        for rec, tr, (a, b) in zip(takes, tracks, parts):
            f = tr["clean"][a:b] * tr["scale"]
            line = {"t": tr["t"][a:b], "f": f}
            # Where the clean part is near the wanted pitch: the steadiest of a few windows there
            # (a pop, a misfire or a fade inside a loop repeats as a pulse every loop).
            near = np.where(np.abs(f / hz - 1) <= opts.get("windowPitchTol", 0.03))[0]
            if not len(near):
                hit = np.where(f >= hz)[0] if rising else np.where(f <= hz)[0]
                near = np.array([int(hit[0]) if len(hit) else len(f) - 1])
            picks = near[np.linspace(0, len(near) - 1, min(len(near), opts.get("windowCandidates", 7))).astype(int)]
            best = None
            for k in picks:
                y = flattened(rec["pcm"], rec["rate"], line, tr["t"][a + int(k)], hz, cycles, sr)
                loop = best_loop(y, period, cycles, opts["seamSamples"])
                score = cycle_spread_db(loop, period)
                if best is None or score < best[0]:
                    best = (score, loop)
            sides.append(best[1])
        length = len(sides[0])
        right = sides[1]
        if len(right) != length:
            right = np.interp(np.linspace(0, len(right) - 1, length), np.arange(len(right)), right)
        loops.append({"hz": sr * round(length / period) / length, "data": np.stack([sides[0], right], axis=1)})
    return loops


def range_of(tracks, parts):
    lo = max(float(np.min(tr["clean"][a:b])) * tr["scale"] for tr, (a, b) in zip(tracks, parts))
    hi = min(float(np.max(tr["clean"][a:b])) * tr["scale"] for tr, (a, b) in zip(tracks, parts))
    return lo * 1.02, hi * 0.99


def build_bdl_bank(config, bdl, bank, root):
    opts = config["output"]
    path = root / bank["folder"] / bdl["file"]
    recs = read_bdl(path.read_bytes())
    if len(recs) < 2:
        raise ValueError(f"{path}: {len(recs)} records")
    # Takes: records 0/1 (accel/decel) on the left, 2/3 on the right (the same take when the bundle has two).
    takes = {"accel": [recs[0], recs[2] if len(recs) > 2 else recs[0]], "decel": [recs[1], recs[3] if len(recs) > 3 else recs[1]]}
    tracks = {layer: [track_pitch(r["pcm"], r["rate"]) for r in pair] for layer, pair in takes.items()}
    accel_parts = [sweep_part(tr, True) for tr in tracks["accel"]]
    decel_parts = [sweep_part(tr, False) for tr in tracks["decel"]]
    # Octave from the accel sweep's top: the nearest of x1/2, x1, x2 to the engine's rev limit (one cycle = rpm / 120).
    tops = [float(np.max(tr["clean"][a:b])) for tr, (a, b) in zip(tracks["accel"], accel_parts)]
    top = tops[0]
    scale = 2.0 ** round(np.log2(bank["expectTopRpm"] / 120 / top))
    for tr, own in zip(tracks["accel"], tops):
        # A second take locked an octave away from the first comes back to the same top.
        tr["scale"] = scale * 2.0 ** round(np.log2(top / own))
    for tr, (a, b) in zip(tracks["decel"], decel_parts):
        # The overrun starts near the top of the revs: same octave as the accel sweep.
        tr["scale"] = scale * 2.0 ** round(np.log2(top / float(np.max(tr["clean"][a:b]))))
    layers = {}
    lo, hi = range_of(tracks["accel"], accel_parts)
    layers["accel"] = bdl_layer(takes["accel"], tracks["accel"], accel_parts, True, bins_for(lo, hi, opts["binRatio"]), opts)
    dlo, dhi = range_of(tracks["decel"], decel_parts)
    decel = bdl_layer(takes["decel"], tracks["decel"], decel_parts, False, bins_for(dlo, dhi, opts["binRatio"]), opts) if dhi > dlo * 1.1 else []
    # Below the clean accel sweep the overrun loops stand in, and the other way round.
    accel_floor = layers["accel"][0]["hz"]
    layers["accel"] = sorted([loop for loop in decel if loop["hz"] < accel_floor * 0.97] + layers["accel"], key=lambda loop: loop["hz"])
    floor = decel[0]["hz"] if decel else float("inf")
    layers["decel"] = sorted([loop for loop in layers["accel"] if loop["hz"] < floor * 0.97] + decel, key=lambda loop: loop["hz"])
    layers["idle"] = [layers["accel"][0]]
    print(f"    {bank['folder']}: {recs[0]['cylinders']} cyl, top {top:.1f} Hz x{scale:g} = {top * scale * 120:.0f} rpm, clean overrun {dlo * 120:.0f}-{dhi * 120:.0f} rpm")
    return write_bank(
        layers,
        opts,
        {
            "id": bank["id"],
            "label": bank["label"],
            "author": bdl["author"],
            "link": None,
            "source": f"F1 2020 (Codemasters) vía mod de F1 2019: {bank['folder']}/{bdl['file']}",
            "license": None,
            "riskRipped": True,
            "cylinders": recs[0]["cylinders"],
        },
    )


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--only", action="append", help="bank id (repeatable)")
    parser.add_argument("--bdl-dir", default=os.environ.get("ENGINE_SOUNDS_BDL_DIR"), help="folder of the F1 2020 mod (its FERRARI subfolder)")
    args = parser.parse_args()
    config = json.loads(CONFIG.read_text(encoding="utf-8"))
    previous = json.loads(MANIFEST.read_text(encoding="utf-8")) if MANIFEST.exists() else {"banks": []}
    kept = {b["id"]: b for b in previous.get("banks", [])}
    for bank in config["banks"]:
        if args.only and bank["id"] not in args.only:
            continue
        kept[bank["id"]] = build_bank(config, bank)
    bdl = config.get("bdl")
    if bdl:
        root = Path(args.bdl_dir) if args.bdl_dir else HERE / bdl["dir"]
        if not root.exists():
            print(f"  F1 2020 mod not found at {root}: its banks keep their previous build")
        else:
            for bank in bdl["banks"]:
                if args.only and bank["id"] not in args.only:
                    continue
                kept[bank["id"]] = build_bdl_bank(config, bdl, bank, root)
    order = [b["id"] for b in config["banks"]] + [b["id"] for b in (bdl or {}).get("banks", [])]
    banks = [kept[i] for i in order if i in kept]
    digest = hashlib.sha256("".join(b["sha256"] for b in banks).encode()).hexdigest()[:16]
    manifest = {
        "$comment": "GENERADO por tools/assets/engine_sounds.py: no editar a mano. Bancos grabados del motor (RF-3D-04); los WAV van a /manager-assets/ (fuera de git). Todos riskRipped: las builds públicas no los cargan (SRS 3.3, 7.3).",
        "version": 1,
        "hash": digest,
        "baseUrl": "/manager-assets/",
        "repo": config["repo"],
        "commit": config["commit"],
        "banks": banks,
    }
    MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"manifest {MANIFEST.relative_to(ROOT)} ({len(banks)} banks, hash {digest})")


if __name__ == "__main__":
    sys.exit(main())
