import argparse
import json
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Configuración de base de datos
DB_URL = "mysql+pymysql://root:root@localhost:3306/f1db" # Actualiza según tu entorno
engine = create_engine(DB_URL)
Session = sessionmaker(bind=engine)

def autocomplete_pilots(partial_name: str):
    session = Session()
    try:
        query = text("""
            SELECT DISTINCT CONCAT(d.forename, ' ', d.surname) AS full_name
            FROM drivers d
            WHERE LOWER(CONCAT(d.forename, ' ', d.surname)) LIKE :partial
            ORDER BY full_name
            LIMIT 10
        """)
        result = session.execute(query, {
            "partial": f"%{partial_name.lower()}%"
        }).fetchall()

        suggestions = [row[0] for row in result]
        return suggestions
    finally:
        session.close()



if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--partial", required=True, help="Nombre parcial del piloto")
    args = parser.parse_args()

    result = autocomplete_pilots(args.partial)
    print(json.dumps(result))

