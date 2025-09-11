import json
import random
from sqlalchemy import create_engine, text
import argparse

parser = argparse.ArgumentParser()
parser.add_argument("--lang", choices=["es", "en"], default="es")
args = parser.parse_args()
DEFAULT_LANG = args.lang

# Configura conexión (variable de entorno o fallback local)
DB_URI = os.getenv("DB_URI", "mysql+pymysql://root:root@localhost:3306/f1db")
engine = create_engine(DB_URI, pool_pre_ping=True)

translations = {
    "champions": {
        "es": "Pilotos campeones del mundo",
        "en": "World Champion Drivers"
    },
    "race_winners": {
        "es": "Pilotos que han ganado al menos 1 Gran Premio",
        "en": "Drivers with at least 1 Grand Prix win"
    },
    "fifty_gp": {
        "es": "Pilotos con más de 50 Grandes Premios disputados",
        "en": "Drivers with more than 50 Grands Prix"
    },
    "team": {
        "es": "Pilotos que han corrido para",
        "en": "Drivers who raced for"
    },
    "country": {
        "es": "Pilotos de nacionalidad",
        "en": "Drivers of nationality"
    }
}

NATIONALITY_TRANSLATIONS = {
    "American": {"es": "estadounidense", "en": "American"},
    "American-Italian": {"es": "estadounidense-italiana", "en": "American-Italian"},
    "Argentine": {"es": "argentina", "en": "Argentine"},
    "Argentine-Italian": {"es": "argentina-italiana", "en": "Argentine-Italian"},
    "Argentinian": {"es": "argentina", "en": "Argentinian"},
    "Australian": {"es": "australiana", "en": "Australian"},
    "Austrian": {"es": "austriaca", "en": "Austrian"},
    "Belgian": {"es": "belga", "en": "Belgian"},
    "Brazilian": {"es": "brasileña", "en": "Brazilian"},
    "British": {"es": "británica", "en": "British"},
    "Canadian": {"es": "canadiense", "en": "Canadian"},
    "Chilean": {"es": "chilena", "en": "Chilean"},
    "Chinese": {"es": "china", "en": "Chinese"},
    "Colombian": {"es": "colombiana", "en": "Colombian"},
    "Czech": {"es": "checa", "en": "Czech"},
    "Danish": {"es": "danesa", "en": "Danish"},
    "Dutch": {"es": "neerlandesa", "en": "Dutch"},
    "East German": {"es": "alemana oriental", "en": "East German"},
    "Finnish": {"es": "finlandesa", "en": "Finnish"},
    "French": {"es": "francesa", "en": "French"},
    "German": {"es": "alemana", "en": "German"},
    "Hungarian": {"es": "húngara", "en": "Hungarian"},
    "Indian": {"es": "india", "en": "Indian"},
    "Indonesian": {"es": "indonesia", "en": "Indonesian"},
    "Irish": {"es": "irlandesa", "en": "Irish"},
    "Italian": {"es": "italiana", "en": "Italian"},
    "Japanese": {"es": "japonesa", "en": "Japanese"},
    "Liechtensteiner": {"es": "liechtensteiniana", "en": "Liechtensteiner"},
    "Malaysian": {"es": "malaya", "en": "Malaysian"},
    "Mexican": {"es": "mexicana", "en": "Mexican"},
    "Monegasque": {"es": "monegasca", "en": "Monegasque"},
    "New Zealander": {"es": "neozelandesa", "en": "New Zealander"},
    "Polish": {"es": "polaca", "en": "Polish"},
    "Portuguese": {"es": "portuguesa", "en": "Portuguese"},
    "Rhodesian": {"es": "rhodesiana", "en": "Rhodesian"},
    "Russian": {"es": "rusa", "en": "Russian"},
    "South African": {"es": "sudafricana", "en": "South African"},
    "Spanish": {"es": "española", "en": "Spanish"},
    "Swedish": {"es": "sueca", "en": "Swedish"},
    "Swiss": {"es": "suiza", "en": "Swiss"},
    "Thai": {"es": "tailandesa", "en": "Thai"},
    "Uruguayan": {"es": "uruguaya", "en": "Uruguayan"},
    "Venezuelan": {"es": "venezolana", "en": "Venezuelan"}
}

TEAM_DESCRIPTION_CACHE = {"es": {}, "en": {}}
COUNTRY_DESCRIPTION_CACHE = {"es": {}, "en": {}}
STATIC_CATEGORIES_CACHE = {"es": [], "en": []}
TEAM_CACHE = []
COUNTRY_CACHE = []
CIRCUIT_CACHE = []
TEAMMATE_DRIVER_CACHE = []



def translate(code, lang, extra=""):
    base = translations.get(code, {}).get(lang, code)
    return f"{base} {extra}".strip()

def translate_team(lang, team_name):
    if team_name in TEAM_DESCRIPTION_CACHE[lang]:
        return TEAM_DESCRIPTION_CACHE[lang][team_name]
    result = translate("team", lang, team_name)
    TEAM_DESCRIPTION_CACHE[lang][team_name] = result
    return result

def translate_country(lang, nationality):
    if nationality in COUNTRY_DESCRIPTION_CACHE[lang]:
        return COUNTRY_DESCRIPTION_CACHE[lang][nationality]
    result = translate("country", lang, nationality)
    COUNTRY_DESCRIPTION_CACHE[lang][nationality] = result
    return result



def get_all_drivers_matching_query(conn, query, param_dict):
    result = conn.execute(text(query), param_dict).fetchall()
    return [{"driverId": row[0], "driverName": row[1]} for row in result]

def precache_dynamic_lists():
    with engine.connect() as conn:
        TEAM_CACHE.clear()
        teams = conn.execute(text("""
            SELECT c.constructorId, c.name
            FROM constructors c
            JOIN results r ON c.constructorId = r.constructorId
            WHERE r.positionOrder = 1
            GROUP BY c.constructorId
            HAVING COUNT(*) > 5
        """)).fetchall()
        TEAM_CACHE.extend(teams)

        COUNTRY_CACHE.clear()
        countries = conn.execute(text("""
            SELECT nationality
            FROM drivers
            GROUP BY nationality
            HAVING COUNT(*) >= 4
        """)).fetchall()
        COUNTRY_CACHE.extend([n[0] for n in countries])

        CIRCUIT_CACHE.clear()
        circuits = conn.execute(text("""
            SELECT DISTINCT c.circuitRef
            FROM circuits c
            JOIN races r ON c.circuitId = r.circuitId
            JOIN results res ON res.raceId = r.raceId
            WHERE res.positionOrder = 1
            GROUP BY c.circuitRef
            HAVING COUNT(*) >= 5
        """)).fetchall()
        CIRCUIT_CACHE.extend([c[0] for c in circuits])

        TEAMMATE_DRIVER_CACHE.clear()
        rows = conn.execute(text("""
            SELECT DISTINCT d.driverId, CONCAT(d.forename, ' ', d.surname)
            FROM drivers d
            JOIN results r1 ON d.driverId = r1.driverId
            JOIN results r2 ON r1.raceId = r2.raceId AND r1.constructorId = r2.constructorId
            WHERE r1.driverId != r2.driverId
            AND EXISTS (
                SELECT 1 FROM races ra WHERE ra.raceId = r1.raceId AND ra.year >= 1980
            )
        """)).fetchall()
        TEAMMATE_DRIVER_CACHE.extend(rows)



def get_champions_category(lang):
    return {
        "code": "champions",
        "description": translate("champions", lang),
        "query": """
            SELECT d.driverId, CONCAT(d.forename, ' ', d.surname)
            FROM drivers d
            JOIN driverStandings ds ON d.driverId = ds.driverId
            JOIN races r ON ds.raceId = r.raceId
            WHERE ds.position = 1
              AND r.round = (
                  SELECT MAX(r2.round)
                  FROM races r2
                  WHERE r2.year = r.year
              )
            GROUP BY d.driverId
        """
    }

def get_team_categories(conn, used_teams, lang):
    teams = list(TEAM_CACHE)
    random.shuffle(teams)
    categories = []
    for constructor_id, team_name in teams:
        if team_name in used_teams:
            continue
        used_teams.add(team_name)
        categories.append({
            "code": f"team_{team_name.lower().replace(' ', '_')}",
            "description": translate_team(lang, team_name),
            "query": """
                SELECT DISTINCT d.driverId, CONCAT(d.forename, ' ', d.surname)
                FROM drivers d
                JOIN results r ON d.driverId = r.driverId
                WHERE r.constructorId = :constructorId
            """,
            "params": {"constructorId": constructor_id}
        })
        if len(categories) >= 3:
            break
    return categories

def get_country_categories(conn, used_countries, lang):
    countries = [(n,) for n in COUNTRY_CACHE]
    random.shuffle(countries)

    categories = []
    for (nationality,) in countries:
        if nationality in used_countries:
            continue
        used_countries.add(nationality)
        nat_trans = NATIONALITY_TRANSLATIONS.get(nationality, {"es": nationality, "en": nationality})[lang]
        categories.append({
            "code": f"country_{nationality.lower().replace(' ', '_')}",
            "description": translate_country(lang, nat_trans),
            "query": """
                SELECT d.driverId, CONCAT(d.forename, ' ', d.surname)
                FROM drivers d
                WHERE d.nationality = :nationality
            """,
            "params": {"nationality": nationality}
        })
        if len(categories) >= 3:
            break
    return categories

def get_race_winner_category(lang):
    return {
        "code": "race_winners",
        "description": translate("race_winners", lang),
        "query": """
            SELECT d.driverId, CONCAT(d.forename, ' ', d.surname)
            FROM drivers d
            JOIN results r ON d.driverId = r.driverId
            WHERE r.positionOrder = 1
            GROUP BY d.driverId
            HAVING COUNT(*) >= 1
        """
    }

def get_experienced_category(lang):
    return {
        "code": "fifty_gp",
        "description": translate("fifty_gp", lang),
        "query": """
            SELECT d.driverId, CONCAT(d.forename, ' ', d.surname)
            FROM drivers d
            JOIN results r ON d.driverId = r.driverId
            GROUP BY d.driverId
            HAVING COUNT(DISTINCT r.raceId) > 50
        """
    }

def get_circuit_winner_categories(conn, used_circuits, lang):
    circuits = [(c,) for c in CIRCUIT_CACHE]
    random.shuffle(circuits)

    categories = []
    for (circuitRef,) in circuits:
        if circuitRef in used_circuits:
            continue
        used_circuits.add(circuitRef)
        description = (
            f"Pilotos que han ganado en {circuitRef}"
            if lang == "es" else
            f"Drivers who won at {circuitRef}"
        )
        categories.append({
            "code": f"circuit_{circuitRef.lower()}",
            "description": description,
            "query": """
                SELECT DISTINCT d.driverId, CONCAT(d.forename, ' ', d.surname)
                FROM drivers d
                JOIN results r ON d.driverId = r.driverId
                JOIN races ra ON r.raceId = ra.raceId
                JOIN circuits ci ON ra.circuitId = ci.circuitId
                WHERE r.positionOrder = 1 AND ci.circuitRef = :circuitRef
            """,
            "params": {"circuitRef": circuitRef}
        })
        if len(categories) >= 2:
            break
    return categories

def get_decade_categories(lang):
    decades = [
        {"code": "1980s", "start": 1980, "end": 1989},
        {"code": "1990s", "start": 1990, "end": 1999},
        {"code": "2000s", "start": 2000, "end": 2009},
        {"code": "2010s", "start": 2010, "end": 2019},
        {"code": "2020s", "start": 2020, "end": 2029}
    ]

    categories = []
    for dec in decades:
        description = (
            f"Pilotos que han corrido en los {dec['code']}"
            if lang == "es" else
            f"Drivers who raced in the {dec['code']}"
        )
        categories.append({
            "code": f"decade_{dec['code']}",
            "description": description,
            "query": """
                SELECT DISTINCT d.driverId, CONCAT(d.forename, ' ', d.surname)
                FROM drivers d
                JOIN results r ON d.driverId = r.driverId
                JOIN races ra ON r.raceId = ra.raceId
                WHERE ra.year BETWEEN :startYear AND :endYear
            """,
            "params": {"startYear": dec["start"], "endYear": dec["end"]}
        })
    return categories

def get_teammates_categories(conn, lang):
    categories = []

    random_drivers = list(TEAMMATE_DRIVER_CACHE)
    random.shuffle(random_drivers)
    random_drivers = random_drivers[:3]


    for driver_id, full_name in random_drivers:
        description = (
            f"Compañeros de equipo de {full_name}"
            if lang == "es" else
            f"Teammates of {full_name}"
        )

        categories.append({
            "code": f"teammates_{driver_id}",
            "description": description,
            "query": """
                SELECT DISTINCT d2.driverId, CONCAT(d2.forename, ' ', d2.surname)
                FROM results r1
                JOIN results r2 ON r1.raceId = r2.raceId AND r1.constructorId = r2.constructorId
                JOIN drivers d2 ON r2.driverId = d2.driverId
                WHERE r1.driverId = :driverId
                  AND r2.driverId != :driverId
            """,
            "params": {"driverId": driver_id}
        })

        if len(categories) >= 2:
            break

    return categories


def precache_static_categories():
    for lang in ["es", "en"]:
        categories = [
            get_champions_category(lang),
            get_race_winner_category(lang),
            get_experienced_category(lang)
        ]
        categories += get_decade_categories(lang)
        STATIC_CATEGORIES_CACHE[lang] = categories


def generate_game(lang=DEFAULT_LANG):
    with engine.connect() as conn:
        selected_categories = []
        used_driver_ids = set()
        used_teams = set()
        used_countries = set()

        base_categories = list(STATIC_CATEGORIES_CACHE[lang])

        team_cats = get_team_categories(conn, used_teams, lang)
        country_cats = get_country_categories(conn, used_countries, lang)
        circuit_cats = get_circuit_winner_categories(conn, set(), lang)
        decade_cats = get_decade_categories(lang)
        teammate_cats = get_teammates_categories(conn, lang)

        dynamic_categories = (
            random.sample(team_cats, min(2, len(team_cats)))
            + random.sample(country_cats, min(2, len(country_cats)))
            + random.sample(circuit_cats, min(2, len(circuit_cats)))
            + random.sample(decade_cats, min(2, len(decade_cats)))
            + random.sample(teammate_cats, min(2, len(teammate_cats)))
        )

        random.shuffle(dynamic_categories)
        all_categories = base_categories + dynamic_categories
        random.shuffle(all_categories)

        for category in all_categories:
            params = category.get("params", {})
            candidates = get_all_drivers_matching_query(conn, category["query"], params)

            valid_candidates = [c for c in candidates if c["driverId"] not in used_driver_ids]

            if len(valid_candidates) < 4:
                continue

            selected_pilots = random.sample(valid_candidates, 4)
            for pilot in selected_pilots:
                used_driver_ids.add(pilot["driverId"])

            selected_categories.append({
                "code": category["code"],
                "description": category["description"],
                "pilots": selected_pilots
            })

            if len(selected_categories) == 4:
                break

        if len(selected_categories) < 4:
            raise Exception("No se pudieron generar 4 categorías válidas.")

        return {"categories": selected_categories}

if __name__ == "__main__":
    try:
        result = generate_game()
        print(json.dumps(result, ensure_ascii=False))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
