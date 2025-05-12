import json
import random
from sqlalchemy import create_engine, text

engine = create_engine("mysql+pymysql://root:root@localhost:3306/f1db")

with engine.connect() as conn:
    # 1. Obtener candidatos válidos: pilotos ganadores de GP desde 1985 con al menos 3 compañeros reales
    valid_drivers = conn.execute(text("""
        SELECT r1.driverId
        FROM results r1
        JOIN results r2 ON r1.raceId = r2.raceId AND r1.constructorId = r2.constructorId
        WHERE r1.driverId != r2.driverId
          AND r1.positionOrder = 1
          AND r1.raceId IN (SELECT raceId FROM races WHERE year BETWEEN 1985 AND YEAR(CURDATE()))
        GROUP BY r1.driverId
        HAVING COUNT(DISTINCT r2.driverId) >= 3
    """)).fetchall()

    if not valid_drivers:
        raise Exception("No se encontraron pilotos válidos con suficientes compañeros.")

    # 2. Seleccionar un piloto aleatorio entre ellos
    selected_driver_id = random.choice(valid_drivers)[0]

    # 3. Obtener datos del piloto
    driver = conn.execute(text("""
        SELECT driverId, CONCAT(forename, ' ', surname) AS name
        FROM drivers
        WHERE driverId = :driverId
    """), {"driverId": selected_driver_id}).fetchone()

    # 4. Obtener compañeros reales de equipo (misma carrera y constructor)
    teammates = conn.execute(text("""
        SELECT DISTINCT d.driverId, CONCAT(d.forename, ' ', d.surname) AS name
        FROM results r1
        JOIN results r2 ON r1.raceId = r2.raceId AND r1.constructorId = r2.constructorId
        JOIN drivers d ON d.driverId = r2.driverId
        WHERE r1.driverId = :driverId
          AND r2.driverId != :driverId
          AND r1.positionOrder IS NOT NULL
          AND r2.positionOrder IS NOT NULL
    """), {"driverId": selected_driver_id}).fetchall()

    # 5. Elegir entre 3 y 5 compañeros aleatorios
    if len(teammates) < 3:
        raise Exception("No hay suficientes compañeros válidos para el piloto seleccionado.")

    num_teammates = min(5, len(teammates))
    selected_teammates = random.sample(teammates, num_teammates)

    # 6. Generar JSON de salida
    result = {
        "driverId": driver.driverId,
        "driverName": driver.name,
        "teammates": [
            {"driverId": t.driverId, "driverName": t.name} for t in selected_teammates
        ]
    }

    print(json.dumps(result))
