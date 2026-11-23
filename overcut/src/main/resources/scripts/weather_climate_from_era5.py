#!/usr/bin/env python3
"""
RF-SIM-11 (SRS 2.3 point 6): the weather climatology of every Grand Prix circuit, for the race
engine's seven-state weather chain (data/weather/climate.json, RNF-07).

    python overcut/src/main/resources/scripts/weather_climate_from_era5.py [--db PATH] [--out PATH]

Source: ERA5 hourly reanalysis (Copernicus Climate Change Service, Hersbach et al. 2020,
doi:10.1002/qj.3803) through the Open-Meteo historical weather API
(https://open-meteo.com/en/docs/historical-weather-api), at each circuit's coordinates from f1db
(circuit.latitude/longitude, f1db v2026.20.0). For every Grand Prix held from 1976 the script
reads the hours of the 31 days centred on the race date (precipitation, cloud cover, 2 m air
temperature), local time. Responses are cached under tools/assets/.cache/era5/.

Each hour is put in one of the seven states of data/balance/race-weather.json `states`:

  0 sunny     no rain (< 0.1 mm), cloud cover <= 37.5 %  (<= 3 oktas, WMO-No. 8 cloud amount)
  1 cloudy    no rain, cloud cover <= 87.5 %                (<= 7 oktas)
  2 overcast  no rain, cloud cover  > 87.5 %                (8 oktas)
  3 drizzle   ERA5 >= 0.1 mm/h (its resolution)
  4 light     ERA5 >= 0.25 mm/h (AMS 1 / 4; ERA5 steps of 0.1: 0.3 and up)
  5 moderate  ERA5 >= 0.625 mm/h (2.5 / 4)
  6 heavy     ERA5 >= 1.9 mm/h (7.6 / 4)

The rain thresholds are the American Meteorological Society classes (light < 2.5 mm/h, moderate
2.5-7.6, heavy > 7.6; Glossary of Meteorology, "rain") divided by ERA5_BIAS = 4: a 31 km grid
mean an hour long smooths showers, and on the named wet races of `CHECKS` ERA5 reports a fifth
or less of the rates the stewards raced in (Suzuka 2022 2.4 mm/h, red flag; Interlagos 2024
2.5, red flag; Montreal 2024 2.2, wet tyres at the start; Spa 2021 0.6-0.8, no racing laps;
Silverstone 2024 0.5, intermediates). The factor is inferred (NV) from those races.

Per circuit and race month it writes:
  start    the share of each state at the circuit's local start hour over all window days
  matrix   the hourly transition matrix between states over the race afternoon (start hour to
           start hour + 3), each row shrunk to the all-circuit matrix with PRIOR pseudo-counts
  airC     median and spread of the 2 m temperature at the start hour, dry and wet hours
  samples  window days counted

Nothing here is tuned: every share is a count of ERA5 hours.
"""

import argparse
import json
import os
import sqlite3
import statistics
import time
import urllib.request
from datetime import date, timedelta

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", "..", "..", ".."))
DEFAULT_DB = os.path.join(ROOT, "tools", "assets", ".cache", "f1db", "f1db.db")
CACHE = os.path.join(ROOT, "tools", "assets", ".cache", "era5")
DEFAULT_OUT = os.path.join(ROOT, "overcut", "frontend", "src", "modules", "overcutManager", "data", "weather", "climate.json")
API = "https://archive-api.open-meteo.com/v1/archive"

ERA5_BIAS = 4
# AMS class limits (mm/h): light rain from 1, moderate from 2.5, heavy from 7.6; drizzle is any
# measurable ERA5 hour (0.1 mm, its resolution). Divided by ERA5_BIAS and set by main().
AMS = {"light": 1.0, "moderate": 2.5, "heavy": 7.6}
RAIN = []


def set_bias(bias):
    """ERA5 reports 0.1 mm steps: a limit of 0.25 means 0.3 and up."""
    RAIN.clear()
    for name, state in (("heavy", 6), ("moderate", 5), ("light", 4)):
        RAIN.append((max(0.1, AMS[name] / bias - 1e-9), state))
    RAIN.append((0.1 - 1e-9, 3))
PRIOR = 30
WINDOW = 15
AFTERNOON = 3
# First night (or twilight) race at the circuits that now start after 17:00 local; before it the
# race started in the afternoon (14:00 local). Singapore 2008, Abu Dhabi 2009 (twilight), Bahrain 2014.
NIGHT_FROM = {"marina-bay": 2008, "yas-marina": 2009, "bahrain": 2014}
DEFAULT_START = 14

# Ergast-style circuit refs (the engine's non-pack calendars, reference.js) -> f1db circuit ids.
ALIASES = {
    "albert_park": "melbourne", "villeneuve": "montreal", "red_bull_ring": "spielberg", "spa": "spa-francorchamps",
    "marina_bay": "marina-bay", "americas": "austin", "rodriguez": "mexico-city", "vegas": "las-vegas", "losail": "lusail",
    "yas_marina": "yas-marina", "magny_cours": "magny-cours", "ricard": "paul-ricard", "galvez": "buenos-aires",
    "long_beach": "long-beach", "brands_hatch": "brands-hatch", "watkins_glen": "watkins-glen", "okayama": "aida",
    "osterreichring": "spielberg", "a1-ring": "spielberg", "hockenheim": "hockenheimring", "nurburgring_gp": "nurburgring",
    "korea": "yeongam", "buddh_international": "buddh", "istanbul_park": "istanbul", "valencia_street": "valencia",
}

CHECKS = [("suzuka", "2022-10-09"), ("interlagos", "2024-11-03"), ("montreal", "2024-06-09"), ("spa-francorchamps", "2021-08-29"), ("silverstone", "2024-07-07"), ("fuji", "2007-09-30")]


def fetch(lat, lon, start, end):
    os.makedirs(CACHE, exist_ok=True)
    file = os.path.join(CACHE, f"{lat:.3f}_{lon:.3f}_{start}_{end}.json")
    if os.path.exists(file):
        with open(file, encoding="utf-8") as handle:
            return json.load(handle)
    url = f"{API}?latitude={lat}&longitude={lon}&start_date={start}&end_date={end}&hourly=precipitation,cloud_cover,temperature_2m&timezone=auto"
    for attempt in range(6):
        try:
            with urllib.request.urlopen(url, timeout=60) as response:
                data = json.loads(response.read().decode("utf-8"))
            break
        except Exception:  # noqa: BLE001 - rate limit: wait and retry
            if attempt == 5:
                raise
            time.sleep(10 + attempt * 20)
    with open(file, "w", encoding="utf-8") as handle:
        json.dump(data, handle)
    time.sleep(0.25)
    return data


def state_of(precip, cloud):
    if precip is None:
        return None
    for threshold, state in RAIN:
        if precip >= threshold:
            return state
    if cloud is None:
        return 1
    return 0 if cloud <= 37.5 else 1 if cloud <= 87.5 else 2


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--db", default=DEFAULT_DB)
    parser.add_argument("--out", default=DEFAULT_OUT)
    parser.add_argument("--bias", type=float, default=ERA5_BIAS)
    args = parser.parse_args()
    set_bias(args.bias)
    db = sqlite3.connect(args.db)
    races = list(db.execute(
        "select r.year, r.date, r.time, r.circuit_id, c.latitude, c.longitude from race r join circuit c on c.id = r.circuit_id where r.year >= 1976 order by r.year, r.round"
    ))
    # Local start hour per circuit from the timed races (f1db `time` is UTC, from 2024).
    timed = {}
    per = {}
    # ERA5 reaches the archive about five days late: windows are cut a week before today and
    # races still to come (the end of the current season) are left out.
    cutoff = date.today() - timedelta(days=7)
    for year, day, utc, circuit, lat, lon in races:
        d = date.fromisoformat(day)
        if d - timedelta(days=WINDOW) > cutoff:
            continue
        data = fetch(lat, lon, (d - timedelta(days=WINDOW)).isoformat(), min(cutoff, d + timedelta(days=WINDOW)).isoformat())
        offset = data.get("utc_offset_seconds", 0) / 3600
        if utc:
            timed[circuit] = (int(utc[:2]) + offset) % 24
        per.setdefault(circuit, []).append((year, d, data))
    out = {}
    global_counts = [[0] * 7 for _ in range(7)]
    tables = {}
    for circuit, rows in per.items():
        for year, d, data in rows:
            start = timed.get(circuit, DEFAULT_START)
            if circuit in NIGHT_FROM and year < NIGHT_FROM[circuit]:
                start = DEFAULT_START
            start = int(round(start))
            # A circuit that later raced at night keeps its afternoon years apart ("<month>d").
            month = f"{d.month}d" if circuit in NIGHT_FROM and year < NIGHT_FROM[circuit] else str(d.month)
            entry = tables.setdefault((circuit, month), {"start": [0] * 7, "counts": [[0] * 7 for _ in range(7)], "dry": [], "wet": [], "days": 0, "years": set(), "hour": start})
            entry["years"].add(year)
            hourly = data["hourly"]
            states = [state_of(p, c) for p, c in zip(hourly["precipitation"], hourly["cloud_cover"])]
            for k, stamp in enumerate(hourly["time"]):
                hour = int(stamp[11:13])
                s = states[k]
                if s is None:
                    continue
                if hour == start:
                    entry["start"][s] += 1
                    entry["days"] += 1
                    temp = hourly["temperature_2m"][k]
                    if temp is not None:
                        (entry["wet"] if s >= 3 else entry["dry"]).append(temp)
                if start <= hour < start + AFTERNOON and k + 1 < len(states) and states[k + 1] is not None:
                    entry["counts"][s][states[k + 1]] += 1
                    global_counts[s][states[k + 1]] += 1
    global_rows = [[c / max(1, sum(row)) for c in row] for row in global_counts]
    for (circuit, month), entry in sorted(tables.items()):
        matrix = []
        for i, row in enumerate(entry["counts"]):
            total = sum(row)
            matrix.append([round((row[j] + PRIOR * global_rows[i][j]) / (total + PRIOR), 4) for j in range(7)])
        days = entry["days"]
        dry = entry["dry"]
        wet = entry["wet"]
        out.setdefault(circuit, {})[month] = {
            "start": [round(c / max(1, days), 4) for c in entry["start"]],
            "matrix": matrix,
            "startHour": entry["hour"],
            "airC": {
                "dry": round(statistics.median(dry), 1) if dry else None,
                "drySd": round(statistics.pstdev(dry), 1) if len(dry) > 1 else None,
                "wet": round(statistics.median(wet), 1) if wet else None,
            },
            "samples": days,
            "years": len(entry["years"]),
        }
    checks = {}
    coords = {circuit: (lat, lon) for _, _, _, circuit, lat, lon in races}
    for circuit, day in CHECKS:
        if circuit not in coords:
            continue
        lat, lon = coords[circuit]
        d = date.fromisoformat(day)
        data = fetch(lat, lon, (d - timedelta(days=WINDOW)).isoformat(), (d + timedelta(days=WINDOW)).isoformat())
        hourly = data["hourly"]
        hours = [(t[11:13], p) for t, p in zip(hourly["time"], hourly["precipitation"]) if t.startswith(day) and 12 <= int(t[11:13]) <= 17]
        checks[f"{circuit} {day}"] = {"maxMmPerHour": max(p for _, p in hours), "states": [state_of(p, 100) for _, p in hours]}
    doc = {
        "$comment": (
            "RF-SIM-11 (SRS 2.3 punto 6): climatología por circuito y mes de carrera, generada por "
            "overcut/src/main/resources/scripts/weather_climate_from_era5.py desde ERA5 (Copernicus C3S, Hersbach et al. 2020, "
            "doi:10.1002/qj.3803) vía la API histórica de Open-Meteo, en las coordenadas de f1db, con los 31 días centrados en "
            "cada GP desde 1976. start = reparto de los 7 estados a la hora local de salida; matrix = transición horaria entre "
            "estados en la tarde de carrera (encogida hacia la matriz de todos los circuitos con " + str(PRIOR) + " pseudo-cuentas); "
            "airC = temperatura a 2 m a la hora de salida (mediana seca y con lluvia). Umbrales de lluvia: clases AMS / "
            + str(args.bias) + " (sesgo de la rejilla de ERA5, NV: con él la cadena da tantas carreras con neumáticos de mojado en 2023-2025 como las reales de OpenF1, ver race-weather.json measured.usage y scripts/measureWeather.js; `checks` muestra que las carreras mojadas conocidas caen en lluvia). No se edita a mano."
        ),
        "source": "ERA5 hourly via https://archive-api.open-meteo.com/v1/archive; circuits and dates from f1db v2026.20.0",
        "era5Bias": args.bias,
        "thresholdsMmPerHour": {"drizzle": 0.1, "light": round(AMS["light"] / args.bias, 3), "moderate": round(AMS["moderate"] / args.bias, 3), "heavy": round(AMS["heavy"] / args.bias, 3)},
        "cloudOktas": {"sunny": 3, "cloudy": 7},
        "global": {
            "matrix": [[round(v, 4) for v in row] for row in global_rows],
            "start": [round(sum(e["start"][s] for e in tables.values()) / max(1, sum(e["days"] for e in tables.values())), 4) for s in range(7)],
            "airC": {
                "dry": round(statistics.median([t for e in tables.values() for t in e["dry"]]), 1),
                "drySd": round(statistics.pstdev([t for e in tables.values() for t in e["dry"]]), 1),
                "wet": round(statistics.median([t for e in tables.values() for t in e["wet"]]), 1),
            },
            "startHour": DEFAULT_START,
        },
        "checks": checks,
        "aliases": {k: v for k, v in ALIASES.items() if v in out},
        "nightFrom": NIGHT_FROM,
        "circuits": out,
    }
    os.makedirs(os.path.dirname(args.out), exist_ok=True)
    with open(args.out, "w", encoding="utf-8") as handle:
        json.dump(doc, handle, separators=(",", ":"))
    print(f"{len(tables)} circuit-months from {len(races)} races -> {args.out}")
    print(json.dumps(checks))


if __name__ == "__main__":
    main()
