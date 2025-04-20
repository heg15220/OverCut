import json
import sys
import argparse
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import unicodedata

# --- CONFIGURACIÓN BBDD ---
DB_URL = 'mysql+pymysql://root:root@localhost/f1db'
engine = create_engine(DB_URL, pool_size=20, max_overflow=10)
Session = sessionmaker(bind=engine)

def _slugify(s: str) -> str:
    # quita acentos, pasa a ASCII
    s = unicodedata.normalize('NFKD', s).encode('ascii', 'ignore').decode()
    # minúsculas, espacios/guiones → _
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
        LEFT JOIN results r ON d.driverId = r.driverId
        LEFT JOIN races ra ON r.raceId = ra.raceId
        LEFT JOIN constructors c ON r.constructorId = c.constructorId
        WHERE CONCAT(d.forename, ' ', d.surname) = :pilot
        GROUP BY d.driverId
    """)
    result = session.execute(sql, {'pilot': piloto}).mappings().first()
    return result


def validate_criteria(driver, criteria_code, session):
    if criteria_code == "world_champion":
        sql = text("SELECT 1 FROM driverStandings WHERE driverId = :driverId AND position = 1 LIMIT 1")
        return session.execute(sql, {'driverId': driver['driverId']}).first() is not None

    if criteria_code == "won_in_monaco":
        sql = text("""
            SELECT 1
            FROM results r
            JOIN races ra ON r.raceId = ra.raceId
            WHERE r.driverId = :driverId AND r.positionOrder = 1 AND ra.name LIKE '%Monaco%'
            LIMIT 1
        """)
        return session.execute(sql, {'driverId': driver['driverId']}).first() is not None

    if criteria_code.startswith("nationality_"):
        crit = _slugify(criteria_code[len("nationality_"):])
        return _slugify(driver['nationality']) == crit

    if criteria_code.startswith("min_") and criteria_code.endswith("_wins"):
        required = int(criteria_code.split("_")[1])
        return int(driver.get('wins') or 0) >= required

    if criteria_code.startswith("min_") and criteria_code.endswith("_podiums"):
        required = int(criteria_code.split("_")[1])
        return int(driver.get('podiums') or 0) >= required


    if criteria_code.startswith("era_"):
        _, start, end = criteria_code.split("_")
        return driver['lastYear'] >= int(start) and driver['debutYear'] <= int(end)

    if criteria_code.startswith("team_"):
        # extrae el slug tras "team_"
        team_slug = criteria_code[len("team_"):]
        teams = [(t or "").strip() for t in (driver['teams'] or "").split(",")]
        # compara case‑insensitive
        return any(team_slug.lower() == t.lower() for t in teams)


    return False


def validate_pilot(row_criteria_code, column_criteria_code, piloto):
    session = Session()
    try:
        driver = load_driver_data(session, piloto)

        if not driver:
            return {"is_valid": False, "reason": "Piloto no encontrado"}

        if not validate_criteria(driver, row_criteria_code, session):
            return {"is_valid": False, "reason": "No cumple criterio fila"}

        if not validate_criteria(driver, column_criteria_code, session):
            return {"is_valid": False, "reason": "No cumple criterio columna"}

        return {"is_valid": True, "reason": "Correcto"}

    except Exception as e:
        return {"is_valid": False, "reason": f"Error interno: {str(e)}"}

    finally:
        session.close()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--row", type=str, required=True)
    parser.add_argument("--col", type=str, required=True)
    parser.add_argument("--pilot", type=str, required=True)
    args = parser.parse_args()

    result = validate_pilot(args.row, args.col, args.pilot)
    print(json.dumps(result, ensure_ascii=False), flush=True)


if __name__ == "__main__":
    main()
