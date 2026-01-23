# resources/scripts/tower_game.py
import os
import json
import random
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

DB_URI = os.getenv("DB_URI", "mysql+pymysql://root:root@localhost:3306/f1db")
engine = create_engine(DB_URI, pool_pre_ping=True)
Session = sessionmaker(bind=engine)

# ---- Caches (mismas ideas que generate_drivers_connections.py) ----
TEAM_CACHE = []                # [(constructorId, name), ...]
COUNTRY_CACHE = []             # ["British", "Spanish", ...]
CIRCUIT_CACHE = []             # ["monza", "spa", ...] (circuitRef)
TEAMMATE_DRIVER_CACHE = []     # [(driverId, "Forename Surname"), ...]
SURNAME_INITIAL_CACHE = []     # ["A","B",...]
WORLD_CHAMPION_CACHE = []      # [(driverId, "Forename Surname"), ...]

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
        TEAM_CACHE.extend([(int(r[0]), str(r[1])) for r in teams])

        COUNTRY_CACHE.clear()
        countries = conn.execute(text("""
            SELECT nationality
            FROM drivers
            GROUP BY nationality
            HAVING COUNT(*) >= 4
        """)).fetchall()
        COUNTRY_CACHE.extend([str(r[0]) for r in countries if r[0] is not None])

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
        CIRCUIT_CACHE.extend([str(r[0]) for r in circuits if r[0] is not None])

        TEAMMATE_DRIVER_CACHE.clear()
        rows = conn.execute(text("""
            SELECT DISTINCT d.driverId, CONCAT(d.forename, ' ', d.surname)
            FROM drivers d
            JOIN results r1 ON d.driverId = r1.driverId
            JOIN results r2 ON r1.raceId = r2.raceId AND r1.constructorId = r2.constructorId
            WHERE r1.driverId != r2.driverId
              AND EXISTS (SELECT 1 FROM races ra WHERE ra.raceId = r1.raceId AND ra.year >= 1980)
        """)).fetchall()
        TEAMMATE_DRIVER_CACHE.extend([(int(r[0]), str(r[1])) for r in rows])

        SURNAME_INITIAL_CACHE.clear()
        initials = conn.execute(text("""
            SELECT UPPER(LEFT(surname, 1)) AS initial
            FROM drivers
            GROUP BY UPPER(LEFT(surname, 1))
            HAVING COUNT(*) >= 4
        """)).fetchall()
        SURNAME_INITIAL_CACHE.extend([str(r[0]) for r in initials if r[0] is not None])

        WORLD_CHAMPION_CACHE.clear()
        champions = conn.execute(text("""
            SELECT d.driverId, CONCAT(d.forename, ' ', d.surname) AS fullName
            FROM drivers d
            JOIN driverStandings ds ON d.driverId = ds.driverId
            JOIN races r ON ds.raceId = r.raceId
            WHERE ds.position = 1
              AND r.round = (
                  SELECT MAX(r2.round)
                  FROM races r2
                  WHERE r2.year = r.year
              )
            GROUP BY d.driverId, fullName
        """)).fetchall()
        WORLD_CHAMPION_CACHE.extend([(int(r[0]), str(r[1])) for r in champions])


def get_tower_themes():
    """
    Devuelve catálogo de temas para el desplegable del frontend.
    - themes[].type: id interno
    - themes[].requiresKey: si el usuario debe elegir un valor
    - themes[].options: lista de {value,label} cuando aplique (team/country/etc.)
    - themes[].keyKind: "driver" si el themeKey debe ser un driverId (teammates)
    """
    decades = [
        {"value": "1980s", "label": "1980s", "startYear": 1980, "endYear": 1989},
        {"value": "1990s", "label": "1990s", "startYear": 1990, "endYear": 1999},
        {"value": "2000s", "label": "2000s", "startYear": 2000, "endYear": 2009},
        {"value": "2010s", "label": "2010s", "startYear": 2010, "endYear": 2019},
        {"value": "2020s", "label": "2020s", "startYear": 2020, "endYear": 2029},
    ]

    return {
        "themes": [
            {"type": "champions", "requiresKey": False},

            {"type": "team", "requiresKey": True,
             "options": [{"value": str(cid), "label": name} for (cid, name) in TEAM_CACHE]},

            {"type": "country", "requiresKey": True,
             "options": [{"value": c, "label": c} for c in COUNTRY_CACHE]},

            {"type": "surname_initial", "requiresKey": True,
             "options": [{"value": i, "label": i} for i in SURNAME_INITIAL_CACHE]},

            {"type": "circuit_winner", "requiresKey": True,
             "options": [{"value": c, "label": c} for c in CIRCUIT_CACHE]},

            {"type": "decade", "requiresKey": True, "options": decades},

            # estos 2: el usuario elige piloto (por autocomplete) y mandas driverId como themeKey
            {"type": "teammates", "requiresKey": True, "keyKind": "driver"},
            {"type": "champion_teammates", "requiresKey": True, "keyKind": "driver"},
        ]
    }


# ---- Helpers ----
def _normalize_driver_id(driverId):
    # si llega 0 desde Java, lo tratamos como null
    if driverId is None:
        return None
    try:
        d = int(driverId)
        return None if d <= 0 else d
    except:
        return None

def _get_driver_id_by_name(session, name: str):
    # 1) exact match
    row = session.execute(text("""
        SELECT driverId
        FROM drivers
        WHERE CONCAT(forename,' ',surname) = :n
        LIMIT 1
    """), {"n": name}).fetchone()
    if row:
        return int(row[0])

    # 2) fallback suave (por si viene sin tildes/espacios raros)
    row2 = session.execute(text("""
        SELECT driverId
        FROM drivers
        WHERE CONCAT(forename,' ',surname) LIKE :pat
        ORDER BY driverId DESC
        LIMIT 1
    """), {"pat": f"%{name}%"}).fetchone()

    return int(row2[0]) if row2 else None

def _count_candidates(conn, themeType, themeKey):
    """
    Solo para asegurar "masa crítica" en generate_tower.
    """
    if themeType == "champions":
        row = conn.execute(text("""
            SELECT COUNT(DISTINCT d.driverId)
            FROM drivers d
            JOIN driverStandings ds ON d.driverId = ds.driverId
            JOIN races r ON ds.raceId = r.raceId
            WHERE ds.position = 1
              AND r.round = (
                  SELECT MAX(r2.round) FROM races r2 WHERE r2.year = r.year
              )
        """)).fetchone()
        return int(row[0] or 0)

    if themeType == "team":
        row = conn.execute(text("""
            SELECT COUNT(DISTINCT r.driverId)
            FROM results r
            WHERE r.constructorId = :constructorId
        """), {"constructorId": int(themeKey)}).fetchone()
        return int(row[0] or 0)

    if themeType == "country":
        row = conn.execute(text("""
            SELECT COUNT(*)
            FROM drivers d
            WHERE d.nationality = :nationality
        """), {"nationality": themeKey}).fetchone()
        return int(row[0] or 0)

    if themeType == "surname_initial":
        row = conn.execute(text("""
            SELECT COUNT(*)
            FROM drivers d
            WHERE UPPER(LEFT(d.surname, 1)) = :initial
        """), {"initial": themeKey}).fetchone()
        return int(row[0] or 0)

    if themeType in ("teammates", "champion_teammates"):
        # nº de compañeros distintos del driver
        row = conn.execute(text("""
            SELECT COUNT(DISTINCT r2.driverId)
            FROM results r1
            JOIN results r2 ON r1.raceId = r2.raceId AND r1.constructorId = r2.constructorId
            WHERE r1.driverId = :driverId AND r2.driverId != :driverId
        """), {"driverId": int(themeKey)}).fetchone()
        return int(row[0] or 0)

    if themeType == "circuit_winner":
        row = conn.execute(text("""
            SELECT COUNT(DISTINCT r.driverId)
            FROM results r
            JOIN races ra ON r.raceId = ra.raceId
            JOIN circuits ci ON ra.circuitId = ci.circuitId
            WHERE r.positionOrder = 1
              AND ci.circuitRef = :circuitRef
        """), {"circuitRef": themeKey}).fetchone()
        return int(row[0] or 0)

    if themeType == "decade":
        startYear, endYear = themeKey["startYear"], themeKey["endYear"]
        row = conn.execute(text("""
            SELECT COUNT(DISTINCT r.driverId)
            FROM results r
            JOIN races ra ON r.raceId = ra.raceId
            WHERE ra.year BETWEEN :startYear AND :endYear
        """), {"startYear": int(startYear), "endYear": int(endYear)}).fetchone()
        return int(row[0] or 0)

    return 0

# ---- Generación de tema (Tower) ----
def generate_tower():
    """
    Devuelve:
      - themeType: pista (team/country/...)
      - themeKey: parámetro interno (constructorId, nationality, driverId, etc)
    """
    with engine.connect() as conn:
        # intentamos varias veces para evitar temas con muy pocos candidatos
        for _ in range(60):
            themeType = random.choice([
                "champions",
                "team",
                "country",
                "surname_initial",
                "teammates",
                "champion_teammates",
                "circuit_winner",
                "decade"
            ])

            # construir themeKey según tipo
            if themeType == "champions":
                themeKey = "world_champions"
                cnt = _count_candidates(conn, themeType, themeKey)

            elif themeType == "team":
                if not TEAM_CACHE:
                    continue
                constructorId, _name = random.choice(TEAM_CACHE)
                themeKey = str(constructorId)  # guardamos como string por simplicidad
                cnt = _count_candidates(conn, themeType, themeKey)

            elif themeType == "country":
                if not COUNTRY_CACHE:
                    continue
                nationality = random.choice(COUNTRY_CACHE)
                themeKey = nationality
                cnt = _count_candidates(conn, themeType, themeKey)

            elif themeType == "surname_initial":
                if not SURNAME_INITIAL_CACHE:
                    continue
                initial = random.choice(SURNAME_INITIAL_CACHE)
                themeKey = initial
                cnt = _count_candidates(conn, themeType, themeKey)

            elif themeType == "teammates":
                if not TEAMMATE_DRIVER_CACHE:
                    continue
                driverId, _ = random.choice(TEAMMATE_DRIVER_CACHE)
                themeKey = str(driverId)
                cnt = _count_candidates(conn, themeType, themeKey)

            elif themeType == "champion_teammates":
                if not WORLD_CHAMPION_CACHE:
                    continue
                champId, _ = random.choice(WORLD_CHAMPION_CACHE)
                themeKey = str(champId)
                cnt = _count_candidates(conn, themeType, themeKey)

            elif themeType == "circuit_winner":
                if not CIRCUIT_CACHE:
                    continue
                circuitRef = random.choice(CIRCUIT_CACHE)
                themeKey = circuitRef
                cnt = _count_candidates(conn, themeType, themeKey)

            elif themeType == "decade":
                decades = [
                    {"code": "1980s", "startYear": 1980, "endYear": 1989},
                    {"code": "1990s", "startYear": 1990, "endYear": 1999},
                    {"code": "2000s", "startYear": 2000, "endYear": 2009},
                    {"code": "2010s", "startYear": 2010, "endYear": 2019},
                    {"code": "2020s", "startYear": 2020, "endYear": 2029},
                ]
                d = random.choice(decades)
                themeKey = d
                cnt = _count_candidates(conn, themeType, themeKey)

            else:
                continue

            # masa crítica mínima (ajustable)
            if cnt >= 10:
                return {
                    "themeType": themeType,
                    "themeKey": themeKey
                }

        # fallback duro (si algo fue mal)
        return {"themeType": "champions", "themeKey": "world_champions"}


def generate_tower_fixed(themeType: str, themeKey=None):
    """
    Generación “forzada” según selección del usuario.
    themeKey puede ser:
      - str para team/country/initial/circuit
      - str code para decade (1980s...) -> lo convertimos a dict
      - str driverId para teammates/champion_teammates
      - None para champions
    """
    if not themeType:
        return generate_tower()

    if themeType == "champions":
        return {"themeType": "champions", "themeKey": "world_champions"}

    if themeType == "decade":
        # themeKey esperado: "1980s", "1990s", ...
        decade_map = {
            "1980s": {"code": "1980s", "startYear": 1980, "endYear": 1989},
            "1990s": {"code": "1990s", "startYear": 1990, "endYear": 1999},
            "2000s": {"code": "2000s", "startYear": 2000, "endYear": 2009},
            "2010s": {"code": "2010s", "startYear": 2010, "endYear": 2019},
            "2020s": {"code": "2020s", "startYear": 2020, "endYear": 2029},
        }
        if isinstance(themeKey, str) and themeKey in decade_map:
            return {"themeType": "decade", "themeKey": decade_map[themeKey]}
        return generate_tower()

    # el resto requiere key (string)
    if themeType in ("team", "country", "surname_initial", "circuit_winner", "teammates", "champion_teammates"):
        if themeKey is None or str(themeKey).strip() == "":
            return generate_tower()
        return {"themeType": themeType, "themeKey": str(themeKey)}

    return generate_tower()


# ---- Validación (Tower) ----
def validate_driver(themeType: str, themeKey, driverId=None, driverName=None):
    session = Session()
    try:
        driverId = _normalize_driver_id(driverId)

        if driverId is None and driverName:
            driverId = _get_driver_id_by_name(session, driverName)

        if driverId is None:
            return {"valid": False}

        # 1) Campeones
        if themeType == "champions" and themeKey == "world_champions":
            ok = session.execute(text("""
                SELECT 1
                FROM driverStandings ds
                JOIN races r ON ds.raceId = r.raceId
                WHERE ds.driverId = :driverId
                  AND ds.position = 1
                  AND r.round = (
                      SELECT MAX(r2.round) FROM races r2 WHERE r2.year = r.year
                  )
                LIMIT 1
            """), {"driverId": driverId}).fetchone() is not None
            return {"valid": ok}

        # 2) Equipo (constructorId)
        if themeType == "team":
            constructorId = int(themeKey)
            ok = session.execute(text("""
                SELECT 1
                FROM results r
                WHERE r.driverId = :driverId
                  AND r.constructorId = :constructorId
                LIMIT 1
            """), {"driverId": driverId, "constructorId": constructorId}).fetchone() is not None
            return {"valid": ok}

        # 3) Nacionalidad
        if themeType == "country":
            ok = session.execute(text("""
                SELECT 1
                FROM drivers d
                WHERE d.driverId = :driverId
                  AND d.nationality = :nationality
                LIMIT 1
            """), {"driverId": driverId, "nationality": themeKey}).fetchone() is not None
            return {"valid": ok}

        # 4) Inicial de apellido
        if themeType == "surname_initial":
            ok = session.execute(text("""
                SELECT 1
                FROM drivers d
                WHERE d.driverId = :driverId
                  AND UPPER(LEFT(d.surname, 1)) = :initial
                LIMIT 1
            """), {"driverId": driverId, "initial": str(themeKey).upper()}).fetchone() is not None
            return {"valid": ok}

        # 5) Compañeros de X
        if themeType in ("teammates", "champion_teammates"):
            refDriverId = int(themeKey)
            ok = session.execute(text("""
                SELECT 1
                FROM results r1
                JOIN results r2 ON r1.raceId = r2.raceId AND r1.constructorId = r2.constructorId
                WHERE r1.driverId = :refDriverId
                  AND r2.driverId = :driverId
                  AND r2.driverId != :refDriverId
                LIMIT 1
            """), {"refDriverId": refDriverId, "driverId": driverId}).fetchone() is not None
            return {"valid": ok}

        # 6) Ganadores en circuito
        if themeType == "circuit_winner":
            ok = session.execute(text("""
                SELECT 1
                FROM results r
                JOIN races ra ON r.raceId = ra.raceId
                JOIN circuits ci ON ra.circuitId = ci.circuitId
                WHERE r.driverId = :driverId
                  AND r.positionOrder = 1
                  AND ci.circuitRef = :circuitRef
                LIMIT 1
            """), {"driverId": driverId, "circuitRef": themeKey}).fetchone() is not None
            return {"valid": ok}

        # 7) Década
        if themeType == "decade":
            # themeKey es dict {"code": "...", "startYear": 1980, "endYear": 1989}
            startYear = int(themeKey["startYear"])
            endYear = int(themeKey["endYear"])
            ok = session.execute(text("""
                SELECT 1
                FROM results r
                JOIN races ra ON r.raceId = ra.raceId
                WHERE r.driverId = :driverId
                  AND ra.year BETWEEN :startYear AND :endYear
                LIMIT 1
            """), {"driverId": driverId, "startYear": startYear, "endYear": endYear}).fetchone() is not None
            return {"valid": ok}

        return {"valid": False}

    finally:
        session.close()


# tower_game.py  (añadir)

def resolve_tower_hint(themeType: str, themeKey):
    """
    Devuelve un string bonito para mostrar en UI como hintValue.
    - team: nombre del constructor
    - circuit_winner: nombre del circuito (si quieres) o circuitRef
    - teammates/champion_teammates: nombre del piloto referencia (driverId)
    - decade: "1980s (1980–1989)" etc
    - country/surname_initial: tal cual
    - champions: "World champions"
    """

    # champs
    if themeType == "champions":
        return "World champions"

    # decade: themeKey es dict {"code": "...", "startYear":..., "endYear":...} (guardado como JSON string en Java)
    if themeType == "decade":
        try:
            code = themeKey.get("code") if isinstance(themeKey, dict) else None
            sy = themeKey.get("startYear") if isinstance(themeKey, dict) else None
            ey = themeKey.get("endYear") if isinstance(themeKey, dict) else None
            if code and sy and ey:
                return f"{code} ({sy}–{ey})"
            return str(themeKey)
        except:
            return str(themeKey)

    # teamKey puede ser constructorId
    if themeType == "team":
        try:
            constructorId = int(themeKey)
            with engine.connect() as conn:
                row = conn.execute(text("""
                    SELECT name
                    FROM constructors
                    WHERE constructorId = :cid
                    LIMIT 1
                """), {"cid": constructorId}).fetchone()
            return str(row[0]) if row else str(themeKey)
        except:
            return str(themeKey)

    # country / initial
    if themeType in ("country", "surname_initial"):
        return str(themeKey)

    # circuitRef -> opcional convertir a nombre del circuito
    if themeType == "circuit_winner":
        try:
            circuitRef = str(themeKey)
            with engine.connect() as conn:
                row = conn.execute(text("""
                    SELECT name
                    FROM circuits
                    WHERE circuitRef = :ref
                    LIMIT 1
                """), {"ref": circuitRef}).fetchone()
            return str(row[0]) if row else circuitRef
        except:
            return str(themeKey)

    # teammates: themeKey es driverId (string)
    if themeType in ("teammates", "champion_teammates"):
        try:
            driverId = int(themeKey)
            with engine.connect() as conn:
                row = conn.execute(text("""
                    SELECT CONCAT(forename, ' ', surname)
                    FROM drivers
                    WHERE driverId = :did
                    LIMIT 1
                """), {"did": driverId}).fetchone()
            return str(row[0]) if row else str(themeKey)
        except:
            return str(themeKey)

    # fallback
    return str(themeKey)


# ---- CLI debug ----
if __name__ == "__main__":
    try:
        precache_dynamic_lists()
        print(json.dumps(generate_tower(), ensure_ascii=False))
    except Exception as e:
        print(json.dumps({"error": str(e)}, ensure_ascii=False))
