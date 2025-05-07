import argparse
import json
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Configuración de base de datos
DB_URL = "mysql+mysqlconnector://root:password@localhost:3306/f1db"  # Actualiza según tu entorno
engine = create_engine(DB_URL)
Session = sessionmaker(bind=engine)

def autocomplete_pilots(partial_name: str, season: int):
    session = Session()
    try:
        query = text("""
            SELECT DISTINCT CONCAT(d.forename, ' ', d.surname) AS full_name
            FROM drivers d
            JOIN results r ON d.driverId = r.driverId
            JOIN races ra ON r.raceId = ra.raceId
            WHERE ra.year = :season
              AND LOWER(CONCAT(d.forename, ' ', d.surname)) LIKE :partial
            ORDER BY full_name
            LIMIT 10
        """)
        result = session.execute(query, {
            "season": season,
            "partial": f"%{partial_name.lower()}%"
        }).fetchall()

        suggestions = [row[0] for row in result]
        return suggestions
    finally:
        session.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--partial", required=True, help="Nombre parcial del piloto")
    parser.add_argument("--season", required=True, type=int, help="Temporada")

    args = parser.parse_args()
    result = autocomplete_pilots(args.partial, args.season)
    print(json.dumps(result))
