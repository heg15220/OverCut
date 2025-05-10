import argparse
import json
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

DB_URL = "mysql+pymysql://root:root@localhost:3306/f1db"  # Ajusta según tu entorno
engine = create_engine(DB_URL)
Session = sessionmaker(bind=engine)

def get_recommendations(category: str):
    session = Session()
    try:
        if category == "team":
            query = text("""
                SELECT DISTINCT name FROM constructors ORDER BY name
            """)
        elif category == "circuit":
            query = text("""
                SELECT DISTINCT circuitRef FROM circuits ORDER BY circuitRef
            """)
        elif category == "nationality":
            query = text("""
                SELECT DISTINCT nationality FROM drivers ORDER BY nationality
            """)
        else:
            return []

        result = session.execute(query).fetchall()
        return [row[0] for row in result]
    finally:
        session.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--category", required=True, help="Categoría para la que se quieren obtener recomendaciones")
    args = parser.parse_args()

    suggestions = get_recommendations(args.category)
    print(json.dumps(suggestions))
