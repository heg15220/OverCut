#!/usr/bin/env python3
"""
GS-13 (F1M24-CHINA §2.9-2.10; RF-SIM-03, RF-SIM-11, RNF-07): the fixture of a wet session from
OpenF1 for engine/weather/weather.test.js.

    python overcut/src/main/resources/scripts/wet_session_from_openf1.py [--session 9668] [--out PATH]

Reads OpenF1 (https://openf1.org, public API, FIA/FOM live timing; no personal data is sent) for
one session: weather (one row a minute: air, track, humidity, rainfall flag), race control
(messages), laps (lap duration, pit-out laps) and stints (compound per lap range). Responses are
cached under tools/assets/.cache/openf1/ so a rerun works offline.

It writes, without tuning anything:

  - the first minute with the rainfall flag, and the minutes after it of the race-control
    messages about the wet (WET TRACK, CHANGE IN CLIMATIC CONDITIONS, TRACK SURFACE SLIPPERY,
    LOW GRIP CONDITIONS, DRS DISABLED);
  - the weather rows from 10 minutes before the rain to the end (air, track, humidity, rain);
  - the track cooling: track temperature at the first rain and the minutes it takes to fall by
    its largest drop in the session, with the air there;
  - the best slick lap before the rain and the best intermediate lap, and their ratio.

Default output: overcut/frontend/src/modules/overcutManager/engine/weather/__fixtures__/openf1-<session>.json
"""

import argparse
import json
import os
import sys
import time
import urllib.request
from datetime import datetime

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", "..", "..", ".."))
CACHE = os.path.join(ROOT, "tools", "assets", ".cache", "openf1")
FIXTURES = os.path.join(ROOT, "overcut", "frontend", "src", "modules", "overcutManager", "engine", "weather", "__fixtures__")
API = "https://api.openf1.org/v1"
SLICKS = {"SOFT", "MEDIUM", "HARD", "HYPERSOFT", "ULTRASOFT", "SUPERSOFT"}
WET_MESSAGES = {
    "wetTrack": "WET TRACK",
    "climaticChange": "CHANGE IN CLIMATIC CONDITIONS",
    "slippery": "TRACK SURFACE SLIPPERY",
    "lowGrip": "LOW GRIP CONDITIONS",
    "drsDisabled": "DRS DISABLED",
}


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
            print(f"retry {path}: {error}", file=sys.stderr)
            time.sleep(5 * (attempt + 1))
    if isinstance(data, dict) and "detail" in data:
        raise SystemExit(f"OpenF1 refused {path}: {data['detail']}")
    with open(file, "w", encoding="utf-8") as handle:
        json.dump(data, handle)
    return data


def ts(value):
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--session", type=int, default=9668)
    parser.add_argument("--out")
    args = parser.parse_args()
    key = args.session
    session = get(f"sessions?session_key={key}")[0]
    weather = sorted(get(f"weather?session_key={key}"), key=lambda row: row["date"])
    control = sorted(get(f"race_control?session_key={key}"), key=lambda row: row["date"])
    laps = get(f"laps?session_key={key}")
    stints = get(f"stints?session_key={key}")

    rain_rows = [row for row in weather if row.get("rainfall")]
    if not rain_rows:
        raise SystemExit("no rain in this session")
    first = ts(rain_rows[0]["date"])
    minutes = lambda date: round((ts(date) - first).total_seconds() / 60, 2)  # noqa: E731

    messages = {}
    for row in control:
        text = (row.get("message") or "").upper()
        for name, needle in WET_MESSAGES.items():
            if needle in text:
                messages.setdefault(name, []).append({"min": minutes(row["date"]), "sector": row.get("sector"), "text": row.get("message")})

    rows = [
        {"min": minutes(row["date"]), "airC": row["air_temperature"], "trackC": row["track_temperature"], "humidity": row["humidity"], "rain": bool(row.get("rainfall"))}
        for row in weather
        if minutes(row["date"]) >= -10
    ]
    start = next(row for row in rows if row["min"] >= 0)
    low = min((row for row in rows if row["min"] >= 0), key=lambda row: row["trackC"])
    cooling = {"fromC": start["trackC"], "toC": low["trackC"], "minutes": low["min"] - start["min"], "airAtStartC": start["airC"], "airAtEndC": low["airC"]}

    compound = {}
    for stint in stints:
        for lap in range(stint["lap_start"], (stint.get("lap_end") or stint["lap_start"]) + 1):
            compound[(stint["driver_number"], lap)] = (stint.get("compound") or "").upper()
    dry, inter = [], []
    for lap in laps:
        if not lap.get("lap_duration") or lap.get("is_pit_out_lap") or not lap.get("date_start"):
            continue
        tyre = compound.get((lap["driver_number"], lap["lap_number"]), "")
        if tyre in SLICKS and ts(lap["date_start"]) < first:
            dry.append(lap["lap_duration"])
        elif tyre == "INTERMEDIATE":
            inter.append(lap["lap_duration"])
    out = {
        "$comment": f"GS-13: OpenF1 session {key} ({session.get('location')} {session.get('year')} {session.get('session_name')}), from wet_session_from_openf1.py. Minutes from the first rainfall row. Nothing tuned.",
        "source": f"{API}/{{weather,race_control,laps,stints}}?session_key={key}",
        "status": "measured",
        "session": {"key": key, "year": session.get("year"), "name": session.get("session_name"), "location": session.get("location")},
        "firstRainUtc": rain_rows[0]["date"],
        "messages": messages,
        "cooling": cooling,
        "laps": {"bestSlickBeforeRain": min(dry) if dry else None, "bestInter": min(inter) if inter else None},
        "weather": rows,
    }
    if dry and inter:
        out["laps"]["interOverDry"] = round(min(inter) / min(dry), 4)
    path = args.out or os.path.join(FIXTURES, f"openf1-{key}.json")
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as handle:
        json.dump(out, handle, indent=1, ensure_ascii=False)
        handle.write("\n")
    print(json.dumps({k: out[k] for k in ("cooling", "laps")}, indent=1))


if __name__ == "__main__":
    main()
