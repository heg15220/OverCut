import os
import sys
import json
import mysql.connector
from sqlalchemy.engine.url import make_url  # solo para parsear la URI

# Lee una sola variable DB_URI o cae a local
# Ejemplo de DB_URI: mysql+pymysql://overcut:PASS@db:3306/f1db
DB_URI = os.getenv("DB_URI", "mysql+pymysql://root:root@localhost:3306/f1db")

# Permite override fino si lo prefieres
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")
DB_USER = os.getenv("DB_USER")
DB_PASS = os.getenv("DB_PASSWORD")
DB_NAME = os.getenv("DB_NAME")

url = make_url(DB_URI)

config = {
    "host": DB_HOST or (url.host or "localhost"),
    "port": int(DB_PORT or (url.port or 3306)),
    "user": DB_USER or (url.username or "root"),
    "password": DB_PASS or (url.password or "root"),
    "database": DB_NAME or (url.database or "f1db"),
    "charset": "utf8mb4",
}

# ---- Entrada JSON por stdin ----
raw = sys.stdin.read().strip()
data = json.loads(raw) if raw else {}
question = (data.get("question") or "").lower()
answers = data.get("answers") or []

result = {"correct": "unknown"}  # yes | no | unknown

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
