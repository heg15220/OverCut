import json
import random
from collections import defaultdict
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Configuración de la base de datos
DB_URL = os.getenv("DB_URI", "mysql+pymysql://root:root@localhost:3306/f1db")
engine = create_engine(DB_URL)
Session = sessionmaker(bind=engine)

def get_team_pairs_with_common_drivers(limit=10):
    session = Session()
    try:
        # 1. Consulta optimizada: solo pilotos con más de un constructor desde 1985
        query = text("""
            SELECT DISTINCT d.driverId, CONCAT(d.forename, ' ', d.surname) AS driverName, c.name AS teamName
            FROM (
                SELECT r.driverId
                FROM results r
                JOIN races ra ON r.raceId = ra.raceId
                WHERE ra.year >= 1985
                GROUP BY r.driverId
                HAVING COUNT(DISTINCT r.constructorId) > 1
            ) sub
            JOIN results r ON r.driverId = sub.driverId
            JOIN races ra ON r.raceId = ra.raceId AND ra.year >= 1985
            JOIN drivers d ON r.driverId = d.driverId
            JOIN constructors c ON r.constructorId = c.constructorId
        """)
        rows = session.execute(query).fetchall()

        # 2. Agrupar equipos por piloto
        driver_to_teams = defaultdict(set)
        for driver_id, driver_name, team in rows:
            driver_to_teams[(driver_id, driver_name)].add(team)

        # 3. Generar solo algunos pares por piloto (evita O(n²))
        pair_to_drivers = defaultdict(set)
        for (driver_id, driver_name), teams in driver_to_teams.items():
            team_list = list(teams)
            if len(team_list) < 2:
                continue

            max_pairs = min(3, len(team_list) * (len(team_list) - 1) // 2)
            sampled_pairs = random.sample(
                [(a, b) for i, a in enumerate(team_list) for b in team_list[i+1:]],
                k=max_pairs
            )

            for teamA, teamB in sampled_pairs:
                sorted_pair = tuple(sorted([teamA, teamB]))
                pair_to_drivers[sorted_pair].add(driver_name)

        # 4. Filtrar y seleccionar aleatoriamente los pares válidos
        valid_pairs = [(teams, list(pilots)) for teams, pilots in pair_to_drivers.items() if pilots]
        selected = []
        used = set()
        while len(selected) < limit and len(used) < len(valid_pairs):
            candidate = random.choice(valid_pairs)
            key = (candidate[0][0], candidate[0][1])
            if key not in used:
                selected.append(candidate)
                used.add(key)


        # 5. Formatear resultado
        result = []
        for i, ((teamA, teamB), drivers) in enumerate(selected):
            result.append({
                "pairOrder": i,
                "teamA": teamA,
                "teamB": teamB,
                "validDrivers": drivers
            })

        return result

    finally:
        session.close()


if __name__ == "__main__":
    get_team_pairs_with_common_drivers()
