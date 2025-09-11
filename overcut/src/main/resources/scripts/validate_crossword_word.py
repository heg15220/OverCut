import sys
import sqlalchemy
from sqlalchemy import create_engine, text
import re
from sqlalchemy.orm import sessionmaker

DB_CONNECTION = os.getenv("DB_URI", "mysql+pymysql://root:root@localhost:3306/f1db")

engine = create_engine(DB_CONNECTION, pool_size=25, max_overflow=10)
Session = sessionmaker(bind=engine)

def normalize(text):
    return re.sub(r"[^a-zA-Z0-9]", "", text.lower())

def clean_nat(n):
    return re.sub(r'[^a-zA-Z]', '', n.strip().lower())

def validate_driver(connection, word, clue):
    try:
        normalized_word = normalize(word)

        query = text("SELECT * FROM drivers")
        result = connection.execute(query).mappings().all()

        for row in result:
            full_name = (row["forename"] + row["surname"])
            if normalize(full_name) != normalized_word:
                continue

            # Validar nacionalidad
            if "nacionalidad" in clue.lower() or "nationality" in clue.lower():
                match = re.search(r"(nacionalidad|nationality):\s*([a-zA-Z]+)", clue, re.IGNORECASE)
                if match:
                    expected_nat = clean_nat(match.group(2))
                    actual_nat = clean_nat(row["nationality"])
                    if actual_nat != expected_nat:
                        continue

            # Validar debut
            if "debutó en" in clue.lower() or "debut in" in clue.lower():
                match = re.search(r"(debutó en|debut in)\s*(\d{4})", clue, re.IGNORECASE)
                if match:
                    expected_year = int(match.group(2))
                    query_year = text("""
                        SELECT MIN(r.year) AS debut_year
                        FROM results res
                        JOIN races r ON res.raceId = r.raceId
                        WHERE res.driverId = :driverId
                    """)
                    debut_result = connection.execute(query_year, {"driverId": row["driverId"]}).mappings().fetchone()
                    if not debut_result or debut_result["debut_year"] != expected_year:
                        continue

            return True  # ✅ Todos los filtros pasados

        return False
    except Exception as e:
        print(f"[ERROR DRIVER] {e}", file=sys.stderr)
        return False



def validate_constructor(connection, word, clue):
    try:
        normalized_word = normalize(word)

        query = text("SELECT * FROM constructors")
        result = connection.execute(query).mappings().all()

        for row in result:
            constructor_name = row["name"]
            if normalize(constructor_name) != normalized_word:
                continue

            # Validar nacionalidad si se menciona
            if "nacionalidad" in clue.lower() or "nationality" in clue.lower():
                match = re.search(r"(nacionalidad|nationality):\s*([a-zA-Z]+)", clue, re.IGNORECASE)
                if match:
                    expected_nat = clean_nat(match.group(2))
                    actual_nat = clean_nat(row["nationality"])

                    if actual_nat != expected_nat:
                        continue

            # Validar debut si se menciona
            if "debutó en" in clue.lower() or "debuted in" in clue.lower():
                match = re.search(r"(debutó en|debuted in)\s*(\d{4})", clue, re.IGNORECASE)
                if match:
                    expected_year = int(match.group(2))
                    q_debut = text("""
                        SELECT MIN(r.year) AS debut
                        FROM constructorresults cr
                        JOIN races r ON cr.raceId = r.raceId
                        WHERE cr.constructorId = :constructorId
                    """)
                    debut_result = connection.execute(q_debut, {"constructorId": row["constructorId"]}).mappings().fetchone()
                    if not debut_result or debut_result["debut"] != expected_year:
                        continue

            return True  # ✅ Todos los filtros pasados

        return False
    except Exception as e:
        print(f"[ERROR CONSTRUCTOR] {e}", file=sys.stderr)
        return False


def validate_circuit(connection, word, clue):
    try:
        query = text("""
            SELECT * FROM circuits
            WHERE LOWER(circuitRef) LIKE :name
            OR LOWER(location) LIKE :name
            OR LOWER(name) LIKE :name
        """)
        name = f"%{word.lower()}%"
        result = connection.execute(query, {"name": name}).mappings().fetchone()
        if not result:
            return False

        # Validar país si se menciona
        if "país" in clue.lower() or "country" in clue.lower():
            match = re.search(r"(país|country):\s*([a-zA-Z]+)", clue, re.IGNORECASE)
            if match:
                expected_country = clean_nat(match.group(2))
                actual_country = clean_nat(result["country"])
                if actual_country != expected_country:
                    return False

        return True
    except Exception as e:
        print(f"[ERROR CIRCUIT] {e}", file=sys.stderr)
        return False

def validate_race(connection, word, clue):
    try:
        query = text("SELECT * FROM races WHERE name LIKE :name")
        result = connection.execute(query, {"name": f"%{word}%"}).mappings().fetchone()
        return bool(result)
    except Exception as e:
        print(f"[ERROR RACE] {e}", file=sys.stderr)
        return False


def validate_word_and_clue(word: str, clue: str, lang: str) -> bool:
    session = Session()
    try:
        if validate_driver(session, word, clue):
            return True
        if validate_constructor(session, word, clue):
            return True
        if validate_circuit(session, word, clue):
            return True
        if validate_race(session, word, clue):
            return True
        return False
    finally:
        session.close()



if __name__ == "__main__":
    if len(sys.argv) != 4:
        print("[ERROR] Invalid arguments", file=sys.stderr)
        sys.exit(1)
    word, clue, lang = sys.argv[1], sys.argv[2], sys.argv[3]
    result = validate_word_and_clue(word, clue, lang)
    print("true" if result else "false")


if __name__ == "__main__":
    main()
