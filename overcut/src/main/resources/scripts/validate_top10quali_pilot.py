import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

DB_URL = os.getenv("DB_URI", "mysql+pymysql://root:root@localhost:3306/f1db")
engine = create_engine(DB_URL)
Session = sessionmaker(bind=engine)

def validate_pilot_in_top10quali(pilot: str, raceId: int):
    session = Session()
    try:
        row = session.execute(text("""
            SELECT q.position
            FROM qualifying q
            JOIN drivers d ON q.driverId = d.driverId
            WHERE q.raceId = :race_id
              AND q.position BETWEEN 1 AND 10
              AND CONCAT(d.forename, ' ', d.surname) = :pilot
            LIMIT 1
        """), {"race_id": raceId, "pilot": pilot}).fetchone()

        if not row:
            return {"valid": False, "position": None}

        return {"valid": True, "position": int(row[0])}
    finally:
        session.close()
