import sys
import json
import mysql.connector

# Configuración conexión MySQL
config = {
    'host': 'localhost',
    'port': 3306,
    'user': 'root',
    'password': 'root',  # tu contraseña real aquí
    'database': 'f1db'
}

# Leer entrada JSON del stdin
input_data = sys.stdin.read()
data = json.loads(input_data)

question = data.get("question", "").lower()
answers = data.get("answers", [])

# Inicializar respuesta
correct = "unknown"

try:
    conn = mysql.connector.connect(**config)
    cursor = conn.cursor()

    if "campeón" in question or "ganó el mundial" in question:
        cursor.execute("""
            SELECT d.forename, d.surname
            FROM driverStandings ds
            JOIN drivers d ON ds.driverId = d.driverId
            JOIN races r ON ds.raceId = r.raceId
            WHERE ds.position = 1
            ORDER BY r.year DESC
            LIMIT 20
        """)
        campeones = set(f"{f} {s}" for f, s in cursor.fetchall())

        for a in answers:
            if a in campeones:
                correct = a
                break

    elif "ganó el gran premio" in question:
        cursor.execute("""
            SELECT d.forename, d.surname
            FROM results res
            JOIN drivers d ON res.driverId = d.driverId
            WHERE res.positionOrder = 1
            ORDER BY RAND()
            LIMIT 200
        """)
        winners = set(f"{f} {s}" for f, s in cursor.fetchall())

        for a in answers:
            if a in winners:
                correct = a
                break

    # Si no se encuentra por consulta, devolver la primera por defecto (fallback)
    if correct == "unknown" and answers:
        correct = answers[0]

except Exception as e:
    correct = f"error: {str(e)}"

finally:
    if 'conn' in locals():
        conn.close()

print(json.dumps({ "correctAnswer": correct }, ensure_ascii=False))
