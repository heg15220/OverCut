import json
import random

import argparse
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Config DB
DB_URL = "mysql+pymysql://root:root@localhost:3306/f1db"
engine = create_engine(DB_URL)
Session = sessionmaker(bind=engine)

CATEGORIES = {
    "win_hockenheim": {
        "es": "Pilotos que han ganado en Hockenheim",
        "en": "Drivers who have won in Hockenheim"
    },
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


def get_valid_pilots(category, session):
    queries = {
        "win_hockenheim": """
            SELECT DISTINCT CONCAT(d.forename, ' ', d.surname)
            FROM results r
            JOIN races ra ON r.raceId = ra.raceId
            JOIN drivers d ON r.driverId = d.driverId
            JOIN circuits c ON ra.circuitId = c.circuitId
            WHERE r.positionOrder = 1 AND c.circuitRef = 'hockenheimring'
        """,
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
