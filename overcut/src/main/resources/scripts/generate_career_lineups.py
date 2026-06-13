"""Generate the real per-season grid (team <-> drivers) from the f1db database.

The OverCut bootstrap (generic_stats_data.json) only stores drivers and teams
per year *separately*, so the actual driver->team pairing of a given season
cannot be reconstructed from it. That pairing lives in the f1db `results` table.

This script dumps it once into `career_lineups.json`, which is then shipped as a
cache and consumed by Career Mode to build a historically real grid for the
debut season.

Output shape:

    {
      "source": "f1db results table -> generate_career_lineups.py",
      "years": [1950, 1951, ...],
      "lineupsByYear": {
        "1950": [
          { "team": "Alfa Romeo", "races": 7,
            "drivers": [ { "name": "Nino Farina", "races": 7 },
                         { "name": "Juan Manuel Fangio", "races": 6 }, ... ] },
          ...
        ],
        ...
      }
    }

Driver and team name strings match exactly what the Java bootstrap uses
(`CONCAT(forename, ' ', surname)` and `constructors.name`) so ratings line up.
Drivers within a team are ordered by races driven (most first), so a consumer
can take the top two as the season's regular line-up and treat the rest as
mid-season replacements.

Usage:
    python generate_career_lineups.py
    python generate_career_lineups.py --min-year 1990 --output career_lineups.json
    F1DB_URL="mysql+pymysql://user:pass@host:3306/f1db" python generate_career_lineups.py
"""

import argparse
import json
import os
from collections import defaultdict

from sqlalchemy import create_engine, text

DEFAULT_DB_URL = os.environ.get("F1DB_URL", "mysql+pymysql://root:root@localhost:3306/f1db")


def fetch_lineups(engine, min_year, max_year):
    """Return year -> team -> ordered list of (driver_name, races)."""
    where = ["1=1"]
    params = {}
    if min_year is not None:
        where.append("ra.year >= :min_year")
        params["min_year"] = min_year
    if max_year is not None:
        where.append("ra.year <= :max_year")
        params["max_year"] = max_year

    query = text(
        f"""
        SELECT ra.year                                AS year,
               c.name                                 AS team,
               CONCAT(d.forename, ' ', d.surname)     AS driver,
               COUNT(DISTINCT r.raceId)               AS races
        FROM results r
        JOIN races ra        ON r.raceId        = ra.raceId
        JOIN constructors c  ON r.constructorId = c.constructorId
        JOIN drivers d       ON r.driverId      = d.driverId
        WHERE {" AND ".join(where)}
        GROUP BY ra.year, c.constructorId, r.driverId
        ORDER BY ra.year, c.name, races DESC, driver
        """
    )

    # year -> team -> [(driver, races)]
    grid = defaultdict(lambda: defaultdict(list))
    with engine.connect() as conn:
        for year, team, driver, races in conn.execute(query, params).fetchall():
            if not team or not driver:
                continue
            grid[int(year)][team].append((driver, int(races)))
    return grid


def build_payload(grid):
    lineups_by_year = {}
    for year in sorted(grid.keys()):
        teams = []
        for team, drivers in grid[year].items():
            ordered = sorted(drivers, key=lambda item: (-item[1], item[0]))
            team_races = max((races for _, races in ordered), default=0)
            teams.append(
                {
                    "team": team,
                    "races": team_races,
                    "drivers": [{"name": name, "races": races} for name, races in ordered],
                }
            )
        # Major teams first (most race participation), stable by name.
        teams.sort(key=lambda entry: (-entry["races"], entry["team"]))
        lineups_by_year[str(year)] = teams

    return {
        "source": "f1db results table -> generate_career_lineups.py",
        "years": sorted(grid.keys()),
        "lineupsByYear": lineups_by_year,
    }


def main():
    parser = argparse.ArgumentParser(description="Dump the real per-season F1 grid from f1db.")
    parser.add_argument("--db-url", default=DEFAULT_DB_URL, help="SQLAlchemy connection URL for f1db.")
    parser.add_argument("--min-year", type=int, default=1950, help="First season to include.")
    parser.add_argument("--max-year", type=int, default=None, help="Last season to include (default: all).")
    parser.add_argument(
        "--output",
        default=os.path.join(os.path.dirname(os.path.abspath(__file__)), "career_lineups.json"),
        help="Destination JSON file.",
    )
    args = parser.parse_args()

    engine = create_engine(args.db_url)
    grid = fetch_lineups(engine, args.min_year, args.max_year)
    payload = build_payload(grid)

    with open(args.output, "w", encoding="utf-8") as handle:
        json.dump(payload, handle, ensure_ascii=False, separators=(",", ":"))

    years = payload["years"]
    total_seats = sum(
        len(team["drivers"]) for teams in payload["lineupsByYear"].values() for team in teams
    )
    print(
        f"Wrote {args.output}: {len(years)} seasons "
        f"({years[0] if years else '-'}-{years[-1] if years else '-'}), {total_seats} driver-seats."
    )


if __name__ == "__main__":
    main()
