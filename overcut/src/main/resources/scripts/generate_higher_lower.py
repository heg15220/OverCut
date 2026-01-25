# higher_lower_game_generator.py
# Script completo con temáticas globales + temáticas parametrizadas:
# - "Carreras con X equipo"
# - "Más puntos en X circuito"

import random
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

DB_URL = "mysql+pymysql://root:root@localhost:3306/f1db"
engine = create_engine(DB_URL)
Session = sessionmaker(bind=engine)

# =========================
# Temáticas globales (tuyas)
# =========================
STAT_THEMES = {
    "total_wins": {
        "es": "¿Tiene más victorias totales?",
        "en": "More total wins?",
    },
    "total_podiums": {
        "es": "¿Tiene más podios totales?",
        "en": "More total podiums?",
    },
    "total_points": {
        "es": "¿Tiene más puntos totales en F1?",
        "en": "More total F1 points?",
    },
    "total_races": {
        "es": "¿Ha disputado más Grandes Premios?",
        "en": "More career Grand Prix starts?",
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

# ===================================
# Temáticas parametrizadas (nuevas)
# ===================================
PARAM_THEMES = {
    "races_with_team": {
        "es": "¿Ha corrido más carreras con {team}?",
        "en": "More races with {team}?",
    },
    "points_at_circuit": {
        "es": "¿Tiene más puntos en {circuit}?",
        "en": "More points at {circuit}?",
    },
}

def query_races_with_team() -> str:
    return """
        SELECT CONCAT(d.forename,' ',d.surname) AS name,
               COUNT(DISTINCT r.raceId) AS v
        FROM results r
        JOIN drivers d ON d.driverId = r.driverId
        WHERE r.constructorId = :constructorId
        GROUP BY d.driverId
        HAVING COUNT(DISTINCT r.raceId) >= 5
    """

def query_points_at_circuit() -> str:
    return """
        SELECT CONCAT(d.forename,' ',d.surname) AS name,
               SUM(r.points) AS v
        FROM results r
        JOIN races ra ON ra.raceId = r.raceId
        JOIN circuits ci ON ci.circuitId = ra.circuitId
        JOIN drivers d ON d.driverId = r.driverId
        WHERE ra.circuitId = :circuitId
        GROUP BY d.driverId
        HAVING SUM(r.points) >= 10
    """

def pick_random_team(session):
    # Umbral alto para evitar equipos con muy pocos datos -> pool insuficiente
    row = session.execute(text("""
        SELECT c.constructorId, c.name
        FROM constructors c
        JOIN results r ON r.constructorId = c.constructorId
        GROUP BY c.constructorId, c.name
        HAVING COUNT(DISTINCT r.raceId) >= 200
        ORDER BY RAND()
        LIMIT 1
    """)).fetchone()
    if not row:
        return None
    return {"constructorId": int(row[0]), "teamName": row[1]}

def pick_random_circuit(session):
    # Umbral razonable para evitar circuitos con pocas carreras
    row = session.execute(text("""
        SELECT ci.circuitId, ci.name
        FROM circuits ci
        JOIN races ra ON ra.circuitId = ci.circuitId
        GROUP BY ci.circuitId, ci.name
        HAVING COUNT(DISTINCT ra.raceId) >= 25
        ORDER BY RAND()
        LIMIT 1
    """)).fetchone()
    if not row:
        return None
    return {"circuitId": int(row[0]), "circuitName": row[1]}

# =========================
# Helpers
# =========================
def _rows_to_pool(rows):
    pool = []
    for r in rows:
        name = r[0]
        v = r[1]
        if not name or v is None:
            continue
        try:
            pool.append({"pilotName": name, "value": float(v)})
        except Exception:
            continue
    return pool

def _build_game_payload(stat_code: str, theme_description: str, pool, pick_n=15):
    if len(pool) < max(50, pick_n):
        return None
    picked = random.sample(pool, pick_n)
    random.shuffle(picked)
    return {
        "statCode": stat_code,
        "themeDescription": theme_description,
        "drivers": picked
    }

# =========================
# Main generator
# =========================
def generate_higher_lower_game(lang: str):
    lang = "es" if str(lang).lower().startswith("es") else "en"

    session = Session()
    try:
        # 1) Intentar stats globales primero
        codes = list(STAT_THEMES.keys())
        random.shuffle(codes)

        for code in codes:
            rows = session.execute(text(QUERIES[code])).fetchall()
            pool = _rows_to_pool(rows)
            payload = _build_game_payload(code, STAT_THEMES[code][lang], pool, pick_n=15)
            if payload:
                return payload

        # 2) Si no hay pool suficiente, intentar parametrizadas
        param_codes = list(PARAM_THEMES.keys())
        random.shuffle(param_codes)

        for code in param_codes:
            if code == "races_with_team":
                team = pick_random_team(session)
                if not team:
                    continue
                rows = session.execute(
                    text(query_races_with_team()),
                    {"constructorId": team["constructorId"]}
                ).fetchall()
                pool = _rows_to_pool(rows)
                theme = PARAM_THEMES[code][lang].format(team=team["teamName"])
                payload = _build_game_payload(code, theme, pool, pick_n=15)
                if payload:
                    return payload

            if code == "points_at_circuit":
                circuit = pick_random_circuit(session)
                if not circuit:
                    continue
                rows = session.execute(
                    text(query_points_at_circuit()),
                    {"circuitId": circuit["circuitId"]}
                ).fetchall()
                pool = _rows_to_pool(rows)
                theme = PARAM_THEMES[code][lang].format(circuit=circuit["circuitName"])
                payload = _build_game_payload(code, theme, pool, pick_n=15)
                if payload:
                    return payload

        return {"error": "No hay estadísticas con pool suficiente"}
    finally:
        session.close()

# =========================
# Debug manual (opcional)
# =========================
if __name__ == "__main__":
    print(generate_higher_lower_game("es"))
