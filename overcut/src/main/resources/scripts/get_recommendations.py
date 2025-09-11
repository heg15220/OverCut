import os
import argparse
import json
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

DB_URL = os.getenv("DB_URI", "mysql+pymysql://root:root@localhost:3306/f1db")
LANG = os.getenv("LANG", "es")

engine = create_engine(DB_URL)
Session = sessionmaker(bind=engine)

# Traducciones de nacionalidades
NATIONALITY_TRANSLATIONS = {
    "American": "Estadounidense",
    "American-Italian": "Estadounidense-Italiano",
    "Argentine": "Argentino",
    "Argentine-Italian": "Argentino-Italiano",
    "Argentinian": "Argentino",
    "Australian": "Australiano",
    "Austrian": "Austriaco",
    "Belgian": "Belga",
    "Brazilian": "Brasileño",
    "British": "Británico",
    "Canadian": "Canadiense",
    "Chilean": "Chileno",
    "Chinese": "Chino",
    "Colombian": "Colombiano",
    "Czech": "Checo",
    "Danish": "Danés",
    "Dutch": "Neerlandés",
    "East German": "Alemán Oriental",
    "Finnish": "Finlandés",
    "French": "Francés",
    "German": "Alemán",
    "Hungarian": "Húngaro",
    "Indian": "Indio",
    "Indonesian": "Indonesio",
    "Irish": "Irlandés",
    "Italian": "Italiano",
    "Japanese": "Japonés",
    "Liechtensteiner": "Liechtensteiniano",
    "Malaysian": "Malasio",
    "Mexican": "Mexicano",
    "Monegasque": "Monegasco",
    "New Zealander": "Neozelandés",
    "Polish": "Polaco",
    "Portuguese": "Portugués",
    "Rhodesian": "Rodesiano",
    "Russian": "Ruso",
    "South African": "Sudafricano",
    "Spanish": "Español",
    "Swedish": "Sueco",
    "Swiss": "Suizo",
    "Thai": "Tailandés",
    "Uruguayan": "Uruguayo",
    "Venezuelan": "Venezolano"
}

def get_recommendations(category: str):
    session = Session()
    try:
        if category == "team":
            query = text("SELECT DISTINCT name FROM constructors ORDER BY name")
        elif category == "circuit":
            query = text("SELECT DISTINCT circuitRef FROM circuits ORDER BY circuitRef")
        elif category == "nationality":
            query = text("SELECT DISTINCT nationality FROM drivers ORDER BY nationality")
        else:
            return []

        result = session.execute(query).fetchall()
        values = [row[0].strip() for row in result]

        # Traducir si la categoría es nacionalidad y el idioma es español
        if category == "nationality" and LANG == "es":
            return [NATIONALITY_TRANSLATIONS.get(val, val) for val in values]

        return values
    finally:
        session.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--category", required=True, help="Categoría para la que se quieren obtener recomendaciones")
    args = parser.parse_args()

    suggestions = get_recommendations(args.category)
    print(json.dumps(suggestions, ensure_ascii=False))
