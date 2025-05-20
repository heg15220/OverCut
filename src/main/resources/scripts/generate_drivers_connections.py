import json
import random
from sqlalchemy import create_engine, text

# Configura conexión
engine = create_engine("mysql+pymysql://root:root@localhost:3306/f1db")

def get_all_drivers_matching_query(conn, query, param_dict):
    result = conn.execute(text(query), param_dict).fetchall()
    return [{"driverId": row[0], "driverName": row[1]} for row in result]

def get_champions_category():
    return {
        "code": "champions",
        "description": "Pilotos campeones del mundo",
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

def get_team_category(conn):
    teams = conn.execute(text("""
        SELECT c.constructorId, c.name
        FROM constructors c
        JOIN results r ON c.constructorId = r.constructorId
        WHERE r.positionOrder = 1
        GROUP BY c.constructorId
        HAVING COUNT(*) > 5
    """)).fetchall()

    if not teams:
        return None

    constructor = random.choice(teams)
    constructor_id = constructor[0]
    team_name = constructor[1]

    return {
        "code": f"team_{team_name.lower().replace(' ', '_')}",
        "description": f"Pilotos que han corrido para {team_name}",
        "query": """
            SELECT DISTINCT d.driverId, CONCAT(d.forename, ' ', d.surname)
            FROM drivers d
            JOIN results r ON d.driverId = r.driverId
            WHERE r.constructorId = :constructorId
        """,
        "params": {"constructorId": constructor_id}
    }

def get_country_category(conn):
    countries = conn.execute(text("""
        SELECT nationality
        FROM drivers
        GROUP BY nationality
        HAVING COUNT(*) >= 4
    """)).fetchall()

    if not countries:
        return None

    nationality = random.choice(countries)[0]

    return {
        "code": f"country_{nationality.lower().replace(' ', '_')}",
        "description": f"Pilotos de nacionalidad {nationality}",
        "query": """
            SELECT d.driverId, CONCAT(d.forename, ' ', d.surname)
            FROM drivers d
            WHERE d.nationality = :nationality
        """,
        "params": {"nationality": nationality}
    }

def generate_game():
    with engine.connect() as conn:
        selected_categories = []
        used_driver_ids = set()

        raw_categories = [
            get_champions_category(),
            get_team_category(conn),
            get_country_category(conn),
        ]

        # Elimina posibles None si no se pudo generar alguna
        raw_categories = [cat for cat in raw_categories if cat]

        for category in raw_categories:
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

        if len(selected_categories) < 3:
            raise Exception("No se pudieron generar 3 categorías válidas.")

        return {"categories": selected_categories}


if __name__ == "__main__":
    try:
        result = generate_game()
        print(json.dumps(result, ensure_ascii=False))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
