#!/usr/bin/env python3
"""
RF-SIM-11 / RF-SIM-03: real wet-race tyre figures for the race engine's water and grip model
(data/balance/race-weather.json `measured.openf1`, RNF-07).

    python overcut/src/main/resources/scripts/wet_tyres_from_openf1.py [--out PATH] [--years 2023 2024 2025]

Reads OpenF1 (https://openf1.org, public API, timing data of the FIA/FOM live timing) for every
Grand Prix of the given years: weather (rainfall flag, track temperature, one row a minute),
stints (compound per lap range), laps (lap duration, pit-out laps) and race control (safety
car, VSC, red flag). Responses are cached under tools/assets/.cache/openf1/ so a rerun works
offline. A race is used when the weather feed reports rain during it or a car ran a wet
compound.

Per race it measures, from green-flag laps that are not out-laps (or in-laps) and are within
the 107 % of that lap's best (so traffic accidents and spins are left out):

  - the median lap per compound family (SLICK, INTERMEDIATE, WET) and lap, against the race's
    reference: the pole time (qualifying, from f1db through the season pack, given in POLES).
  - the slick/inter crossover: the first lap where the slick median beats the inter median
    with at least two cars on each, the inter ratio to the pole there, and the minutes from
    the last rainfall row to that lap.
  - the inter/wet crossover, the same way.
  - the ratio of inter laps and wet laps to the pole while it is raining.

Nothing is tuned here: every number in the output is a median of real laps.
"""

import argparse
import json
import os
import statistics
import sys
import time
import urllib.request
from datetime import datetime

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", "..", "..", ".."))
CACHE = os.path.join(ROOT, "tools", "assets", ".cache", "openf1")
DEFAULT_OUT = os.path.join(ROOT, "tools", "assets", ".cache", "openf1", "wet-tyres.json")
API = "https://api.openf1.org/v1"
SLICKS = {"SOFT", "MEDIUM", "HARD", "HYPERSOFT", "ULTRASOFT", "SUPERSOFT"}


def get(path):
    os.makedirs(CACHE, exist_ok=True)
    key = path.replace("/", "_").replace("?", "_").replace("&", "_").replace("=", "-")
    file = os.path.join(CACHE, key + ".json")
    if os.path.exists(file):
        with open(file, encoding="utf-8") as handle:
            return json.load(handle)
    for attempt in range(4):
        try:
            with urllib.request.urlopen(f"{API}/{path}", timeout=60) as response:
                data = json.loads(response.read().decode("utf-8"))
            break
        except Exception as error:  # noqa: BLE001 - rate limits and timeouts: wait and retry
            if attempt == 3:
                raise
            time.sleep(3 + attempt * 5)
    with open(file, "w", encoding="utf-8") as handle:
        json.dump(data, handle)
    time.sleep(0.4)
    return data


def ts(value):
    return datetime.fromisoformat(value.replace("Z", "+00:00")).timestamp()


def family(compound):
    if compound in SLICKS:
        return "slick"
    if compound == "INTERMEDIATE":
        return "inter"
    if compound == "WET":
        return "wet"
    return None


def analyse(session):
    key = session["session_key"]
    weather = get(f"weather?session_key={key}")
    stints = get(f"stints?session_key={key}")
    rain_rows = [ts(row["date"]) for row in weather if row.get("rainfall")]
    wet_tyre = any(family(s.get("compound")) in ("inter", "wet") for s in stints)
    if not rain_rows and not wet_tyre:
        return None
    laps = get(f"laps?session_key={key}")
    control = get(f"race_control?session_key={key}")
    # Neutralised laps (SC, VSC, red flag): by the leader's lap number in race control.
    neutral = set()
    open_from = None
    for row in sorted(control, key=lambda r: r["date"]):
        message = (row.get("message") or "").upper()
        lap = row.get("lap_number") or 0
        if ("SAFETY CAR DEPLOYED" in message or "VSC DEPLOYED" in message or "RED FLAG" in message) and open_from is None:
            open_from = lap
        if ("IN THIS LAP" in message or "VSC ENDING" in message or "RESUME" in message or "GREEN LIGHT" in message) and open_from is not None:
            neutral.update(range(open_from, lap + 2))
            open_from = None
    compound_of = {}
    for s in stints:
        fam = family(s.get("compound"))
        if not fam or s.get("lap_start") is None:
            continue
        for lap in range(s["lap_start"], (s.get("lap_end") or s["lap_start"]) + 1):
            compound_of[(s["driver_number"], lap)] = (fam, lap == s["lap_start"])
    by_lap = {}
    lap_time_of = {}
    for row in laps:
        lap = row.get("lap_number")
        dur = row.get("lap_duration")
        if not lap or not dur or lap <= 1 or lap in neutral or row.get("is_pit_out_lap"):
            continue
        info = compound_of.get((row["driver_number"], lap))
        if not info or info[1]:
            continue
        nxt = compound_of.get((row["driver_number"], lap + 1))
        if nxt and nxt[1]:
            continue  # in-lap
        by_lap.setdefault(lap, []).append((info[0], dur))
        if row.get("date_start"):
            lap_time_of.setdefault(lap, []).append(ts(row["date_start"]))
    medians = {}
    for lap, rows in by_lap.items():
        best = min(d for _, d in rows)
        out = {}
        for fam in ("slick", "inter", "wet"):
            vals = [d for f, d in rows if f == fam and d <= best * 1.07 + 6]
            if len(vals) >= 2:
                out[fam] = (statistics.median(vals), len(vals))
        medians[lap] = out
    lap_start = {lap: min(values) for lap, values in lap_time_of.items()}

    def raining_at(t):
        return any(abs(r - t) <= 90 for r in rain_rows)

    def crossover(a, b):
        for lap in sorted(medians):
            m = medians[lap]
            if a in m and b in m and m[b][0] < m[a][0]:
                return lap, m[a][0], m[b][0]
        return None

    result = {"sessionKey": key, "year": session["year"], "location": session["location"], "date": session["date_start"][:10], "rainMinutes": len(rain_rows)}
    temps = [row["track_temperature"] for row in weather if row.get("track_temperature") is not None]
    result["trackTempC"] = round(statistics.median(temps), 1) if temps else None
    for a, b in (("inter", "slick"), ("wet", "inter")):
        found = crossover(a, b)
        if not found:
            continue
        lap, ta, tb = found
        entry = {"lap": lap, a: round(ta, 3), b: round(tb, 3)}
        t = lap_start.get(lap)
        if t and rain_rows:
            before = [r for r in rain_rows if r <= t]
            if before:
                entry["minutesSinceRain"] = round((t - max(before)) / 60, 1)
        result[f"{b}Over{a.capitalize()}"] = entry
    # Wet-weather pace while it is raining (or, without the feed, on wet tyres) by family.
    raining = {"inter": [], "wet": [], "slick": []}
    for lap, m in medians.items():
        t = lap_start.get(lap)
        if t is None or not raining_at(t):
            continue
        for fam, (value, _) in m.items():
            raining[fam].append(value)
    result["rainingMedian"] = {fam: round(statistics.median(v), 3) for fam, v in raining.items() if v}
    all_fam = {"inter": [], "wet": [], "slick": []}
    for m in medians.values():
        for fam, (value, _) in m.items():
            all_fam[fam].append(value)
    result["bestMedian"] = {fam: round(min(v), 3) for fam, v in all_fam.items() if v}
    result["lapsByFamily"] = {fam: len(v) for fam, v in all_fam.items()}
    return result


PACKS = os.path.join(ROOT, "overcut", "frontend", "src", "modules", "overcutManager", "data", "seasons")
RACE_FROM_POLE = 1.067  # data/balance/pack-world.json raceFromPole: median race lap over pole, f1db


def per_lap(session, name):
    """--per-lap: the median lap of each compound family per lap over pole x raceFromPole (the
    sim's dry race pace), marking laps with rainfall (R). The crossovers and drying slopes of
    race-weather.json `measured.openf1` were read from these tables."""
    key = session["session_key"]
    with open(os.path.join(PACKS, f"{session['year']}.json"), encoding="utf-8") as handle:
        pack = json.load(handle)
    event = next((c for c in pack["calendar"] if c["name"] == name), None)
    if not event or not (event.get("refLaps") or {}).get("pole"):
        return
    base = event["refLaps"]["pole"] * RACE_FROM_POLE
    weather = get(f"weather?session_key={key}")
    rain = [ts(r["date"]) for r in weather if r.get("rainfall")]
    compound_of = {}
    for s in get(f"stints?session_key={key}"):
        fam = family(s.get("compound"))
        if fam and s.get("lap_start"):
            for lap in range(s["lap_start"], (s.get("lap_end") or s["lap_start"]) + 1):
                compound_of[(s["driver_number"], lap)] = (fam, lap == s["lap_start"])
    by, start = {}, {}
    for row in get(f"laps?session_key={key}"):
        lap, dur = row.get("lap_number"), row.get("lap_duration")
        if not lap or not dur or lap < 2 or row.get("is_pit_out_lap"):
            continue
        info, nxt = compound_of.get((row["driver_number"], lap)), compound_of.get((row["driver_number"], lap + 1))
        if not info or info[1] or (nxt and nxt[1]):
            continue
        by.setdefault(lap, {}).setdefault(info[0], []).append(dur)
        if row.get("date_start"):
            start.setdefault(lap, []).append(ts(row["date_start"]))
    print(f"== {session['year']} {name} pole {event['refLaps']['pole']} dry race pace {base:.2f}")
    for lap in sorted(by):
        t = min(start.get(lap, [0]))
        mark = "R" if any(abs(x - t) <= 120 for x in rain) else " "
        cells = " ".join(f"{fam}{len(v)}:{statistics.median(v) / base:.3f}" for fam, v in sorted(by[lap].items()))
        print(f" L{lap:2d} {mark} {cells}")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--per-lap", nargs=2, metavar=("YEAR", "PACK_NAME"), help="print the per-lap table of one race, e.g. 2024 Canada")
    parser.add_argument("--years", nargs="*", type=int, default=[2023, 2024, 2025])
    parser.add_argument("--out", default=DEFAULT_OUT)
    args = parser.parse_args()
    if args.per_lap:
        year, name = int(args.per_lap[0]), args.per_lap[1]
        pack = json.load(open(os.path.join(PACKS, f"{year}.json"), encoding="utf-8"))
        event = next(c for c in pack["calendar"] if c["name"] == name)
        session = next(s for s in get(f"sessions?session_name=Race&year={year}") if s["date_start"][:10] == event["date"])
        per_lap(session, name)
        return
    races = []
    for year in args.years:
        for session in get(f"sessions?session_name=Race&year={year}"):
            if session.get("session_type") != "Race":
                continue
            try:
                found = analyse(session)
            except Exception as error:  # noqa: BLE001
                print(f"skip {year} {session['location']}: {error}", file=sys.stderr)
                continue
            if found:
                races.append(found)
                print(json.dumps(found), file=sys.stderr)
    os.makedirs(os.path.dirname(args.out), exist_ok=True)
    with open(args.out, "w", encoding="utf-8") as handle:
        json.dump({"source": "OpenF1 https://openf1.org (weather, stints, laps, race_control)", "races": races}, handle, indent=1)
    print(f"{len(races)} wet or mixed races -> {args.out}")


if __name__ == "__main__":
    main()
