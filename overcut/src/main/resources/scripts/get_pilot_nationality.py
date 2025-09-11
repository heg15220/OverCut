import argparse
import json
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

DB_URL = os.getenv("DB_URI", "mysql+pymysql://root:root@localhost:3306/f1db")
engine = create_engine(DB_URL)
Session = sessionmaker(bind=engine)

def normalize_name(name):
    return name.strip().lower()

def get_nationality(pilot_name, season):
    session = Session()
    try:
        query = text("""
            SELECT d.nationality
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
        if result:
            return result[0]
        return None
    finally:
        session.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--pilot", required=True)
    parser.add_argument("--season", type=int, required=True)
    args = parser.parse_args()

    nationality = get_nationality(args.pilot, args.season)
    if nationality:
        print(json.dumps({"nationality": nationality}))
    else:
        print(json.dumps({"nationality": None}))
