#!/usr/bin/env python3
"""
RF-STF-02 / RF-STF-03: the twelve driver attributes of every real driver, season by season,
derived from f1db results and never written by hand.

    python overcut/src/main/resources/scripts/driver_attributes.py [--db PATH] [--years 2005 2012] [--write-measured]

Used by generate_season_packs.py (`ratings.drivers[].skills` of each pack) and runnable on its
own: it prints the attributes of the years asked for and, with --write-measured, writes the
real pass targets (`measured` block of data/balance/driver-attributes.json: position changes
per race between grid and flag among the classified cars, by era and f1db circuit type) that
the race engine's pass rates are calibrated against (scripts/measurePasses.js).

Every attribute is one statistic of real results, made relative to the drivers of the same era
(z-score over the seasons within `poolYears`), shrunk towards the era mean by its sample
(z × n / (n + k), empirical Bayes) and put on the Manager's scale (centre + perSd × z, clamped).
The statistic of each one (data/balance/driver-attributes.json `derivation`, whose shape
values are marked NV there):

  cornering     qualifying gap to the team-mate at the faster half of the season's circuits
                (pole average speed above the season's median: long fast corners)
  braking       the same at the slower half (stop-go circuits: hard braking into slow corners)
  control       solo accident retirements (accident, spun off) per start, fewer is better
  smoothness    race against qualifying: the gap to the team-mate over a full race distance
                (both classified on the lead lap) minus the qualifying gap, smaller is better
                (tyres and fuel looked after)
  adaptability  qualifying gap to the team-mate in new situations (first start at a circuit,
                the first races with a new team) against the driver's own usual gap
  overtaking    places gained from the grid to the flag against the era's mean for that grid
                slot, minus the team-mate's in the same race (same car)
  defending     places lost from a grid slot better than the car's (the team's median grid that
                season by `defendGridMargin` or more) against the era's mean for that slot
  starts        opening-lap incident retirements (accident or collision, retired on lap 0/1)
                per start, fewer is better. f1db has no lap chart, so first-lap place gains
                are not measurable here (SIM-FISICA §7 pending)
  accuracy      the scatter of the race-by-race qualifying gap to the team-mate (MAD), smaller
                is better
  aggression    collision retirements per start and the overtaking statistic, weighted
  potential     the best season pace against the team-mate the driver reached from this season
                to the end of his career (the real ceiling, known in hindsight)
  commercial    titles, wins, podiums, poles and starts up to this season, log-weighted
  Value

Seasons count with `seasonWeights` (this one, the one before, ...). RF-HIS-00: fatal accidents
are not incidents of racing and are never counted.
"""

import argparse
import json
import math
import os
import sqlite3
import statistics

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", "..", "..", ".."))
DEFAULT_DB = os.path.join(ROOT, "tools", "assets", ".cache", "f1db", "f1db.db")
CONFIG = os.path.join(ROOT, "overcut", "frontend", "src", "modules", "overcutManager", "data", "balance", "driver-attributes.json")

SKILL_KEYS = [
    "cornering", "braking", "control", "smoothness", "adaptability", "overtaking", "defending", "starts", "accuracy",
    "aggression", "potential", "commercialValue",
]
SOLO = {"Accident", "Spun off", "Spin", "Accident damage"}
CONTACT = {"Collision", "Collision damage", "Caused collision with Trulli"}
NON_STARTERS = ("DNQ", "DNPQ", "DNS", "DNP", "EX")


def load_config(path=CONFIG):
    with open(path, encoding="utf-8") as fh:
        return json.load(fh)


def _rows(con, sql, *args):
    cur = con.execute(sql, args)
    cols = [c[0] for c in cur.description]
    return [dict(zip(cols, r)) for r in cur.fetchall()]


def _wmean(pairs):
    w = sum(p[1] for p in pairs)
    return (sum(p[0] * p[1] for p in pairs) / w, w) if w > 0 else (None, 0.0)


def _mad(values):
    if len(values) < 2:
        return None
    m = statistics.median(values)
    return statistics.median([abs(v - m) for v in values]) * 1.4826


class Results:
    """Every Grand Prix start of every driver from f1db, with the qualifying gap to pole."""

    def __init__(self, con):
        races = _rows(con, """select r.id, r.year, r.round, r.circuit_id, r.circuit_type, r.course_length, r.laps
                              from race r order by r.year, r.round""")
        self.races = {r["id"]: r for r in races}
        quali = _rows(con, """select race_id, driver_id, constructor_id, time_millis, q1_millis, q2_millis, q3_millis
                              from qualifying_result""")
        best = {}
        for q in quali:
            times = [t for t in (q["time_millis"], q["q1_millis"], q["q2_millis"], q["q3_millis"]) if t]
            if times:
                best[(q["race_id"], q["driver_id"])] = min(times)
        pole = {}
        for (race_id, _), ms in best.items():
            pole[race_id] = min(pole.get(race_id, ms), ms)
        results = _rows(con, """select race_id, driver_id, constructor_id, position_number, position_text, laps,
                                       reason_retired, grid_position_number, time_millis
                                from race_result""")
        # One seat per driver per race (the car he raced, as the pack generator keeps it).
        keep = {}
        for rr in results:
            key = (rr["race_id"], rr["driver_id"])
            score = (rr["position_number"] is not None, rr["laps"] or 0, rr["grid_position_number"] is not None)
            if key not in keep or score > keep[key][0]:
                keep[key] = (score, rr)
        self.starts = []
        for (race_id, driver_id), (_, rr) in keep.items():
            race = self.races[race_id]
            if rr["position_text"] in NON_STARTERS or rr["grid_position_number"] is None and (rr["laps"] or 0) == 0:
                continue
            ms = best.get((race_id, driver_id))
            self.starts.append({
                "race": race_id, "year": race["year"], "round": race["round"], "circuit": race["circuit_id"],
                "type": race["circuit_type"], "driver": driver_id, "team": rr["constructor_id"],
                "grid": rr["grid_position_number"], "pos": rr["position_number"], "laps": rr["laps"] or 0,
                "raceLaps": race["laps"], "reason": rr["reason_retired"], "timeMs": rr["time_millis"],
                "gap": (ms / pole[race_id] - 1) * 100 if ms and race_id in pole else None,
            })
        self.starts.sort(key=lambda s: (s["year"], s["round"], s["driver"]))
        self.by_race = {}
        for s in self.starts:
            self.by_race.setdefault(s["race"], []).append(s)
        # Pole average speed per race (km/h), the circuit's speed class.
        self.speed = {rid: race["course_length"] * 3600 / (pole[rid] / 1000) for rid, race in self.races.items()
                      if rid in pole and race["course_length"]}
        self.years = sorted({s["year"] for s in self.starts})


def _fatal(reason):
    return bool(reason) and "Fatal" in reason


def season_stats(res, cfg):
    """Raw statistics per (driver, year), each with its own sample, over the weighted window."""
    der = cfg["derivation"]
    weights = der["seasonWeights"]
    clip = der["gapClipPct"]
    # Fast and slow halves of each season's circuits by pole average speed.
    median_speed = {}
    for year in res.years:
        speeds = [res.speed[rid] for rid, race in res.races.items() if race["year"] == year and rid in res.speed]
        if speeds:
            median_speed[year] = statistics.median(speeds)

    # Per race observations, before the window.
    per = {}

    def obs(driver, year):
        return per.setdefault((driver, year), {
            "gapFast": [], "gapSlow": [], "gapAll": [], "gapNew": [], "smooth": [], "over": [], "defend": [],
            "starts": 0, "solo": 0, "contact": 0, "opening": 0,
        })

    # Era mean of places gained per grid slot among classified cars (for overtaking/defending).
    gain_by_slot = {}
    for s in res.starts:
        if s["pos"] is not None and s["grid"]:
            key = (s["year"], min(s["grid"], 26))
            gain_by_slot.setdefault(key, []).append(s["grid"] - s["pos"])
    pool = der["poolYears"]

    def expected_gain(year, grid):
        slot = min(grid, 26)
        vals = []
        for y in range(year - pool, year + pool + 1):
            vals.extend(gain_by_slot.get((y, slot), []))
        return sum(vals) / len(vals) if vals else 0.0

    exp_cache = {}

    def exp_gain(year, grid):
        key = (year, min(grid, 26))
        if key not in exp_cache:
            exp_cache[key] = expected_gain(year, grid)
        return exp_cache[key]

    seen_circuit = {}
    team_seq = {}
    # The team's median grid in a season (the car's usual slot).
    team_grid = {}
    for s in res.starts:
        if s["grid"]:
            team_grid.setdefault((s["team"], s["year"]), []).append(s["grid"])
    team_grid = {k: statistics.median(v) for k, v in team_grid.items()}

    for race_id, field in sorted(res.by_race.items(), key=lambda kv: (res.races[kv[0]]["year"], res.races[kv[0]]["round"])):
        race = res.races[race_id]
        year = race["year"]
        fast = res.speed.get(race_id, 0) >= median_speed.get(year, 0)
        by_team = {}
        for s in field:
            by_team.setdefault(s["team"], []).append(s)
        for s in field:
            o = obs(s["driver"], year)
            if _fatal(s["reason"]):
                continue
            o["starts"] += 1
            reason = s["reason"] if s["pos"] is None else None
            if reason in SOLO:
                o["solo"] += 1
            if reason in CONTACT:
                o["contact"] += 1
            if reason in SOLO | CONTACT and s["laps"] <= 1:
                o["opening"] += 1
            mates = [m for m in by_team[s["team"]] if m is not s]
            new_circuit = (s["driver"], s["circuit"]) not in seen_circuit
            seq_key = (s["driver"], s["team"])
            team_seq[seq_key] = team_seq.get(seq_key, 0) + 1
            new_team = team_seq[seq_key] <= der["newTeamRaces"]
            if s["gap"] is not None:
                for m in mates:
                    if m["gap"] is None:
                        continue
                    g = max(-clip, min(clip, s["gap"] - m["gap"]))
                    share = 1 / len(mates)
                    o["gapAll"].append((g, share))
                    (o["gapFast"] if fast else o["gapSlow"]).append((g, share))
                    if new_circuit or new_team:
                        o["gapNew"].append((g, share))
                    # Race against qualifying: both classified on the lead lap, full race time.
                    if s["timeMs"] and m["timeMs"] and s["laps"] == m["laps"] and s["laps"] > 0:
                        race_gap = (s["timeMs"] / m["timeMs"] - 1) * 100
                        o["smooth"].append((max(-clip, min(clip, race_gap - g)), share))
            if s["pos"] is not None and s["grid"]:
                resid = (s["grid"] - s["pos"]) - exp_gain(year, s["grid"])
                for m in mates:
                    if m["pos"] is not None and m["grid"]:
                        resid_m = (m["grid"] - m["pos"]) - exp_gain(year, m["grid"])
                        o["over"].append((resid - resid_m, 1 / len(mates)))
                slot = team_grid.get((s["team"], year))
                if slot is not None and s["grid"] <= slot - der["defendGridMargin"]:
                    # Places kept from a grid slot better than the car's (positive = held on).
                    o["defend"].append((resid, 1.0))
        for s in field:
            seen_circuit[(s["driver"], s["circuit"])] = True

    # The weighted window: this season and the ones before it.
    stats = {}
    drivers_years = sorted({k for k in per})
    for driver, year in drivers_years:
        acc = {k: [] for k in ("gapFast", "gapSlow", "gapAll", "gapNew", "smooth", "over", "defend")}
        counts = {"starts": 0.0, "solo": 0.0, "contact": 0.0, "opening": 0.0}
        for back, w in enumerate(weights):
            o = per.get((driver, year - back))
            if not o:
                continue
            for k in acc:
                acc[k].extend((v, sw * w) for v, sw in o[k])
            for k in counts:
                counts[k] += o[k] * w
        if counts["starts"] <= 0:
            continue
        own_gap, n_all = _wmean(acc["gapAll"])
        fast, n_fast = _wmean(acc["gapFast"])
        slow, n_slow = _wmean(acc["gapSlow"])
        new, n_new = _wmean(acc["gapNew"])
        smooth, n_smooth = _wmean(acc["smooth"])
        over, n_over = _wmean(acc["over"])
        defend, n_def = _wmean(acc["defend"])
        this = per.get((driver, year))
        mad = _mad([v for v, _ in this["gapAll"]]) if this else None
        stats[(driver, year)] = {
            # Signed so that larger is better (or, for aggression, more aggressive).
            "cornering": (-fast if fast is not None else None, n_fast),
            "braking": (-slow if slow is not None else None, n_slow),
            "control": (-counts["solo"] / counts["starts"], counts["starts"]),
            "smoothness": (-smooth if smooth is not None else None, n_smooth),
            "adaptability": (-(new - own_gap) if new is not None and own_gap is not None else None, n_new),
            "overtaking": (over, n_over),
            "defending": (defend, n_def),
            "starts": (-counts["opening"] / counts["starts"], counts["starts"]),
            "accuracy": (-mad if mad is not None else None, len(this["gapAll"]) if this else 0),
            "collision": (counts["contact"] / counts["starts"], counts["starts"]),
            "pace": (-own_gap if own_gap is not None else None, n_all),
            "startsThisYear": this["starts"] if this else 0,
        }
    return stats


def _pool_moments(stats, key, year, pool, min_n):
    vals = [v[key][0] for (d, y), v in stats.items() if abs(y - year) <= pool and v[key][0] is not None and v[key][1] >= min_n]
    if len(vals) < 5:
        return None
    mean = sum(vals) / len(vals)
    sd = math.sqrt(sum((x - mean) ** 2 for x in vals) / (len(vals) - 1)) or 1.0
    return mean, sd


def commercial_scores(con, years, cfg):
    """Log-weighted record up to and including each season (titles, wins, podiums, poles, starts)."""
    w = cfg["derivation"]["commercial"]
    rows = _rows(con, """select r.year, rr.driver_id, rr.position_number, rr.grid_position_number
                         from race_result rr join race r on r.id = rr.race_id""")
    titles = _rows(con, "select year, driver_id from season_driver_standing where position_number = 1")
    by = {}
    for r in rows:
        d = by.setdefault((r["driver_id"], r["year"]), {"wins": 0, "podiums": 0, "poles": 0, "starts": 0, "titles": 0})
        d["starts"] += 1
        if r["position_number"] == 1:
            d["wins"] += 1
        if r["position_number"] is not None and r["position_number"] <= 3:
            d["podiums"] += 1
        if r["grid_position_number"] == 1:
            d["poles"] += 1
    last_year = max(y for _, y in by) if by else 0
    for t in titles:
        # The current season's title is not won until it ends; f1db lists the leader.
        if (t["driver_id"], t["year"]) in by and t["year"] < last_year:
            by[(t["driver_id"], t["year"])]["titles"] += 1
    out = {}
    drivers = {d for d, _ in by}
    for driver in drivers:
        total = {"wins": 0, "podiums": 0, "poles": 0, "starts": 0, "titles": 0}
        for year in range(min(y for d, y in by if d == driver), max(y for d, y in by if d == driver) + 1):
            row = by.get((driver, year))
            if row:
                for k in total:
                    total[k] += row[k]
                out[(driver, year)] = math.log1p(sum(total[k] * w[k] for k in total))
    return out


def derive(con, years, cfg=None):
    """{year: {driverId: {skill: value, ..., "sample": {...}}}} for the seasons asked for."""
    cfg = cfg or load_config()
    der = cfg["derivation"]
    scale = der["scale"]
    res = Results(con)
    stats = season_stats(res, cfg)
    commercial = commercial_scores(con, years, cfg)
    pool = der["poolYears"]

    def to_scale(z):
        return round(max(scale["min"], min(scale["max"], scale["centre"] + scale["perSd"] * z)), 1)

    def zscore(key, driver, year, value_key=None):
        entry = stats.get((driver, year))
        if not entry:
            return 0.0, 0.0
        value, n = entry[value_key or key]
        if value is None:
            return 0.0, n
        mom = _pool_moments(stats, value_key or key, year, pool, der["minSample"].get(key, 1))
        if not mom:
            return 0.0, n
        z = (value - mom[0]) / mom[1]
        k = der["shrink"][key]
        return z * n / (n + k), n

    def pace_attr(driver, year):
        z, n = zscore("potential", driver, year, "pace")
        return z if n >= der["minSample"]["potential"] else None

    out = {}
    for year in years:
        field = sorted({d for (d, y) in stats if y == year and stats[(d, y)]["startsThisYear"] > 0})
        comm_vals = [commercial[(d, year)] for d in field if (d, year) in commercial]
        cm = sum(comm_vals) / len(comm_vals) if comm_vals else 0.0
        cs = math.sqrt(sum((x - cm) ** 2 for x in comm_vals) / max(1, len(comm_vals) - 1)) or 1.0
        season = {}
        for driver in field:
            skills = {}
            sample = {}
            for key in ("cornering", "braking", "control", "smoothness", "adaptability", "overtaking", "defending", "starts", "accuracy"):
                z, n = zscore(key, driver, year)
                skills[key] = to_scale(z)
                sample[key] = round(n, 1)
            zc, _ = zscore("aggression", driver, year, "collision")
            zo, _ = zscore("overtaking", driver, year)
            aw = der["aggression"]
            skills["aggression"] = to_scale(aw["collision"] * zc + aw["overtaking"] * zo)
            # Potential: the best season pace from here to the end of the career (hindsight).
            later = [pace_attr(driver, y) for y in range(year, max(res.years) + 1) if (driver, y) in stats]
            later = [z for z in later if z is not None]
            now = pace_attr(driver, year)
            peak = max(later) if later else (now if now is not None else 0.0)
            skills["potential"] = to_scale(peak)
            skills["commercialValue"] = to_scale(((commercial.get((driver, year), cm)) - cm) / cs)
            season[driver] = {"skills": {k: skills[k] for k in SKILL_KEYS}, "sample": sample}
        out[year] = season
    return out


def measured_passes(con, cfg):
    """Real pass targets: per era and circuit type, the mean number of pairs of classified cars
    whose order at the flag is the reverse of their order on the grid (net position changes), and that
    count as a share of all the pairs of classified cars (the measure the engine is calibrated on)."""
    eras = cfg["derivation"]["passEras"]
    races = _rows(con, "select id, year, circuit_type from race where year >= ?", eras[0][0])
    results = _rows(con, """select race_id, grid_position_number as grid, position_number as pos
                            from race_result where position_number is not null and grid_position_number is not null""")
    by_race = {}
    for r in results:
        by_race.setdefault(r["race_id"], []).append(r)
    acc = {}
    for race in races:
        field = by_race.get(race["id"], [])
        if len(field) < 4:
            continue
        era = next((e for e in eras if e[0] <= race["year"] <= e[1]), None)
        if not era:
            continue
        inv = 0
        for i in range(len(field)):
            for j in range(i + 1, len(field)):
                a, b = field[i], field[j]
                if (a["grid"] - b["grid"]) * (a["pos"] - b["pos"]) < 0:
                    inv += 1
        key = (f"{era[0]}-{era[1]}", race["circuit_type"])
        row = acc.setdefault(key, {"races": 0, "inversions": 0, "classified": 0, "pairs": 0})
        row["races"] += 1
        row["inversions"] += inv
        row["classified"] += len(field)
        row["pairs"] += len(field) * (len(field) - 1) // 2
    out = []
    for (era, kind), row in sorted(acc.items()):
        out.append({
            "era": era, "circuitType": kind, "races": row["races"],
            "inversionsPerRace": round(row["inversions"] / row["races"], 2),
            "classifiedPerRace": round(row["classified"] / row["races"], 2),
            # Share of the pairs of classified cars that swapped order: independent of how many finished.
            "inversionShare": round(row["inversions"] / row["pairs"], 4),
        })
    return out


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--db", default=DEFAULT_DB)
    parser.add_argument("--years", type=int, nargs="*", default=[2012])
    parser.add_argument("--write-measured", action="store_true")
    args = parser.parse_args()
    con = sqlite3.connect(f"file:{args.db}?mode=ro", uri=True)
    cfg = load_config()
    if args.write_measured:
        cfg["measured"] = {
            "$comment": cfg["measured"]["$comment"],
            "source": "f1db v2026.20.0 race_result (grid_position_number, position_number), race.circuit_type",
            "passes": measured_passes(con, cfg),
        }
        with open(CONFIG, "w", encoding="utf-8", newline="\n") as fh:
            json.dump(cfg, fh, ensure_ascii=False, indent=2)
            fh.write("\n")
        print(f"wrote measured passes to {os.path.relpath(CONFIG, ROOT)}")
    table = derive(con, args.years, cfg)
    for year in args.years:
        print(year)
        for driver, row in sorted(table[year].items(), key=lambda kv: -kv[1]["skills"]["cornering"]):
            print(f"  {driver:28s} " + " ".join(f"{k[:5]}={row['skills'][k]:5.1f}" for k in SKILL_KEYS))


if __name__ == "__main__":
    main()
