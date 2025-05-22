import argparse
import json
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

DB_URL = "mysql+pymysql://root:root@localhost:3306/f1db"
engine = create_engine(DB_URL)
Session = sessionmaker(bind=engine)

def normalize_name(name):
    return name.strip().lower()

def pilot_exists_for_season(pilot_name, season):
    session = Session()
    try:
        query = text("""
            SELECT d.driverId
            FROM drivers d
            JOIN results r ON d.driverId = r.driverId
            JOIN races ra ON ra.raceId = r.raceId
            WHERE LOWER(CONCAT(d.forename, ' ', d.surname)) = :pilot_name
              AND ra.year = :season
            LIMIT 1
        """)
        result = session.execute(query, {
            "pilot_name": normalize_name(pilot_name),
            "season": season
        }).fetchone()
        return result is not None
    finally:
        session.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--pilot", required=True)
    parser.add_argument("--season", type=int, required=True)

    args = parser.parse_args()
    is_valid = pilot_exists_for_season(args.pilot, args.season)

    print(json.dumps({"valid": is_valid}))
