import json
import random
from sqlalchemy import create_engine, text

# Conexión a base de datos
DB_URI = os.getenv("DB_URI", "mysql+pymysql://root:root@localhost:3306/f1db")
engine = create_engine(DB_URI, pool_pre_ping=True)

# ✅ Nueva función reutilizable
def generate_drivers_link_game():
    with engine.connect() as conn:
        # 1. Obtener pilotos con al menos 2 podios entre 1980 y actualidad y al menos 3 compañeros de equipo reales
        valid_drivers = conn.execute(text("""
            SELECT r1.driverId
            FROM results r1
            JOIN races ra ON r1.raceId = ra.raceId
            JOIN results r2 ON r1.raceId = r2.raceId AND r1.constructorId = r2.constructorId
            WHERE ra.year BETWEEN 1980 AND YEAR(CURDATE())
              AND r1.driverId != r2.driverId
              AND r1.positionOrder IN (1, 2, 3)
            GROUP BY r1.driverId
            HAVING COUNT(DISTINCT CASE WHEN r1.positionOrder IN (1, 2, 3) THEN r1.raceId END) >= 2
               AND COUNT(DISTINCT r2.driverId) >= 3
        """)).fetchall()

        if not valid_drivers:
            raise Exception("No se encontraron pilotos válidos con suficientes podios y compañeros.")

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

        if len(teammates) < 3:
            raise Exception("No hay suficientes compañeros válidos para el piloto seleccionado.")

        num_teammates = min(5, len(teammates))
        selected_teammates = random.sample(teammates, num_teammates)

        return {
            "driverId": driver.driverId,
            "driverName": driver.name,
            "teammates": [
                {"driverId": t.driverId, "driverName": t.name} for t in selected_teammates
            ]
        }

# ✅ Permite ejecución directa por terminal también
if __name__ == "__main__":
    print(json.dumps(generate_drivers_link_game(), ensure_ascii=False))
