import random
import json
from sqlalchemy import create_engine, text

# Conexión a la base de datos
engine = create_engine("mysql+pymysql://root:root@localhost:3306/f1db")

# Lista de temáticas posibles
THEMES = [
    {
        "topic": "Victorias con Ferrari en Albert Park",
        "query": """
            SELECT d.driverId, CONCAT(d.forename, ' ', d.surname) AS driverName, COUNT(*) AS victories
            FROM results r
            JOIN races ra ON r.raceId = ra.raceId
            JOIN circuits c ON ra.circuitId = c.circuitId
            JOIN constructors co ON r.constructorId = co.constructorId
            JOIN drivers d ON r.driverId = d.driverId
            WHERE r.positionOrder = 1
              AND co.name = 'Ferrari'
              AND c.name = 'Albert Park Grand Prix Circuit'
            GROUP BY r.driverId
            ORDER BY victories DESC
            LIMIT 10
        """
    },
    {
        "topic": "Podios con Mercedes",
        "query": """
            SELECT d.driverId, CONCAT(d.forename, ' ', d.surname) AS driverName, COUNT(*) AS podiums
            FROM results r
            JOIN constructors co ON r.constructorId = co.constructorId
            JOIN drivers d ON r.driverId = d.driverId
            WHERE r.positionOrder <= 3
              AND co.name = 'Mercedes'
            GROUP BY r.driverId
            ORDER BY podiums DESC
            LIMIT 10
        """
    },
    {
        "topic": "Pole positions en Mónaco",
        "query": """
            SELECT d.driverId, CONCAT(d.forename, ' ', d.surname) AS driverName, COUNT(*) AS poles
            FROM qualifying q
            JOIN races ra ON q.raceId = ra.raceId
            JOIN circuits c ON ra.circuitId = c.circuitId
            JOIN drivers d ON q.driverId = d.driverId
            WHERE q.position = 1
              AND c.name LIKE '%Monaco%'
            GROUP BY q.driverId
            ORDER BY poles DESC
            LIMIT 10
        """
    }
]

def generate_order_game():
    theme = random.choice(THEMES)
    topic = theme["topic"]
    query = theme["query"]

    with engine.connect() as conn:
        result = conn.execute(text(query))
        drivers = result.fetchall()

    output = {
        "topic": topic,
        "drivers": []
    }

    for i, row in enumerate(drivers):
        output["drivers"].append({
            "driverId": row.driverId,
            "driverName": row.driverName,
            "correctOrder": i  # ordenado ya por criterio descendente
        })

    print(json.dumps(output, ensure_ascii=False))


if __name__ == "__main__":
    generate_order_game()
