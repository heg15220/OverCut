import argparse
import json
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Conexión a la base de datos
DB_URL = "mysql+pymysql://root:root@localhost:3306/f1db" # ajusta credenciales
engine = create_engine(DB_URL)
Session = sessionmaker(bind=engine)

# Mapeo nacionalidades a ISO
ISO_MAPPING = {
    "british": "gb", "german": "de", "italian": "it", "french": "fr", "spanish": "es", "dutch": "nl",
    "finnish": "fi", "brazilian": "br", "argentinean": "ar", "mexican": "mx", "canadian": "ca",
    "austrian": "at", "australian": "au", "swiss": "ch", "belgian": "be", "swedish": "se",
    "portuguese": "pt", "chilean": "cl", "american": "us", "new zealander": "nz", "irish": "ie",
    "south african": "za", "japanese": "jp", "russian": "ru", "polish": "pl", "venezuelan": "ve",
    "colombian": "co", "czech": "cz", "hungarian": "hu", "monegasque": "mc", "monacan": "mc",
    "thai": "th", "chinese": "cn", "indian": "in", "malaysian": "my", "indonesian": "id",
    "dane": "dk", "danish": "dk", "estonian": "ee", "latvian": "lv", "uruguayan": "uy"
}

def normalize_name(name):
    return name.strip().lower()

def validate_bulk(pilot_name, slots):
    session = Session()
    valid_positions = []

    try:
        normalized_name = normalize_name(pilot_name)

        for slot in slots:
            position = slot.get("position")
            nationality_code = slot.get("nationalityCode")
            season = slot.get("seasonYear")

            query = text("""
                SELECT d.driverId, d.surname, d.nationality
                FROM drivers d
                JOIN results r ON d.driverId = r.driverId
                JOIN races ra ON r.raceId = ra.raceId
                WHERE LOWER(CONCAT(d.forename, ' ', d.surname)) = :pilot_name
                  AND ra.year = :season
                LIMIT 1
            """)

            result = session.execute(query, {
                "pilot_name": normalized_name,
                "season": season
            }).fetchone()

            if result:
                _, _, nationality = result
                pilot_nat_key = nationality.strip().lower()
                pilot_iso = ISO_MAPPING.get(pilot_nat_key)
                expected_iso = ISO_MAPPING.get(nationality_code.strip().lower(), nationality_code.strip().lower())

                if pilot_iso == expected_iso:
                    valid_positions.append(position)

    finally:
        session.close()

    return valid_positions

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--pilot", required=True, help="Nombre del piloto (ej: Michael Schumacher)")
    parser.add_argument("--slots", required=True, help="JSON con slots [{position, nationalityCode, seasonYear}]")

    args = parser.parse_args()
    slots = json.loads(args.slots)
    result = validate_bulk(args.pilot, slots)
    print(json.dumps({"validPositions": result}))
