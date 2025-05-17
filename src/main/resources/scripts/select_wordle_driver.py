# select_wordle_driver.py
import random
import json
from sqlalchemy import create_engine, text

engine = create_engine("mysql+pymysql://root:root@localhost:3306/f1db")

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
    print(json.dumps({"driverId": driver[0], "surname": driver[1]}))
