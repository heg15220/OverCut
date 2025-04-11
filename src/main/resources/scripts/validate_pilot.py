import pymysql
import json
import sys
import os

# Configuración conexión BBDD
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': 'root',
    'database': 'f1db',
    'cursorclass': pymysql.cursors.DictCursor
}


def validate_pilot(row_criteria_code, column_criteria_code, piloto):
    connection = pymysql.connect(**DB_CONFIG)

    try:
        with connection.cursor() as cursor:

            # 1. Validar existencia piloto
            sql = "SELECT driverId FROM drivers WHERE CONCAT(forename, ' ', surname) = %s"
            cursor.execute(sql, (piloto,))
            result = cursor.fetchone()

            if not result:
                return {"is_valid": False, "reason": "Piloto no encontrado"}

            driverId = result['driverId']

            # 2. Validar criterio fila
            if not validate_criteria(cursor, row_criteria_code, driverId):
                return {"is_valid": False, "reason": "El piloto no cumple el criterio de la fila"}

            # 3. Validar criterio columna
            if not validate_criteria(cursor, column_criteria_code, driverId):
                return {"is_valid": False, "reason": "El piloto no cumple el criterio de la columna"}

            return {"is_valid": True, "reason": "Correcto"}

    except Exception as e:
        return {"is_valid": False, "reason": f"Error interno: {str(e)}"}

    finally:
        connection.close()


def validate_criteria(cursor, criteria_code, driverId):
    # Criterio: Campeón del Mundo
    if criteria_code == "world_champion":
        query = """
            SELECT 1
            FROM driverStandings
            WHERE driverId = %s AND position = 1
            LIMIT 1
        """
        cursor.execute(query, (driverId,))
        return cursor.fetchone() is not None

    # Criterio: Ganador en Mónaco
    if criteria_code == "won_in_monaco":
        query = """
            SELECT 1
            FROM results r
            JOIN races ra ON r.raceId = ra.raceId
            WHERE r.driverId = %s AND r.positionOrder = 1 AND ra.name LIKE '%%Monaco%%'
            LIMIT 1
        """
        cursor.execute(query, (driverId,))
        return cursor.fetchone() is not None

    # nationality_xxx
    if criteria_code.startswith("nationality_"):
        nationality = criteria_code.replace("nationality_", "").replace("_", " ").title()
        query = "SELECT 1 FROM drivers WHERE driverId = %s AND nationality = %s LIMIT 1"
        cursor.execute(query, (driverId, nationality))
        return cursor.fetchone() is not None

    # debut_YYYY
    if criteria_code.startswith("debut_"):
        year = int(criteria_code.replace("debut_", ""))
        query = """
            SELECT 1
            FROM results r
            JOIN races ra ON r.raceId = ra.raceId
            WHERE r.driverId = %s
            ORDER BY ra.year ASC
            LIMIT 1
        """
        cursor.execute(query, (driverId,))
        debut = cursor.fetchone()
        return debut is not None and debut['year'] == year

    # Otros criterios dinámicos (ya existentes)
    # min_X_wins
    if criteria_code.startswith("min_") and criteria_code.endswith("_wins"):
        wins = int(criteria_code.split("_")[1])
        query = """
            SELECT 1
            FROM results
            WHERE driverId = %s AND positionOrder = 1
            GROUP BY driverId
            HAVING COUNT(*) >= %s
        """
        cursor.execute(query, (driverId, wins))
        return cursor.fetchone() is not None

    # min_X_podiums
    if criteria_code.startswith("min_") and criteria_code.endswith("_podiums"):
        podiums = int(criteria_code.split("_")[1])
        query = """
            SELECT 1
            FROM results
            WHERE driverId = %s AND positionOrder <= 3
            GROUP BY driverId
            HAVING COUNT(*) >= %s
        """
        cursor.execute(query, (driverId, podiums))
        return cursor.fetchone() is not None

    # team_xxx
    if criteria_code.startswith("team_"):
        team = criteria_code.replace("team_", "").replace("_", " ").title()
        query = """
            SELECT 1
            FROM results r
            JOIN constructors c ON r.constructorId = c.constructorId
            WHERE r.driverId = %s AND c.name = %s
            LIMIT 1
        """
        cursor.execute(query, (driverId, team))
        return cursor.fetchone() is not None

    # Podio en circuito
    if criteria_code.startswith("podium_"):
        circuit = criteria_code.replace("podium_", "").replace("_", " ").title()
        query = """
            SELECT 1
            FROM results r
            JOIN races ra ON r.raceId = ra.raceId
            JOIN circuits c ON ra.circuitId = c.circuitId
            WHERE r.driverId = %s AND r.positionOrder <= 3 AND c.name = %s
            LIMIT 1
        """
        cursor.execute(query, (driverId, circuit))
        return cursor.fetchone() is not None

    # Ganador en circuito
    if criteria_code.startswith("winner_"):
        circuit = criteria_code.replace("winner_", "").replace("_", " ").title()
        query = """
            SELECT 1
            FROM results r
            JOIN races ra ON r.raceId = ra.raceId
            JOIN circuits c ON ra.circuitId = c.circuitId
            WHERE r.driverId = %s AND r.positionOrder = 1 AND c.name = %s
            LIMIT 1
        """
        cursor.execute(query, (driverId, circuit))
        return cursor.fetchone() is not None

    # teammate_of_xxx
    if criteria_code.startswith("teammate_of_"):
        teammate_name = criteria_code.replace("teammate_of_", "").replace("_", " ").title()
        cursor.execute("SELECT driverId FROM drivers WHERE CONCAT(forename, ' ', surname) = %s", (teammate_name,))
        teammate = cursor.fetchone()
        if not teammate:
            return False
        query = """
            SELECT 1
            FROM results r1
            JOIN results r2 ON r1.raceId = r2.raceId AND r1.constructorId = r2.constructorId
            WHERE r1.driverId = %s AND r2.driverId = %s
            LIMIT 1
        """
        cursor.execute(query, (teammate['driverId'], driverId))
        return cursor.fetchone() is not None

    # coached_by_xxx (depende implementación equipos → como ya lo tengas definido)

    return False  # Si no lo reconoce




if __name__ == "__main__":
    try:
        input_data = json.loads(sys.stdin.read())
        output = validate_pilot(
            input_data["row_criteria_code"],
            input_data["column_criteria_code"],
            input_data["piloto"]
        )
        print(json.dumps(output))

    except Exception as e:
        print(json.dumps({"is_valid": False, "reason": f"Error interno en Python: {str(e)}"}))


