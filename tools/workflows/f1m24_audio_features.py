"""Audio features of the gameplay video, for the analysis agents (reference only).

Writes, per 50 ms hop: RMS (dBFS), spectral centroid, and a harmonic f0 estimate in the
engine band (harmonic product spectrum, 60-1200 Hz), plus detected "shift" events (a
rising f0 that drops by more than 12 % within 120 ms). Also renders one spectrogram PNG
per 2 minutes (0-2 kHz, log magnitude) so agents can look at the sound.

Usage: python audio_features.py <mono.wav> <out_dir>
"""
import csv
import os
import sys

import numpy as np
from PIL import Image
from scipy.io import wavfile
from scipy.signal import stft

wav, out = sys.argv[1], sys.argv[2]
os.makedirs(os.path.join(out, "spectrograms"), exist_ok=True)
rate, data = wavfile.read(wav)
data = data.astype(np.float32)
if data.ndim > 1:
    data = data.mean(axis=1)
peak = np.abs(data).max() or 1.0
data /= peak

HOP = int(rate * 0.05)
WIN = 4096
CHUNK = rate * 120
keep_imgs = []
rows = []
lo = hi = None
for c0 in range(0, len(data), CHUNK):
    seg = data[c0 : c0 + CHUNK + WIN]
    if len(seg) < WIN * 2:
        break
    f, t, Z = stft(seg, fs=rate, nperseg=WIN, noverlap=WIN - HOP, boundary=None, padded=False)
    t = t + c0 / rate
    mag = np.abs(Z).astype(np.float32)
    n = min(mag.shape[1], int(120 / 0.05))
    mag = mag[:, :n]
    band = (f >= 60) & (f <= 1200)
    fb = f[band]
    idxs = {h: np.clip(np.searchsorted(f, fb * h), 0, len(f) - 1) for h in (2, 3, 4)}
    for i in range(n):
        spec = mag[:, i]
        frame = seg[i * HOP : i * HOP + WIN]
        rms = float(np.sqrt(np.mean(frame**2)) + 1e-9)
        total = spec.sum() + 1e-9
        centroid = float((f * spec).sum() / total)
        hps = spec[band].copy()
        for h in (2, 3, 4):
            hps *= spec[idxs[h]]
        k = int(np.argmax(hps))
        tonal = float(spec[band].max() / (spec[band].mean() + 1e-9))
        rows.append((round(float(t[i]), 2), round(20 * np.log10(rms), 1), round(centroid, 1), round(float(fb[k]), 1), round(tonal, 1)))
    keep = f <= 2000
    img = 20 * np.log10(mag[keep] + 1e-6)
    if lo is None:
        lo, hi = -60.0, float(np.percentile(img, 99.5))
    norm = np.clip((img - lo) / (hi - lo), 0, 1)
    pix = (255 * norm[::-1]).astype(np.uint8)
    Image.fromarray(pix).resize((1200, 400)).save(os.path.join(out, "spectrograms", f"spec_{int(c0 / rate / 60):03d}min.png"))

arr = np.array(rows)
with open(os.path.join(out, "audio_frames.csv"), "w", newline="") as fh:
    w = csv.writer(fh)
    w.writerow(["t", "rms_db", "centroid_hz", "f0_hz", "tonality"])
    w.writerows(rows)

# Shift events: smoothed f0 rising over the previous 0.3 s, then a drop > 12 % within 0.12 s.
f0 = arr[:, 3]
ton = arr[:, 4]
sm = np.convolve(f0, np.ones(3) / 3, mode="same")
events = []
for i in range(8, len(sm) - 3):
    if ton[i] < 6:
        continue
    rising = sm[i] > sm[i - 6] * 1.04
    drop = min(sm[i + 1 : i + 3]) < sm[i] * 0.88
    if rising and drop and (not events or arr[i, 0] - events[-1][0] > 0.25):
        events.append((arr[i, 0], round(sm[i], 1), round(float(min(sm[i + 1 : i + 3])), 1)))
with open(os.path.join(out, "shift_events.csv"), "w", newline="") as fh:
    w = csv.writer(fh)
    w.writerow(["t", "f0_before_hz", "f0_after_hz"])
    w.writerows(events)

print("frames", len(rows), "shifts", len(events))
