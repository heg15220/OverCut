# -*- coding: utf-8 -*-
import random
from sqlalchemy import text
from generate_order_drivers import engine

def generate_abbreviations_game(limit: int = 20):
    with engine.connect() as conn:
        rows = conn.execute(text("""
            SELECT
              d.driverId,
              CONCAT(d.forename,' ',d.surname) AS fullName,
              UPPER(SUBSTRING(d.surname, 1, 3)) AS abbr,
              d.surname AS surname
            FROM drivers d
            JOIN results r ON r.driverId = d.driverId
            JOIN races ra ON ra.raceId = r.raceId
            WHERE ra.year >= 1980
              AND d.surname IS NOT NULL
              AND LENGTH(d.surname) >= 3
            GROUP BY d.driverId, fullName, abbr, surname
        """)).fetchall()

    pool = [{"driverId": int(r[0]), "driverName": r[1], "abbr": r[2]} for r in rows]

    # Elegimos 20 con abbr únicas
    random.shuffle(pool)
    used = set()
    picks = []
    for item in pool:
        a = item["abbr"]
        if a in used:
            continue
        used.add(a)
        picks.append(item)
        if len(picks) >= limit:
            break

    if len(picks) < limit:
        # fallback: devolvemos lo que haya
        return {"drivers": picks, "limit": limit, "actual": len(picks)}

    return {"drivers": picks, "limit": limit, "actual": len(picks)}
