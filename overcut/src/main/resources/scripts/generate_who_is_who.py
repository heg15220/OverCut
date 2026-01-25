# -*- coding: utf-8 -*-
import random
from sqlalchemy import text
from generate_order_drivers import engine

WHOISWHO_POOL = []

def load_whoiswho_pool():
    global WHOISWHO_POOL
    with engine.connect() as conn:
        rows = conn.execute(text("""
            SELECT d.driverId, CONCAT(d.forename,' ',d.surname) AS driverName
            FROM drivers d
            JOIN results r ON r.driverId = d.driverId
            JOIN races ra ON ra.raceId = r.raceId
            WHERE ra.year >= 1980
            GROUP BY d.driverId, d.forename, d.surname
            HAVING COUNT(DISTINCT r.raceId) >= 25
        """)).fetchall()

    WHOISWHO_POOL = [{"driverId": r[0], "driverName": r[1]} for r in rows]
    print("[startup] WhoIsWho pool:", len(WHOISWHO_POOL))


def _one(conn, q, params):
    row = conn.execute(text(q), params).fetchone()
    return row

def _all(conn, q, params):
    return conn.execute(text(q), params).fetchall()

def _es_en(lang, es, en):
    return es if lang == "es" else en

def generate_who_is_who_game(lang="es", max_hints=15):
    if not WHOISWHO_POOL:
        load_whoiswho_pool()

    target = random.choice(WHOISWHO_POOL)
    driver_id = target["driverId"]
    driver_name = target["driverName"]

    hints = []
    used = set()

    def add(h):
        if not h: 
            return
        if h in used:
            return
        used.add(h)
        hints.append(h)

    with engine.connect() as conn:
        # 1) primera carrera (GP + año)
        row = _one(conn, """
            SELECT ra.year, ra.name
            FROM results r
            JOIN races ra ON ra.raceId = r.raceId
            WHERE r.driverId = :driverId
            ORDER BY ra.year ASC, ra.round ASC
            LIMIT 1
        """, {"driverId": driver_id})
        if row:
            add(_es_en(lang,
                f"Su primera carrera fue el GP de {row[1]} ({row[0]}).",
                f"His first race was the {row[1]} GP ({row[0]})."
            ))

        # 2) primer equipo
        row = _one(conn, """
            SELECT c.name, ra.year
            FROM results r
            JOIN races ra ON ra.raceId = r.raceId
            JOIN constructors c ON c.constructorId = r.constructorId
            WHERE r.driverId = :driverId
            ORDER BY ra.year ASC, ra.round ASC
            LIMIT 1
        """, {"driverId": driver_id})
        if row:
            add(_es_en(lang,
                f"Debutó con el equipo {row[0]} ({row[1]}).",
                f"He debuted with {row[0]} ({row[1]})."
            ))

        # 3) equipos (random 1)
        teams = _all(conn, """
            SELECT DISTINCT c.name
            FROM results r
            JOIN constructors c ON c.constructorId = r.constructorId
            WHERE r.driverId = :driverId
        """, {"driverId": driver_id})
        if teams:
            t = random.choice(teams)[0]
            add(_es_en(lang,
                f"Corrió para el equipo {t}.",
                f"He raced for {t}."
            ))

        # 4) compañero (random)
        mate = _one(conn, """
            SELECT DISTINCT CONCAT(d2.forename,' ',d2.surname) AS mate
            FROM results r1
            JOIN results r2 ON r1.raceId = r2.raceId AND r1.constructorId = r2.constructorId
            JOIN drivers d2 ON d2.driverId = r2.driverId
            WHERE r1.driverId = :driverId
              AND r2.driverId != :driverId
            ORDER BY RAND()
            LIMIT 1
        """, {"driverId": driver_id})
        if mate:
            add(_es_en(lang,
                f"Fue compañero de equipo de {mate[0]}.",
                f"He was a teammate of {mate[0]}."
            ))

        # 5) victorias (circuito)
        win = _one(conn, """
            SELECT ci.name
            FROM results r
            JOIN races ra ON ra.raceId = r.raceId
            JOIN circuits ci ON ci.circuitId = ra.circuitId
            WHERE r.driverId = :driverId
              AND r.positionOrder = 1
            ORDER BY RAND()
            LIMIT 1
        """, {"driverId": driver_id})
        if win:
            add(_es_en(lang,
                f"Ha ganado en el circuito {win[0]}.",
                f"He has won at {win[0]}."
            ))

        # 6) podio (circuito)
        pod = _one(conn, """
            SELECT ci.name
            FROM results r
            JOIN races ra ON ra.raceId = r.raceId
            JOIN circuits ci ON ci.circuitId = ra.circuitId
            WHERE r.driverId = :driverId
              AND r.positionOrder BETWEEN 1 AND 3
            ORDER BY RAND()
            LIMIT 1
        """, {"driverId": driver_id})
        if pod:
            add(_es_en(lang,
                f"Ha hecho podio en {pod[0]}.",
                f"He has scored a podium at {pod[0]}."
            ))

        # 7) puntos en su primera temporada
        first_year = _one(conn, """
            SELECT MIN(ra.year)
            FROM results r JOIN races ra ON ra.raceId = r.raceId
            WHERE r.driverId = :driverId
        """, {"driverId": driver_id})
        if first_year and first_year[0]:
            pts = _one(conn, """
                SELECT COALESCE(SUM(r.points),0)
                FROM results r
                JOIN races ra ON ra.raceId = r.raceId
                WHERE r.driverId = :driverId AND ra.year = :year
            """, {"driverId": driver_id, "year": int(first_year[0])})
            if pts:
                add(_es_en(lang,
                    f"En su primera temporada ({int(first_year[0])}) consiguió {float(pts[0]):.0f} puntos.",
                    f"In his first season ({int(first_year[0])}) he scored {float(pts[0]):.0f} points."
                ))

        # 8) nacionalidad
        nat = _one(conn, "SELECT nationality FROM drivers WHERE driverId = :driverId", {"driverId": driver_id})
        if nat:
            add(_es_en(lang,
                f"Su nacionalidad es {nat[0]}.",
                f"His nationality is {nat[0]}."
            ))

        # 9) poles (si tiene)
        poles = _one(conn, """
            SELECT COUNT(*) 
            FROM qualifying q
            WHERE q.driverId = :driverId AND q.position = 1
        """, {"driverId": driver_id})
        if poles and poles[0] and int(poles[0]) > 0:
            add(_es_en(lang,
                f"Ha conseguido al menos una pole position.",
                f"He has at least one pole position."
            ))

        # 10) campeón del mundo (si aplica)
        champ = _one(conn, """
            SELECT 1
            FROM driverStandings ds
            JOIN races r ON r.raceId = ds.raceId
            WHERE ds.driverId = :driverId
              AND ds.position = 1
              AND r.round = (SELECT MAX(r2.round) FROM races r2 WHERE r2.year = r.year)
            LIMIT 1
        """, {"driverId": driver_id})
        if champ:
            add(_es_en(lang,
                f"Ha sido campeón del mundo.",
                f"He has been world champion."
            ))
        else:
            add(_es_en(lang,
                f"No ha sido campeón del mundo.",
                f"He has not been world champion."
            ))

        # 11) número de GPs disputados (rango)
        gps = _one(conn, """
            SELECT COUNT(DISTINCT r.raceId)
            FROM results r
            WHERE r.driverId = :driverId
        """, {"driverId": driver_id})
        if gps:
            g = int(gps[0])
            add(_es_en(lang,
                f"Ha disputado aproximadamente {g} Grandes Premios.",
                f"He has raced in about {g} Grands Prix."
            ))

        # 12) mejor resultado (positionOrder mínimo)
        best = _one(conn, """
            SELECT MIN(r.positionOrder)
            FROM results r
            WHERE r.driverId = :driverId AND r.positionOrder IS NOT NULL
        """, {"driverId": driver_id})
        if best and best[0]:
            add(_es_en(lang,
                f"Su mejor resultado en carrera es P{int(best[0])}.",
                f"His best race finish is P{int(best[0])}."
            ))

        # 13) primera victoria (si existe)
        fw = _one(conn, """
            SELECT ra.year, ra.name
            FROM results r
            JOIN races ra ON ra.raceId = r.raceId
            WHERE r.driverId = :driverId AND r.positionOrder = 1
            ORDER BY ra.year ASC, ra.round ASC
            LIMIT 1
        """, {"driverId": driver_id})
        if fw:
            add(_es_en(lang,
                f"Su primera victoria fue en {fw[1]} ({fw[0]}).",
                f"His first win was at {fw[1]} ({fw[0]})."
            ))

        # 14) primera vez en podio (si existe)
        fp = _one(conn, """
            SELECT ra.year, ra.name
            FROM results r
            JOIN races ra ON ra.raceId = r.raceId
            WHERE r.driverId = :driverId AND r.positionOrder BETWEEN 1 AND 3
            ORDER BY ra.year ASC, ra.round ASC
            LIMIT 1
        """, {"driverId": driver_id})
        if fp:
            add(_es_en(lang,
                f"Su primer podio fue en {fp[1]} ({fp[0]}).",
                f"His first podium was at {fp[1]} ({fp[0]})."
            ))

        # 15) última temporada
        ly = _one(conn, """
            SELECT MAX(ra.year)
            FROM results r JOIN races ra ON ra.raceId = r.raceId
            WHERE r.driverId = :driverId
        """, {"driverId": driver_id})
        if ly and ly[0]:
            add(_es_en(lang,
                f"Su última temporada fue {int(ly[0])}.",
                f"His last season was {int(ly[0])}."
            ))

    random.shuffle(hints)
    hints = hints[:max_hints]

    return {
        "driverId": driver_id,
        "driverName": driver_name,
        "hints": hints
    }
