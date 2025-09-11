import argparse
import json
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Configuración de la base de datos
DB_URL = os.getenv("DB_URI", "mysql+pymysql://root:root@localhost:3306/f1db")
engine = create_engine(DB_URL)
Session = sessionmaker(bind=engine)

def normalize(name):
    return name.strip().lower()

def validate_pilot_in_top10(pilot_name, race_id):
    session = Session()
    try:
        # ⚠️ Usamos positionOrder en lugar de position para evitar errores con NULL o "R"/"DQ"
        query = text("""
            SELECT CONCAT(d.forename, ' ', d.surname) AS full_name
            FROM results res
            JOIN drivers d ON res.driverId = d.driverId
            WHERE res.raceId = :race_id
            ORDER BY res.positionOrder ASC
            LIMIT 10
        """)
        results = session.execute(query, {"race_id": race_id}).fetchall()
        normalized_pilot = normalize(pilot_name)

        for pos, row in enumerate(results, start=1):
            if normalize(row[0]) == normalized_pilot:
                return {"valid": True, "position": pos}

        return {"valid": False, "position": None}
    finally:
        session.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--pilot", required=True)
    parser.add_argument("--raceId", type=int, required=True)
    args = parser.parse_args()

    result = validate_pilot_in_top10(args.pilot, args.raceId)
    print(json.dumps(result, ensure_ascii=False))
