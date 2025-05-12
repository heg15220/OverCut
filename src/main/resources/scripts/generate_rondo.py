import random
import json
import argparse
import unicodedata
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Configuración de base de datos (ajusta si es necesario)
DB_URL = "mysql+pymysql://root:root@localhost:3306/f1db"
engine = create_engine(DB_URL)
Session = sessionmaker(bind=engine)

LETTERS = [chr(i) for i in range(ord('A'), ord('Z') + 1)]

def strip_accents(s):
    return ''.join(c for c in unicodedata.normalize('NFD', s)
                   if unicodedata.category(c) != 'Mn')

def get_items_starting_with(session, table, column, letter):
    query = text(f"SELECT {column} FROM {table} WHERE {column} LIKE :pattern")
    results = session.execute(query, {"pattern": f"{letter}%"}).fetchall()
    return [r[0] for r in results]

def generate_question_answer(session, letter, lang):
    candidates = []

    # 1. Pilotos por apellido (usando tabla `drivers`)
    query = text("""
        SELECT CONCAT(forename, ' ', surname) AS full_name
        FROM drivers
        WHERE surname LIKE :pattern
    """)
    drivers = session.execute(query, {"pattern": f"{letter}%"}).fetchall()
    for row in drivers:
        name = row[0]
        answer = name.split()[-1]
        if strip_accents(answer.upper()).startswith(letter):
            question = (
                f"Apellido de un piloto de F1 cuyo nombre completo es {name}"
                if lang == "es" else
                f"Surname of an F1 driver whose full name is {name}"
            )
            candidates.append((question, answer))

    # 2. Escuderías
    teams = get_items_starting_with(session, "constructors", "name", letter)
    for team in teams:
        question = (
            f"Nombre de una escudería de F1 que empieza por la letra {letter}"
            if lang == "es" else
            f"Name of an F1 team starting with letter {letter}"
        )
        candidates.append((question, team))

    # 3. Circuitos
    circuits = get_items_starting_with(session, "circuits", "name", letter)
    for circuit in circuits:
        question = (
            f"Nombre de un circuito de F1 que empieza por la letra {letter}"
            if lang == "es" else
            f"Name of an F1 circuit starting with letter {letter}"
        )
        candidates.append((question, circuit))

    # 4. Extras técnicas o históricas
    extras = {
        'D': ("Dispositivo que reduce la resistencia aerodinámica en rectas", "DRS"),
        'E': ("Sistema de recuperación de energía cinética en F1", "ERS"),
        'P': ("Zona de parque cerrado en la F1", "Parc Fermé"),
        'Z': ("Última letra del alfabeto, difícil de encontrar en F1", "Zanardi")
    }

    if letter in extras:
        q, a = extras[letter]
        if lang == "en":
            q = {
                "D": "Device that reduces aerodynamic drag on straights",
                "E": "System for kinetic energy recovery in F1",
                "P": "Closed park zone in F1",
                "Z": "Last letter of the alphabet, rare in F1"
            }[letter]
        candidates.append((q, a))

    if candidates:
        return random.choice(candidates)
    else:
        return (
            f"No hay definición para la letra {letter}" if lang == "es"
            else f"No definition for letter {letter}",
            f"Letra {letter}"
        )

def generar_rosco(lang):
    session = Session()
    try:
        rosco = []
        for letter in LETTERS:
            question, answer = generate_question_answer(session, letter, lang)
            rosco.append({
                "letter": letter,
                "question": question,
                "answer": answer
            })
        return rosco
    finally:
        session.close()

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--lang", default="es", choices=["es", "en"])
    args = parser.parse_args()

    rosco = generar_rosco(args.lang)
    print(json.dumps(rosco, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    main()
