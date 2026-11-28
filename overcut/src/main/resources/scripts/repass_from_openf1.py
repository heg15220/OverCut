"""
Cambios de posición en pista por pareja y re-pases reales, para calibrar la histéresis del duelo del modo por pasos del
Manager (paquete SIM-C3 de docs/manager/F1M24-CHINA.md §2.2 GS-05 / VIEW-09; RF-SIM-07, RNF-07):
data/balance/race-sim.json `duel.rePass.measured`.

Fuente: OpenF1 (https://openf1.org, API pública e histórica). Ningún dato personal en las peticiones: solo año, tipo
de sesión y claves de sesión. Por carrera (sin sprints) se leen `position` (cada cambio de puesto de la clasificación
en directo), `laps` (inicio de cada vuelta del líder, para pasar tiempos a vueltas), `pit` (entradas en boxes) y
`race_control` (coche de seguridad y VSC, con la lectura de race_yellows_from_openf1.py).

Un cambio de orden entre dos coches es un momento en que sus puestos se invierten. No cuentan:
  - la vuelta 1 (salida y primera curva) ni lo posterior a la bandera a cuadros;
  - los que caen dentro de un SC o VSC (y hasta la bandera verde siguiente);
  - los de una pareja con uno de los dos en boxes: desde PIT_BEFORE_SEC antes de su entrada hasta su duración en el
    pit lane más PIT_AFTER_SEC después (el ciclo de paradas reordena sin adelantamientos);
  - los de un coche que abandona (desaparece de la clasificación) en los RETIRE_SEC anteriores a su último dato.

Con lo que queda (cambios en pista con bandera verde) escribe, por carrera y en total: parejas con algún cambio, el
p95 y el máximo de cambios de una pareja en cualquier ventana de 10 vueltas del líder, y la parte de pases devueltos
(la pareja vuelve a invertirse) en la misma vuelta, en 1 y en 2 vueltas. Es la cifra que copia race-sim.json
`duel.rePass.measured`. Sin dependencias fuera de la biblioteca estándar.

    python overcut/src/main/resources/scripts/repass_from_openf1.py [--years 2023,2024] [--cache DIR] [--out FICHERO]
"""

import bisect
import json
import os
import sys
import urllib.parse

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import session_yellows_from_openf1 as base  # noqa: E402
from race_yellows_from_openf1 import neutralised_spells  # noqa: E402

PIT_BEFORE_SEC = 10.0
PIT_AFTER_SEC = 25.0
DEFAULT_LANE_SEC = 25.0
RETIRE_SEC = 60.0
WINDOW_LAPS = 10


def ts(text):
    """Seconds since the epoch of an OpenF1 date."""
    return base.when(text).timestamp()


def leader_lap_of(lap_starts):
    """A function race time -> leader's lap, from the earliest start of every lap number."""
    starts = sorted(lap_starts.items(), key=lambda kv: kv[0])
    laps = [lap for lap, _ in starts]
    times = [t for _, t in starts]

    def lap_at(t):
        k = bisect.bisect_right(times, t) - 1
        return laps[k] if k >= 0 else 0

    return lap_at


def flips_of(rows):
    """(time, a, b) for every pair of drivers whose places invert, from the position stream (batched by date)."""
    rows = sorted(rows, key=lambda r: r["date"])
    pos = {}
    out = []
    k = 0
    while k < len(rows):
        date = rows[k]["date"]
        batch = []
        while k < len(rows) and rows[k]["date"] == date:
            batch.append(rows[k])
            k += 1
        before = dict(pos)
        for row in batch:
            pos[row["driver_number"]] = row["position"]
        if not before:
            continue
        t = ts(date)
        moved = [row["driver_number"] for row in batch]
        for a in moved:
            for b in pos:
                if b == a or a not in before or b not in before:
                    continue
                if (before[a] - before[b]) * (pos[a] - pos[b]) < 0 and (b not in moved or a < b):
                    out.append((t, a, b))
    return out


def quantile(values, q):
    if not values:
        return None
    ordered = sorted(values)
    return ordered[min(len(ordered) - 1, max(0, int(-(-q * len(ordered) // 1)) - 1))]


def main(argv):
    years = [2023, 2024]
    out_path = None
    i = 0
    while i < len(argv):
        if argv[i] == "--years":
            years = [int(y) for y in argv[i + 1].split(",")]
            i += 2
        elif argv[i] == "--cache":
            base.CACHE = argv[i + 1]
            i += 2
        elif argv[i] == "--out":
            out_path = argv[i + 1]
            i += 2
        else:
            i += 1
    races = []
    windows = []
    passes = 0
    same_lap = 0
    within1 = 0
    within2 = 0
    for year in years:
        sessions = base.get("/sessions?" + urllib.parse.urlencode({"year": year, "session_type": "Race"}))
        for session in sessions:
            if "Sprint" in session.get("session_name", ""):
                continue
            key = {"session_key": session["session_key"]}
            positions = base.get("/position?" + urllib.parse.urlencode(key))
            laps = base.get("/laps?" + urllib.parse.urlencode(key))
            if not positions or not laps:
                continue
            pits = base.get("/pit?" + urllib.parse.urlencode(key)) or []
            messages = base.get("/race_control?" + urllib.parse.urlencode(key)) or []
            spells = [(a.timestamp(), b.timestamp()) for a, b in neutralised_spells(messages, base.when(session["date_end"]))]
            starts = {}
            for row in laps:
                if row.get("date_start") and row.get("lap_number"):
                    t = ts(row["date_start"])
                    starts[row["lap_number"]] = min(starts.get(row["lap_number"], t), t)
            if 2 not in starts:
                continue
            lap_at = leader_lap_of(starts)
            last_lap = max(starts)
            pit_spans = {}
            for row in pits:
                if not row.get("date"):
                    continue
                t = ts(row["date"])
                lane = row.get("pit_duration") or DEFAULT_LANE_SEC
                pit_spans.setdefault(row["driver_number"], []).append((t - PIT_BEFORE_SEC, t + lane + PIT_AFTER_SEC))
            # Each driver's last moment on track: the start of his last lap plus its time (or RETIRE_SEC).
            on_track = {}
            for row in laps:
                if row.get("date_start"):
                    t = ts(row["date_start"]) + (row.get("lap_duration") or RETIRE_SEC)
                    on_track[row["driver_number"]] = max(on_track.get(row["driver_number"], 0), t)
            final = max(on_track.values())

            def in_pit(d, t):
                return any(a <= t <= b for a, b in pit_spans.get(d, []))

            def retiring(d, t):
                # Out before the end (not a lapped finisher): its last RETIRE_SEC and everything after.
                gone = on_track.get(d)
                return gone is None or (gone < final - 3 * RETIRE_SEC and t >= gone - RETIRE_SEC)

            kept = {}
            for t, a, b in flips_of(positions):
                lap = lap_at(t)
                if lap < 2 or lap > last_lap:
                    continue
                if any(s <= t <= e for s, e in spells):
                    continue
                if in_pit(a, t) or in_pit(b, t) or retiring(a, t) or retiring(b, t):
                    continue
                pair = (min(a, b), max(a, b))
                # Who is ahead after the flip: the one that moved up (lower position number).
                kept.setdefault(pair, []).append((t, lap))
            race_windows = []
            for pair, flips in kept.items():
                flips.sort()
                laps_of = [lap for _, lap in flips]
                best = 0
                lo = 0
                for hi in range(len(laps_of)):
                    while laps_of[hi] - laps_of[lo] >= WINDOW_LAPS:
                        lo += 1
                    best = max(best, hi - lo + 1)
                race_windows.append(best)
                for k in range(len(flips)):
                    passes += 1
                    if k + 1 < len(flips):
                        gap = flips[k + 1][1] - flips[k][1]
                        if gap == 0:
                            same_lap += 1
                        if gap <= 1:
                            within1 += 1
                        if gap <= 2:
                            within2 += 1
            windows.extend(race_windows)
            races.append({
                "year": year,
                "session_key": session["session_key"],
                "circuit": session.get("circuit_short_name"),
                "pairs": len(kept),
                "flips": sum(len(f) for f in kept.values()),
                "p95PerPair10Laps": quantile(race_windows, 0.95),
                "maxPerPair10Laps": max(race_windows) if race_windows else 0,
            })
    out = {
        "source": "OpenF1 position/laps/pit/race_control, carreras " + ",".join(str(y) for y in years) + " (sin sprints)",
        "races": len(races),
        "greenTrackFlips": passes,
        "pairsWithFlips": len(windows),
        "p95PerPair10Laps": quantile(windows, 0.95),
        "maxPerPair10Laps": max(windows) if windows else 0,
        "rePassedSameLapShare": round(same_lap / passes, 4) if passes else None,
        "rePassedWithin1LapShare": round(within1 / passes, 4) if passes else None,
        "rePassedWithin2LapsShare": round(within2 / passes, 4) if passes else None,
        "byRace": races,
    }
    text = json.dumps(out, indent=1, ensure_ascii=False)
    if out_path:
        with open(out_path, "w", encoding="utf-8") as handle:
            handle.write(text + "\n")
    print(json.dumps({k: v for k, v in out.items() if k != "byRace"}, indent=1, ensure_ascii=False))


if __name__ == "__main__":
    main(sys.argv[1:])
