import json
import random
import argparse
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Config DB
DB_URL = "mysql+pymysql://root:root@localhost:3306/f1db"
engine = create_engine(DB_URL)
Session = sessionmaker(bind=engine)

# Circuitos base
circuit_refs = [
    'albert_park', 'sepang', 'bahrain', 'catalunya', 'istanbul', 'monaco', 'villeneuve', 'magny_cours', 'silverstone',
    'hockenheimring', 'hungaroring', 'valencia', 'spa', 'monza', 'marina_bay', 'fuji', 'shanghai', 'interlagos',
    'indianapolis', 'nurburgring', 'imola', 'suzuka', 'vegas', 'yas_marina', 'galvez', 'jerez', 'estoril', 'okayama',
    'adelaide', 'kyalami', 'donington', 'rodriguez', 'phoenix', 'ricard', 'yeongam', 'jacarepagua', 'detroit',
    'brands_hatch', 'zandvoort', 'zolder', 'dijon', 'dallas', 'long_beach', 'las_vegas', 'jarama', 'watkins_glen',
    'anderstorp', 'mosport', 'montjuic', 'nivelles', 'charade', 'tremblant', 'essarts', 'lemans', 'reims', 'george',
    'zeltweg', 'aintree', 'boavista', 'riverside', 'avus', 'monsanto', 'sebring', 'ain-diab', 'pescara', 'bremgarten',
    'pedralbes', 'buddh', 'americas', 'red_bull_ring', 'sochi', 'baku', 'portimao', 'mugello', 'jeddah', 'losail', 'miami'
]

# Categorías estáticas
CATEGORIES = {
    "pole_position": {
        "es": "Pilotos con al menos una pole position",
        "en": "Drivers with at least one pole position"
    },
    "world_champion": {
        "es": "Pilotos campeones del mundo",
        "en": "World champions"
    },
    "more_10_wins": {
        "es": "Pilotos con más de 10 victorias",
        "en": "Drivers with more than 10 wins"
    },
    "more_20_podiums": {
        "es": "Pilotos con más de 20 podios",
        "en": "Drivers with more than 20 podiums"
    },
    "more_50_gp": {
        "es": "Pilotos que han disputado más de 50 GP",
        "en": "Drivers who raced in more than 50 GPs"
    },
    "more_150_gp": {
        "es": "Pilotos que han disputado más de 150 GP",
        "en": "Drivers who raced in more than 150 GPs"
    },
    "raced_for_ferrari": {
        "es": "Pilotos que han corrido para Ferrari",
        "en": "Drivers who raced for Ferrari"
    },
    "won_with_mercedes": {
        "es": "Pilotos que han ganado con Mercedes",
        "en": "Drivers who won with Mercedes"
    }
}

# Añadir categorías por circuito dinámicamente
for circuit in circuit_refs:
    label = circuit.replace('_', ' ').title()
    CATEGORIES[f"win_{circuit}"] = {
        "es": f"Pilotos que han ganado en {label}",
        "en": f"Drivers who have won in {label}"
    }
    CATEGORIES[f"podium_{circuit}"] = {
        "es": f"Pilotos que han hecho podio en {label}",
        "en": f"Drivers who have finished on the podium in {label}"
    }
    CATEGORIES[f"pole_{circuit}"] = {
        "es": f"Pilotos con pole position en {label}",
        "en": f"Drivers with a pole position in {label}"
    }


def get_valid_pilots(category, session):
    # Consultas base
    queries = {
        "pole_position": """
            SELECT DISTINCT CONCAT(d.forename, ' ', d.surname)
            FROM qualifying q
            JOIN drivers d ON q.driverId = d.driverId
            WHERE q.position = 1
        """,
        "world_champion": """
            SELECT DISTINCT CONCAT(d.forename, ' ', d.surname)
            FROM driver_standings ds
            JOIN races r ON ds.raceId = r.raceId
            JOIN drivers d ON ds.driverId = d.driverId
            WHERE ds.position = 1
        """,
        "more_10_wins": """
            SELECT CONCAT(d.forename, ' ', d.surname)
            FROM results r
            JOIN drivers d ON r.driverId = d.driverId
            WHERE r.positionOrder = 1
            GROUP BY d.driverId
            HAVING COUNT(*) > 10
        """,
        "more_20_podiums": """
            SELECT CONCAT(d.forename, ' ', d.surname)
            FROM results r
            JOIN drivers d ON r.driverId = d.driverId
            WHERE r.positionOrder <= 3
            GROUP BY d.driverId
            HAVING COUNT(*) > 20
        """,
        "more_50_gp": """
            SELECT CONCAT(d.forename, ' ', d.surname)
            FROM results r
            JOIN drivers d ON r.driverId = d.driverId
            GROUP BY d.driverId
            HAVING COUNT(DISTINCT r.raceId) > 50
        """,
        "more_150_gp": """
            SELECT CONCAT(d.forename, ' ', d.surname)
            FROM results r
            JOIN drivers d ON r.driverId = d.driverId
            GROUP BY d.driverId
            HAVING COUNT(DISTINCT r.raceId) > 150
        """,
        "raced_for_ferrari": """
            SELECT DISTINCT CONCAT(d.forename, ' ', d.surname)
            FROM results r
            JOIN drivers d ON r.driverId = d.driverId
            JOIN constructors c ON r.constructorId = c.constructorId
            WHERE c.name = 'Ferrari'
        """,
        "won_with_mercedes": """
            SELECT DISTINCT CONCAT(d.forename, ' ', d.surname)
            FROM results r
            JOIN drivers d ON r.driverId = d.driverId
            JOIN constructors c ON r.constructorId = c.constructorId
            WHERE r.positionOrder = 1 AND c.name = 'Mercedes'
        """
    }

    # Añadir dinámicas por circuito
    for circuit in circuit_refs:
        queries[f"win_{circuit}"] = f"""
            SELECT DISTINCT CONCAT(d.forename, ' ', d.surname)
            FROM results r
            JOIN races ra ON r.raceId = ra.raceId
            JOIN circuits c ON ra.circuitId = c.circuitId
            JOIN drivers d ON r.driverId = d.driverId
            WHERE r.positionOrder = 1 AND c.circuitRef = '{circuit}'
        """
        queries[f"podium_{circuit}"] = f"""
            SELECT DISTINCT CONCAT(d.forename, ' ', d.surname)
            FROM results r
            JOIN races ra ON r.raceId = ra.raceId
            JOIN circuits c ON ra.circuitId = c.circuitId
            JOIN drivers d ON r.driverId = d.driverId
            WHERE r.positionOrder <= 3 AND c.circuitRef = '{circuit}'
        """
        queries[f"pole_{circuit}"] = f"""
            SELECT DISTINCT CONCAT(d.forename, ' ', d.surname)
            FROM qualifying q
            JOIN races ra ON q.raceId = ra.raceId
            JOIN circuits c ON ra.circuitId = c.circuitId
            JOIN drivers d ON q.driverId = d.driverId
            WHERE q.position = 1 AND c.circuitRef = '{circuit}'
        """

    if category not in queries:
        return []

    return [row[0] for row in session.execute(text(queries[category])).fetchall()]


def get_all_pilots(session):
    query = text("SELECT CONCAT(forename, ' ', surname) FROM drivers")
    return [row[0] for row in session.execute(query).fetchall()]


def generate_game(lang):
    session = Session()
    try:
        categories = list(CATEGORIES.keys())
        random.shuffle(categories)

        for category in categories:
            valid = get_valid_pilots(category, session)
            all_pilots = get_all_pilots(session)
            impostors = list(set(all_pilots) - set(valid))

            if len(valid) >= 5 and len(impostors) >= 5:
                selected = random.sample(valid, 5) + random.sample(impostors, 5)
                random.shuffle(selected)

                result = []
                for p in selected:
                    result.append({
                        "pilotName": p,
                        "valid": p in valid
                    })

                print(json.dumps({
                    "category": category,
                    "themeDescription": CATEGORIES[category][lang],
                    "pilots": result
                }, ensure_ascii=False))
                return

        print(json.dumps({"error": "No valid category with enough data"}))
    finally:
        session.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--lang", choices=["es", "en"], default="es")
    args = parser.parse_args()
    generate_game(lang=args.lang)
