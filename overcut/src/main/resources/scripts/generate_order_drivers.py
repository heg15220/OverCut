import random
import json
import argparse
from sqlalchemy import create_engine, text

# Conexión a la base de datos
engine = create_engine("mysql+pymysql://root:root@localhost:3306/f1db")


# Diccionario de traducciones de nacionalidades
NATIONALITY_TRANSLATIONS = {
    "es": {
        "American": "Estadounidense",
        "American-Italian": "Estadounidense-italiano",
        "Argentine": "Argentino",
        "Argentine-Italian": "Argentino-italiano",
        "Argentinian ": "Argentino",
        "Australian": "Australiano",
        "Austrian": "Austriaco",
        "Belgian": "Belga",
        "Brazilian": "Brasileño",
        "British": "Británico",
        "Canadian": "Canadiense",
        "Chilean": "Chileno",
        "Chinese": "Chino",
        "Colombian": "Colombiano",
        "Czech": "Checo",
        "Danish": "Danés",
        "Dutch": "Neerlandés",
        "East German": "Alemán oriental",
        "Finnish": "Finlandés",
        "French": "Francés",
        "German": "Alemán",
        "Hungarian": "Húngaro",
        "Indian": "Indio",
        "Indonesian": "Indonesio",
        "Irish": "Irlandés",
        "Italian": "Italiano",
        "Japanese": "Japonés",
        "Liechtensteiner": "Liechtensteiniano",
        "Malaysian": "Malasio",
        "Mexican": "Mexicano",
        "Monegasque": "Monegasco",
        "New Zealander": "Neozelandés",
        "Polish": "Polaco",
        "Portuguese": "Portugués",
        "Rhodesian": "Rodesiano",
        "Russian": "Ruso",
        "South African": "Sudafricano",
        "Spanish": "Español",
        "Swedish": "Sueco",
        "Swiss": "Suizo",
        "Thai": "Tailandés",
        "Uruguayan": "Uruguayo",
        "Venezuelan": "Venezolano"
    },
    "en": {}  # Identidad, ya que los nombres vienen ya en inglés
}

def translate_nationality(nat, lang):
    if lang == "es":
        return NATIONALITY_TRANSLATIONS["es"].get(nat.strip(), nat)
    return nat

def get_random_team_with_min_wins(conn, min_wins=5):
    result = conn.execute(text("""
        SELECT co.name
        FROM results r
        JOIN constructors co ON r.constructorId = co.constructorId
        WHERE r.positionOrder = 1
        GROUP BY co.constructorId
        HAVING COUNT(*) >= :min_wins
    """), {"min_wins": min_wins})
    teams = [row[0] for row in result.fetchall()]
    return random.choice(teams) if teams else None

def get_random_team_by_wins_or_races(conn):
    result = conn.execute(text("""
        SELECT co.name
        FROM results r
        JOIN constructors co ON r.constructorId = co.constructorId
        GROUP BY co.constructorId
        HAVING COUNT(*) >= 100 OR SUM(r.positionOrder = 1) >= 5
    """))
    teams = [row[0] for row in result.fetchall()]
    return random.choice(teams) if teams else None

def get_random_circuit_with_min_pilots(conn, podium=False):
    condition = "r.positionOrder = 1" if not podium else "r.positionOrder <= 3"
    result = conn.execute(text(f"""
        SELECT c.circuitRef
        FROM results r
        JOIN races ra ON r.raceId = ra.raceId
        JOIN circuits c ON ra.circuitId = c.circuitId
        GROUP BY c.circuitId
        HAVING COUNT(DISTINCT r.driverId) >= 5
    """))
    circuits = [row[0] for row in result.fetchall()]
    return random.choice(circuits) if circuits else None


def get_valid_nationality_for_wins(conn):
    result = conn.execute(text("""
        SELECT d.nationality
        FROM results r
        JOIN drivers d ON r.driverId = d.driverId
        WHERE r.positionOrder = 1
        GROUP BY d.nationality
        HAVING COUNT(DISTINCT d.driverId) >= 5
    """))
    nationalities = [row[0] for row in result.fetchall()]
    return random.choice(nationalities) if nationalities else None


def generate_themes(conn, lang):
    team = get_random_team_with_min_wins(conn)
    team2 = get_random_team_by_wins_or_races(conn)
    circuit = get_random_circuit_with_min_pilots(conn)
    nationality = get_valid_nationality_for_wins(conn)

    nat_wins_t = translate_nationality(nationality, lang)

    return [
        {
            "topic": f"Podios con {team}" if lang == "es" else f"Podiums with {team}",
            "query": f"""
                SELECT d.driverId, CONCAT(d.forename, ' ', d.surname) AS driverName, COUNT(*) AS podiums
                FROM results r
                JOIN constructors co ON r.constructorId = co.constructorId
                JOIN drivers d ON r.driverId = d.driverId
                WHERE r.positionOrder <= 3 AND co.name LIKE '%{team}%'
                GROUP BY r.driverId
                ORDER BY podiums DESC
                LIMIT 50
            """
        },
        {
            "topic": "Campeones del mundo" if lang == "es" else "World Champions",
            "query": """
                SELECT d.driverId, CONCAT(d.forename, ' ', d.surname) AS driverName, COUNT(*) AS titles
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
                ORDER BY titles DESC
                LIMIT 10
            """
        },
        {
            "topic": "Ganadores de Grandes Premios" if lang == "es" else "Grand Prix Winners",
            "query": """
                SELECT d.driverId, CONCAT(d.forename, ' ', d.surname) AS driverName, COUNT(*) AS wins
                FROM results r
                JOIN drivers d ON r.driverId = d.driverId
                WHERE r.positionOrder = 1
                GROUP BY r.driverId
                ORDER BY wins DESC
                LIMIT 50
            """
        },
        {
            "topic": "Podios" if lang == "es" else "Podiums",
            "query": """
                SELECT d.driverId, CONCAT(d.forename, ' ', d.surname) AS driverName, COUNT(*) AS podiums
                FROM results r
                JOIN drivers d ON r.driverId = d.driverId
                WHERE r.positionOrder <= 3
                GROUP BY r.driverId
                ORDER BY podiums DESC
                LIMIT 50
            """
        },
        {
            "topic": f"Carreras disputadas con {team2}" if lang == "es" else f"Races contested with {team2}",
            "query": f"""
                SELECT d.driverId, CONCAT(d.forename, ' ', d.surname) AS driverName, COUNT(*) AS starts
                FROM results r
                JOIN constructors co ON r.constructorId = co.constructorId
                JOIN drivers d ON r.driverId = d.driverId
                WHERE co.name LIKE '%{team2}%'
                GROUP BY d.driverId
                ORDER BY starts DESC
                LIMIT 50
            """
        },
        {
            "topic": "Vueltas Rápidas" if lang == "es" else "Fastest Laps",
            "query": """
                SELECT d.driverId, CONCAT(d.forename, ' ', d.surname) AS driverName, COUNT(*) AS fastlaps
                FROM results r
                JOIN drivers d ON r.driverId = d.driverId
                WHERE r.rank = 1
                GROUP BY r.driverId
                ORDER BY fastlaps DESC
                LIMIT 50
            """
        },
        {
            "topic": "Pole Positions" if lang == "es" else "Pole Positions",
            "query": """
                SELECT d.driverId, CONCAT(d.forename, ' ', d.surname) AS driverName, COUNT(*) AS poles
                FROM qualifying q
                JOIN drivers d ON q.driverId = d.driverId
                WHERE q.position = 1
                GROUP BY q.driverId
                ORDER BY poles DESC
                LIMIT 50
            """
        },
        {
            "topic": f"Pilotos con más poles con {team}" if lang == "es" else f"Drivers with most poles with {team}",
            "query": f"""
                SELECT d.driverId, CONCAT(d.forename, ' ', d.surname) AS driverName, COUNT(*) AS poles
                FROM qualifying q
                JOIN races ra ON q.raceId = ra.raceId
                JOIN results r ON q.driverId = r.driverId AND q.raceId = r.raceId
                JOIN constructors co ON r.constructorId = co.constructorId
                JOIN drivers d ON q.driverId = d.driverId
                WHERE q.position = 1 AND co.name LIKE '%{team}%'
                GROUP BY q.driverId
                ORDER BY poles DESC
                LIMIT 50
            """
        },
        {
            "topic": f"Pilotos con más victorias con {team}" if lang == "es" else f"Drivers with most wins with {team}",
            "query": f"""
                SELECT d.driverId, CONCAT(d.forename, ' ', d.surname) AS driverName, COUNT(*) AS wins
                FROM results r
                JOIN constructors co ON r.constructorId = co.constructorId
                JOIN drivers d ON r.driverId = d.driverId
                WHERE r.positionOrder = 1 AND co.name LIKE '%{team}%'
                GROUP BY r.driverId
                ORDER BY wins DESC
                LIMIT 50
            """
        },
        {
             "topic": f"Pilotos con más victorias en {circuit}" if lang == "es" else f"Drivers with most wins at {circuit}",
            "query": f"""
                SELECT d.driverId, CONCAT(d.forename, ' ', d.surname) AS driverName, COUNT(*) AS wins
                FROM results r
                JOIN races ra ON r.raceId = ra.raceId
                JOIN circuits c ON ra.circuitId = c.circuitId
                JOIN drivers d ON r.driverId = d.driverId
                WHERE r.positionOrder = 1 AND c.circuitRef = '{circuit}'
                GROUP BY r.driverId
                ORDER BY wins DESC
                LIMIT 10
            """
        },
        {
            "topic": f"Pilotos con más podios en {circuit}" if lang == "es" else f"Drivers with most podiums at {circuit}",
            "query": f"""
                SELECT d.driverId, CONCAT(d.forename, ' ', d.surname) AS driverName, COUNT(*) AS podiums
                FROM results r
                JOIN races ra ON r.raceId = ra.raceId
                JOIN circuits c ON ra.circuitId = c.circuitId
                JOIN drivers d ON r.driverId = d.driverId
                WHERE r.positionOrder <= 3 AND c.circuitRef = '{circuit}'
                GROUP BY r.driverId
                ORDER BY podiums DESC
                LIMIT 10
            """
        },
        {
            "topic": f"{nat_wins_t} con más victorias" if lang == "es" else f"{nat_wins_t} with most wins",
            "query": f"""
                SELECT d.driverId, CONCAT(d.forename, ' ', d.surname) AS driverName, COUNT(*) AS wins
                FROM results r
                JOIN drivers d ON r.driverId = d.driverId
                WHERE r.positionOrder = 1 AND d.nationality = '{nat_wins_t}'
                GROUP BY r.driverId
                ORDER BY wins DESC
                LIMIT 10
            """
        },
        {
            "topic": f"{nat_wins_t} con más podios" if lang == "es" else f"{nat_wins_t} with most podiums",
            "query": f"""
                SELECT d.driverId, CONCAT(d.forename, ' ', d.surname) AS driverName, COUNT(*) AS podiums
                FROM results r
                JOIN drivers d ON r.driverId = d.driverId
                WHERE r.positionOrder <= 3 AND d.nationality = '{nat_wins_t}'
                GROUP BY r.driverId
                ORDER BY podiums DESC
                LIMIT 10
            """
        },
        {
            "topic": f"{nat_wins_t} con más poles" if lang == "es" else f"{nat_wins_t} with most poles",
            "query": f"""
                SELECT d.driverId, CONCAT(d.forename, ' ', d.surname) AS driverName, COUNT(*) AS poles
                FROM qualifying q
                JOIN drivers d ON q.driverId = d.driverId
                WHERE q.position = 1 AND d.nationality = '{nat_wins_t}'
                GROUP BY q.driverId
                ORDER BY poles DESC
                LIMIT 10
            """
        },
        {
            "topic": f"{nat_wins_t} con más puntos totales" if lang == "es" else f"{nat_wins_t} with most career points",
            "query": f"""
                SELECT d.driverId, CONCAT(d.forename, ' ', d.surname) AS driverName, SUM(ds.points) AS points
                FROM driverStandings ds
                JOIN drivers d ON ds.driverId = d.driverId
                WHERE d.nationality = '{nat_wins_t}'
                GROUP BY ds.driverId
                ORDER BY points DESC
                LIMIT 10
            """
        }
    ]

def generate_order_game(lang):
    with engine.connect() as conn:
        themes = generate_themes(conn, lang)
        theme = random.choice(themes)
        topic = theme["topic"]
        query = theme["query"]

        result = conn.execute(text(query))
        drivers = result.fetchall()

    random.shuffle(drivers)
    drivers = drivers[:10]
    drivers.sort(key=lambda r: r[2] if len(r) > 2 else 0, reverse=True)

    output = {
        "topic": topic,
        "drivers": []
    }

    for i, row in enumerate(drivers):
        output["drivers"].append({
            "driverId": row.driverId,
            "driverName": row.driverName,
            "correctOrder": i
        })

    print(json.dumps(output, ensure_ascii=False))

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--lang", choices=["es", "en"], default="es", help="Idioma de salida")
    args = parser.parse_args()

    generate_order_game(args.lang)
