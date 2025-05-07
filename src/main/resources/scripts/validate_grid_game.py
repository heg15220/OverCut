import argparse
import json
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Configuración conexión f1db
DB_URL = "mysql+mysqlconnector://root:password@localhost:3306/f1db"  # actualiza credenciales
engine = create_engine(DB_URL)
Session = sessionmaker(bind=engine)

def normalize_name(name):
    return name.strip().lower()

def validate_pilot(nationality_code, pilot_name, season):
    session = Session()
    try:
        # Obtener piloto por nombre (normalizado)
        query = text("""
            SELECT d.driverId, d.surname, d.nationality
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
            driver_id, surname, nationality = result
            pilot_nationality = nationality.strip().upper()[:3]  # Ej: "British" → "BRI"
            expected_code = nationality_code.upper()

            if pilot_nationality.startswith(expected_code) or expected_code in pilot_nationality:
                return {"valid": True, "pilot": f"{surname}"}
            else:
                return {"valid": False, "reason": "nationality_mismatch"}
        else:
            return {"valid": False, "reason": "not_found"}
    finally:
        session.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--nationality", required=True, help="Código de nacionalidad esperado (ej: GBR)")
    parser.add_argument("--pilot", required=True, help="Nombre del piloto (ej: Lewis Hamilton)")
    parser.add_argument("--season", required=True, type=int, help="Temporada F1 (ej: 2020)")

    args = parser.parse_args()

    result = validate_pilot(args.nationality, args.pilot, args.season)
    print(json.dumps(result))
