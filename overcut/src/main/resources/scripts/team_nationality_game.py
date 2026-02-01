# -*- coding: utf-8 -*-
from sqlalchemy import text
import random
from collections import deque
from generate_order_drivers import engine

NATIONALITY_TO_CC = {
    "British": "GB", "Spanish": "ES", "French": "FR", "German": "DE", "Italian": "IT",
    "Dutch": "NL", "Finnish": "FI", "Brazilian": "BR", "Australian": "AU", "Canadian": "CA",
    "American": "US", "Mexican": "MX", "Argentine": "AR", "Japanese": "JP", "Danish": "DK",
    "Austrian": "AT", "Belgian": "BE", "Swiss": "CH", "Swedish": "SE",
}

SINCE_YEAR = 1980

# ✅ NO forzamos 10. Si quieres “mínimo jugable”, pon 2 o 3.
MIN_DISTINCT_DRIVERS = 2

# ✅ Evitar repetición inmediata (últimas N parejas)
_RECENT = deque(maxlen=12)

_SQL_POOL = text("""
    SELECT c.name AS teamName,
           d.nationality AS nationality,
           COUNT(DISTINCT d.driverId) AS cnt
    FROM results r
    JOIN races ra ON ra.raceId = r.raceId
    JOIN constructors c ON c.constructorId = r.constructorId
    JOIN drivers d ON d.driverId = r.driverId
    WHERE ra.year >= :since
      AND d.nationality IS NOT NULL
    GROUP BY c.constructorId, c.name, d.nationality
    HAVING COUNT(DISTINCT d.driverId) >= :minCnt
""")

def generate_team_nationality(exclude=None):
    """
    exclude: tuple(teamName, nationality) o None
    Devuelve maxAnswers ajustado al número REAL de pilotos posibles (cnt).
    """
    params = {"since": SINCE_YEAR, "minCnt": MIN_DISTINCT_DRIVERS}

    with engine.connect() as conn:
        rows = conn.execute(_SQL_POOL, params).fetchall()

    if not rows:
        return {"teamName": "Unknown", "nationality": "Unknown", "countryCode": "??", "maxAnswers": 30}

    # Filtrados: exclude + recientes
    filtered = rows

    if exclude:
        ex_team, ex_nat = exclude
        filtered = [r for r in filtered if not (r[0] == ex_team and r[1] == ex_nat)]

    # Evitar repetir las últimas N parejas
    if _RECENT:
        recent_set = set(_RECENT)
        filtered2 = [r for r in filtered if (r[0], r[1]) not in recent_set]
        if filtered2:
            filtered = filtered2

    # Si por filtros nos quedamos sin filas, volvemos a rows (para no romper)
    if not filtered:
        filtered = rows

    team, nat, cnt = random.choice(filtered)
    _RECENT.append((team, nat))

    cc = NATIONALITY_TO_CC.get(nat, "??")

    # ✅ maxAnswers debe ser <= cnt y <= 30
    max_answers = min(30, int(cnt))

    return {
        "teamName": team,
        "nationality": nat,
        "countryCode": cc,
        "maxAnswers": max_answers,
        "poolSize": int(cnt)  # opcional: útil para debug/UI
    }


def _valid_driver_for_pair(team: str, nationality: str, driver_name: str) -> dict:
    norm = (driver_name or "").strip().lower()
    if not norm:
        return {"valid": False, "driverId": None, "driverName": None}

    with engine.connect() as conn:
        row = conn.execute(text("""
            SELECT d.driverId, CONCAT(d.forename,' ',d.surname) AS fullName
            FROM drivers d
            JOIN results r ON r.driverId = d.driverId
            JOIN races ra ON ra.raceId = r.raceId
            JOIN constructors c ON c.constructorId = r.constructorId
            WHERE ra.year >= :since
              AND c.name = :team
              AND d.nationality = :nat
              AND LOWER(CONCAT(d.forename,' ',d.surname)) = :name
            LIMIT 1
        """), {"since": SINCE_YEAR, "team": team, "nat": nationality, "name": norm}).fetchone()

    if not row:
        return {"valid": False, "driverId": None, "driverName": None}

    return {"valid": True, "driverId": int(row[0]), "driverName": row[1]}
