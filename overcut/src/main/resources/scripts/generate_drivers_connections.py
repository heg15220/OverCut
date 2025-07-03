import json
import random
from sqlalchemy import create_engine, text
import argparse

parser = argparse.ArgumentParser()
parser.add_argument("--lang", choices=["es", "en"], default="es")
args = parser.parse_args()
LANG = args.lang  # ✅ Este es el que se debe usar

# Configura conexión
engine = create_engine("mysql+pymysql://root:root@localhost:3306/f1db")


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

def translate(code, extra=""):
    base = translations.get(code, {}).get(LANG, code)
    return f"{base} {extra}".strip()

def get_all_drivers_matching_query(conn, query, param_dict):
    result = conn.execute(text(query), param_dict).fetchall()
    return [{"driverId": row[0], "driverName": row[1]} for row in result]

def get_champions_category():
    return {
        "code": "champions",
        "description": translate("champions"),
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

def get_team_categories(conn, used_teams):
    teams = conn.execute(text("""
        SELECT c.constructorId, c.name
        FROM constructors c
        JOIN results r ON c.constructorId = r.constructorId
        WHERE r.positionOrder = 1
        GROUP BY c.constructorId
        HAVING COUNT(*) > 5
    """)).fetchall()

    random.shuffle(teams)
    categories = []
    for constructor_id, team_name in teams:
        if team_name in used_teams:
            continue
        used_teams.add(team_name)
        categories.append({
            "code": f"team_{team_name.lower().replace(' ', '_')}",
            "description": translate("team", team_name),
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

def get_country_categories(conn, used_countries):
    countries = conn.execute(text("""
        SELECT nationality
        FROM drivers
        GROUP BY nationality
        HAVING COUNT(*) >= 4
    """)).fetchall()

    random.shuffle(countries)
    categories = []
    for (nationality,) in countries:
        if nationality in used_countries:
            continue
        used_countries.add(nationality)
        nat_trans = NATIONALITY_TRANSLATIONS.get(nationality, {"es": nationality, "en": nationality})[LANG]
        categories.append({
            "code": f"country_{nationality.lower().replace(' ', '_')}",
            "description": translate("country", nat_trans),
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

def get_race_winner_category():
    return {
        "code": "race_winners",
        "description": translate("race_winners"),
        "query": """
            SELECT d.driverId, CONCAT(d.forename, ' ', d.surname)
            FROM drivers d
            JOIN results r ON d.driverId = r.driverId
            WHERE r.positionOrder = 1
            GROUP BY d.driverId
            HAVING COUNT(*) >= 1
        """
    }

def get_experienced_category():
    return {
        "code": "fifty_gp",
        "description": translate("fifty_gp"),
        "query": """
            SELECT d.driverId, CONCAT(d.forename, ' ', d.surname)
            FROM drivers d
            JOIN results r ON d.driverId = r.driverId
            GROUP BY d.driverId
            HAVING COUNT(DISTINCT r.raceId) > 50
        """
    }

def get_circuit_winner_categories(conn, used_circuits):
    circuits = conn.execute(text("""
        SELECT DISTINCT c.circuitRef
        FROM circuits c
        JOIN races r ON c.circuitId = r.circuitId
        JOIN results res ON res.raceId = r.raceId
        WHERE res.positionOrder = 1
        GROUP BY c.circuitRef
        HAVING COUNT(*) >= 5
    """)).fetchall()

    random.shuffle(circuits)
    categories = []
    for (circuitRef,) in circuits:
        if circuitRef in used_circuits:
            continue
        used_circuits.add(circuitRef)
        categories.append({
            "code": f"circuit_{circuitRef.lower()}",
            "description": f"{'Pilotos que han ganado en' if LANG == 'es' else 'Drivers who won at'} {circuitRef}",
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

def get_decade_categories():
    decades = [
        {"code": "1980s", "start": 1980, "end": 1989},
        {"code": "1990s", "start": 1990, "end": 1999},
        {"code": "2000s", "start": 2000, "end": 2009},
        {"code": "2010s", "start": 2010, "end": 2019},
        {"code": "2020s", "start": 2020, "end": 2029}
    ]

    categories = []
    for dec in decades:
        categories.append({
            "code": f"decade_{dec['code']}",
            "description": f"{'Pilotos que han corrido en los' if LANG == 'es' else 'Drivers who raced in the'} {dec['code']}",
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

def get_teammates_categories(conn):
    categories = []

    # Elige pilotos aleatorios que tengan resultados (para asegurar que tengan compañeros)
    random_drivers = conn.execute(text("""
        SELECT DISTINCT d.driverId, CONCAT(d.forename, ' ', d.surname)
        FROM drivers d
        JOIN results r ON d.driverId = r.driverId
        ORDER BY RAND()
        LIMIT 3
    """)).fetchall()

    for driver_id, full_name in random_drivers:
        description = (
            f"Compañeros de equipo de {full_name}"
            if LANG == "es" else
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




def generate_game():
    with engine.connect() as conn:
        selected_categories = []
        used_driver_ids = set()
        used_teams = set()
        used_countries = set()

        base_categories = [
            get_champions_category(),
            get_race_winner_category(),
            get_experienced_category()
        ]

        dynamic_categories = (
            get_team_categories(conn, used_teams)
            + get_country_categories(conn, used_countries)
            + get_circuit_winner_categories(conn, set())
            + get_decade_categories()
            + get_teammates_categories(conn)
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