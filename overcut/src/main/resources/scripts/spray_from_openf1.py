#!/usr/bin/env python3
"""
GS-11 / WX-C2 (F1M24-CHINA §2.9; RF-SIM-11, RF-SIM-06, RNF-07): the time a car loses following
another through the spray on a wet track, measured from real races, for race-weather.json `spray`.

    python overcut/src/main/resources/scripts/spray_from_openf1.py [--out PATH] [--years 2023 2024 2025]

Reads OpenF1 (https://openf1.org, public API: laps, stints, intervals, race_control; no personal
data in the requests) for every Grand Prix of the given years in which a car ran intermediates or
full wets (the same races as wet_tyres_from_openf1.py, `measured.usage`). Responses are cached
under tools/assets/.cache/openf1/ (shared with wet_tyres_from_openf1.py), so a rerun is offline.

Per lap of each driver (green flag, not lap 1, not an out-lap or in-lap, within 107 % + 6 s of
that lap's best on the same tyre family):

  gap      the mean OpenF1 `interval` (to the car ahead) over the lap's timing window.
  residual the lap time minus the median lap of the same tyre family on that lap (>= 3 cars).
  level    the spray level the engine uses, min(1, h / interMm), read from that lap's family
           median over the dry race pace (pole x raceFromPole) by inverting race-weather.json
           grip: inter (ratio - interDryRatio) / (interWetRatio - interDryRatio), wet
           (ratio - wetDryRatio) / wetSlopePerInterCap. Slick laps with the slick median under
           dryBelowRatio are the dry control (no spray, only dirty air).
  excess   the residual minus the same driver's mean residual in clean air (gap > cleanFromSec)
           on the same tyre family within nearLaps laps (at least two such laps): what following
           costs him, with his pace and the field's drift over the lap number taken out.
  pole     the dry pole: the quickest pole at that GP in 2023-2025 (a wet qualifying slows its
           own pole).

The laps within windowSec of the car ahead then give:
    extraSec = mean(excess, wet) - mean(excess, dry)   what the wet adds to the dirty air
    k        = mean(level * (1 - gap / windowSec), wet) the engine's shape on those same laps
    lossSec  = extraSec / k                              (engine/weather sprayLossOf:
                                                          lossSec * level * (1 - gap / windowSec))
with a 95 % interval from a seeded bootstrap (1,000 resamples). A three-term least squares
(excess = c + a x + L level x) was tried and dropped: with ~350 laps level and gap are too
collinear and L swung from -1.5 to +2.9 s with the reference window; the difference of means
stayed at 0.29-0.40 s for windows of 3 to 12 laps.

Every sample used is in the output (gap, level, excess, class), so the engine test
(engine/weather/weather.test.js, __fixtures__/openf1-wet-spray.json) recomputes the measurement
and checks the engine's loss against it. Nothing is tuned here.
"""

import argparse
import json
import os
import random
import statistics
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from wet_tyres_from_openf1 import PACKS, RACE_FROM_POLE, ROOT, family, get, ts  # noqa: E402

BALANCE = os.path.join(ROOT, "overcut", "frontend", "src", "modules", "overcutManager", "data", "balance", "race-weather.json")
DEFAULT_OUT = os.path.join(ROOT, "overcut", "frontend", "src", "modules", "overcutManager", "engine", "weather", "__fixtures__", "openf1-wet-spray.json")
FOLLOW_SEC = 1.5     # race-weather.json spray.windowSec: the spray window the engine uses
CLEAN_FROM_SEC = 3.0  # F1M24-CHINA §2.9 GS-11: clean air is more than 3 s behind the car ahead
DRY_BELOW_RATIO = 1.03  # a slick median within 3 % of the dry race pace: a dry lap (no spray)
NEAR_LAPS = 8  # the clean-air reference: the same driver on the same tyre family within 8 laps
POLE_YEARS = (2023, 2024, 2025)


def dry_pole(event):
    """The quickest pole at this GP over POLE_YEARS (f1db, season packs): a wet qualifying slows
    its own pole (Canada 2023, Sao Paulo 2024), and the layouts did not change in those years."""
    poles = []
    for year in POLE_YEARS:
        path = os.path.join(PACKS, f"{year}.json")
        if not os.path.exists(path):
            continue
        with open(path, encoding="utf-8") as handle:
            pack = json.load(handle)
        other = next((c for c in pack["calendar"] if c.get("name") == event.get("name")), None)
        pole = (other or {}).get("refLaps", {}).get("pole")
        if pole:
            poles.append(pole)
    return min(poles) if poles else None


def neutral_laps(control):
    neutral, open_from = set(), None
    for row in sorted(control, key=lambda r: r["date"]):
        message = (row.get("message") or "").upper()
        lap = row.get("lap_number") or 0
        if ("SAFETY CAR DEPLOYED" in message or "VSC DEPLOYED" in message or "RED FLAG" in message) and open_from is None:
            open_from = lap
        if ("IN THIS LAP" in message or "VSC ENDING" in message or "RESUME" in message or "GREEN LIGHT" in message) and open_from is not None:
            neutral.update(range(open_from, lap + 2))
            open_from = None
    if open_from is not None:
        neutral.update(range(open_from, 400))
    return neutral


def level_of(fam, ratio, grip):
    if fam == "inter":
        value = (ratio - grip["interDryRatio"]) / (grip["interWetRatio"] - grip["interDryRatio"])
    elif fam == "wet":
        value = (ratio - grip["wetDryRatio"]) / grip["wetSlopePerInterCap"]
    else:
        return 0.0
    return max(0.0, min(1.0, value))


def numeric(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool)


def race_samples(session, grip):
    key = session["session_key"]
    stints = get(f"stints?session_key={key}")
    if not any(family(s.get("compound")) in ("inter", "wet") for s in stints):
        return None
    with open(os.path.join(PACKS, f"{session['year']}.json"), encoding="utf-8") as handle:
        pack = json.load(handle)
    event = next((c for c in pack["calendar"] if c.get("date") == session["date_start"][:10]), None)
    pole = dry_pole(event) if event else None
    if not pole:
        print(f"skip {session['year']} {session['location']}: no pole in the pack", file=sys.stderr)
        return None
    base = pole * RACE_FROM_POLE
    laps = get(f"laps?session_key={key}")
    neutral = neutral_laps(get(f"race_control?session_key={key}"))
    intervals = get(f"intervals?session_key={key}")
    compound_of = {}
    for s in stints:
        fam = family(s.get("compound"))
        if fam and s.get("lap_start") is not None:
            for lap in range(s["lap_start"], (s.get("lap_end") or s["lap_start"]) + 1):
                compound_of[(s["driver_number"], lap)] = (fam, lap == s["lap_start"])
    by_driver = {}
    for row in intervals:
        if numeric(row.get("interval")):
            by_driver.setdefault(row["driver_number"], []).append((ts(row["date"]), row["interval"]))
    for rows in by_driver.values():
        rows.sort()
    rows = []
    for row in laps:
        lap, dur = row.get("lap_number"), row.get("lap_duration")
        if not lap or not dur or lap < 2 or lap in neutral or row.get("is_pit_out_lap") or not row.get("date_start"):
            continue
        info, nxt = compound_of.get((row["driver_number"], lap)), compound_of.get((row["driver_number"], lap + 1))
        if not info or info[1] or (nxt and nxt[1]):
            continue
        t0 = ts(row["date_start"])
        gaps = [g for t, g in by_driver.get(row["driver_number"], []) if t0 <= t <= t0 + dur]
        if not gaps:
            continue
        rows.append({"driver": row["driver_number"], "lap": lap, "fam": info[0], "dur": dur, "gap": statistics.mean(gaps)})
    by_lap = {}
    for r in rows:
        by_lap.setdefault((r["lap"], r["fam"]), []).append(r)
    kept = []
    for (lap, fam), group in by_lap.items():
        best = min(r["dur"] for r in group)
        group = [r for r in group if r["dur"] <= best * 1.07 + 6]
        if len(group) < 3:
            continue
        median = statistics.median(r["dur"] for r in group)
        ratio = median / base
        if fam == "slick":
            if ratio >= DRY_BELOW_RATIO:
                continue
            cls, level = "dry", 0.0
        else:
            cls, level = "wet", level_of(fam, ratio, grip)
        for r in group:
            kept.append({**r, "cls": cls, "level": level, "residual": r["dur"] - median})
    clean = {}
    for r in kept:
        if r["gap"] > CLEAN_FROM_SEC:
            clean.setdefault((r["driver"], r["fam"]), []).append((r["lap"], r["residual"]))
    samples = []
    for r in kept:
        if r["gap"] >= FOLLOW_SEC:
            continue
        ref = [v for lap, v in clean.get((r["driver"], r["fam"]), []) if abs(lap - r["lap"]) <= NEAR_LAPS]
        if len(ref) < 2:
            continue
        samples.append([round(r["gap"], 3), round(r["level"], 3), round(r["residual"] - statistics.mean(ref), 3), r["cls"]])
    name = event.get("name") if event else session["location"]
    return {"race": f"{session['year']} {name}", "sessionKey": key, "pole": pole, "samples": samples}


def estimate(wet, dry):
    extra = statistics.mean(r[2] for r in wet) - statistics.mean(r[2] for r in dry)
    shape = statistics.mean(r[1] * (1 - r[0] / FOLLOW_SEC) for r in wet)
    return extra, shape, extra / shape


def bootstrap(wet, dry, runs=1000, seed=0):
    rnd = random.Random(seed)
    values = sorted(estimate([rnd.choice(wet) for _ in wet], [rnd.choice(dry) for _ in dry])[2] for _ in range(runs))
    return values[int(runs * 0.025)], values[int(runs * 0.975) - 1]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--years", nargs="*", type=int, default=[2023, 2024, 2025])
    parser.add_argument("--out", default=DEFAULT_OUT)
    parser.add_argument("--trim", type=float, default=4.0, help="drop samples whose excess is beyond +-TRIM s (a spin, a lock-up, a lift for a yellow)")
    args = parser.parse_args()
    with open(BALANCE, encoding="utf-8") as handle:
        grip = json.load(handle)["grip"]
    races = []
    for year in args.years:
        for session in get(f"sessions?session_name=Race&year={year}"):
            if session.get("session_type") != "Race":
                continue
            try:
                found = race_samples(session, grip)
            except Exception as error:  # noqa: BLE001 - a cancelled race has no feed (404)
                print(f"skip {year} {session['location']}: {error}", file=sys.stderr)
                continue
            if found and found["samples"]:
                races.append(found)
                print(f"{found['race']}: {len(found['samples'])} close laps", file=sys.stderr)
    rows = [s for race in races for s in race["samples"] if abs(s[2]) <= args.trim]
    wet = [s for s in rows if s[3] == "wet"]
    dry = [s for s in rows if s[3] == "dry"]
    extra, shape, loss = estimate(wet, dry)
    low, high = bootstrap(wet, dry)
    out = {
        "$comment": "GS-11 / WX-C2 (F1M24-CHINA §2.9): time lost following through the spray, from OpenF1 wet races 2023-2025. Generated by overcut/src/main/resources/scripts/spray_from_openf1.py (method in its docstring); do not edit by hand. samples: [gap s, spray level 0..1, excess s over the driver's own clean-air laps, class wet|dry]. result: extraSec = mean wet excess - mean dry excess, shape = mean(level x (1 - gap / windowSec)) over the wet laps, lossSec = extraSec / shape, ci95 from a seeded bootstrap.",
        "source": "https://api.openf1.org/v1/{sessions,laps,stints,intervals,race_control}",
        "status": "measured",
        "method": {"windowSec": FOLLOW_SEC, "cleanFromSec": CLEAN_FROM_SEC, "nearLaps": NEAR_LAPS, "dryBelowRatio": DRY_BELOW_RATIO, "raceFromPole": RACE_FROM_POLE, "poleYears": list(POLE_YEARS), "trimSec": args.trim},
        "result": {
            "wet": len(wet),
            "dry": len(dry),
            "wetExcessSec": round(statistics.mean(s[2] for s in wet), 4),
            "dryExcessSec": round(statistics.mean(s[2] for s in dry), 4),
            "extraSec": round(extra, 4),
            "shape": round(shape, 4),
            "lossSec": round(loss, 3),
            "ci95": [round(low, 3), round(high, 3)],
        },
        "races": [{"race": r["race"], "sessionKey": r["sessionKey"], "pole": r["pole"], "samples": [s for s in r["samples"] if abs(s[2]) <= args.trim]} for r in races],
    }
    os.makedirs(os.path.dirname(args.out), exist_ok=True)
    with open(args.out, "w", encoding="utf-8") as handle:
        json.dump(out, handle, indent=1)
        handle.write("\n")
    print(json.dumps(out["result"], indent=1))


if __name__ == "__main__":
    main()
