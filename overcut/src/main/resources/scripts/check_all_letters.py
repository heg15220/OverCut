# src/main/resources/scripts/check_all_letters.py

import string
import json
import argparse
from sqlalchemy import create_engine
from concurrent.futures import ThreadPoolExecutor
from sqlalchemy.orm import sessionmaker


DB_URI = os.getenv("DB_URI", "mysql+pymysql://root:root@localhost:3306/f1db")
# Crear el engine global
engine = create_engine(DB_URI)
Session = sessionmaker(bind=engine)


from validate_category_answer import (
    CATEGORY_MAP,
    has_driver_starting_with,
    has_constructor_starting_with,
    has_circuit_starting_with,
    has_champion_starting_with,
    has_nationality_starting_with,
    has_defunct_team_starting_with,
    has_rookie_starting_with,
    has_engine_starting_with,
    has_tyres_starting_with,
    has_team_principal_starting_with
)

VALIDATORS = {
    "driver": has_driver_starting_with,
    "constructor": has_constructor_starting_with,
    "circuit": has_circuit_starting_with,
    "driver_champion": has_champion_starting_with,
    "nationality": has_nationality_starting_with,
    "defunct_team": has_defunct_team_starting_with,
    "rookie": has_rookie_starting_with,
    "engine": has_engine_starting_with,
    "tyres": has_tyres_starting_with,
    "team_principal": has_team_principal_starting_with
}


def is_viable(category, letter, lang):
    internal_type = CATEGORY_MAP[lang].get(category)
    if internal_type in VALIDATORS:
        try:
            with Session() as session:
                return VALIDATORS[internal_type](session, letter)
        except Exception as e:
            print(f"[ERROR] {category} con letra {letter}: {e}")
            return False
    return False


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--lang", choices=["es", "en"], default="es")
    parser.add_argument("--output", default="category_letter_cache.json")
    args = parser.parse_args()

    lang = args.lang
    output_path = args.output
    letters = list(string.ascii_uppercase)
    categories = CATEGORY_MAP[lang].keys()

    result = {}

    for letter in letters:
        result[letter] = {}
        with ThreadPoolExecutor() as executor:
            futures = {
                category: executor.submit(is_viable, category, letter, lang)
                for category in categories
            }
            for cat, future in futures.items():
                result[letter][cat] = future.result()

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2, ensure_ascii=False)

    print(f"✅ Caché guardada en {output_path}")

if __name__ == "__main__":
    main()
