import unicodedata
import argparse
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import QueuePool

# Configuración de base de datos
DB_URL = "mysql+pymysql://root:root@localhost:3306/f1db"
engine = create_engine(DB_URL, poolclass=QueuePool, pool_size=10, max_overflow=5, pool_timeout=30)
Session = sessionmaker(bind=engine)

def strip_accents(s):
    return ''.join(c for c in unicodedata.normalize('NFD', s) if unicodedata.category(c) != 'Mn')

def get_f1_jargon_questions(letter, lang):
    from generate_rondo import get_f1_jargon_questions as f
    return f(letter, lang)

def validate_answer(letter, question, user_answer):
    letter = strip_accents(letter.upper())
    answer = strip_accents(user_answer.strip().upper())

    session = Session()
    try:
        possible_answers = set()

        # Jerga F1
        for q, valid_answer in get_f1_jargon_questions(letter, "es") + get_f1_jargon_questions(letter, "en"):
            if strip_accents(q.lower()) in strip_accents(question.lower()) and strip_accents(valid_answer.upper()).startswith(letter):
                possible_answers.add(strip_accents(valid_answer.upper()))

        # Pilotos
        for forename, surname, nationality in session.execute(text("SELECT forename, surname, nationality FROM drivers")):
            f, s, n = strip_accents(forename.upper()), strip_accents(surname.upper()), strip_accents(nationality.lower())
            ql = strip_accents(question.lower())

            if ql.startswith("¿cuál es el apellido") or ql.startswith("what is the surname"):
                if f.startswith(letter):
                    possible_answers.add(s)
            elif ql.startswith("¿cuál es el nombre") or ql.startswith("what is the first name"):
                if s.startswith(letter):
                    possible_answers.add(f)
            elif "piloto de nacionalidad" in ql or "driver with nationality" in ql:
                if n in ql and s.startswith(letter):
                    possible_answers.add(s)

        # Constructores
        for name, nationality in session.execute(text("SELECT name, nationality FROM constructors")):
            name_clean = strip_accents(name.upper())
            nat_clean = strip_accents(nationality.upper())
            ql = strip_accents(question.lower())

            if "escudería" in ql or "team" in ql or "equipo" in ql:
                if name_clean.startswith(letter) or nat_clean.startswith(letter) or nat_clean in ql.upper():
                    possible_answers.add(name_clean)

        # Títulos de constructores
        if "título" in question.lower() or "title" in question.lower():
            import re
            match = re.search(r"(\d+)", question)
            if match:
                expected_titles = int(match.group(1))
                result = session.execute(text("""
                    SELECT constructors.name, COUNT(*) AS titles
                    FROM constructorstandings
                    JOIN constructors ON constructorstandings.constructorId = constructors.constructorId
                    WHERE constructorstandings.position = 1
                    GROUP BY constructors.name
                """))
                for name, count in result:
                    if count == expected_titles and strip_accents(name.upper()).startswith(letter):
                        possible_answers.add(strip_accents(name.upper()))

        # Año de debut
        if "debutó en el año" in question.lower() or "debuted in" in question.lower():
            import re
            match = re.search(r"(\d{4})", question)
            if match:
                debut_year = int(match.group(1))
                result = session.execute(text("""
                    SELECT constructors.name, MIN(ra.year) AS debut
                    FROM results r
                    JOIN races ra ON r.raceId = ra.raceId
                    JOIN constructors ON r.constructorId = constructors.constructorId
                    GROUP BY constructors.name
                """))
                for name, debut in result:
                    if debut == debut_year and strip_accents(name.upper()).startswith(letter):
                        possible_answers.add(strip_accents(name.upper()))

        # Equipos en los que corrió un piloto
        driver_team_result = session.execute(text("""
            SELECT d.forename, d.surname, c.name
            FROM drivers d
            JOIN results r ON d.driverId = r.driverId
            JOIN constructors c ON r.constructorId = c.constructorId
        """)).fetchall()

        team_map = {}
        for forename, surname, team in driver_team_result:
            key = strip_accents(surname.upper())
            team_map.setdefault(key, set()).add(strip_accents(team.upper()))

        for driver, teams in team_map.items():
            if not driver.startswith(letter): continue
            q_clean = strip_accents(question.lower())
            if any(team.lower() in q_clean for team in teams):
                possible_answers.add(driver)


        # Circuitos
        for (ref,) in session.execute(text("SELECT circuitRef FROM circuits")):
            cref = strip_accents(ref.upper())
            if "circuito" in question.lower() or "circuit" in question.lower():
                if cref.startswith(letter):
                    possible_answers.add(cref)

        return answer in possible_answers
    finally:
        session.close()

# CLI
if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--letter", required=True)
    parser.add_argument("--question", required=True)
    parser.add_argument("--answer", required=True)
    args = parser.parse_args()

    is_valid = validate_answer(args.letter, args.question, args.answer)
    print("true" if is_valid else "false")
