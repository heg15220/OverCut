"""Generate final constructor standings by season from the f1db database.

Career Mode uses this cache to make contract point objectives realistic: the
minimum requested from the player is half of the team's real constructor points
for that season when those data are available.

Output shape:

    {
      "source": "f1db constructorStandings table -> generate_career_constructor_standings.py",
      "years": [1958, 1959, ...],
      "constructorStandingsByYear": {
        "2010": [
          { "team": "Red Bull", "position": 1, "points": 498.0 },
          ...
        ]
      }
    }

Usage:
    python generate_career_constructor_standings.py
    python generate_career_constructor_standings.py --min-year 1990
    F1DB_URL="mysql+pymysql://user:pass@host:3306/f1db" python generate_career_constructor_standings.py
"""

import argparse
import json
import os
from collections import defaultdict

from sqlalchemy import create_engine, text

DEFAULT_DB_URL = os.environ.get("F1DB_URL", "mysql+pymysql://root:root@localhost:3306/f1db")


def fetch_constructor_standings(engine, min_year, max_year):
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
        SELECT ra.year      AS year,
               c.name       AS team,
               cs.position  AS position,
               cs.points    AS points
        FROM constructorStandings cs
        JOIN constructors c ON cs.constructorId = c.constructorId
        JOIN races ra       ON cs.raceId = ra.raceId
        WHERE {" AND ".join(where)}
          AND ra.raceId = (
              SELECT MAX(r2.raceId)
              FROM races r2
              WHERE r2.year = ra.year
          )
        ORDER BY ra.year, cs.position, c.name
        """
    )

    by_year = defaultdict(list)
    with engine.connect() as conn:
        for year, team, position, points in conn.execute(query, params).fetchall():
            if not team:
                continue
            by_year[int(year)].append(
                {
                    "team": team,
                    "position": int(position) if position is not None else None,
                    "points": float(points or 0),
                }
            )
    return by_year


def build_payload(by_year):
    standings_by_year = {}
    for year in sorted(by_year.keys()):
        rows = sorted(
            by_year[year],
            key=lambda row: (
                row["position"] if row["position"] is not None else 999,
                row["team"],
            ),
        )
        standings_by_year[str(year)] = rows

    return {
        "source": "f1db constructorStandings table -> generate_career_constructor_standings.py",
        "years": sorted(by_year.keys()),
        "constructorStandingsByYear": standings_by_year,
    }


def main():
    parser = argparse.ArgumentParser(description="Dump final F1 constructor standings from f1db.")
    parser.add_argument("--db-url", default=DEFAULT_DB_URL, help="SQLAlchemy connection URL for f1db.")
    parser.add_argument("--min-year", type=int, default=1958, help="First season to include.")
    parser.add_argument("--max-year", type=int, default=None, help="Last season to include (default: all).")
    parser.add_argument(
        "--output",
        default=os.path.join(os.path.dirname(os.path.abspath(__file__)), "career_constructor_standings.json"),
        help="Destination JSON file.",
    )
    args = parser.parse_args()

    engine = create_engine(args.db_url)
    standings = fetch_constructor_standings(engine, args.min_year, args.max_year)
    payload = build_payload(standings)

    with open(args.output, "w", encoding="utf-8") as handle:
        json.dump(payload, handle, ensure_ascii=False, separators=(",", ":"))

    years = payload["years"]
    total_rows = sum(len(rows) for rows in payload["constructorStandingsByYear"].values())
    print(
        f"Wrote {args.output}: {len(years)} seasons "
        f"({years[0] if years else '-'}-{years[-1] if years else '-'}), {total_rows} constructor rows."
    )


if __name__ == "__main__":
    main()
