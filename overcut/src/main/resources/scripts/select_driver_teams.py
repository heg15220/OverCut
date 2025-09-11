import random
import json
from sqlalchemy import create_engine, text

# ✅ Crea el engine una sola vez
DB_URI = os.getenv("DB_URI", "mysql+pymysql://root:root@localhost:3306/f1db")
engine = create_engine(DB_URI, pool_pre_ping=True)

def generate_career_path_game():
    with engine.connect() as conn:
        # 1. Pilotos desde 1980 con al menos 1 podio
        drivers = conn.execute(text("""
            SELECT d.driverId, CONCAT(d.forename, ' ', d.surname) AS name
            FROM results r
            JOIN races ra ON r.raceId = ra.raceId
            JOIN drivers d ON r.driverId = d.driverId
            WHERE ra.year >= 1980 AND r.positionOrder IN (1, 2, 3)
            GROUP BY r.driverId
            HAVING COUNT(DISTINCT r.raceId) >= 1
        """)).fetchall()

        if not drivers:
            raise Exception("No se encontraron pilotos válidos")

        selected = random.choice(drivers)
        driver_id, driver_name = selected

        # 2. Apariciones por equipo ordenadas cronológicamente
        stints = conn.execute(text("""
            SELECT ra.year, ra.round, c.name
            FROM results r
            JOIN races ra ON r.raceId = ra.raceId
            JOIN constructors c ON r.constructorId = c.constructorId
            WHERE r.driverId = :driverId
            ORDER BY ra.year, ra.round
        """), {"driverId": driver_id}).fetchall()

        # 3. Agrupar por bloques consecutivos de equipo
        chronological_teams = []
        last_team = None
        for _, _, team in stints:
            if team != last_team:
                chronological_teams.append(team)
                last_team = team

        return {
            "driverId": driver_id,
            "driverName": driver_name,
            "teams": chronological_teams
        }

# ✅ Solo si se ejecuta directamente como script
if __name__ == "__main__":
    print(json.dumps(generate_career_path_game(), ensure_ascii=False))
