# generate_higher_lower.py
import random
import time
from collections import OrderedDict
from threading import Lock
from sqlalchemy import text
from sqlalchemy.orm import sessionmaker

# Usa tu engine global si ya lo tienes en otro módulo
from sqlalchemy import create_engine
DB_URL = "mysql+pymysql://root:root@localhost:3306/f1db"
engine = create_engine(DB_URL)
Session = sessionmaker(bind=engine)

STAT_THEMES = {
    "total_wins": {"es": "¿Tiene más victorias totales?", "en": "More total wins?"},
    "total_podiums": {"es": "¿Tiene más podios totales?", "en": "More total podiums?"},
    "total_points": {"es": "¿Tiene más puntos totales en F1?", "en": "More total F1 points?"},
    "total_races": {"es": "¿Ha disputado más Grandes Premios?", "en": "More career Grand Prix starts?"},
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

PARAM_THEMES = {
    "races_with_team": {"es": "¿Ha corrido más carreras con {team}?", "en": "More races with {team}?"},
    "points_at_circuit": {"es": "¿Tiene más puntos en {circuit}?", "en": "More points at {circuit}?"},
}

def query_races_with_team() -> str:
    return """
        SELECT CONCAT(d.forename,' ',d.surname) AS name, COUNT(DISTINCT r.raceId) AS v
        FROM results r
        JOIN drivers d ON d.driverId = r.driverId
        WHERE r.constructorId = :constructorId
        GROUP BY d.driverId
        HAVING COUNT(DISTINCT r.raceId) >= 5
    """

def query_points_at_circuit() -> str:
    return """
        SELECT CONCAT(d.forename,' ',d.surname) AS name, SUM(r.points) AS v
        FROM results r
        JOIN races ra ON ra.raceId = r.raceId
        JOIN drivers d ON d.driverId = r.driverId
        WHERE ra.circuitId = :circuitId
        GROUP BY d.driverId
        HAVING SUM(r.points) >= 10
    """

# -------------------------
# Helpers
# -------------------------
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
    if not pool or len(pool) < max(50, pick_n):
        return None
    picked = random.sample(pool, pick_n)
    random.shuffle(picked)
    return {"statCode": stat_code, "themeDescription": theme_description, "drivers": picked}

# -------------------------
# Cachés en memoria
# -------------------------
GLOBAL_POOLS = {}  # code -> pool(list)
TEAM_CANDIDATES = []  # [{"constructorId":..,"teamName":..}, ...]
CIRCUIT_CANDIDATES = []  # [{"circuitId":..,"circuitName":..}, ...]

# LRU simple para pools parametrizadas (para no llenar RAM)
TEAM_POOL_CACHE = OrderedDict()     # constructorId -> pool
CIRCUIT_POOL_CACHE = OrderedDict()  # circuitId -> pool
LRU_MAX = 80

# TTL opcional (por si actualizas DB)
LAST_WARMUP_TS = 0
WARMUP_TTL_SECONDS = 6 * 60 * 60  # 6h

_LOCK = Lock()

def _lru_put(cache: OrderedDict, key, value, max_size: int):
    cache[key] = value
    cache.move_to_end(key)
    while len(cache) > max_size:
        cache.popitem(last=False)

def warmup_higher_lower_caches(force: bool = False):
    """
    Precarga:
      - pools globales (4 queries)
      - lista de equipos/circuitos válidos (sin RAND)
    """
    global LAST_WARMUP_TS
    now = int(time.time())
    if not force and LAST_WARMUP_TS and now - LAST_WARMUP_TS < WARMUP_TTL_SECONDS:
        return

    with _LOCK:
        now = int(time.time())
        if not force and LAST_WARMUP_TS and now - LAST_WARMUP_TS < WARMUP_TTL_SECONDS:
            return

        session = Session()
        try:
            # 1) Pools globales
            new_global = {}
            for code, q in QUERIES.items():
                rows = session.execute(text(q)).fetchall()
                new_global[code] = _rows_to_pool(rows)

            # 2) Candidatos de equipos (SIN RAND)
            team_rows = session.execute(text("""
                SELECT c.constructorId, c.name
                FROM constructors c
                JOIN results r ON r.constructorId = c.constructorId
                GROUP BY c.constructorId, c.name
                HAVING COUNT(DISTINCT r.raceId) >= 200
                ORDER BY c.constructorId
            """)).fetchall()
            teams = [{"constructorId": int(r[0]), "teamName": r[1]} for r in team_rows]

            # 3) Candidatos de circuitos (SIN RAND)
            circuit_rows = session.execute(text("""
                SELECT ci.circuitId, ci.name
                FROM circuits ci
                JOIN races ra ON ra.circuitId = ci.circuitId
                GROUP BY ci.circuitId, ci.name
                HAVING COUNT(DISTINCT ra.raceId) >= 25
                ORDER BY ci.circuitId
            """)).fetchall()
            circuits = [{"circuitId": int(r[0]), "circuitName": r[1]} for r in circuit_rows]

            GLOBAL_POOLS.clear()
            GLOBAL_POOLS.update(new_global)

            TEAM_CANDIDATES.clear()
            TEAM_CANDIDATES.extend(teams)

            CIRCUIT_CANDIDATES.clear()
            CIRCUIT_CANDIDATES.extend(circuits)

            # Limpia caches LRU (opcional)
            TEAM_POOL_CACHE.clear()
            CIRCUIT_POOL_CACHE.clear()

            LAST_WARMUP_TS = now
            print(f"[startup] HigherLower warmup: globals={len(GLOBAL_POOLS)} teams={len(TEAM_CANDIDATES)} circuits={len(CIRCUIT_CANDIDATES)}")
        finally:
            session.close()

def _get_team_pool(session, constructor_id: int):
    with _LOCK:
        cached = TEAM_POOL_CACHE.get(constructor_id)
        if cached is not None:
            TEAM_POOL_CACHE.move_to_end(constructor_id)
            return cached

    rows = session.execute(text(query_races_with_team()), {"constructorId": constructor_id}).fetchall()
    pool = _rows_to_pool(rows)

    with _LOCK:
        _lru_put(TEAM_POOL_CACHE, constructor_id, pool, LRU_MAX)
    return pool

def _get_circuit_pool(session, circuit_id: int):
    with _LOCK:
        cached = CIRCUIT_POOL_CACHE.get(circuit_id)
        if cached is not None:
            CIRCUIT_POOL_CACHE.move_to_end(circuit_id)
            return cached

    rows = session.execute(text(query_points_at_circuit()), {"circuitId": circuit_id}).fetchall()
    pool = _rows_to_pool(rows)

    with _LOCK:
        _lru_put(CIRCUIT_POOL_CACHE, circuit_id, pool, LRU_MAX)
    return pool

def generate_higher_lower_game(lang: str):
    lang = "es" if str(lang).lower().startswith("es") else "en"
    warmup_higher_lower_caches(force=False)

    session = Session()
    try:
        # 1) Globales: ya están cacheadas
        codes = list(STAT_THEMES.keys())
        random.shuffle(codes)
        for code in codes:
            pool = GLOBAL_POOLS.get(code) or []
            payload = _build_game_payload(code, STAT_THEMES[code][lang], pool, pick_n=15)
            if payload:
                return payload

        # 2) Parametrizadas: elegir candidato de listas cacheadas (sin RAND SQL)
        param_codes = ["races_with_team", "points_at_circuit"]
        random.shuffle(param_codes)

        for code in param_codes:
            if code == "races_with_team" and TEAM_CANDIDATES:
                team = random.choice(TEAM_CANDIDATES)
                pool = _get_team_pool(session, team["constructorId"])
                theme = PARAM_THEMES[code][lang].format(team=team["teamName"])
                payload = _build_game_payload(code, theme, pool, pick_n=15)
                if payload:
                    return payload

            if code == "points_at_circuit" and CIRCUIT_CANDIDATES:
                circuit = random.choice(CIRCUIT_CANDIDATES)
                pool = _get_circuit_pool(session, circuit["circuitId"])
                theme = PARAM_THEMES[code][lang].format(circuit=circuit["circuitName"])
                payload = _build_game_payload(code, theme, pool, pick_n=15)
                if payload:
                    return payload

        return {"error": "No hay estadísticas con pool suficiente "}
    finally:
        session.close()
