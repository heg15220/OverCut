import sys
import sqlalchemy
from sqlalchemy import create_engine, text
import re
from sqlalchemy.orm import sessionmaker

DB_CONNECTION = "mysql+pymysql://root:root@localhost:3306/f1db"

engine = create_engine(DB_CONNECTION, pool_size=25, max_overflow=10)
Session = sessionmaker(bind=engine)

def normalize(text):
    return re.sub(r"[^a-zA-Z0-9]", "", text.lower())

def clean_nat(n):
    return re.sub(r'[^a-zA-Z]', '', n.strip().lower())

def validate_driver(connection, word, clue):
    try:
        query = text("SELECT * FROM drivers WHERE surname LIKE :name OR forename LIKE :name")
        result = connection.execute(query, {"name": f"%{word}%"}).mappings().fetchone()
        if not result:
            return False

        # Validar si debe tener títulos (campeón)
        if "campeón" in clue.lower() or "champion" in clue.lower():
            query2 = text("""
                SELECT COUNT(*) as titles
                FROM driver_standings
                WHERE driverId = :driverId AND position = 1
            """)
            standings = connection.execute(query2, {"driverId": result["driverId"]}).mappings().fetchone()
            if not standings or standings["titles"] == 0:
                return False

        # Validar nacionalidad si se menciona
        if "nacionalidad" in clue.lower() or "nationality" in clue.lower():
            match = re.search(r"(nacionalidad|nationality):\s*([a-zA-Z]+)", clue, re.IGNORECASE)
            if match:
                expected_nat = clean_nat(match.group(2))
                actual_nat = clean_nat(result["nationality"])
                if actual_nat != expected_nat:
                    return False

        return True
    except Exception as e:
        print(f"[ERROR DRIVER] {e}", file=sys.stderr)
        return False

def validate_constructor(connection, word, clue):
    try:
        query = text("SELECT * FROM constructors WHERE name LIKE :name")
        result = connection.execute(query, {"name": f"%{word}%"}).mappings().fetchone()
        if not result:
            return False

        # Validar nacionalidad si se menciona
        if "nacionalidad" in clue.lower() or "nationality" in clue.lower():
            match = re.search(r"(nacionalidad|nationality):\s*([a-zA-Z]+)", clue, re.IGNORECASE)
            if match:
                expected_nat = clean_nat(match.group(2))
                actual_nat = clean_nat(result["nationality"])

                if actual_nat != expected_nat:
                    return False

        return True
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

def main():
    if len(sys.argv) != 4:
        print("[ERROR] Invalid arguments", file=sys.stderr)
        sys.exit(1)

    word = sys.argv[1]
    clue = sys.argv[2]
    language = sys.argv[3]

    session = Session()
    try:
        if validate_driver(session, word, clue):
            print("true")
            sys.exit(0)
        if validate_constructor(session, word, clue):
            print("true")
            sys.exit(0)
        if validate_circuit(session, word, clue):
            print("true")
            sys.exit(0)
        if validate_race(session, word, clue):
            print("true")
            sys.exit(0)

        print("false")
        sys.exit(0)

    except Exception as e:
        print(f"[ERROR MAIN] {e}", file=sys.stderr)
        sys.exit(1)

    finally:
        session.close()

if __name__ == "__main__":
    main()
