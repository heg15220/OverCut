import pymysql
import json
import sys

from pymysqlpool.pool import Pool

DB_CONFIG_POOL = {
    'host': 'localhost',
    'user': 'root',
    'password': 'root',
    'database': 'f1db'
}

pool = Pool(host=DB_CONFIG_POOL['host'],
            user=DB_CONFIG_POOL['user'],
            password=DB_CONFIG_POOL['password'],
            database=DB_CONFIG_POOL['database'])

pool.init()


def load_driver_data(cursor, piloto):
    # Sacamos todo de golpe
    sql = """
        SELECT d.driverId, d.nationality,
               MIN(ra.year) as debutYear,
               MAX(ra.year) as lastYear,
               SUM(IF(r.positionOrder=1,1,0)) as wins,
               SUM(IF(r.positionOrder<=3,1,0)) as podiums,
               GROUP_CONCAT(DISTINCT c.name) as teams
        FROM drivers d
        LEFT JOIN results r ON d.driverId = r.driverId
        LEFT JOIN races ra ON r.raceId = ra.raceId
        LEFT JOIN constructors c ON r.constructorId = c.constructorId
        WHERE CONCAT(d.forename, ' ', d.surname) = %s
        GROUP BY d.driverId
    """
    cursor.execute(sql, (piloto,))
    return cursor.fetchone()


def validate_criteria(driver, criteria_code, cursor):
    # World champion
    if criteria_code == "world_champion":
        cursor.execute("""
            SELECT 1 FROM driverStandings WHERE driverId = %s AND position = 1 LIMIT 1
        """, (driver['driverId'],))
        return cursor.fetchone() is not None

    if criteria_code == "won_in_monaco":
        cursor.execute("""
            SELECT 1
            FROM results r
            JOIN races ra ON r.raceId = ra.raceId
            WHERE r.driverId = %s AND r.positionOrder = 1 AND ra.name LIKE '%%Monaco%%'
            LIMIT 1
        """, (driver['driverId'],))
        return cursor.fetchone() is not None

    if criteria_code.startswith("nationality_"):
        return driver['nationality'].lower().replace(" ", "_") == criteria_code.replace("nationality_", "")

    if criteria_code.startswith("min_") and criteria_code.endswith("_wins"):
        required = int(criteria_code.split("_")[1])
        return driver['wins'] >= required

    if criteria_code.startswith("min_") and criteria_code.endswith("_podiums"):
        required = int(criteria_code.split("_")[1])
        return driver['podiums'] >= required

    if criteria_code.startswith("era_"):
        _, start, end = criteria_code.split("_")
        start, end = int(start), int(end)
        return driver['lastYear'] >= start and driver['debutYear'] <= end

    if criteria_code.startswith("team_"):
        team_name = criteria_code.replace("team_", "").replace("_", " ").title()
        return team_name in driver['teams'].split(",")

    return False


def validate_pilot(row_criteria_code, column_criteria_code, piloto):
    connection = pool.get_conn()
    try:
        with connection.cursor(pymysql.cursors.DictCursor) as cursor:
            driver = load_driver_data(cursor, piloto)

            if not driver:
                return {"is_valid": False, "reason": "Piloto no encontrado"}

            if not validate_criteria(driver, row_criteria_code, cursor):
                return {"is_valid": False, "reason": "No cumple criterio fila"}

            if not validate_criteria(driver, column_criteria_code, cursor):
                return {"is_valid": False, "reason": "No cumple criterio columna"}

            return {"is_valid": True, "reason": "Correcto"}

    except Exception as e:
        return {"is_valid": False, "reason": f"Error interno: {str(e)}"}
    finally:
        pool.release(connection)



if __name__ == "__main__":
    try:
        input_data = json.loads(sys.stdin.read())
        result = validate_pilot(
            input_data["row_criteria_code"],
            input_data["column_criteria_code"],
            input_data["piloto"]
        )
        print(json.dumps(result), flush=True)  # SIEMPRE SALE RESULTADO

    except Exception as e:
        error_output = {"is_valid": False, "reason": f"Error interno: {str(e)}"}
        print(json.dumps(error_output), flush=True)

