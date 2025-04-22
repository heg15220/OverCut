#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import argparse
import json
import unicodedata

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Configuración de conexión a BBDD
DB_URL = 'mysql+pymysql://root:root@localhost/f1db'
engine = create_engine(DB_URL, pool_size=10, max_overflow=5)
Session = sessionmaker(bind=engine)


def slugify(texto):
    texto = unicodedata.normalize('NFKD', texto).encode('ascii', 'ignore').decode()
    return texto.lower().replace('-', ' ').replace('_', ' ').strip()


def obtener_todos_pilotos(session):
    sql = text("""
        SELECT DISTINCT CONCAT(forename, ' ', surname) AS full_name
        FROM drivers
        ORDER BY full_name
    """)
    return [row[0] for row in session.execute(sql).fetchall()]


def validar_piloto(session, piloto, row_crit, col_crit, since_year, end_year):
    args = ["--row", row_crit, "--col", col_crit, "--pilot", piloto]
    if since_year:
        args.extend(["--since", str(since_year)])
    if end_year:
        args.extend(["--until", str(end_year)])

    from validate_pilot import validate_pilot
    result = validate_pilot(row_crit, col_crit, piloto, since_year, end_year)
    return result.get("is_valid", False)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--row", required=True, help="Código del criterio de fila")
    parser.add_argument("--col", required=True, help="Código del criterio de columna")
    parser.add_argument("--since", type=int, default=None)
    parser.add_argument("--until", type=int, default=None)
    args = parser.parse_args()

    session = Session()
    try:
        pilotos_validos = []
        for piloto in obtener_todos_pilotos(session):
            if validar_piloto(session, piloto, args.row, args.col, args.since, args.until):
                pilotos_validos.append(piloto)
            if len(pilotos_validos) >= 5:  # suficiente con 5 candidatos
                break

        print(json.dumps({
            "valid_pilots": pilotos_validos
        }, ensure_ascii=False), flush=True)

    except Exception as e:
        print(json.dumps({"error": str(e)}), flush=True)
    finally:
        session.close()


if __name__ == "__main__":
    main()
