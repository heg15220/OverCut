import random
import json
import argparse
from sqlalchemy import create_engine, text

# Configura conexión (variable de entorno o fallback local)
DB_URI = os.getenv("DB_URI", "mysql+pymysql://root:root@localhost:3306/f1db")
engine = create_engine(DB_URI, pool_pre_ping=True)


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

ORDER_THEMES_CACHE = []
ORDER_TEAM_CACHE_MIN_WINS = []
ORDER_TEAM_CACHE_LONG_CAREER = []
ORDER_CIRCUIT_CACHE = []
ORDER_NATIONALITY_CACHE = []


def translate_nationality(nat, lang):
    if lang == "es":
        return NATIONALITY_TRANSLATIONS["es"].get(nat.strip(), nat)
    return nat


def load_teams_with_min_wins(conn, min_wins=5):
    result = conn.execute(text("""
        SELECT DISTINCT co.name
        FROM results r
        JOIN constructors co ON r.constructorId = co.constructorId
        WHERE r.positionOrder = 1
        GROUP BY co.constructorId
        HAVING COUNT(*) >= :min_wins
    """), {"min_wins": min_wins})
    return [row[0] for row in result.fetchall()]

def load_teams_with_enough_races_or_wins(conn):
    result = conn.execute(text("""
        SELECT DISTINCT co.name
        FROM results r
        JOIN constructors co ON r.constructorId = co.constructorId
        GROUP BY co.constructorId
        HAVING COUNT(*) >= 100 OR SUM(r.positionOrder = 1) >= 5
    """))
    return [row[0] for row in result.fetchall()]

def load_valid_circuits(conn):
    result = conn.execute(text("""
        SELECT DISTINCT c.circuitRef
        FROM results r
        JOIN races ra ON r.raceId = ra.raceId
        JOIN circuits c ON ra.circuitId = c.circuitId
        GROUP BY c.circuitId
        HAVING COUNT(DISTINCT r.driverId) >= 5
    """))
    return [row[0] for row in result.fetchall()]


def load_valid_nationalities(conn):
    result = conn.execute(text("""
        SELECT d.nationality
        FROM results r
        JOIN drivers d ON r.driverId = d.driverId
        WHERE r.positionOrder = 1
        GROUP BY d.nationality
        HAVING COUNT(DISTINCT d.driverId) >= 5
    """))
    return [row[0] for row in result.fetchall()]





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

def get_random_cached_value(cache_list, name):
    if not cache_list:
        raise Exception(f"Cache vacía para {name}")
    return random.choice(cache_list)


def generate_themes(conn, lang):
    team = get_random_cached_value(ORDER_TEAM_CACHE_MIN_WINS, "teams with min wins")
    team2 = get_random_cached_value(ORDER_TEAM_CACHE_LONG_CAREER, "teams with long career")
    circuit = get_random_cached_value(ORDER_CIRCUIT_CACHE, "circuits")
    nationality = get_random_cached_value(ORDER_NATIONALITY_CACHE, "nationalities")



    nat_wins_t = translate_nationality(nationality, lang)

    return [
        {
            "topic_template": "Podios con {team}" if lang == "es" else "Podiums with {team}",
            "query_template": """
                SELECT d.driverId, CONCAT(d.forename, ' ', d.surname) AS driverName, COUNT(*) AS podiums
                FROM results r
                JOIN constructors co ON r.constructorId = co.constructorId
                JOIN drivers d ON r.driverId = d.driverId
                WHERE r.positionOrder <= 3 AND co.name LIKE :team
                GROUP BY r.driverId
                ORDER BY podiums DESC, RAND()
                LIMIT 50
            """,
            "params": {"team": f"%{team}%"}
        },
        {
            "topic_template": "Campeones del mundo" if lang == "es" else "World Champions",
            "query_template": """
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
                ORDER BY titles DESC, RAND()
                LIMIT 10
            """,
            "params": {}
        },
        {
            "topic_template": "Ganadores de Grandes Premios" if lang == "es" else "Grand Prix Winners",
            "query_template": """
                SELECT d.driverId, CONCAT(d.forename, ' ', d.surname) AS driverName, COUNT(*) AS wins
                FROM results r
                JOIN drivers d ON r.driverId = d.driverId
                WHERE r.positionOrder = 1
                GROUP BY r.driverId
                ORDER BY wins DESC, RAND()
                LIMIT 50
            """,
            "params": {}
        },
        {
            "topic_template": "Podios" if lang == "es" else "Podiums",
            "query_template": """
                SELECT d.driverId, CONCAT(d.forename, ' ', d.surname) AS driverName, COUNT(*) AS podiums
                FROM results r
                JOIN drivers d ON r.driverId = d.driverId
                WHERE r.positionOrder <= 3
                GROUP BY r.driverId
                ORDER BY podiums DESC, RAND()
                LIMIT 50
            """,
            "params": {}
        },
        {
            "topic_template": "Carreras disputadas con {team}" if lang == "es" else "Races contested with {team}",
            "query_template": """
                SELECT d.driverId, CONCAT(d.forename, ' ', d.surname) AS driverName, COUNT(*) AS starts
                FROM results r
                JOIN constructors co ON r.constructorId = co.constructorId
                JOIN drivers d ON r.driverId = d.driverId
                WHERE co.name LIKE :team
                GROUP BY d.driverId
                ORDER BY starts DESC, RAND()
                LIMIT 50
            """,
            "params": {"team": f"%{team2}%"}
        },
        {
            "topic_template": "Vueltas Rápidas" if lang == "es" else "Fastest Laps",
            "query_template": """
                SELECT d.driverId, CONCAT(d.forename, ' ', d.surname) AS driverName, COUNT(*) AS fastlaps
                FROM results r
                JOIN drivers d ON r.driverId = d.driverId
                WHERE r.rank = 1
                GROUP BY r.driverId
                ORDER BY fastlaps DESC, RAND()
                LIMIT 50
            """,
            "params": {}
        },
        {
            "topic_template": "Pilotos con más victorias con {team}" if lang == "es" else "Drivers with most wins with {team}",
            "query_template": """
                SELECT d.driverId, CONCAT(d.forename, ' ', d.surname) AS driverName, COUNT(*) AS wins
                FROM results r
                JOIN constructors co ON r.constructorId = co.constructorId
                JOIN drivers d ON r.driverId = d.driverId
                WHERE r.positionOrder = 1 AND co.name LIKE :team
                GROUP BY r.driverId
                ORDER BY wins DESC, RAND()
                LIMIT 50
            """,
            "params": {"team": f"{team}"}
        },
        {
            "topic_template": "Carreras disputadas en {circuit}" if lang == "es" else "Races contested at {circuit}",
            "query_template": """
                SELECT d.driverId, CONCAT(d.forename, ' ', d.surname) AS driverName, COUNT(*) AS starts
                FROM results r
                JOIN races ra ON r.raceId = ra.raceId
                JOIN circuits c ON ra.circuitId = c.circuitId
                JOIN drivers d ON r.driverId = d.driverId
                WHERE c.circuitRef = :circuit
                GROUP BY d.driverId
                ORDER BY starts DESC, RAND()
                LIMIT 50
            """,
            "params": {"circuit": circuit}
        },
        {
            "topic_template": "Victorias en {circuit}" if lang == "es" else "Wins at {circuit}",
            "query_template": """
                SELECT d.driverId, CONCAT(d.forename, ' ', d.surname) AS driverName, COUNT(*) AS wins
                FROM results r
                JOIN races ra ON r.raceId = ra.raceId
                JOIN circuits c ON ra.circuitId = c.circuitId
                JOIN drivers d ON r.driverId = d.driverId
                WHERE r.positionOrder = 1 AND c.circuitRef = :circuit
                GROUP BY d.driverId
                ORDER BY wins DESC, RAND()
                LIMIT 50
            """,
            "params": {"circuit": circuit}
        },
        {
            "topic_template": "Podios en {circuit}" if lang == "es" else "Podiums at {circuit}",
            "query_template": """
                SELECT d.driverId, CONCAT(d.forename, ' ', d.surname) AS driverName, COUNT(*) AS podiums
                FROM results r
                JOIN races ra ON r.raceId = ra.raceId
                JOIN circuits c ON ra.circuitId = c.circuitId
                JOIN drivers d ON r.driverId = d.driverId
                WHERE r.positionOrder <= 3 AND c.circuitRef = :circuit
                GROUP BY r.driverId
                ORDER BY podiums DESC, RAND()
                LIMIT 50
            """,
            "params": {"circuit": circuit}
        },
        {
            "topic_template": "{nationality} con más victorias" if lang == "es" else "{nationality} with most wins",
            "query_template": """
                SELECT d.driverId, CONCAT(d.forename, ' ', d.surname) AS driverName, COUNT(*) AS wins
                FROM results r
                JOIN drivers d ON r.driverId = d.driverId
                WHERE r.positionOrder = 1 AND d.nationality = :nationality
                GROUP BY r.driverId
                ORDER BY wins DESC, RAND()
                LIMIT 50
            """,
            "params": {"nationality": nat_wins_t}
        },
        {
            "topic_template": "{nationality} con más podios" if lang == "es" else "{nationality} with most podiums",
            "query_template": """
                SELECT d.driverId, CONCAT(d.forename, ' ', d.surname) AS driverName, COUNT(*) AS podiums
                FROM results r
                JOIN drivers d ON r.driverId = d.driverId
                WHERE r.positionOrder <= 3 AND d.nationality = :nationality
                GROUP BY r.driverId
                ORDER BY podiums DESC, RAND()
                LIMIT 50
            """,
            "params": {"nationality": nat_wins_t}
        }
    ]



def generate_order_game(lang):
    with engine.connect() as conn:
        themes = generate_themes(conn, lang)
        theme = random.choice(themes)

        topic_template = theme["topic_template"]
        query_template = theme["query_template"]
        params = theme["params"]

        # Renderizar texto del topic con sus parámetros
        topic = topic_template.format(**params)

        # Ejecutar la query con parámetros
        result = conn.execute(text(query_template), params)
        drivers = result.fetchall()

    # Mezclar y recortar resultados
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

    return output

def ensure_order_caches_ready():
    global ORDER_TEAM_CACHE_MIN_WINS, ORDER_TEAM_CACHE_LONG_CAREER
    global ORDER_CIRCUIT_CACHE, ORDER_NATIONALITY_CACHE

    with engine.connect() as conn:
        if not ORDER_TEAM_CACHE_MIN_WINS or not ORDER_TEAM_CACHE_LONG_CAREER:
            ORDER_TEAM_CACHE_MIN_WINS = load_teams_with_min_wins(conn)
            ORDER_TEAM_CACHE_LONG_CAREER = load_teams_with_enough_races_or_wins(conn)
            print("[on-demand] Precargadas teams caches.")

        if not ORDER_CIRCUIT_CACHE:
            ORDER_CIRCUIT_CACHE = load_valid_circuits(conn)
            print("[on-demand] Precargada circuits cache.")

        if not ORDER_NATIONALITY_CACHE:
            ORDER_NATIONALITY_CACHE = load_valid_nationalities(conn)
            print("[on-demand] Precargada nationalities cache.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--lang", choices=["es", "en"], default="es", help="Idioma de salida")
    args = parser.parse_args()

    generate_order_game(args.lang)
