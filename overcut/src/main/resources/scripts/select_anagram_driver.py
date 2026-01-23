import random
from sqlalchemy import create_engine, text

engine = create_engine("mysql+pymysql://root:root@localhost:3306/f1db")

def generate_f1_anagrams_game(n: int = 6):
    with engine.connect() as conn:
        rows = conn.execute(text(f"""
            SELECT d.driverId, d.surname
            FROM drivers d
            JOIN results r ON d.driverId = r.driverId
            JOIN races ra ON r.raceId = ra.raceId
            WHERE ra.year >= 1980
              AND d.surname IS NOT NULL
              AND LENGTH(d.surname) BETWEEN 4 AND 18
            GROUP BY d.driverId, d.surname
            HAVING COUNT(*) >= 5
            ORDER BY RAND()
            LIMIT {n}
        """)).fetchall()

        return {"drivers": [{"driverId": row[0], "surname": row[1]} for row in rows]}
