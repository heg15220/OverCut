import random
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

DB_URL = "mysql+pymysql://root:root@localhost:3306/f1db"
engine = create_engine(DB_URL)
Session = sessionmaker(bind=engine)

STAT_THEMES = {
    "total_wins": {
        "es": "¿Tiene más victorias totales?",
        "en": "More total wins?"
    },
    "total_podiums": {
        "es": "¿Tiene más podios totales?",
        "en": "More total podiums?"
    },
    "total_points": {
        "es": "¿Tiene más puntos totales en F1?",
        "en": "More total F1 points?"
    },
    "total_races": {
        "es": "¿Ha disputado más Grandes Premios?",
        "en": "More career Grand Prix starts?"
    },
}

QUERIES = {
    "total_wins": """
        SELECT CONCAT(d.forename,' ',d.surname) AS name, COUNT(*) AS v
        FROM results r
        JOIN drivers d ON d.driverId=r.driverId
        WHERE r.positionOrder=1
        GROUP BY d.driverId
        HAVING COUNT(*) >= 1
    """,
    "total_podiums": """
        SELECT CONCAT(d.forename,' ',d.surname) AS name, COUNT(*) AS v
        FROM results r
        JOIN drivers d ON d.driverId=r.driverId
        WHERE r.positionOrder <= 3
        GROUP BY d.driverId
        HAVING COUNT(*) >= 1
    """,
    "total_points": """
        SELECT CONCAT(d.forename,' ',d.surname) AS name, SUM(r.points) AS v
        FROM results r
        JOIN drivers d ON d.driverId=r.driverId
        GROUP BY d.driverId
        HAVING SUM(r.points) > 0
    """,
    "total_races": """
        SELECT CONCAT(d.forename,' ',d.surname) AS name, COUNT(DISTINCT r.raceId) AS v
        FROM results r
        JOIN drivers d ON d.driverId=r.driverId
        GROUP BY d.driverId
        HAVING COUNT(DISTINCT r.raceId) >= 10
    """,
}

def generate_higher_lower_game(lang: str):
    session = Session()
    try:
        codes = list(STAT_THEMES.keys())
        random.shuffle(codes)

        for code in codes:
            rows = session.execute(text(QUERIES[code])).fetchall()
            if len(rows) < 50:
                continue

            pool = [{"pilotName": r[0], "value": float(r[1])} for r in rows if r[0] and r[1] is not None]
            if len(pool) < 50:
                continue

            picked = random.sample(pool, 15)
            random.shuffle(picked)

            return {
                "statCode": code,
                "themeDescription": STAT_THEMES[code][lang],
                "drivers": picked
            }

        return {"error": "No hay estadísticas con pool suficiente"}
    finally:
        session.close()
