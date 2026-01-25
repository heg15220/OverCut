# generate_team_history_game.py
# -*- coding: utf-8 -*-

import os
import random
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

DB_URL = os.getenv("DB_URI", "mysql+pymysql://root:root@localhost:3306/f1db")
engine = create_engine(DB_URL)
Session = sessionmaker(bind=engine)

def _pick_constructor_with_history(session, min_seasons=8):
    cid = session.execute(text("""
        SELECT cs.constructorId
        FROM constructorStandings cs
        JOIN races r ON r.raceId = cs.raceId
        WHERE r.round = (
            SELECT MAX(r2.round) FROM races r2 WHERE r2.year = r.year
        )
          AND cs.position IS NOT NULL
        GROUP BY cs.constructorId
        HAVING COUNT(*) >= :min_seasons
        ORDER BY RAND()
        LIMIT 1
    """), {"min_seasons": min_seasons}).scalar()
    return int(cid)

def _get_constructor_name(session, constructor_id: int) -> str:
    row = session.execute(text("""
        SELECT name
        FROM constructors
        WHERE constructorId = :cid
        LIMIT 1
    """), {"cid": constructor_id}).fetchone()
    return (row[0] if row and row[0] else "").strip()

def _max_position_overall(session) -> int:
    # máximo “grid” de posiciones que tendrá el select (como maxPosition en DriverSeason)
    val = session.execute(text("""
        SELECT MAX(cs.position)
        FROM constructorStandings cs
        WHERE cs.position IS NOT NULL
    """)).scalar() or 12
    return int(val)

def _get_constructor_season_positions(session, constructor_id: int):
    # filas = (year, finishingPosition)
    rows = session.execute(text("""
        SELECT
          r.year AS seasonYear,
          cs.position AS finishingPosition
        FROM constructorStandings cs
        JOIN races r ON r.raceId = cs.raceId
        WHERE cs.constructorId = :cid
          AND r.round = (
              SELECT MAX(r2.round) FROM races r2 WHERE r2.year = r.year
          )
          AND cs.position IS NOT NULL
        ORDER BY r.year ASC
    """), {"cid": constructor_id}).fetchall()
    return [(int(y), int(p)) for (y, p) in rows if y is not None and p is not None]

def get_team_history_game(lang="es"):
    session = Session()
    try:
        constructor_id = _pick_constructor_with_history(session, min_seasons=8)
        name = _get_constructor_name(session, constructor_id)
        seasons = _get_constructor_season_positions(session, constructor_id)

        if len(seasons) < 8:
            return get_team_history_game(lang)

        # ✅ para que el juego no sea eterno: recortamos a un bloque continuo aleatorio
        window = random.randint(8, min(14, len(seasons)))
        start = random.randint(0, len(seasons) - window)
        block = seasons[start:start + window]

        max_pos = _max_position_overall(session)

        return {
            "constructorId": constructor_id,
            "constructorName": name,
            "maxPosition": max_pos,
            "seasons": [
                {"seasonYear": y, "finishingPosition": p}
                for (y, p) in block
            ]
        }
    finally:
        session.close()

if __name__ == "__main__":
    import json
    print(json.dumps(get_team_history_game(), ensure_ascii=False))
