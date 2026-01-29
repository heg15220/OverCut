# -*- coding: utf-8 -*-
import random
from sqlalchemy import text
from generate_order_drivers import engine  # ya lo usas en tu ecosistema

THEME_TYPES = [
    "WINNERS_AT_CIRCUIT",
    "PODIUM_AT_CIRCUIT",
    "WINNERS_FOR_TEAM",
    "PODIUM_FOR_TEAM",
    "RACED_FOR_TEAM",
    "TEAMMATES_OF_DRIVER",
    "NATIONALITY",
]

def _rand_circuit():
    with engine.connect() as conn:
        row = conn.execute(text("""
            SELECT c.name
            FROM circuits c
            JOIN races r ON r.circuitId = c.circuitId
            GROUP BY c.circuitId, c.name
            HAVING COUNT(*) >= 8
            ORDER BY RAND()
            LIMIT 1
        """)).fetchone()
    return row[0]

def _rand_team():
    with engine.connect() as conn:
        row = conn.execute(text("""
            SELECT c.name
            FROM constructors c
            JOIN results r ON r.constructorId = c.constructorId
            JOIN races ra ON ra.raceId = r.raceId
            GROUP BY c.constructorId, c.name
            HAVING COUNT(*) >= 300
            ORDER BY RAND()
            LIMIT 1
        """)).fetchone()
    return row[0]

def _rand_nationality():
    with engine.connect() as conn:
        row = conn.execute(text("""
            SELECT d.nationality
            FROM drivers d
            WHERE d.nationality IS NOT NULL
            GROUP BY d.nationality
            HAVING COUNT(*) >= 10
            ORDER BY RAND()
            LIMIT 1
        """)).fetchone()
    return row[0]

def _rand_driver():
    with engine.connect() as conn:
        row = conn.execute(text("""
            SELECT CONCAT(d.forename,' ',d.surname)
            FROM drivers d
            JOIN results r ON r.driverId = d.driverId
            JOIN races ra ON ra.raceId = r.raceId
            GROUP BY d.driverId
            HAVING COUNT(*) >= 80
            ORDER BY RAND()
            LIMIT 1
        """)).fetchone()
    return row[0]

def generate_30_seconds_theme(lang="es"):
    t = random.choice(THEME_TYPES)

    if t in ("WINNERS_AT_CIRCUIT", "PODIUM_AT_CIRCUIT"):
        value = _rand_circuit()
    elif t in ("WINNERS_FOR_TEAM", "PODIUM_FOR_TEAM", "RACED_FOR_TEAM"):
        value = _rand_team()
    elif t == "TEAMMATES_OF_DRIVER":
        value = _rand_driver()
    else:
        value = _rand_nationality()

    return {"themeType": t, "themeValue": value}

def _valid_set(themeType: str, themeValue: str) -> set[str]:
    themeValue = themeValue.strip()

    with engine.connect() as conn:

        if themeType == "WINNERS_AT_CIRCUIT":
            rows = conn.execute(text("""
                SELECT DISTINCT LOWER(CONCAT(d.forename,' ',d.surname)) AS name
                FROM results r
                JOIN races ra ON ra.raceId = r.raceId
                JOIN circuits c ON c.circuitId = ra.circuitId
                JOIN drivers d ON d.driverId = r.driverId
                WHERE c.name = :circuit
                  AND r.position = 1
            """), {"circuit": themeValue}).fetchall()

        elif themeType == "PODIUM_AT_CIRCUIT":
            rows = conn.execute(text("""
                SELECT DISTINCT LOWER(CONCAT(d.forename,' ',d.surname)) AS name
                FROM results r
                JOIN races ra ON ra.raceId = r.raceId
                JOIN circuits c ON c.circuitId = ra.circuitId
                JOIN drivers d ON d.driverId = r.driverId
                WHERE c.name = :circuit
                  AND r.position IN (1,2,3)
            """), {"circuit": themeValue}).fetchall()

        elif themeType == "WINNERS_FOR_TEAM":
            rows = conn.execute(text("""
                SELECT DISTINCT LOWER(CONCAT(d.forename,' ',d.surname)) AS name
                FROM results r
                JOIN drivers d ON d.driverId = r.driverId
                JOIN constructors c ON c.constructorId = r.constructorId
                WHERE c.name = :team
                  AND r.position = 1
            """), {"team": themeValue}).fetchall()

        elif themeType == "PODIUM_FOR_TEAM":
            rows = conn.execute(text("""
                SELECT DISTINCT LOWER(CONCAT(d.forename,' ',d.surname)) AS name
                FROM results r
                JOIN drivers d ON d.driverId = r.driverId
                JOIN constructors c ON c.constructorId = r.constructorId
                WHERE c.name = :team
                  AND r.position IN (1,2,3)
            """), {"team": themeValue}).fetchall()

        elif themeType == "RACED_FOR_TEAM":
            rows = conn.execute(text("""
                SELECT DISTINCT LOWER(CONCAT(d.forename,' ',d.surname)) AS name
                FROM results r
                JOIN drivers d ON d.driverId = r.driverId
                JOIN constructors c ON c.constructorId = r.constructorId
                WHERE c.name = :team
            """), {"team": themeValue}).fetchall()

        elif themeType == "TEAMMATES_OF_DRIVER":
            # Teammates: mismo raceId + constructorId, distinto driverId
            rows = conn.execute(text("""
                SELECT DISTINCT LOWER(CONCAT(d2.forename,' ',d2.surname)) AS name
                FROM results r1
                JOIN drivers d1 ON d1.driverId = r1.driverId
                JOIN results r2 ON r2.raceId = r1.raceId AND r2.constructorId = r1.constructorId AND r2.driverId <> r1.driverId
                JOIN drivers d2 ON d2.driverId = r2.driverId
                WHERE LOWER(CONCAT(d1.forename,' ',d1.surname)) = LOWER(:driverName)
            """), {"driverName": themeValue}).fetchall()

        elif themeType == "NATIONALITY":
            rows = conn.execute(text("""
                SELECT DISTINCT LOWER(CONCAT(d.forename,' ',d.surname)) AS name
                FROM drivers d
                WHERE d.nationality = :nat
            """), {"nat": themeValue}).fetchall()

        else:
            rows = []

    return {r[0] for r in rows if r[0]}

def validate_30_seconds(themeType: str, themeValue: str, answers: list[str]):
    valid = _valid_set(themeType, themeValue)

    # únicos case-insensitive manteniendo orden
    seen = set()
    normalized = []
    for a in answers or []:
        s = (a or "").strip()
        if not s:
            continue
        key = s.lower()
        if key in seen:
            continue
        seen.add(key)
        normalized.append(s)

    results = []
    correct = 0
    for a in normalized:
        ok = a.lower() in valid
        if ok:
            correct += 1
        results.append({"answer": a, "valid": ok})

    return {"correctCount": correct, "results": results}
