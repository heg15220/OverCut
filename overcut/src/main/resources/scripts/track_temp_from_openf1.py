#!/usr/bin/env python3
"""
WX-C3 / GS-14 (F1M24-CHINA §2.10; RF-SIM-11, RNF-07): the track temperature over the air, from
the real height of the sun and the cloud, measured on OpenF1's dry races 2023-2025.

    python overcut/src/main/resources/scripts/track_temp_from_openf1.py [--db F1DB] [--cache DIR]
        [--fixture PATH] [--sites PATH] [--fit PATH]

Sources (public, no personal data in any request):
  - OpenF1 (https://openf1.org) `sessions` and `weather` (one row a minute: air, track, rainfall);
    cached under <cache>/openf1/ (shared with wet_tyres_from_openf1.py, same file names).
  - ERA5 hourly cloud cover (Copernicus C3S, Hersbach et al. 2020) through the Open-Meteo archive,
    the same windows weather_climate_from_era5.py caches under <cache>/era5/ (31 days around each
    GP, local time, with the circuit's UTC offset).
  - f1db v2026.20.0 (circuit latitude/longitude, race dates and UTC start times).

Model (everything physical but the three fitted numbers):
  sun        NOAA Solar Calculator (Meeus, Astronomical Algorithms): the sun's elevation e at the
             circuit and the UTC minute.
  clear sky  Haurwitz (1945) global horizontal irradiance, S = 1.098 sin(e) exp(-0.057 / sin e) kW/m2.
  cloud      the shape of Kasten and Czeplak (1980), S x (1 - c N^3.4), N the ERA5 cloud fraction of
             the hour (linear between hours). Their c = 0.75 is for the irradiance under observed
             octas; ERA5's total cloud counts thin high cloud too, so c is fitted here.
  excess     the track over the air relaxes to  base + gain x S x (1 - c N^3.4)  with the time
             constant tau (first order: the asphalt's heat). base, gain and c by least squares on
             every minute of the dry races (no rainfall row in the session); the filter starts six
             hours before the session at its equilibrium. tau: hourly cloud cannot resolve it (the
             rmse is flat from 0 to 30 min, printed in byTau), so the fit uses the constant measured
             under rain in OpenF1 9668 (race-weather.json temperature.relaxTauMin, --tau).

Writes:
  --fit      the fit (base, gain, tau, rmse, rows, races) as JSON (copied by hand into
             data/balance/race-weather.json temperature.sun, with its source).
  --fixture  engine/weather/__fixtures__/openf1-9664-9673.json: the Chinese GP 2024 qualifying
             (9664) and race (9673) every five minutes (air, track, ERA5 cloud, elevation), for
             engine/weather/weather.test.js.
  --sites    data/weather/sun-sites.json: latitude, longitude and the UTC offset (civil, from
             Open-Meteo's timezone of each window) by race month of every circuit in climate.json.
"""

import argparse
import bisect
import glob
import json
import math
import os
import sqlite3
import statistics
import time
import urllib.error
import urllib.request
from datetime import date, datetime, timedelta, timezone
from zoneinfo import ZoneInfo

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", "..", "..", ".."))
MANAGER = os.path.join(ROOT, "overcut", "frontend", "src", "modules", "overcutManager")
OPENF1 = "https://api.openf1.org/v1"
YEARS = (2023, 2024, 2025)
CHINA = (9664, 9673)
TAUS = [0, 5, 10, 15, 20, 25, 30, 40, 50, 60, 75, 90, 120]
TAU_RAIN = 12.3  # race-weather.json temperature.relaxTauMin (OpenF1 9668, rain)
CLOUD_EXPONENT = 3.4  # Kasten and Czeplak (1980)
WINDOW = 15  # weather_climate_from_era5.py WINDOW (days each side of the race)
NIGHT_FROM = {"marina-bay": 2008, "yas-marina": 2009, "bahrain": 2014}  # same as weather_climate_from_era5.py


def get(cache, path):
    """OpenF1 with the same cache names as wet_tyres_from_openf1.py get()."""
    os.makedirs(cache, exist_ok=True)
    key = path.replace("/", "_").replace("?", "_").replace("&", "_").replace("=", "-")
    file = os.path.join(cache, key + ".json")
    if os.path.exists(file):
        with open(file, encoding="utf-8") as handle:
            return json.load(handle)
    request = urllib.request.Request(f"{OPENF1}/{path}", headers={"User-Agent": "overcut-calibration"})
    for attempt in range(4):
        try:
            with urllib.request.urlopen(request, timeout=60) as response:
                data = json.loads(response.read().decode("utf-8"))
            break
        except urllib.error.HTTPError as error:
            if error.code == 404:  # OpenF1 answers 404 for a session without rows
                return []
            if attempt == 3:
                raise
            time.sleep(3 + attempt * 5)
        except Exception:  # noqa: BLE001 - rate limits and timeouts: wait and retry
            if attempt == 3:
                raise
            time.sleep(3 + attempt * 5)
    with open(file, "w", encoding="utf-8") as handle:
        json.dump(data, handle)
    time.sleep(0.4)
    return data


def gmt_hours(value):
    """OpenF1 `gmt_offset` ("08:00:00", "-04:00:00") in hours."""
    if not value:
        return 0.0
    sign = -1 if value.startswith("-") else 1
    h, m, *_ = value.lstrip("+-").split(":")
    return sign * (int(h) + int(m) / 60)


def ts(value):
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


# ------------------------------------------------------------------ NOAA sun (Meeus)


def julian_day(y, m, d):
    if m <= 2:
        y -= 1
        m += 12
    a = y // 100
    b = 2 - a + a // 4
    return math.floor(365.25 * (y + 4716)) + math.floor(30.6001 * (m + 1)) + d + b - 1524.5


def elevation_deg(lat, lon, utc):
    """True solar elevation (degrees, no refraction) at a UTC datetime (NOAA Solar Calculator)."""
    hours = utc.hour + utc.minute / 60 + utc.second / 3600
    jd = julian_day(utc.year, utc.month, utc.day) + hours / 24
    t = (jd - 2451545) / 36525
    l0 = (280.46646 + t * (36000.76983 + t * 0.0003032)) % 360
    m = 357.52911 + t * (35999.05029 - 0.0001537 * t)
    e = 0.016708634 - t * (0.000042037 + 0.0000001267 * t)
    mr = math.radians(m)
    c = math.sin(mr) * (1.914602 - t * (0.004817 + 0.000014 * t)) + math.sin(2 * mr) * (0.019993 - 0.000101 * t) + math.sin(3 * mr) * 0.000289
    omega = math.radians(125.04 - 1934.136 * t)
    app = math.radians(l0 + c - 0.00569 - 0.00478 * math.sin(omega))
    eps0 = 23 + (26 + (21.448 - t * (46.815 + t * (0.00059 - t * 0.001813))) / 60) / 60
    eps = math.radians(eps0 + 0.00256 * math.cos(omega))
    decl = math.asin(math.sin(eps) * math.sin(app))
    y = math.tan(eps / 2) ** 2
    l0r = math.radians(l0)
    eq = 4 * math.degrees(y * math.sin(2 * l0r) - 2 * e * math.sin(mr) + 4 * e * y * math.sin(mr) * math.cos(2 * l0r) - 0.5 * y * y * math.sin(4 * l0r) - 1.25 * e * e * math.sin(2 * mr))
    true_solar = (hours * 60 + eq + 4 * lon) % 1440
    ha = true_solar / 4 - 180 if true_solar / 4 >= 0 else true_solar / 4 + 180
    latr = math.radians(lat)
    cos_zen = math.sin(latr) * math.sin(decl) + math.cos(latr) * math.cos(decl) * math.cos(math.radians(ha))
    return 90 - math.degrees(math.acos(max(-1, min(1, cos_zen))))


def clear_kw(elev):
    """Haurwitz (1945) clear-sky global horizontal irradiance, kW/m2."""
    if elev <= 0:
        return 0.0
    s = math.sin(math.radians(elev))
    return 1.098 * s * math.exp(-0.057 / s)


# ------------------------------------------------------------------ ERA5 cloud


def era5_window(cache, lat, lon, day):
    """The ERA5 window weather_climate_from_era5.py cached for this race (or any window holding the day)."""
    exact = os.path.join(cache, f"{lat:.3f}_{lon:.3f}_{(day - timedelta(days=WINDOW)).isoformat()}_{(day + timedelta(days=WINDOW)).isoformat()}.json")
    candidates = [exact] if os.path.exists(exact) else sorted(glob.glob(os.path.join(cache, f"{lat:.3f}_{lon:.3f}_*.json")))
    for file in candidates:
        parts = os.path.basename(file)[:-5].split("_")
        start, end = date.fromisoformat(parts[2]), date.fromisoformat(parts[3])
        if start <= day <= end:
            with open(file, encoding="utf-8") as handle:
                return json.load(handle)
    return None


class Cloud:
    """ERA5 hourly cloud fraction at UTC instants (linear between hours)."""

    def __init__(self, data):
        offset = data.get("utc_offset_seconds", 0)
        self.offset_h = offset / 3600
        hourly = data["hourly"]
        self.t = []
        self.v = []
        for stamp, cloud in zip(hourly["time"], hourly["cloud_cover"]):
            if cloud is None:
                continue
            local = datetime.fromisoformat(stamp).replace(tzinfo=timezone.utc)
            self.t.append((local - timedelta(seconds=offset)).timestamp())
            self.v.append(cloud / 100)

    def at(self, utc):
        x = utc.timestamp()
        k = bisect.bisect_left(self.t, x)
        if k <= 0:
            return self.v[0]
        if k >= len(self.t):
            return self.v[-1]
        f = (x - self.t[k - 1]) / (self.t[k] - self.t[k - 1])
        return self.v[k - 1] + f * (self.v[k] - self.v[k - 1])


# ------------------------------------------------------------------ the fit


def lagged(series, tau, warm):
    """First-order filter (minutes) of `series` [(minute, value)], starting at equilibrium with `warm`."""
    out = []
    state = warm
    last = None
    for minute, value in series:
        if last is None or tau <= 0:
            state = value if tau <= 0 else state
        else:
            k = math.exp(-(minute - last) / tau)
            state = value + (state - value) * k
        last = minute
        out.append(state)
    return out


def race_rows(sessions_cache, era5_cache, db, key, meta):
    """Dry minutes of one session: (utc, air, track, cloud, elevation) and the forcing from six hours before."""
    rows = get(sessions_cache, f"weather?session_key={key}")
    if not rows or any((row.get("rainfall") or 0) > 0 for row in rows):
        return None
    start = ts(meta["date_start"])
    local_day = (start + timedelta(hours=gmt_hours(meta.get("gmt_offset")))).date()
    circuit = db.get(local_day) or db.get(local_day + timedelta(days=1)) or db.get(local_day - timedelta(days=1))
    if not circuit:
        return None
    cid, lat, lon = circuit
    era = era5_window(era5_cache, lat, lon, local_day)
    if not era:
        return None
    cloud = Cloud(era)
    rows = sorted(rows, key=lambda row: row["date"])
    t0 = ts(rows[0]["date"])
    forcing = []
    minute = -360
    while minute <= 0:
        at = t0 + timedelta(minutes=minute)
        sun = clear_kw(elevation_deg(lat, lon, at))
        forcing.append((minute, sun, sun * cloud.at(at) ** CLOUD_EXPONENT))
        minute += 5
    obs = []
    for row in rows:
        if row.get("air_temperature") is None or row.get("track_temperature") is None:
            continue
        at = ts(row["date"])
        m = (at - t0).total_seconds() / 60
        elev = elevation_deg(lat, lon, at)
        c = cloud.at(at)
        sun = clear_kw(elev)
        obs.append({"minute": m, "utc": at, "air": row["air_temperature"], "track": row["track_temperature"], "cloud": c, "elev": elev, "sun": sun, "sunCloud": sun * c ** CLOUD_EXPONENT})
    return {"key": key, "circuit": cid, "lat": lat, "lon": lon, "forcing": forcing, "obs": obs, "offset": cloud.offset_h}


def design(race, tau):
    """The two lagged forcings (clear sky, clear sky x N^3.4) at each observed minute (the filter runs through the six hours before)."""
    out = []
    for k, key in ((1, "sun"), (2, "sunCloud")):
        series = [(f[0], f[k]) for f in race["forcing"][:-1]] + [(o["minute"], o[key]) for o in race["obs"]]
        out.append(lagged(series, tau, race["forcing"][0][k])[len(race["forcing"]) - 1:])
    return list(zip(*out))


def solve3(a, b):
    """Gaussian elimination for a 3x3 system."""
    m = [row[:] + [b[i]] for i, row in enumerate(a)]
    for i in range(3):
        p = max(range(i, 3), key=lambda r: abs(m[r][i]))
        m[i], m[p] = m[p], m[i]
        for r in range(3):
            if r != i:
                f = m[r][i] / m[i][i]
                m[r] = [x - f * y for x, y in zip(m[r], m[i])]
    return [m[i][3] / m[i][i] for i in range(3)]


def fit(races, tau):
    """Least squares of excess = base + gain x clear - gain x c x clear x N^3.4 (lagged by tau)."""
    ata = [[0.0] * 3 for _ in range(3)]
    aty = [0.0] * 3
    rows = []
    for race in races:
        for (x1, x2), o in zip(design(race, tau), race["obs"]):
            v = (1.0, x1, x2)
            y = o["track"] - o["air"]
            rows.append((v, y))
            for i in range(3):
                aty[i] += v[i] * y
                for j in range(3):
                    ata[i][j] += v[i] * v[j]
    base, g1, g2 = solve3(ata, aty)
    rmse = math.sqrt(sum((y - base - g1 * v[1] - g2 * v[2]) ** 2 for v, y in rows) / len(rows))
    return {"base": base, "gain": g1, "cloud": -g2 / g1, "tau": tau, "rmse": rmse, "rows": len(rows)}


def residuals(race, f):
    return [o["track"] - o["air"] - f["base"] - f["gain"] * (x1 - f["cloud"] * x2) for (x1, x2), o in zip(design(race, f["tau"]), race["obs"])]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--db", default=os.path.join(ROOT, "tools", "assets", ".cache", "f1db", "f1db.db"))
    parser.add_argument("--cache", default=os.path.join(ROOT, "tools", "assets", ".cache"))
    parser.add_argument("--fixture", default=os.path.join(MANAGER, "engine", "weather", "__fixtures__", "openf1-9664-9673.json"))
    parser.add_argument("--sites", default=os.path.join(MANAGER, "data", "weather", "sun-sites.json"))
    parser.add_argument("--fit", default=None)
    parser.add_argument("--tau", type=float, default=TAU_RAIN, help="time constant (min) of the fit; default the one measured under rain in OpenF1 9668")
    args = parser.parse_args()
    openf1_cache = os.path.join(args.cache, "openf1")
    era5_cache = os.path.join(args.cache, "era5")
    con = sqlite3.connect(args.db)
    by_day = {}
    for day, cid, lat, lon in con.execute("select r.date, r.circuit_id, c.latitude, c.longitude from race r join circuit c on c.id = r.circuit_id where r.year >= 2023"):
        by_day[date.fromisoformat(day)] = (cid, lat, lon)

    races = []
    skipped = {"wet": 0, "noEra5": 0}
    for year in YEARS:
        for meta in get(openf1_cache, f"sessions?session_name=Race&year={year}"):
            if meta.get("is_cancelled"):
                continue
            race = race_rows(openf1_cache, era5_cache, by_day, meta["session_key"], meta)
            if race is None:
                skipped["wet"] += 1
                continue
            if len(race["obs"]) < 30:
                continue
            races.append(race)
    fits = [fit(races, tau) for tau in TAUS]
    best = fit(races, args.tau)
    # Per-race mean residual: the race-to-race scatter (sun, wind, asphalt) the model leaves.
    per_race = [statistics.mean(residuals(race, best)) for race in races]
    night = [o["track"] - o["air"] for race in races for o in race["obs"] if o["elev"] < -6]
    result = {
        "base": round(best["base"], 2),
        "gain": round(best["gain"], 2),
        "cloud": round(best["cloud"], 3),
        "tauMin": best["tau"],
        "rmse": round(best["rmse"], 2),
        "rows": best["rows"],
        "races": len(races),
        "raceSd": round(statistics.pstdev(per_race), 2),
        "nightMedian": round(statistics.median(night), 2) if night else None,
        "nightRows": len(night),
        "byTau": [{"tauMin": f["tau"], "rmse": round(f["rmse"], 3), "base": round(f["base"], 2), "gain": round(f["gain"], 2), "cloud": round(f["cloud"], 3)} for f in fits],
        "skipped": skipped,
    }
    print(json.dumps(result, indent=1))
    if args.fit:
        with open(args.fit, "w", encoding="utf-8") as handle:
            json.dump(result, handle, indent=1)

    # The Chinese GP 2024: qualifying (Saturday) and race (Sunday).
    sessions = []
    china_meta = {}
    for meta in get(openf1_cache, "sessions?session_name=Race&year=2024"):
        if meta["session_key"] == 9673:
            china_meta[9673] = meta
    china_meta[9664] = dict(china_meta[9673], session_key=9664, session_type="Qualifying", session_name="Qualifying", date_start="2024-04-20T07:00:00+00:00", date_end="2024-04-20T08:00:00+00:00")
    for key in CHINA:
        race = race_rows(openf1_cache, era5_cache, by_day, key, china_meta[key])
        meta = china_meta[key]
        rows = []
        last = None
        for o in race["obs"]:
            if last is not None and o["minute"] - last < 4.5:
                continue
            last = o["minute"]
            local = o["utc"] + timedelta(hours=race["offset"])
            rows.append({"local": local.strftime("%H:%M"), "hour": round(local.hour + local.minute / 60 + local.second / 3600, 3), "airC": o["air"], "trackC": o["track"], "cloud": round(o["cloud"], 3), "elevationDeg": round(o["elev"], 2)})
        sessions.append({"key": key, "name": meta["session_name"], "date": (ts(meta["date_start"]) + timedelta(hours=race["offset"])).date().isoformat(), "startUtc": meta["date_start"], "utcOffsetH": race["offset"], "circuit": race["circuit"], "lat": race["lat"], "lon": race["lon"], "rows": rows})
    fixture = {
        "$comment": "WX-C3 / GS-14 (F1M24-CHINA §2.10): OpenF1 weather of the Chinese GP 2024, qualifying (9664, Saturday) and race (9673, Sunday), every five minutes, with ERA5's cloud fraction of the hour (Open-Meteo archive) and the NOAA solar elevation (true, degrees) at f1db's coordinates. Generated by overcut/src/main/resources/scripts/track_temp_from_openf1.py; do not edit by hand. fit: the model fitted on every dry minute of OpenF1's dry races 2023-2025 (race-weather.json temperature.sun).",
        "source": "https://api.openf1.org/v1/weather?session_key={9664,9673}; https://archive-api.open-meteo.com/v1/archive (ERA5 cloud_cover); f1db v2026.20.0",
        "status": "measured",
        "fit": {k: result[k] for k in ("base", "gain", "cloud", "tauMin", "rmse", "rows", "races", "raceSd", "nightMedian")},
        "sessions": sessions,
    }
    with open(args.fixture, "w", encoding="utf-8") as handle:
        json.dump(fixture, handle, indent=1, ensure_ascii=False)
        handle.write("\n")

    # Sun sites: every circuit of climate.json, its coordinates and the civil UTC offset by race month.
    with open(os.path.join(MANAGER, "data", "weather", "climate.json"), encoding="utf-8") as handle:
        climate = json.load(handle)
    with open(os.path.join(MANAGER, "data", "seasons", "curated", "circuit-timezones.json"), encoding="utf-8") as handle:
        zones = json.load(handle)["circuits"]
    sites = {}
    for year, day, cid, lat, lon in con.execute("select r.year, r.date, r.circuit_id, c.latitude, c.longitude from race r join circuit c on c.id = r.circuit_id where r.year >= 1976 order by r.year, r.round"):
        if cid not in climate["circuits"]:
            continue
        d = date.fromisoformat(day)
        month = f"{d.month}d" if cid in NIGHT_FROM and year < NIGHT_FROM[cid] else str(d.month)
        era = era5_window(era5_cache, lat, lon, d)
        site = sites.setdefault(cid, {"lat": round(lat, 4), "lon": round(lon, 4), "utcOffsetH": {}, "civilOffsetH": {}})
        if era is not None:
            site["utcOffsetH"][month] = era.get("utc_offset_seconds", 0) / 3600
        if cid in zones:
            noon = datetime(d.year, d.month, d.day, 12, tzinfo=ZoneInfo(zones[cid]))
            site["civilOffsetH"][month] = noon.utcoffset().total_seconds() / 3600
    for cid, site in sites.items():
        # Months of climate.json without an ERA5 window here: the circuit's most common offset.
        known = list(site["utcOffsetH"].values())
        common = statistics.mode(known) if known else round(site["lon"] / 15)
        for month in climate["circuits"][cid]:
            site["utcOffsetH"].setdefault(month, common)
        order = lambda item: (int(item[0].rstrip("d")), item[0])  # noqa: E731
        site["utcOffsetH"] = dict(sorted(site["utcOffsetH"].items(), key=order))
        if site["civilOffsetH"]:
            site["civilOffsetH"] = dict(sorted(site["civilOffsetH"].items(), key=order))
        else:
            del site["civilOffsetH"]
    doc = {
        "$comment": "WX-C3 / GS-14 (RF-SIM-11, RNF-07): where each circuit of data/weather/climate.json is, for the sun's height over the track (engine/weather/solar.js, NOAA). lat/lon from f1db v2026.20.0 (circuit.latitude/longitude). utcOffsetH: by race month, the offset climate.json's startHour was computed with (Open-Meteo's utc_offset_seconds of each ERA5 window weather_climate_from_era5.py read; Open-Meteo gives the offset of the day of the request, so at circuits with summer time it can be the winter one), so startHour - utcOffsetH is the race's real UTC start for the circuits f1db times (2024 on); months with no window take the circuit's usual offset. civilOffsetH: the civil offset of the race month (summer time included) from the IANA zone of data/seasons/curated/circuit-timezones.json, for the session clock (pack startLocal); only the circuits with a zone. Generated by overcut/src/main/resources/scripts/track_temp_from_openf1.py; do not edit by hand.",
        "source": "f1db v2026.20.0; https://archive-api.open-meteo.com/v1/archive (utc_offset_seconds, timezone=auto); IANA tzdata (zoneinfo)",
        "sites": dict(sorted(sites.items())),
    }
    with open(args.sites, "w", encoding="utf-8") as handle:
        json.dump(doc, handle, indent=1, ensure_ascii=False)
        handle.write("\n")


if __name__ == "__main__":
    main()
