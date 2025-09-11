import random
import json
from sqlalchemy import create_engine, text

DB_URI = os.getenv("DB_URI", "mysql+pymysql://root:root@localhost:3306/f1db")
engine = create_engine(DB_URI, pool_pre_ping=True)

def generate_f1_wordle_game():
    with engine.connect() as conn:
        result = conn.execute(text("""
            SELECT d.driverId, d.surname
            FROM drivers d
            JOIN results r ON d.driverId = r.driverId
            JOIN races ra ON r.raceId = ra.raceId
            WHERE ra.year >= 1985 AND r.positionOrder <= 3
            GROUP BY d.driverId
            HAVING COUNT(*) >= 2
        """)).fetchall()

        driver = random.choice(result)
        return {"driverId": driver[0], "surname": driver[1]}

if __name__ == "__main__":
    print(json.dumps(generate_f1_wordle_game()))
