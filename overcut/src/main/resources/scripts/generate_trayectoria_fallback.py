"""Build the offline fallback bootstrap for OverCut Trayectoria.

The game normally reads /api/overcutTrayectoria/bootstrap, which serves the whole
of Formula 1 history out of the caches in this folder. When the backend is not
reachable the frontend still has to be playable, so this script bakes a much
smaller slice - one season per decade, complete with its real calendar, line-ups
and constructors' championship - into a JS module the client imports directly.

It mirrors the Java controller's derivations exactly (same rating formulas, same
country table) so a career started offline behaves like a career started online,
only with fewer years to choose from.

Usage:
    python generate_trayectoria_fallback.py
    python generate_trayectoria_fallback.py --years 1955 1976 2021
"""

import argparse
import json
import math
import os
import re
import unicodedata
from collections import defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
STATS = os.path.join(HERE, "generic_stats_data.json")
LINEUPS = os.path.join(HERE, "career_lineups.json")
STANDINGS = os.path.join(HERE, "career_constructor_standings.json")

DEFAULT_YEARS = [1955, 1965, 1976, 1988, 1998, 2008, 2016, 2024]

DEFAULT_OUTPUT = os.path.join(
    HERE,
    "..",
    "..",
    "..",
    "..",
    "frontend",
    "src",
    "modules",
    "overcutTrayectoria",
    "data",
    "fallbackBootstrap.js",
)

# Same table as OvercutTrayectoriaController.GP_COUNTRIES, most specific first.
GP_COUNTRIES = [
    ("70th anniversary", "gb"), ("emilia", "it"), ("san marino", "it"),
    ("united states", "us"), ("indianapolis", "us"), ("detroit", "us"),
    ("dallas", "us"), ("las vegas", "us"), ("caesars palace", "us"),
    ("long beach", "us"), ("miami", "us"), ("saudi arabian", "sa"),
    ("abu dhabi", "ae"), ("south african", "za"), ("great britain", "gb"),
    ("british", "gb"), ("styrian", "at"), ("austrian", "at"), ("tuscan", "it"),
    ("italian", "it"), ("sakhir", "bh"), ("bahrain", "bh"), ("qatar", "qa"),
    ("azerbaijan", "az"), ("european", "eu"), ("argentine", "ar"),
    ("australian", "au"), ("belgian", "be"), ("brazilian", "br"),
    ("sao paulo", "br"), ("são paulo", "br"), ("canadian", "ca"),
    ("chinese", "cn"), ("dutch", "nl"), ("french", "fr"), ("german", "de"),
    ("eifel", "de"), ("luxembourg", "de"), ("hungarian", "hu"), ("indian", "in"),
    ("japanese", "jp"), ("pacific", "jp"), ("korean", "kr"), ("malaysian", "my"),
    ("mexican", "mx"), ("mexico city", "mx"), ("monaco", "mc"),
    ("moroccan", "ma"), ("portuguese", "pt"), ("russian", "ru"),
    ("singapore", "sg"), ("spanish", "es"), ("swedish", "se"), ("swiss", "ch"),
    ("turkish", "tr"), ("pescara", "it"), ("austria", "at"),
]


PODIUM_TABLES = (
    "resultados_gp_ganadores",
    "resultados_gp_segundos",
    "resultados_gp_terceros",
)


def country_of(grand_prix):
    key = grand_prix.lower()
    for needle, code in GP_COUNTRIES:
        if needle in key:
            return code
    return None


def slug(value):
    text = unicodedata.normalize("NFD", value.lower())
    text = "".join(ch for ch in text if unicodedata.category(ch) != "Mn")
    text = re.sub(r"[^a-z0-9]+", "-", text)
    return text.strip("-")


def deterministic_jitter(value, spread):
    """Java's String.hashCode, so ratings match the backend byte for byte."""
    hash_value = 0
    for char in value:
        hash_value = (31 * hash_value + ord(char)) & 0xFFFFFFFF
    if hash_value >= 0x80000000:
        hash_value -= 0x100000000
    return (abs(hash_value) % (spread * 2 + 1)) - spread


def clamp_rating(score):
    return max(45, min(99, round(score)))


def build_driver_ratings(stats, drivers):
    podiums = {row["nombre"]: row["podios"] for row in stats["pilotos_podios"]}
    seasons = {row["nombre"]: row["temporadas"] for row in stats["pilotos_temporadas"]}
    wins = defaultdict(int)
    for row in stats["pilotos_victorias_por_temporada"]:
        wins[row["nombre"]] += row["victorias"]
    titles = defaultdict(int)
    for row in stats["campeones_pilotos_por_anio"]:
        titles[row["piloto"]] += 1

    ratings = {}
    for name, years in drivers.items():
        score = (
            52
            + math.sqrt(podiums.get(name, 0)) * 2.65
            + wins.get(name, 0) * 0.32
            + titles.get(name, 0) * 5.8
            + seasons.get(name, len(years)) * 0.42
            + deterministic_jitter(name, 7)
        )
        ratings[name] = clamp_rating(score)
    return ratings


def build_constructor_ratings(stats):
    titles = {row["nombre"]: row["titulos"] for row in stats["constructores_titulos"]}
    doubles = {row["nombre"]: row["dobletes"] for row in stats["constructores_dobletes"]}
    podiums = defaultdict(int)
    for row in stats["constructores_podios_por_temporada"]:
        podiums[row["nombre"]] += row["podios"]

    appearances = defaultdict(int)
    for _, teams in stats["constructores_por_anio"].items():
        for team in teams:
            appearances[team] += 1

    ratings = {}
    for name, years in appearances.items():
        score = (
            50
            + math.sqrt(podiums.get(name, 0)) * 2.25
            + titles.get(name, 0) * 4.3
            + math.sqrt(doubles.get(name, 0)) * 1.5
            + years * 0.34
            + deterministic_jitter(name, 8)
        )
        ratings[name] = clamp_rating(score)
    return ratings


def top_of(values, limit=25):
    rows = [
        {"name": name, "value": value}
        for name, value in values.items()
        if name and value > 0
    ]
    rows.sort(key=lambda row: (-row["value"], row["name"]))
    return rows[:limit]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--years", nargs="*", type=int, default=DEFAULT_YEARS)
    parser.add_argument("--output", default=DEFAULT_OUTPUT)
    args = parser.parse_args()

    with open(STATS, encoding="utf-8") as handle:
        stats = json.load(handle)
    with open(LINEUPS, encoding="utf-8") as handle:
        lineups = json.load(handle)["lineupsByYear"]
    with open(STANDINGS, encoding="utf-8") as handle:
        standings = json.load(handle)["constructorStandingsByYear"]

    drivers = defaultdict(set)
    for year, names in stats["pilotos_por_anio"].items():
        for name in names:
            drivers[name].add(int(year))

    driver_ratings = build_driver_ratings(stats, drivers)
    constructor_ratings = build_constructor_ratings(stats)

    races_by_year = defaultdict(list)
    for row in stats["resultados_gp_ganadores"]:
        year = str(row["year"])
        name = row["gp"]
        if not any(race["name"] == name for race in races_by_year[year]):
            races_by_year[year].append(
                {"round": len(races_by_year[year]) + 1, "name": name, "country": country_of(name)}
            )

    years = [year for year in args.years if str(year) in races_by_year and str(year) in lineups]
    if not years:
        raise SystemExit("none of the requested years have both a calendar and line-ups")

    out_races = {}
    out_lineups = {}
    out_standings = {}
    kept_drivers = set()

    for year in years:
        key = str(year)
        out_races[key] = races_by_year[key]
        out_standings[key] = standings.get(key, [])
        standing_by_team = {row["team"]: row for row in out_standings[key]}

        teams = []
        for team in lineups[key]:
            entry = {
                "id": slug(team["team"]),
                "team": team["team"],
                "rating": constructor_ratings.get(team["team"], 58),
                "races": team.get("races", 0),
                "drivers": [],
            }
            standing = standing_by_team.get(team["team"])
            if standing:
                entry["points"] = standing["points"]
                entry["standingPosition"] = standing["position"]
            # Only the regular line-up plus one stand-in: the client never looks
            # past the third seat and the fallback has to stay small.
            for driver in team.get("drivers", [])[:3]:
                kept_drivers.add(driver["name"])
                entry["drivers"].append(
                    {
                        "name": driver["name"],
                        "rating": driver_ratings.get(driver["name"], 58),
                        "races": driver.get("races", 0),
                    }
                )
            teams.append(entry)
        out_lineups[key] = teams

    champions = {
        str(row["year"]): row["piloto"] for row in stats["campeones_pilotos_por_anio"]
    }

    wins_by_season = defaultdict(dict)
    for row in stats["pilotos_victorias_por_temporada"]:
        if row["nombre"] in kept_drivers:
            wins_by_season[row["nombre"]][str(row["year"])] = row["victorias"]

    # Podiums per driver per season. The three podium tables hold one row per
    # Grand Prix ever run, so counting a driver's rows in a year is how many
    # times they stood on the podium that season - the only per-season measure
    # of a driver the caches carry. Mirrors podiumsBySeason() in the Java
    # controller; the two must stay in step.
    podiums_by_season = defaultdict(dict)
    for table in PODIUM_TABLES:
        for row in stats[table]:
            name = row.get("piloto")
            if name not in kept_drivers:
                continue
            year = str(row["year"])
            podiums_by_season[name][year] = podiums_by_season[name].get(year, 0) + 1

    profiles = []
    for name in sorted(kept_drivers):
        appearances = sorted(drivers.get(name, []))
        if not appearances:
            continue
        profiles.append(
            {
                "id": slug(name),
                "name": name,
                "firstYear": appearances[0],
                "lastYear": appearances[-1],
                "seasons": len(appearances),
                "rating": driver_ratings.get(name, 58),
            }
        )

    titles = defaultdict(int)
    for row in stats["campeones_pilotos_por_anio"]:
        titles[row["piloto"]] += 1
    all_wins = defaultdict(int)
    for row in stats["pilotos_victorias_por_temporada"]:
        all_wins[row["nombre"]] += row["victorias"]

    payload = {
        "dataSource": "fallback (generate_trayectoria_fallback.py)",
        "currentYear": max(years),
        "seasonYears": sorted(years),
        "decades": [
            {"key": f"{decade}s", "label": f"{decade}s", "from": decade, "to": decade + 9}
            for decade in sorted({year // 10 * 10 for year in years})
        ],
        "racesByYear": out_races,
        "lineupsByYear": out_lineups,
        "constructorStandingsByYear": out_standings,
        "championsByYear": champions,
        "winsBySeason": dict(wins_by_season),
        "podiumsBySeason": dict(podiums_by_season),
        "driverProfiles": profiles,
        "recordBook": {
            "titles": top_of(titles),
            "wins": top_of(all_wins),
            "podiums": top_of({row["nombre"]: row["podios"] for row in stats["pilotos_podios"]}),
            "seasons": top_of({row["nombre"]: row["temporadas"] for row in stats["pilotos_temporadas"]}),
        },
    }

    body = json.dumps(payload, ensure_ascii=False, indent=2)
    module = (
        "/**\n"
        " * Offline bootstrap for OverCut Trayectoria.\n"
        " *\n"
        " * GENERATED FILE - do not edit by hand. Rebuild with:\n"
        " *   python src/main/resources/scripts/generate_trayectoria_fallback.py\n"
        " *\n"
        " * One season per decade, with the real calendar, line-ups and constructors'\n"
        " * championship of each, so the game stays playable when the backend is not\n"
        " * reachable. The full history lives behind /api/overcutTrayectoria/bootstrap.\n"
        " */\n\n"
        f"export const fallbackBootstrap = {body};\n\n"
        "export default fallbackBootstrap;\n"
    )

    output = os.path.abspath(args.output)
    os.makedirs(os.path.dirname(output), exist_ok=True)
    with open(output, "w", encoding="utf-8") as handle:
        handle.write(module)

    print(f"wrote {output} ({len(module) // 1024} KB, seasons: {sorted(years)})")


if __name__ == "__main__":
    main()
