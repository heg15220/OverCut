#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import json
import argparse
import unicodedata

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# --- CONFIGURACIÓN BBDD ---
DB_URL = 'mysql+pymysql://root:root@localhost/f1db'
engine = create_engine(DB_URL, pool_size=20, max_overflow=10)
Session = sessionmaker(bind=engine)


def _slugify(s: str) -> str:
    s = unicodedata.normalize('NFKD', s).encode('ascii', 'ignore').decode()
    return '_'.join(s.lower().replace('-', ' ').split())


def load_driver_data(session, piloto):
    sql = text("""
        SELECT d.driverId, d.nationality,
               MIN(ra.year) AS debutYear,
               MAX(ra.year) AS lastYear,
               SUM(IF(r.positionOrder=1,1,0)) AS wins,
               SUM(IF(r.positionOrder<=3,1,0)) AS podiums,
               GROUP_CONCAT(DISTINCT c.name) AS teams
          FROM drivers d
          LEFT JOIN results r       ON d.driverId      = r.driverId
          LEFT JOIN races ra         ON r.raceId        = ra.raceId
          LEFT JOIN constructors c   ON r.constructorId = c.constructorId
         WHERE CONCAT(d.forename, ' ', d.surname) = :pilot
         GROUP BY d.driverId
    """)
    return session.execute(sql, {'pilot': piloto}).mappings().first()


def validate_criteria(driver, criteria_code, session, since_year=None, end_year=None):
    # 1) CAMPEÓN DEL MUNDO EN EL PERÍODO
    if criteria_code == "world_champion":
        sql = text(f"""
            SELECT 1
              FROM driverStandings ds
              JOIN races ra ON ds.raceId = ra.raceId
             WHERE ds.driverId = :driverId
               AND ds.position = 1
               {"AND ra.year >= :since_year" if since_year else ""}
               {"AND ra.year <= :end_year"   if end_year   else ""}
             LIMIT 1
        """)
        params = {"driverId": driver["driverId"]}
        if since_year: params["since_year"] = since_year
        if end_year:   params["end_year"]   = end_year
        return session.execute(sql, params).first() is not None

    # 2) VICTORIA EN MÓNACO DURANTE EL PERÍODO
    if criteria_code == "won_in_monaco":
        sql = text(f"""
            SELECT 1
              FROM results r
              JOIN races ra ON r.raceId = ra.raceId
             WHERE r.driverId      = :driverId
               AND r.positionOrder = 1
               AND ra.name LIKE '%Monaco%'
               {"AND ra.year >= :since_year" if since_year else ""}
               {"AND ra.year <= :end_year"   if end_year   else ""}
             LIMIT 1
        """)
        params = {"driverId": driver["driverId"]}
        if since_year: params["since_year"] = since_year
        if end_year:   params["end_year"]   = end_year
        return session.execute(sql, params).first() is not None

    # 3) NACIONALIDAD (no depende de años)
    if criteria_code.startswith("nationality_"):
        crit = _slugify(criteria_code[len("nationality_"):])
        return _slugify(driver["nationality"]) == crit

    # 4) MÍNIMO DE VICTORIAS EN EL PERÍODO
    if criteria_code.startswith("min_") and criteria_code.endswith("_wins"):
        required = int(criteria_code.split("_")[1])
        sql = text(f"""
            SELECT COUNT(*) FROM results r
            JOIN races ra ON r.raceId = ra.raceId
             WHERE r.driverId      = :driverId
               AND r.positionOrder = 1
               {"AND ra.year >= :since_year" if since_year else ""}
               {"AND ra.year <= :end_year"   if end_year   else ""}
        """)
        params = {"driverId": driver["driverId"]}
        if since_year: params["since_year"] = since_year
        if end_year:   params["end_year"]   = end_year
        wins = session.execute(sql, params).scalar() or 0
        return wins >= required

    # 5) MÍNIMO DE PODIOS EN EL PERÍODO
    if criteria_code.startswith("min_") and criteria_code.endswith("_podiums"):
        required = int(criteria_code.split("_")[1])
        sql = text(f"""
            SELECT COUNT(*) FROM results r
            JOIN races ra ON r.raceId = ra.raceId
             WHERE r.driverId        = :driverId
               AND r.positionOrder <= 3
               {"AND ra.year >= :since_year" if since_year else ""}
               {"AND ra.year <= :end_year"   if end_year   else ""}
        """)
        params = {"driverId": driver["driverId"]}
        if since_year: params["since_year"] = since_year
        if end_year:   params["end_year"]   = end_year
        pods = session.execute(sql, params).scalar() or 0
        return pods >= required

    # 6) ERA (usa debutYear/lastYear)
    if criteria_code.startswith("era_"):
        _, start, end = criteria_code.split("_")
        return driver["lastYear"]  >= int(start) \
           and driver["debutYear"] <= int(end)

    # 7) EQUIPO DURANTE EL PERÍODO
    if criteria_code.startswith("team_"):
        team_slug = criteria_code[len("team_"):].replace('_',' ').lower()
        sql = text(f"""
            SELECT 1
              FROM results r
              JOIN races ra ON r.raceId        = ra.raceId
              JOIN constructors c ON r.constructorId = c.constructorId
             WHERE r.driverId     = :driverId
               AND LOWER(c.name) LIKE :team
               {"AND ra.year >= :since_year" if since_year else ""}
               {"AND ra.year <= :end_year"   if end_year   else ""}
             LIMIT 1
        """)
        params = {
            "driverId": driver["driverId"],
            "team":     f"%{team_slug}%"
        }
        if since_year: params["since_year"] = since_year
        if end_year:   params["end_year"]   = end_year
        return session.execute(sql, params).first() is not None

    # 8) VICTORIAS EN UN CIRCUITO DURANTE EL PERÍODO
    if criteria_code.startswith("circuit_wins_"):
        slug    = criteria_code[len("circuit_wins_"):]
        circuit = slug.replace("_", " ").lower()
        sql = text(f"""
            SELECT COUNT(*) FROM results r
            JOIN races ra ON r.raceId = ra.raceId
             WHERE r.driverId      = :driverId
               AND r.positionOrder = 1
               AND LOWER(ra.name) LIKE :circuit
               {"AND ra.year >= :since_year" if since_year else ""}
               {"AND ra.year <= :end_year"   if end_year   else ""}
        """)
        params = {
            "driverId": driver["driverId"],
            "circuit":  f"%{circuit}%"
        }
        if since_year: params["since_year"] = since_year
        if end_year:   params["end_year"]   = end_year
        wins = session.execute(sql, params).scalar() or 0
        return wins >= 1

    # 9) PODIOS EN UN CIRCUITO DURANTE EL PERÍODO
    if criteria_code.startswith("circuit_podiums_"):
        slug    = criteria_code[len("circuit_podiums_"):]
        circuit = slug.replace("_", " ").lower()
        sql = text(f"""
            SELECT COUNT(*) FROM results r
            JOIN races ra ON r.raceId = ra.raceId
             WHERE r.driverId        = :driverId
               AND r.positionOrder <= 3
               AND LOWER(ra.name)   LIKE :circuit
               {"AND ra.year >= :since_year" if since_year else ""}
               {"AND ra.year <= :end_year"   if end_year   else ""}
        """)
        params = {
            "driverId": driver["driverId"],
            "circuit":  f"%{circuit}%"
        }
        if since_year: params["since_year"] = since_year
        if end_year:   params["end_year"]   = end_year
        pods = session.execute(sql, params).scalar() or 0
        return pods >= 1

    # 10) COMPAÑERO DE EQUIPO DURANTE EL PERÍODO
    if criteria_code.startswith("teammate_"):
        slug       = criteria_code[len("teammate_"):]
        champ_name = slug.replace("_", " ")
        # 10.1) Buscar driverId del campeón
        sql = text("""
            SELECT driverId
              FROM drivers
             WHERE LOWER(CONCAT(forename,' ',surname)) = :name
             LIMIT 1
        """)
        row = session.execute(sql, {"name": champ_name.lower()}).first()
        if not row:
            return False
        champ_id = row[0]
        # 10.2) Comprobar que coincidieron en mismo GP y constructor
        sql = text(f"""
            SELECT 1
              FROM results r1
              JOIN races ra1 ON r1.raceId = ra1.raceId
              JOIN results r2 ON r1.raceId        = r2.raceId
                             AND r1.constructorId = r2.constructorId
             WHERE r2.driverId = :driverId
               AND r1.driverId = :champId
               {"AND ra1.year >= :since_year" if since_year else ""}
               {"AND ra1.year <= :end_year"   if end_year   else ""}
             LIMIT 1
        """)
        params = {
            "driverId": driver["driverId"],
            "champId":  champ_id
        }
        if since_year: params["since_year"] = since_year
        if end_year:   params["end_year"]   = end_year
        return session.execute(sql, params).first() is not None

    # 11) Si no coincide con ninguno, falla
    return False


def validate_pilot(row_criteria_code, column_criteria_code, piloto, since_year=None, end_year=None):
    session = Session()
    try:
        driver = load_driver_data(session, piloto)
        if not driver:
            return {"is_valid": False, "reason": "Piloto no encontrado"}

        # Ya no forzamos debutYear/lastYear globalmente:
        # cada criterio SQL aplica su filtro de años.

        # Validamos criterio de la fila:
        if not validate_criteria(driver, row_criteria_code, session, since_year, end_year):
            return {"is_valid": False, "reason": "No cumple criterio de la fila"}

        # Validamos criterio de la columna:
        if not validate_criteria(driver, column_criteria_code, session, since_year, end_year):
            return {"is_valid": False, "reason": "No cumple criterio de la columna"}

        return {"is_valid": True, "reason": "Correcto"}

    except Exception as e:
        return {"is_valid": False, "reason": f"Error interno: {e}"}

    finally:
        session.close()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--row",   type=str, required=True)
    parser.add_argument("--col",   type=str, required=True)
    parser.add_argument("--pilot", type=str, required=True)
    parser.add_argument("--since", type=int, default=None)
    parser.add_argument("--until", type=int, default=None)
    args = parser.parse_args()

    result = validate_pilot(
        args.row,
        args.col,
        args.pilot,
        since_year=args.since,
        end_year=args.until
    )
    print(json.dumps(result, ensure_ascii=False), flush=True)


if __name__ == "__main__":
    main()
