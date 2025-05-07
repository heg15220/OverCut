import argparse
import json
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

DB_URL = "mysql+pymysql://root:root@localhost:3306/f1db"
  # Ajusta según tu entorno
engine = create_engine(DB_URL)
Session = sessionmaker(bind=engine)

def get_drivers_for_season(season):
    session = Session()
    try:
        query = text("""
            SELECT DISTINCT d.driverId, CONCAT(d.forename, ' ', d.surname) AS full_name, d.nationality
            FROM drivers d
            JOIN results r ON d.driverId = r.driverId
            JOIN races ra ON r.raceId = ra.raceId
            WHERE ra.year = :season
        """)
        result = session.execute(query, {"season": season}).fetchall()

        drivers = []
        for row in result:
            driver_id, name, nationality = row
            drivers.append({
                "pilotId": driver_id,
                "name": name,
                "nationalityCode": nationality.strip()[:3].upper()  # Ej: "British" -> "BRI"
            })

        return drivers
    finally:
        session.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--season", type=int, required=True)
    args = parser.parse_args()

    data = get_drivers_for_season(args.season)
    print(json.dumps(data))
