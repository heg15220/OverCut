import argparse
import json
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

engine = create_engine("mysql+pymysql://root:root@localhost:3306/f1db")  # Ajustar si es necesario
Session = sessionmaker(bind=engine)

def autocomplete_teams(partial_name: str):
    session = Session()
    try:
        result = session.execute(text("""
            SELECT DISTINCT name
            FROM constructors
            WHERE LOWER(name) LIKE :partial
            ORDER BY name
            LIMIT 10
        """), {"partial": f"%{partial_name.lower()}%"}).fetchall()
        return [r[0] for r in result]
    finally:
        session.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--partial", required=True)
    args = parser.parse_args()
    suggestions = autocomplete_teams(args.partial)
    print(json.dumps(suggestions))
