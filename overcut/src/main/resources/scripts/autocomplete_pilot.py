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
        return [r[0] for r in resultados]
    except Exception as e:
        raise RuntimeError(f"Error en buscar_pilotos: {e}")
    finally:
        session.close()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--name', required=True, help='Nombre parcial del piloto')
    args = parser.parse_args()

    print(json.dumps(buscar_pilotos(args.name), ensure_ascii=False))  # <- Solo print en CLI



if __name__ == '__main__':
    main()
