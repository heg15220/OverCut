import mysql.connector
import random
import json

# Configuración de conexión a MySQL
config = {
    'host': 'localhost',
    'port': 3306,
    'user': 'root',  # o el que uses
    'password': 'root',  # tu contraseña real aquí
    'database': 'f1db'
}

# Conexión y extracción de ganadores
conn = mysql.connector.connect(**config)
cursor = conn.cursor()

cursor.execute("""
    SELECT r.year, r.name, d.forename, d.surname
    FROM results res
    JOIN races r ON res.raceId = r.raceId
    JOIN drivers d ON res.driverId = d.driverId
    WHERE res.positionOrder = 1
    ORDER BY RAND()
    LIMIT 5
""")
resultados = cursor.fetchall()
conn.close()

preguntas = []

for year, gp, nombre, apellido in resultados:
    pregunta_texto = f"¿Quién ganó el {gp} en {year}?"
    respuesta_correcta = f"{nombre} {apellido}"

    # Respuestas incorrectas
    conn = mysql.connector.connect(**config)
    cursor = conn.cursor()
    cursor.execute("""
        SELECT CONCAT(forename, ' ', surname)
        FROM drivers
        WHERE CONCAT(forename, ' ', surname) != %s
        ORDER BY RAND()
        LIMIT 3
    """, (respuesta_correcta,))
    respuestas_incorrectas = [row[0] for row in cursor.fetchall()]
    conn.close()

    opciones = respuestas_incorrectas + [respuesta_correcta]
    random.shuffle(opciones)

    preguntas.append({
        "question": pregunta_texto,
        "answers": opciones,
        "correctAnswer": respuesta_correcta
    })

# ⚠️ Salida por stdout en formato JSON para ser leída desde Java
print(json.dumps(preguntas, ensure_ascii=False))
