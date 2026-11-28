#!/usr/bin/env python3
"""
VIEW-06 (F1M24-CHINA §2.8, LOOK-C3; RF-3D-04, RNF-07): where and when every Grand Prix from 1976 was
run, for the sun of the 3D view (three/sky.js lookAt): data/circuits/sites.json.

    python overcut/src/main/resources/scripts/circuit_sites_from_f1db.py [--db PATH] [--out PATH]

Sources, nothing tuned:
  - coordinates, race dates and start times (UTC, f1db `race.time`, given from 2024): f1db v2026.20.0
    (`circuit.latitude/longitude`, `race.date/time`), the same database the season packs come from;
  - the circuit's time zone (IANA name): the ERA5 responses already cached by weather_climate_from_era5.py
    (Open-Meteo `timezone=auto`, tools/assets/.cache/era5/), and the UTC offset of the race day from it
    with Python's zoneinfo (daylight saving included);
  - the local start hour before 2024 (f1db has no time): the start hour of data/weather/climate.json for
    the circuit and month (the engine's weather uses the same hour), marked startSource "climate"; that
    hour is 14:00 local where f1db never timed the circuit (DEFAULT_START of the climate script) and is
    therefore pending, not a fact.

Output:
  circuits  {f1dbId: {lat, lon, tz}}
  aliases   engine layout ref -> f1db id where they differ (climate.json aliases plus the refs that
            climate.json does not need)
  races     {year: [[circuitId, date, startLocal "HH:MM", startSource, utcOffsetH]]} (columns in `raceColumns`)
"""

import argparse
import glob
import json
import os
import sqlite3
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", "..", "..", ".."))
MAIN_ROOT = os.environ.get("OVERCUT_ROOT", ROOT)
MANAGER = os.path.join(ROOT, "overcut", "frontend", "src", "modules", "overcutManager")
DEFAULT_DB = os.path.join(MAIN_ROOT, "tools", "assets", ".cache", "f1db", "f1db.db")
ERA5 = os.path.join(MAIN_ROOT, "tools", "assets", ".cache", "era5")
CLIMATE = os.path.join(MANAGER, "data", "weather", "climate.json")
DEFAULT_OUT = os.path.join(MANAGER, "data", "circuits", "sites.json")

# Layout refs of engine/layouts.js that name an f1db circuit differently and are not in climate.json aliases.
EXTRA_ALIASES = {"sochi": "sirius", "las_vegas": "caesars-palace", "madring": "madring"}


def zones_from_era5():
    """(lat, lon) rounded to 3 decimals -> IANA zone, from the cached Open-Meteo responses."""
    zones = {}
    for path in glob.glob(os.path.join(ERA5, "*.json")):
        name = os.path.basename(path)
        try:
            lat, lon = name.split("_")[:2]
            with open(path, encoding="utf-8") as handle:
                data = json.load(handle)
        except (ValueError, OSError, json.JSONDecodeError):
            continue
        if data.get("timezone"):
            zones[(lat, lon)] = data["timezone"]
    return zones


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--db", default=DEFAULT_DB)
    parser.add_argument("--out", default=DEFAULT_OUT)
    args = parser.parse_args()
    db = sqlite3.connect(args.db)
    with open(CLIMATE, encoding="utf-8") as handle:
        climate = json.load(handle)
    zones = zones_from_era5()
    rows = list(db.execute(
        "select r.year, r.date, r.time, r.circuit_id, c.latitude, c.longitude from race r join circuit c on c.id = r.circuit_id"
        " where r.year >= 1976 order by r.year, r.round"
    ))
    circuits = {}
    races = {}
    for year, day, utc, cid, lat, lon in rows:
        tz = zones.get((f"{lat:.3f}", f"{lon:.3f}"))
        circuits.setdefault(cid, {"lat": round(lat, 6), "lon": round(lon, 6), "tz": tz})
        d = datetime.fromisoformat(day)
        if utc:
            hh, mm = (int(part) for part in utc[:5].split(":"))
            start_utc = datetime(d.year, d.month, d.day, hh, mm, tzinfo=ZoneInfo("UTC"))
            local = start_utc.astimezone(ZoneInfo(tz)) if tz else None
            offset = local.utcoffset().total_seconds() / 3600 if local else None
            start_local = local.strftime("%H:%M") if local else None
            source = "f1db"
        else:
            night_from = climate.get("nightFrom", {}).get(cid)
            month = f"{d.month}d" if night_from and year < night_from else str(d.month)
            hour = climate.get("circuits", {}).get(cid, {}).get(month, {}).get("startHour")
            start_local = f"{int(hour):02d}:00" if hour is not None else None
            offset = None
            if tz and hour is not None:
                local = datetime(d.year, d.month, d.day, int(hour), tzinfo=ZoneInfo(tz))
                offset = local.utcoffset().total_seconds() / 3600
            source = "climate"
        races.setdefault(str(year), []).append([cid, day, start_local, source, offset])
    aliases = dict(climate.get("aliases", {}))
    aliases.update(EXTRA_ALIASES)
    out = {
        "$comment": "GENERADO por overcut/src/main/resources/scripts/circuit_sites_from_f1db.py (VIEW-06, LOOK-C3): coordenadas y fechas de f1db v2026.20.0, huso IANA de las respuestas ERA5/Open-Meteo ya cacheadas y desfase UTC del día de carrera con zoneinfo (horario de verano incluido). startSource f1db = hora oficial (f1db la da desde 2024); climate = hora de salida de data/weather/climate.json (14:00 local donde f1db nunca la cronometró: pending, no es un hecho). No se edita a mano.",
        "source": "f1db v2026.20.0 (circuit.latitude/longitude, race.date/time); IANA tz de Open-Meteo (timezone=auto)",
        "status": {"coordinates": "sourced", "startLocalF1db": "sourced", "startLocalClimate": "pending"},
        "aliases": dict(sorted(aliases.items())),
        "circuits": dict(sorted(circuits.items())),
        "raceColumns": ["circuitId", "date", "startLocal", "startSource", "utcOffsetH"],
        "races": races,
    }
    os.makedirs(os.path.dirname(args.out), exist_ok=True)
    with open(args.out, "w", encoding="utf-8") as handle:
        json.dump(out, handle, ensure_ascii=False, separators=(",", ":"))
        handle.write("\n")
    missing = sorted(cid for cid, c in circuits.items() if not c["tz"])
    print(f"{len(circuits)} circuits, {len(rows)} races; without time zone: {missing}")


if __name__ == "__main__":
    main()
