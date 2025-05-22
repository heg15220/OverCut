import json
import random
from collections import defaultdict
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Configuración de la base de datos
DB_URL = "mysql+pymysql://root:root@localhost:3306/f1db"
engine = create_engine(DB_URL)
Session = sessionmaker(bind=engine)

def get_team_pairs_with_common_drivers(limit=10):
    session = Session()
    try:
        # Obtener piloto + constructor (único) desde 1985
        query = text("""
            SELECT d.driverId, CONCAT(d.forename, ' ', d.surname) AS driverName, c.name AS teamName
            FROM results r
            JOIN races ra ON r.raceId = ra.raceId
            JOIN drivers d ON r.driverId = d.driverId
            JOIN constructors c ON r.constructorId = c.constructorId
            WHERE ra.year >= 1985
        """)
        rows = session.execute(query).fetchall()

        # Agrupar equipos por piloto
        driver_to_teams = defaultdict(set)
        for driver_id, driver_name, team in rows:
            driver_to_teams[(driver_id, driver_name)].add(team)

        # Generar pares únicos de equipos con pilotos válidos
        pair_to_drivers = defaultdict(set)
        for (driver_id, driver_name), teams in driver_to_teams.items():
            team_list = list(teams)
            for i in range(len(team_list)):
                for j in range(i + 1, len(team_list)):
                    teamA, teamB = sorted([team_list[i], team_list[j]])
                    pair_to_drivers[(teamA, teamB)].add(driver_name)

        # Filtrar pares con al menos 1 piloto válido
        valid_pairs = [(teams, list(pilots)) for teams, pilots in pair_to_drivers.items() if len(pilots) >= 1]

        # Seleccionar aleatoriamente
        selected = random.sample(valid_pairs, min(limit, len(valid_pairs)))

        # Formatear resultado
        result = []
        for i, ((teamA, teamB), drivers) in enumerate(selected):
            result.append({
                "pairOrder": i,
                "teamA": teamA,
                "teamB": teamB,
                "validDrivers": drivers
            })

        print(json.dumps(result, ensure_ascii=False))
    finally:
        session.close()

if __name__ == "__main__":
    get_team_pairs_with_common_drivers()
