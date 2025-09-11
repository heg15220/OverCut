# src/main/resources/scripts/validate_category_answer.py

import argparse
import json
from sqlalchemy import create_engine, text

# Ajusta a tu entorno
DB_URI = os.getenv("DB_URI", "mysql+pymysql://root:root@localhost:3306/f1db")

CATEGORY_MAP = {
    "es": {
        "Piloto": "driver",
        "Equipo": "constructor",
        "Circuito": "circuit",
        "País": "country",
        "Motor": "engine",
        "Campeón del Mundo": "driver_champion",
        "Circuito urbano": "street_circuit",
        "Nacionalidad": "nationality",
        "Neumáticos": "tyres",
        "Ciudad con GP": "city",
        "Escudería desaparecida": "defunct_team",
        "Debutante famoso": "rookie",
        "Jefe de equipo": "team_principal"
    },
    "en": {
        "Driver": "driver",
        "Team": "constructor",
        "Circuit": "circuit",
        "Country": "country",
        "Engine": "engine",
        "World Champion": "driver_champion",
        "Street Circuit": "street_circuit",
        "Nationality": "nationality",
        "Tyres": "tyres",
        "GP City": "city",
        "Defunct Team": "defunct_team",
        "Famous Rookie": "rookie",
        "Team Principal": "team_principal"
    }
}


#Validadores para generar partidas

def has_driver_starting_with(session, letter):
    result = session.execute(text("""
        SELECT 1 FROM drivers
        WHERE forename LIKE :prefix OR surname LIKE :prefix
        LIMIT 1
    """), {"prefix": f"{letter}%"})
    return result.first() is not None


def has_constructor_starting_with(session, letter):
    result = session.execute(text("""
        SELECT 1 FROM constructors
        WHERE name LIKE :prefix
        LIMIT 1
    """), {"prefix": f"{letter}%"})
    return result.first() is not None


def has_circuit_starting_with(session, letter):
    result = session.execute(text("""
        SELECT 1 FROM circuits
        WHERE circuitRef LIKE :prefix
        LIMIT 1
    """), {"prefix": f"{letter}%"})
    return result.first() is not None

def has_champion_starting_with(session, letter):
    result = session.execute(text("""
        SELECT 1
        FROM drivers d
        JOIN driverStandings ds ON d.driverId = ds.driverId
        JOIN races r ON ds.raceId = r.raceId
        WHERE ds.position = 1
          AND r.round = (
              SELECT MAX(r2.round)
              FROM races r2
              WHERE r2.year = r.year
          )
          AND (d.forename LIKE :prefix OR d.surname LIKE :prefix)
        GROUP BY d.driverId
        LIMIT 1
    """), {"prefix": f"{letter}%"})
    return result.first() is not None


def has_nationality_starting_with(session, letter):
    result = session.execute(text("""
        SELECT 1 FROM drivers
        WHERE nationality LIKE :prefix
        LIMIT 1
    """), {"prefix": f"{letter}%"})
    return result.first() is not None

def has_defunct_team_starting_with(session, letter):
    result = session.execute(text("""
        SELECT 1 FROM constructors
        WHERE constructorId NOT IN (
            SELECT DISTINCT cs.constructorId
            FROM constructorstandings cs
            JOIN races r ON cs.raceId = r.raceId
            WHERE r.year >= 2020
        )
        AND name LIKE :prefix
        LIMIT 1
    """), {"prefix": f"{letter}%"})
    return result.first() is not None


def has_rookie_starting_with(session, letter):
    result = session.execute(text("""
        SELECT 1
        FROM drivers d
        JOIN results r ON d.driverId = r.driverId
        WHERE r.positionOrder = 1
          AND (d.forename LIKE :prefix OR d.surname LIKE :prefix)
        GROUP BY d.driverId
        LIMIT 1
    """), {"prefix": f"{letter}%"})
    return result.first() is not None

def has_engine_starting_with(session, letter):
    engines = [
        "Ferrari", "Renault", "Mercedes", "Ford Cosworth", "Honda", "BMW", "Alfa Romeo", "Cosworth", "BRM",
        "Petronas", "Mugen Honda", "Hart", "Toyota", "Matra", "Yamaha", "Peugeot", "Maserati", "Climax",
        "Lamborghini", "TAG Porsche", "Judd", "TAG Heuer", "Honda RBPT", "Zakspeed", "Playlife", "Motori Moderni",
        "Gordini", "BWT Mercedes", "Ilmor", "Porsche", "Repco", "Supertec", "Asiatech", "Megatron", "Arrows",
        "Vanwall", "Alta", "RBPT", "Weslake", "Bristol", "Fondmetal", "Acer", "European", "Sauber", "Mecachrome",
        "Talbot", "Offenhauser", "Lea Francis", "Tecno", "Osella", "OSCA", "Ford", "A-T-S", "Veritas", "Novi",
        "Aston Martin", "ERA", "Lancia", "Castellotti", "Pratt & Whitney", "Cummins", "Butterworth", "Scarab",
        "JAP", "Jaguar", "Küchen", "EMW", "Bugatti", "Borgward", "Conrero", "Serenissima"
    ]
    return any(e.lower().startswith(letter.lower()) for e in engines)

def has_tyres_starting_with(session, letter):
    tyres = [
        "Pirelli", "Michelin", "Bridgestone", "Goodyear", "Avon",
        "Firestone", "Continental", "Dunlop", "Englebert"
    ]
    return any(t.lower().startswith(letter.lower()) for t in tyres)

def has_team_principal_starting_with(session, letter):
    team_principals = [
        "Toto Wolff", "Christian Horner", "Frederic Vasseur", "Andrea Stella",
        "Oliver Oakes", "Mike Krack", "Jonathan Wheatley", "Laurent Mekies",
        "Ayao Komatsu", "James Vowles", "Mattia Binotto", "Franz Tost",
        "Otmar Szafnauer", "Andreas Seidl", "Simon Roberts", "Davide Brivio",
        "Alessandro Alunni Bravi", "Xevi Pujolar", "Beat Zehnder"
    ]
    return any(p.lower().startswith(letter.lower()) for p in team_principals)



#Validadores de respuestas recibidas
def validate_driver(session, answer, letter):
    result = session.execute(text("""
        SELECT forename, surname FROM drivers
    """))
    answer_lc = answer.lower()
    return any(
        answer_lc in [row[0].lower(), row[1].lower(), f"{row[0]} {row[1]}".lower()]
        and answer_lc.startswith(letter.lower())
        for row in result
    )

def validate_team_principal(session, answer, letter):
    principals = [
        "Christian Horner", "Franz Tost", "Toto Wolff", "Günther Steiner", "Frederic Vasseur",
        "Otmar Szafnauer", "Mattia Binotto", "Andreas Seidl", "Simon Roberts", "Davide Brivio",
        "Andrea Stella", "Oliver Oakes", "Mike Krack", "Jonathan Wheatley", "Laurent Mekies",
        "Alessandro Alunni Bravi", "Xevi Pujolar", "Beat Zehnder", "Ayao Komatsu", "James Vowles"
    ]

    answer_lc = answer.lower()
    return answer_lc.startswith(letter.lower()) and any(
        answer_lc in name.lower().split() or answer_lc == name.lower()
        for name in principals
    )


def validate_constructor(session, answer, letter):
    result = session.execute(text("""
        SELECT name FROM constructors
        WHERE name LIKE :prefix
        LIMIT 1
    """), {"prefix": f"{letter}%"})
    return any(row[0].lower().startswith(letter.lower()) and answer.lower().startswith(letter.lower()) for row in result)

def validate_circuit(session, answer, letter):
    result = session.execute(text("""
        SELECT circuitRef FROM circuits
    """))
    circuit_refs = [row[0] for row in result]
    return validate_generic_list(answer, letter, circuit_refs)

def validate_champion(session, answer, letter):
    result = session.execute(text("""
        SELECT DISTINCT d.forename, d.surname
        FROM drivers d
        JOIN driverStandings ds ON d.driverId = ds.driverId
        JOIN races r ON ds.raceId = r.raceId
        WHERE ds.position = 1
    """))
    answer_lc = answer.lower()
    return any(
        (
            answer_lc == f"{row[0]} {row[1]}".lower()
            or answer_lc == row[0].lower()
            or answer_lc == row[1].lower()
        ) and answer_lc.startswith(letter.lower())
        for row in result
    )






def validate_city(session, answer, letter):
    result = session.execute(text("SELECT location FROM circuits"))
    cities = [row[0] for row in result]
    return validate_generic_list(answer, letter, cities)

def validate_nationality(session, answer, letter):
    result = session.execute(text("SELECT DISTINCT nationality FROM drivers"))
    nationalities = [row[0] for row in result]
    return validate_generic_list(answer, letter, nationalities)

def validate_defunct_team(session, answer, letter):
    result = session.execute(text("""
        SELECT name FROM constructors
        WHERE constructorId NOT IN (
            SELECT DISTINCT cs.constructorId
            FROM constructorstandings cs
            JOIN races r ON cs.raceId = r.raceId
            WHERE r.year >= 2020
        )
    """))
    names = [row[0] for row in result]
    return validate_generic_list(answer, letter, names)


def validate_rookie(session, answer, letter):
    result = session.execute(text("""
        SELECT CONCAT(d.forename, ' ', d.surname)
        FROM drivers d
        JOIN results r ON d.driverId = r.driverId
        WHERE r.positionOrder = 1
        GROUP BY d.driverId
    """))
    rookies = [row[0] for row in result]

    answer_lc = answer.lower()
    return answer_lc.startswith(letter.lower()) and any(
        answer_lc in name.lower().split() or answer_lc == name.lower()
        for name in rookies
    )


def validate_engine(session, answer, letter):
    engines = [
        "Ferrari", "Renault", "Mercedes", "Ford Cosworth", "Honda", "BMW", "Alfa Romeo", "Cosworth", "BRM",
        "Petronas", "Mugen Honda", "Hart", "Toyota", "Matra", "Yamaha", "Peugeot", "Maserati", "Climax",
        "Lamborghini", "TAG Porsche", "Judd", "TAG Heuer", "Honda RBPT", "Zakspeed", "Playlife", "Motori Moderni",
        "Gordini", "BWT Mercedes", "Ilmor", "Porsche", "Repco", "Supertec", "Asiatech", "Megatron", "Arrows",
        "Vanwall", "Alta", "RBPT", "Weslake", "Bristol", "Fondmetal", "Acer", "European", "Sauber", "Mecachrome",
        "Talbot", "Offenhauser", "Lea Francis", "Tecno", "Osella", "OSCA", "Ford", "A-T-S", "Veritas", "Novi",
        "Aston Martin", "ERA", "Lancia", "Castellotti", "Pratt & Whitney", "Cummins", "Butterworth", "Scarab",
        "JAP", "Jaguar", "Küchen", "EMW", "Bugatti", "Borgward", "Conrero", "Serenissima"
    ]
    return validate_generic_list(answer, letter, engines)


def validate_tyres(answer, letter):
    tyres = [
        "Pirelli", "Michelin", "Bridgestone", "Goodyear", "Avon",
        "Firestone", "Continental", "Dunlop", "Englebert"
    ]
    return validate_generic_list(answer, letter, tyres)


def validate_generic_list(answer, letter, values):
    return any(
        v.lower().startswith(letter.lower()) and answer.lower() == v.lower()
        for v in values
    )


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--category", required=True)
    parser.add_argument("--answer", required=True)
    parser.add_argument("--letter", required=True)
    parser.add_argument("--lang", choices=["es", "en"], default="es")
    args = parser.parse_args()

    category = args.category
    answer = args.answer.strip()
    letter = args.letter.upper()
    lang = args.lang

    internal_type = CATEGORY_MAP[lang].get(category)
    if not internal_type:
        print(json.dumps({"valid": False, "error": "Unknown category"}))
        return

    engine = create_engine(DB_URI)
    with engine.connect() as session:
        if internal_type == "driver":
            valid = validate_driver(session, answer, letter)
        elif internal_type == "constructor":
            valid = validate_constructor(session, answer, letter)
        elif internal_type == "circuit":
            valid = validate_circuit(session, answer, letter)
        elif internal_type == "driver_champion":
            valid = validate_champion(session, answer, letter)
        elif internal_type == "city":
            valid = validate_city(session, answer, letter)
        elif internal_type == "nationality":
            valid = validate_nationality(session, answer, letter)
        elif internal_type == "defunct_team":
            valid = validate_defunct_team(session, answer, letter)
        elif internal_type == "rookie":
            valid = validate_rookie(session, answer, letter)
        elif internal_type == "engine":
            valid = validate_engine(session, answer, letter)
        elif internal_type == "tyres":
            valid = validate_tyres(answer, letter)
        elif internal_type == "team_principal":
            valid = validate_team_principal(session, answer, letter)
        else:
            valid = answer.lower().startswith(letter.lower())

    print(json.dumps({"valid": valid}))

def validate_category_answer(category: str, answer: str, letter: str, lang: str = "es") -> dict:
    answer = answer.strip()
    letter = letter.upper()
    internal_type = CATEGORY_MAP.get(lang, {}).get(category)

    if not internal_type:
        return {"valid": False, "error": "Unknown category"}

    engine = create_engine(DB_URI)
    with engine.connect() as session:
        if internal_type == "driver":
            valid = validate_driver(session, answer, letter)
        elif internal_type == "constructor":
            valid = validate_constructor(session, answer, letter)
        elif internal_type == "circuit":
            valid = validate_circuit(session, answer, letter)
        elif internal_type == "driver_champion":
            valid = validate_champion(session, answer, letter)
        elif internal_type == "city":
            valid = validate_city(session, answer, letter)
        elif internal_type == "nationality":
            valid = validate_nationality(session, answer, letter)
        elif internal_type == "defunct_team":
            valid = validate_defunct_team(session, answer, letter)
        elif internal_type == "rookie":
            valid = validate_rookie(session, answer, letter)
        elif internal_type == "engine":
            valid = validate_engine(session, answer, letter)
        elif internal_type == "tyres":
            valid = validate_tyres(answer, letter)
        elif internal_type == "team_principal":
            valid = validate_team_principal(session, answer, letter)
        else:
            valid = answer.lower().startswith(letter.lower())

    return {"valid": valid}



if __name__ == "__main__":
    main()
