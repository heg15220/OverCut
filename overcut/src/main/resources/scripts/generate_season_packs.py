"""Build the OverCut Manager season packs (SRS 6.3, fases 1 y 5).

One JSON file per season, written to
overcut/frontend/src/modules/overcutManager/data/seasons/<year>.json, from:

  - the f1db SQLite release (CC BY 4.0), pinned by version: entrants per Grand
    Prix, chassis, engines, tyre suppliers, calendar with circuit layouts,
    qualifying format, race and sprint results, points and standings;
  - the curated inputs next to the packs (data/seasons/curated/): regulations
    with their provenance, era coherence rules, historical events and the GLB
    each team uses from f1-3d-assets.

The generator cross-checks every curated value that f1db can prove and stops
if they disagree (criterio 7.2):

  - the points scheme against the points of every race and sprint result,
    with the curated per-round factor (half points, double points);
  - the drivers' and constructors' tables against the results, with the
    dropped scores (best N, split seasons), best-car-only constructors and the
    curated adjustments (points taken away by the stewards or the FIA);
  - the engine formulas, the sprint weekends;
  - events (round and date must exist) and car assets (team must exist).

Years without events or car assets are fine: the pack simply has none.

The output is deterministic: same f1db + same curated inputs -> byte-identical
packs.

Get the database (checksum in the same release):
    gh release download v2026.20.0 -R f1db/f1db -p f1db-sqlite.zip
    unzip f1db-sqlite.zip            # -> f1db.db

Run:
    python overcut/src/main/resources/scripts/generate_season_packs.py --f1db path/to/f1db.db --years 2005 2008 2012
    python overcut/src/main/resources/scripts/generate_season_packs.py --f1db path/to/f1db.db --all
"""

import argparse
import json
import os
import sqlite3
import statistics
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, "..", "..", "..", "..", ".."))
SEASONS_DIR = os.path.join(REPO, "overcut", "frontend", "src", "modules", "overcutManager", "data", "seasons")
CURATED_DIR = os.path.join(SEASONS_DIR, "curated")

SCHEMA_VERSION = 2
PACK_VERSION = "2.0.0"
F1DB_VERSION = "v2026.20.0"
RATINGS_METHOD = "v1-qualifying-gap"

# reason_retired values (f1db spelling) grouped for reliability.
ACCIDENT_REASONS = {
    "Accident", "Collision", "Collision damage", "Spun off", "Puncture", "Puncture damage",
    "Caused collision with Trulli",
}
NON_RACING_REASONS = {"Withdrew", "Illness", "Ignored red light", "Disqualified", "Excluded"}

MECHANICAL = "mechanical"

# Regulation keys the curated file must give for every year (tyreSuppliers and
# qualifyingFormats come straight from f1db).
CURATED_KEYS = [
    "engineFormula", "engineFormulas", "refuelling", "energySystem", "drs", "activeAero", "safetyCar", "vsc",
    "tyreType", "tyreChangesInRace", "mandatoryDryCompounds", "qualifyingRaceFuel", "topTenStartTyres", "rule107",
    "pointsScheme", "budgetCap", "aeroTestingRestriction", "unitLimits", "teamOrdersBanned", "parcFerme",
    "sprintWeekends",
]
PROVENANCE_KEYS = {"status", "url", "quote", "note"}
EPS = 1e-9


def load_json(name):
    with open(os.path.join(CURATED_DIR, name), encoding="utf-8") as fh:
        return json.load(fh)


def rows(con, sql, *args):
    cur = con.execute(sql, args)
    cols = [d[0] for d in cur.description]
    return [dict(zip(cols, r)) for r in cur.fetchall()]


def fail(msg):
    sys.exit(f"[generate_season_packs] {msg}")


def engine_formula(capacity, configuration, aspiration):
    if capacity is None:
        return None
    base = f"{capacity:.1f} {configuration}"
    if aspiration == "TURBOCHARGED_HYBRID":
        return f"{base} turbo hybrid"
    if aspiration == "TURBOCHARGED":
        return f"{base} turbo"
    return base


def reliability_bucket(reason):
    if reason is None:
        return None
    if reason in ACCIDENT_REASONS:
        return "accident"
    if reason in NON_RACING_REASONS:
        return "other"
    return MECHANICAL


def median(values):
    return round(statistics.median(values), 3) if values else None


def provenance_of(year, key, entry):
    if not isinstance(entry, dict) or entry.get("status") not in ("f1db", "source", "pending"):
        fail(f"{year}: provenance of {key} must have status f1db|source|pending")
    if set(entry) - PROVENANCE_KEYS:
        fail(f"{year}: provenance of {key} has unknown keys {sorted(set(entry) - PROVENANCE_KEYS)}")
    if entry["status"] == "source" and not (entry.get("url") and entry.get("quote")):
        fail(f"{year}: provenance of {key} says 'source' without url and quote")
    return dict(entry)


def counted(points_by_round, scheme, last_round):
    """A season total under the dropped-scores rules (bestResults, bestResultsSplit)."""
    split = scheme.get("bestResultsSplit")
    if split:
        total = 0
        for block in split:
            block_points = [points_by_round.get(r, 0) for r in range(block["fromRound"], block["toRound"] + 1)]
            total += sum(sorted(block_points, reverse=True)[:block["best"]])
        return total
    if scheme.get("bestResults"):
        values = [points_by_round.get(r, 0) for r in range(1, last_round + 1)]
        return sum(sorted(values, reverse=True)[:scheme["bestResults"]])
    return sum(points_by_round.values())


def standings_totals(real_results, sprint_results, scheme, last_round, adjustments):
    """Drivers' and constructors' totals the pack's results and rules produce."""
    drivers, teams = {}, {}
    for x in real_results + sprint_results:
        d = drivers.setdefault(x["driverId"], {})
        d[x["round"]] = d.get(x["round"], 0) + x["points"]
    best_car = scheme["constructorsBestCarOnly"]
    for x in real_results:
        t = teams.setdefault(x["teamId"], {})
        t[x["round"]] = max(t.get(x["round"], 0), x["points"]) if best_car else t.get(x["round"], 0) + x["points"]
    for x in sprint_results:
        t = teams.setdefault(x["teamId"], {})
        t[x["round"]] = t.get(x["round"], 0) + x["points"]
    drop_teams = scheme["dropScoresConstructors"]
    totals = {
        "drivers": {k: counted(v, scheme, last_round) for k, v in drivers.items()},
        "constructors": {k: counted(v, scheme, last_round) if drop_teams else sum(v.values()) for k, v in teams.items()},
    }
    for adj in adjustments:
        table = totals[adj["table"]]
        table[adj["id"]] = table.get(adj["id"], 0) + adj["points"]
    return totals


def pit_lane_speed(year, calendar):
    """RF-SIM-12 / SRS 6.2 (WP6): the pit-lane speed limit of a season, from
    curated/era-defaults.json `pitLaneSpeed` (dated periods in km/h with per-circuit
    exceptions by f1db circuit id), with its provenance. Periods that start after the last
    race are dropped."""
    entries = load_json("era-defaults.json")["fields"]["pitLaneSpeed"]
    entry = next((e for e in entries if e["from"] <= year <= e["to"]), None)
    if entry is None:
        fail(f"{year}: era-defaults.json pitLaneSpeed has no range for this year")
    last = calendar[-1]["date"] if calendar else f"{year}-12-31"
    periods = [dict(p) for p in entry["value"] if not p.get("fromDate") or p["fromDate"] <= last]
    for p in periods:
        if set(p) - {"fromDate", "race", "circuits"}:
            fail(f"{year}: pitLaneSpeed period has unknown keys {sorted(set(p) - {'fromDate', 'race', 'circuits'})}")
        if p.get("fromDate") and not str(p["fromDate"]).startswith(f"{year}-"):
            fail(f"{year}: pitLaneSpeed period starts on {p['fromDate']}, outside the season")
        p["circuits"] = {k: p["circuits"][k] for k in sorted(p.get("circuits") or {})}
    provenance = {k: entry[k] for k in ("status", "url", "quote", "note") if k in entry}
    return periods, provenance_of(year, "pitLaneSpeed", provenance)


def ref_laps(con, race_id, qualifying_format):
    """Real reference laps of one Grand Prix (SIM-FISICA §3.10, WP10; RF-SIM-02, RF-WKD-02).

    pole            fastest single qualifying lap of the weekend, in seconds. Under the
                    aggregate format (2005, rounds 1-6) the qualifying_result time is the sum
                    of two laps, so only the single-lap sessions count.
    fastestRaceLap  fastest lap of the race (f1db fastest_lap).
    winnerAvg       the winner's race time over his laps (includes stops and safety cars).
    Any of them is null when f1db has no time (early years, cancelled sessions).
    """
    singles = []
    tables = ["qualifying_1_result", "qualifying_2_result"]
    if qualifying_format != "AGGREGATE":
        singles += [x for row in con.execute(
            "select q1_millis, q2_millis, q3_millis, time_millis from qualifying_result where race_id = ?", (race_id,))
            for x in row if x]
    for table in tables:
        singles += [row[0] for row in con.execute(f"select time_millis from {table} where race_id = ?", (race_id,)) if row[0]]
    fastest = con.execute("select min(time_millis) from fastest_lap where race_id = ?", (race_id,)).fetchone()[0]
    winner = con.execute("""select time_millis, laps from race_result
                            where race_id = ? and position_number = 1 order by position_display_order limit 1""",
                         (race_id,)).fetchone()
    seconds = lambda ms: round(ms / 1000, 3) if ms else None
    return {
        "pole": seconds(min(singles)) if singles else None,
        "fastestRaceLap": seconds(fastest),
        "winnerAvg": seconds(winner[0] / winner[1]) if winner and winner[0] and winner[1] else None,
    }


def build_pack(con, year, regs_cur, events_cur, assets_cur):
    if str(year) not in regs_cur:
        fail(f"{year}: no curated regulations in curated/regulations.json")
    cur = regs_cur[str(year)]

    races = rows(con, """
        select r.id, r.round, r.date, r.grand_prix_id, gp.name as gp_name, r.official_name,
               r.qualifying_format, r.sprint_race_date, r.circuit_id, c.name as circuit_name,
               c.place_name, co.alpha2_code as country, r.circuit_layout_id, r.circuit_type,
               r.direction, r.course_length, r.turns, r.laps, r.scheduled_laps, r.distance
        from race r
        join grand_prix gp on gp.id = r.grand_prix_id
        join circuit c on c.id = r.circuit_id
        join country co on co.id = c.country_id
        where r.year = ? order by r.round""", year)
    if not races:
        fail(f"{year}: f1db has no races")
    race_by_id = {r["id"]: r for r in races}
    last_round = races[-1]["round"]

    # ---------------------------------------------------------------- teams
    # One team per constructor. f1db may list several entrants for one
    # constructor (privateers in 1976, Force India's two entrants in 2018):
    # they are merged, so `entrant` names all of them.
    team_rows = rows(con, """
        select sec.constructor_id as id, e.name as entrant, cn.name as name, cc.alpha2_code as country
        from season_entrant_constructor sec
        join entrant e on e.id = sec.entrant_id
        join constructor cn on cn.id = sec.constructor_id
        left join country cc on cc.id = cn.country_id
        where sec.year = ? order by sec.constructor_id, e.name""", year)
    chassis = rows(con, """
        select distinct sec.constructor_id, ch.id, ch.name from season_entrant_chassis sec
        join chassis ch on ch.id = sec.chassis_id where sec.year = ? order by ch.id""", year)
    engines = rows(con, """
        select distinct see.constructor_id, en.id, en.name, en.capacity, en.configuration, en.aspiration,
               em.name as manufacturer_name, see.engine_manufacturer_id
        from season_entrant_engine see join engine en on en.id = see.engine_id
        join engine_manufacturer em on em.id = see.engine_manufacturer_id
        where see.year = ? order by en.id""", year)
    tyres = rows(con, """
        select distinct constructor_id, tyre_manufacturer_id from season_entrant_tyre_manufacturer
        where year = ? order by tyre_manufacturer_id""", year)

    merged = {}
    for t in team_rows:
        if t["id"] in merged:
            merged[t["id"]]["entrants"].append(t["entrant"])
        else:
            merged[t["id"]] = {**t, "entrants": [t["entrant"]]}

    # An entrant that never turned up at a Grand Prix (March 1993, Larrousse
    # 1995) has nothing to race: it is left out of the pack.
    raced_teams = {r[0] for r in con.execute("""
        select distinct rr.constructor_id from race_result rr join race r on r.id = rr.race_id where r.year = ?""", (year,))}
    year_assets = {k: v for k, v in assets_cur.get(str(year), {}).items() if not k.startswith("_")}
    no_show = sorted(set(year_assets) & (set(merged) - raced_teams))
    if no_show:
        fail(f"{year}: car-assets.json names teams that entered but never raced: {no_show}")
    teams = []
    for tid in sorted(t for t in merged if t in raced_teams):
        t = merged[tid]
        team_engines = [e for e in engines if e["constructor_id"] == tid]
        team_tyres = sorted({x["tyre_manufacturer_id"] for x in tyres if x["constructor_id"] == tid})
        asset = year_assets.get(tid)
        teams.append({
            "id": tid,
            "name": t["name"],
            "entrant": " / ".join(t["entrants"]),
            "country": (t["country"] or "").lower() or None,
            "chassis": [{"id": c["id"], "name": c["name"]} for c in chassis if c["constructor_id"] == tid],
            "engines": [{
                "id": e["id"], "name": e["name"], "manufacturer": e["engine_manufacturer_id"],
                "manufacturerName": e["manufacturer_name"],
                "formula": engine_formula(e["capacity"], e["configuration"], e["aspiration"]),
            } for e in team_engines],
            "tyreSuppliers": team_tyres,
            "car": ({"release": asset["release"], "file": asset["file"], "status": asset["status"]}
                    if asset else None),
        })
    team_ids = {t["id"] for t in teams}
    unknown_assets = set(year_assets) - team_ids
    if unknown_assets:
        fail(f"{year}: car-assets.json names teams not in f1db: {sorted(unknown_assets)}")

    # -------------------------------------------------------- results/entries
    results = rows(con, """
        select rr.race_id, rr.position_display_order, rr.position_number, rr.position_text,
               rr.driver_number, rr.driver_id, rr.constructor_id, rr.engine_manufacturer_id,
               rr.tyre_manufacturer_id, rr.laps, rr.reason_retired, rr.points,
               rr.grid_position_number, rr.qualification_position_number, rr.fastest_lap
        from race_result rr join race r on r.id = rr.race_id
        where r.year = ? order by r.round, rr.position_display_order""", year)
    sprints = rows(con, """
        select s.race_id, s.position_number, s.position_text, s.driver_id, s.constructor_id, s.points
        from sprint_race_result s join race r on r.id = s.race_id
        where r.year = ? order by r.round, s.position_display_order""", year)
    quali = rows(con, """
        select qr.race_id, qr.driver_id, qr.constructor_id, qr.position_number, qr.time_millis,
               qr.q1_millis, qr.q2_millis, qr.q3_millis
        from qualifying_result qr join race r on r.id = qr.race_id where r.year = ?""", year)

    def best_quali_ms(q):
        times = [x for x in (q["time_millis"], q["q1_millis"], q["q2_millis"], q["q3_millis"]) if x]
        return min(times) if times else None

    quali_by_race = {}
    for q in quali:
        quali_by_race.setdefault(q["race_id"], []).append(q)

    def car_number(value):
        return int(value) if value and str(value).isdigit() else None

    # One seat per driver per Grand Prix: a driver f1db lists twice in a round
    # (Stommelen 1976 Germany: the RAM Brabham he did not start and the works
    # Brabham he raced) keeps the car he actually raced.
    def participation(rr):
        return (rr["position_number"] is not None, rr["laps"] or 0, rr["grid_position_number"] is not None)
    best_row = {}
    for rr in results:
        key = (rr["race_id"], rr["driver_id"])
        if key not in best_row or participation(rr) > participation(best_row[key]):
            best_row[key] = rr
    results = [rr for rr in results if best_row[(rr["race_id"], rr["driver_id"])] is rr]

    entries, real_results = [], []
    driver_ids = set()
    for rr in results:
        race = race_by_id[rr["race_id"]]
        driver_ids.add(rr["driver_id"])
        if rr["constructor_id"] not in team_ids:
            fail(f"{year} r{race['round']}: {rr['constructor_id']} raced but is not a season entrant")
        entries.append({
            "round": race["round"], "teamId": rr["constructor_id"], "driverId": rr["driver_id"],
            "carNumber": car_number(rr["driver_number"]), "tyreSupplier": rr["tyre_manufacturer_id"],
        })

    # Rounds f1db has not raced yet (the current season): the grid is the one
    # of the last round with results, marked as projected.
    rounds_with_results = {race_by_id[rr["race_id"]]["round"] for rr in results}
    if not rounds_with_results:
        fail(f"{year}: f1db has no results")
    last_raced = max(rounds_with_results)
    for race in races:
        if race["round"] in rounds_with_results:
            continue
        if race["round"] < last_raced:
            fail(f"{year} r{race['round']}: no results although later rounds have them")
        for e in [x for x in entries if x["round"] == last_raced and not x.get("projected")]:
            entries.append({**e, "round": race["round"], "projected": True})

    sprint_rounds = {race_by_id[s["race_id"]]["round"] for s in sprints}
    sprint_results = []
    for s in sprints:
        race = race_by_id[s["race_id"]]
        if s["constructor_id"] not in team_ids:
            fail(f"{year} r{race['round']}: {s['constructor_id']} ran the sprint but is not a season entrant")
        sprint_results.append({
            "round": race["round"], "driverId": s["driver_id"], "teamId": s["constructor_id"],
            "position": s["position_number"], "status": s["position_text"], "points": s["points"] or 0,
        })

    for race in races:
        field_q = quali_by_race.get(race["id"], [])
        pole_ms = min((best_quali_ms(q) for q in field_q if best_quali_ms(q)), default=None)
        q_by_driver = {q["driver_id"]: q for q in field_q}
        for rr in (x for x in results if x["race_id"] == race["id"]):
            q = q_by_driver.get(rr["driver_id"])
            ms = best_quali_ms(q) if q else None
            real_results.append({
                "round": race["round"], "driverId": rr["driver_id"], "teamId": rr["constructor_id"],
                "position": rr["position_number"], "status": rr["position_text"],
                "laps": rr["laps"], "grid": rr["grid_position_number"],
                "qualifying": q["position_number"] if q else None,
                "qualifyingGapPct": round((ms / pole_ms - 1) * 100, 3) if ms and pole_ms else None,
                "points": rr["points"] or 0,
                "fastestLap": bool(rr["fastest_lap"]),
                "retired": rr["reason_retired"],
            })

    drivers = rows(con, f"""
        select d.id, d.name, d.abbreviation, d.date_of_birth, c.alpha2_code as nationality
        from driver d left join country c on c.id = d.nationality_country_id
        where d.id in ({",".join("?" * len(driver_ids))}) order by d.id""", *sorted(driver_ids))

    # ---------------------------------------------------------------- calendar
    factors = {}
    for key, entry in sorted(cur.get("roundPointsFactor", {}).items(), key=lambda kv: int(kv[0])):
        if not any(r["round"] == int(key) for r in races):
            fail(f"{year}: roundPointsFactor names round {key}, which does not exist")
        provenance_of(year, f"roundPointsFactor.{key}", {k: v for k, v in entry.items() if k != "factor"})
        factors[int(key)] = entry["factor"]
    calendar = [{
        "round": r["round"], "grandPrixId": r["grand_prix_id"], "name": r["gp_name"],
        "officialName": r["official_name"], "date": r["date"], "circuitId": r["circuit_id"],
        "circuitName": r["circuit_name"], "place": r["place_name"], "country": (r["country"] or "").lower(),
        "layoutId": r["circuit_layout_id"], "circuitType": r["circuit_type"], "direction": r["direction"],
        "lengthKm": r["course_length"], "turns": r["turns"], "laps": r["laps"],
        "scheduledLaps": r["scheduled_laps"], "distanceKm": r["distance"],
        "qualifyingFormat": r["qualifying_format"],
        "sprint": r["sprint_race_date"] is not None or r["round"] in sprint_rounds,
        "pointsFactor": factors.get(r["round"], 1),
        "resultsAvailable": r["round"] in rounds_with_results,
        "refLaps": ref_laps(con, r["id"], r["qualifying_format"]),
    } for r in races]

    # ---------------------------------------------------------------- standings
    def merge_rows(items, key):
        # One row per id (2018: f1db keeps Force India's two entrants apart).
        out, seen = [], {}
        for s in items:
            if s[key] in seen:
                row = seen[s[key]]
                row["points"] += s["points"]
                if row["position"] is None:
                    row["position"] = s["position"]
                continue
            row = dict(s)
            seen[s[key]] = row
            out.append(row)
        return out

    standings = {
        "drivers": merge_rows([{"driverId": s["driver_id"], "position": s["position_number"], "points": s["points"]}
                               for s in rows(con, """select driver_id, position_number, points from season_driver_standing
                                                     where year = ? order by position_display_order""", year)], "driverId"),
        "constructors": merge_rows([{"teamId": s["constructor_id"], "position": s["position_number"], "points": s["points"]}
                                    for s in rows(con, """select constructor_id, position_number, points from season_constructor_standing
                                                          where year = ? order by position_display_order""", year)], "teamId"),
    }

    adjustments = []
    for adj in cur.get("standingsAdjustments", []):
        if adj["table"] not in ("drivers", "constructors"):
            fail(f"{year}: standingsAdjustments table must be drivers|constructors")
        known = team_ids if adj["table"] == "constructors" else driver_ids
        if adj["id"] not in known:
            fail(f"{year}: standingsAdjustments names {adj['id']}, not in the {adj['table']} of the season")
        if adj.get("round") is not None and not any(r["round"] == adj["round"] for r in races):
            fail(f"{year}: standingsAdjustments round {adj['round']} does not exist")
        prov = provenance_of(year, f"standingsAdjustments.{adj['id']}",
                             {k: v for k, v in adj.items() if k in PROVENANCE_KEYS})
        adjustments.append({"table": adj["table"], "id": adj["id"], "round": adj.get("round"),
                            "points": adj["points"], "reason": adj["reason"], "provenance": prov})

    # ---------------------------------------------------------------- ratings
    team_ratings = []
    for t in teams:
        mine = [x for x in real_results if x["teamId"] == t["id"]]
        per_round = {}
        for x in mine:
            if x["qualifyingGapPct"] is not None:
                per_round[x["round"]] = min(per_round.get(x["round"], 99), x["qualifyingGapPct"])
        gap = median(list(per_round.values()))
        started = [x for x in mine if x["grid"] is not None and x["status"] not in ("DNS", "DNQ", "DNPQ")]
        buckets = [reliability_bucket(x["retired"]) for x in started if x["position"] is None]
        team_ratings.append({
            "teamId": t["id"],
            "medianQualifyingGapPct": gap,
            "paceIndex": round(max(0.0, min(100.0, 100 - 12 * gap)), 1) if gap is not None else None,
            "reliability": {
                "starts": len(started),
                "mechanicalDnf": buckets.count(MECHANICAL),
                "accidentDnf": buckets.count("accident"),
                "otherDnf": buckets.count("other"),
            },
        })

    results_by_round_team = {}
    for x in real_results:
        results_by_round_team.setdefault((x["round"], x["teamId"]), []).append(x)
    sprint_points = {}
    for x in sprint_results:
        sprint_points[x["driverId"]] = sprint_points.get(x["driverId"], 0) + x["points"]

    driver_ratings = []
    for d in drivers:
        mine = [x for x in real_results if x["driverId"] == d["id"]]
        wins = losses = 0
        gaps = []
        for x in mine:
            for y in results_by_round_team[(x["round"], x["teamId"])]:
                if y["driverId"] == d["id"] or x["qualifyingGapPct"] is None or y["qualifyingGapPct"] is None:
                    continue
                gaps.append(x["qualifyingGapPct"] - y["qualifyingGapPct"])
                if x["qualifyingGapPct"] < y["qualifyingGapPct"]:
                    wins += 1
                else:
                    losses += 1
        teams_raced = sorted({x["teamId"] for x in mine}, key=lambda tid: (-sum(1 for x in mine if x["teamId"] == tid), tid))
        gap = median(gaps)
        driver_ratings.append({
            "driverId": d["id"],
            "teamId": teams_raced[0] if teams_raced else None,
            "starts": sum(1 for x in mine if x["grid"] is not None and x["status"] not in ("DNS", "DNQ", "DNPQ")),
            "points": sum(x["points"] for x in mine) + sprint_points.get(d["id"], 0),
            "wins": sum(1 for x in mine if x["position"] == 1),
            "podiums": sum(1 for x in mine if x["position"] is not None and x["position"] <= 3),
            "teammateQualifying": {"won": wins, "lost": losses},
            "medianGapToTeammatePct": gap,
            "teammateIndex": round(max(40.0, min(99.0, 75 - 20 * gap)), 1) if gap is not None else None,
        })

    # ---------------------------------------------------------------- regulations
    missing = [k for k in CURATED_KEYS if k not in cur["values"]]
    if missing:
        fail(f"{year}: curated regulations miss {missing}")
    extra = set(cur["values"]) - set(CURATED_KEYS)
    if extra:
        fail(f"{year}: curated regulations have unknown keys {sorted(extra)}")
    regs = json.loads(json.dumps(cur["values"]))
    regs["tyreSuppliers"] = sorted({x["tyre_manufacturer_id"] for x in tyres})
    regs["qualifyingFormats"] = sorted({r["qualifying_format"] for r in races})
    provenance = {}
    for key in CURATED_KEYS:
        if key not in cur["provenance"]:
            fail(f"{year}: regulation {key} has no provenance")
        provenance[key] = provenance_of(year, key, cur["provenance"][key])
    provenance["tyreSuppliers"] = {"status": "f1db"}
    provenance["qualifyingFormats"] = {"status": "f1db"}
    regs["pitLaneSpeed"], provenance["pitLaneSpeed"] = pit_lane_speed(year, calendar)
    regs = {k: regs[k] for k in sorted(regs)}
    provenance = {k: provenance[k] for k in sorted(provenance)}

    # Cross-checks of the curated values f1db can prove.
    scheme = regs["pointsScheme"]
    if scheme["doubleLastRace"] != (factors.get(last_round) == 2):
        fail(f"{year}: doubleLastRace={scheme['doubleLastRace']} but roundPointsFactor of the last round is {factors.get(last_round, 1)}")
    for x in real_results:
        if x["position"] is None:
            expected = 0
        else:
            expected = scheme["race"][x["position"] - 1] if x["position"] <= len(scheme["race"]) else 0
            if x["fastestLap"] and scheme["fastestLap"] and x["position"] <= 10:
                expected += scheme["fastestLap"]
        expected *= factors.get(x["round"], 1)
        if abs(x["points"] - expected) > EPS:
            fail(f"{year} r{x['round']} {x['driverId']}: f1db gives {x['points']} pts, scheme says {expected}")
    for x in sprint_results:
        expected = scheme["sprint"][x["position"] - 1] if x["position"] and x["position"] <= len(scheme["sprint"]) else 0
        if abs(x["points"] - expected) > EPS:
            fail(f"{year} sprint r{x['round']} {x['driverId']}: f1db gives {x['points']} pts, sprint scheme says {expected}")
    formulas = sorted({e["formula"] for t in teams for e in t["engines"]})
    if formulas != sorted(regs["engineFormulas"]):
        fail(f"{year}: engineFormulas curated {regs['engineFormulas']} but f1db engines are {formulas}")
    sprint_count = sum(1 for c in calendar if c["sprint"])
    if sprint_count != regs["sprintWeekends"]:
        fail(f"{year}: sprintWeekends curated {regs['sprintWeekends']} but f1db has {sprint_count}")
    totals = standings_totals(real_results, sprint_results, scheme, last_round, adjustments)
    for table, key in (("drivers", "driverId"), ("constructors", "teamId")):
        for row in standings[table]:
            got = totals[table].get(row[key], 0)
            if abs(got - row["points"]) > EPS:
                fail(f"{year}: {table} {row[key]} adds up to {got} under the curated rules, f1db table says {row['points']}")

    # ---------------------------------------------------------------- events
    events = []
    for ev in events_cur.get(str(year), []):
        ev = dict(ev)
        if not str(ev.get("date", "")).startswith(f"{year}-"):
            fail(f"{year}: event {ev.get('id')} is dated {ev.get('date')}")
        if ev.get("round") is not None:
            race = next((c for c in calendar if c["round"] == ev["round"]), None)
            if race is None:
                fail(f"{year}: event {ev['id']} points at round {ev['round']}, which does not exist")
            if race["date"] != ev["date"]:
                fail(f"{year}: event {ev['id']} is dated {ev['date']} but round {ev['round']} is on {race['date']}")
        if ev.get("sensitive") and ev.get("kind") != "note":
            fail(f"{year}: event {ev['id']} is sensitive and must be a note (RF-HIS-00)")
        events.append(ev)

    return {
        "schemaVersion": SCHEMA_VERSION,
        "year": year,
        "packVersion": PACK_VERSION,
        "sources": [
            {"name": "f1db", "version": F1DB_VERSION, "license": "CC BY 4.0", "url": "https://github.com/f1db/f1db"},
            {"name": "f1-3d-assets", "version": "releases 2026-11-05", "license": "per asset (ATTRIBUTION.txt)",
             "url": "https://github.com/heg15220/f1-3d-assets"},
        ],
        "regulations": regs,
        "regulationsProvenance": provenance,
        "calendar": calendar,
        "teams": teams,
        "drivers": [{
            "id": d["id"], "name": d["name"], "code": d["abbreviation"],
            "nationality": (d["nationality"] or "").lower() or None, "dateOfBirth": d["date_of_birth"],
        } for d in drivers],
        "entries": entries,
        "realResults": real_results,
        "sprintResults": sprint_results,
        "standings": standings,
        "standingsAdjustments": adjustments,
        "ratings": {"method": RATINGS_METHOD, "teams": team_ratings, "drivers": driver_ratings},
        "events": events,
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--f1db", required=True, help="path to f1db.db (SQLite release)")
    parser.add_argument("--years", type=int, nargs="+")
    parser.add_argument("--all", action="store_true", help="every year in curated/regulations.json")
    parser.add_argument("--out", default=SEASONS_DIR)
    args = parser.parse_args()

    con = sqlite3.connect(f"file:{args.f1db}?mode=ro", uri=True)
    regs_cur = load_json("regulations.json")
    events_cur = load_json("events.json")
    assets_cur = load_json("car-assets.json")
    years = sorted(int(k) for k in regs_cur if k.isdigit()) if args.all else args.years
    if not years:
        parser.error("give --years or --all")
    for year in years:
        pack = build_pack(con, year, regs_cur, events_cur, assets_cur)
        path = os.path.join(args.out, f"{year}.json")
        with open(path, "w", encoding="utf-8", newline="\n") as fh:
            json.dump(pack, fh, ensure_ascii=False, indent=1)
            fh.write("\n")
        print(f"{year}: {len(pack['calendar'])} rounds, {len(pack['teams'])} teams, "
              f"{len(pack['drivers'])} drivers, {len(pack['entries'])} entries -> {os.path.relpath(path, REPO)}")


if __name__ == "__main__":
    main()
