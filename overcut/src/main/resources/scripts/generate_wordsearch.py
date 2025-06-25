# archivo: generate_wordsearch.py

import json, random
from sqlalchemy import create_engine, text

def generate_wordsearch_grid():
    engine = create_engine("mysql+pymysql://root:root@localhost:3306/f1db")
    with engine.connect() as conn:
        drivers = conn.execute(text("""
            SELECT d.driverId, d.surname
            FROM results r
            JOIN drivers d ON d.driverId = r.driverId
            WHERE r.positionOrder IN (1,2,3) AND d.dob >= '1960-01-01'
            GROUP BY d.driverId
            HAVING COUNT(*) > 0
        """)).fetchall()

        selected = random.sample(drivers, 8)
        grid = [['' for _ in range(21)] for _ in range(10)]
        words_data = []

        directions = [(0,1), (0,-1), (1,0), (-1,0), (1,1), (-1,-1), (-1,1), (1,-1)]
        for driverId, surname in selected:
            surname = surname.upper()
            placed = False
            attempts = 0
            while not placed and attempts < 100:
                row, col = random.randint(0, 9), random.randint(0, 20)
                dr, dc = random.choice(directions)
                end_r = row + dr * (len(surname) - 1)
                end_c = col + dc * (len(surname) - 1)
                if 0 <= end_r < 10 and 0 <= end_c < 21:
                    fits = True
                    for i in range(len(surname)):
                        r, c = row + dr*i, col + dc*i
                        if grid[r][c] not in ('', surname[i]):
                            fits = False
                            break
                    if fits:
                        for i in range(len(surname)):
                            r, c = row + dr*i, col + dc*i
                            grid[r][c] = surname[i]
                        words_data.append({
                            "driverId": driverId,
                            "surname": surname,
                            "startRow": row,
                            "startCol": col,
                            "direction": f"{dr},{dc}"
                        })
                        placed = True
                attempts += 1

        for r in range(10):
            for c in range(21):
                if grid[r][c] == '':
                    grid[r][c] = random.choice("ABCDEFGHIJKLMNOPQRSTUVWXYZ")

        grid_json = [{"row": r, "col": c, "letter": grid[r][c]} for r in range(10) for c in range(21)]

        return {
            "theme": "Podium Drivers",
            "words": words_data,
            "grid": grid_json
        }
