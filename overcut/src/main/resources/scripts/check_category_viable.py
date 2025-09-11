# src/main/resources/scripts/check_category_viable.py

import argparse
import json
from sqlalchemy import create_engine, text
from validate_category_answer import (
    CATEGORY_MAP,
    validate_driver, validate_constructor, validate_circuit, validate_champion,
    validate_city, validate_nationality, validate_defunct_team, validate_rookie,
    validate_engine, validate_tyres
)

DB_URI = os.getenv("DB_URI", "mysql+pymysql://root:root@localhost:3306/f1db")

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--category", required=True)
    parser.add_argument("--letter", required=True)
    parser.add_argument("--lang", choices=["es", "en"], default="es")
    args = parser.parse_args()

    category = args.category
    letter = args.letter.upper()
    lang = args.lang

    internal_type = CATEGORY_MAP[lang].get(category)
    if not internal_type:
        print(json.dumps({"viable": False}))
        return

    engine = create_engine(DB_URI)
    with engine.connect() as session:
        if internal_type == "driver":
            valid = validate_driver(session, letter, letter)
        elif internal_type == "constructor":
            valid = validate_constructor(session, letter, letter)
        elif internal_type == "circuit":
            valid = validate_circuit(session, letter, letter)
        elif internal_type == "driver_champion":
            valid = validate_champion(session, letter, letter)
        elif internal_type == "city":
            valid = validate_city(session, letter, letter)
        elif internal_type == "nationality":
            valid = validate_nationality(session, letter, letter)
        elif internal_type == "defunct_team":
            valid = validate_defunct_team(session, letter, letter)
        elif internal_type == "rookie":
            valid = validate_rookie(session, letter, letter)
        elif internal_type == "engine":
            valid = validate_engine(session, letter, letter)
        elif internal_type == "tyres":
            valid = validate_tyres(letter, letter)
        else:
            valid = False

    print(json.dumps({"viable": valid}))
