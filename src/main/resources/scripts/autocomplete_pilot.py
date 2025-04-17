import sys
import json
import argparse
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

DB_URL = 'mysql+pymysql://root:root@localhost/f1db'
engine = create_engine(DB_URL, pool_size=25, max_overflow=10)
Session = sessionmaker(bind=engine)


def buscar_pilotos(nombre):
    session = Session()
    try:
        nombre = nombre.strip()
        nombre_like = f"%{nombre}%"

        sql = text("""
            SELECT DISTINCT CONCAT(forename, ' ', surname) AS full_name
            FROM drivers
            WHERE CONCAT(forename, ' ', surname) LIKE :name
            ORDER BY full_name
            LIMIT 10
        """)

        resultados = session.execute(sql, {'name': nombre_like}).fetchall()
        nombres = [r[0] for r in resultados]

        print(json.dumps(nombres, ensure_ascii=False))
    except Exception as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1)
    finally:
        session.close()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--name', required=True, help='Nombre parcial del piloto')
    args = parser.parse_args()

    buscar_pilotos(args.name)


if __name__ == '__main__':
    main()
