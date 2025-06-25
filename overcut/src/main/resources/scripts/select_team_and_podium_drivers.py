import json, random
from sqlalchemy import create_engine, text

engine = create_engine("mysql+pymysql://root:root@localhost:3306/f1db")

def generate_team_guess_data():
    with engine.connect() as conn:
        teams = conn.execute(text("""
            SELECT c.constructorId, c.name
            FROM constructors c
            JOIN results r ON r.constructorId = c.constructorId
            WHERE r.positionOrder IN (1,2,3)
            GROUP BY c.constructorId
            HAVING COUNT(DISTINCT r.driverId) >= 4
        """)).fetchall()

        selected_team = random.choice(teams)
        team_id, team_name = selected_team

        drivers = conn.execute(text("""
            SELECT DISTINCT d.driverId, CONCAT(d.forename, ' ', d.surname) AS name
            FROM results r
            JOIN drivers d ON d.driverId = r.driverId
            WHERE r.constructorId = :teamId AND r.positionOrder IN (1,2,3)
        """), {"teamId": team_id}).fetchall()

        selected_drivers = random.sample(drivers, min(8, len(drivers)))

        return {
            "teamId": team_id,
            "teamName": team_name,
            "drivers": [{"driverId": d.driverId, "driverName": d.name} for d in selected_drivers]
        }
