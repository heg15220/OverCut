import mysql.connector
import random
import json

config = {
    'host': 'localhost',
    'port': 3306,
    'user': 'root',
    'password': 'root',
    'database': 'f1db'
}

conn = mysql.connector.connect(**config)
cursor = conn.cursor()

cursor.execute("SELECT CONCAT(forename, ' ', surname) FROM drivers")
pilotos_cache = [row[0] for row in cursor.fetchall()]

cursor.execute("SELECT name FROM constructors")
constructores_cache = [row[0] for row in cursor.fetchall()]

cursor.execute("SELECT DISTINCT country FROM circuits WHERE country IS NOT NULL")
paises_cache = [row[0] for row in cursor.fetchall()]

def get_respuestas_incorrectas(correcta, pool, n=3):
    opciones = [x for x in pool if x != correcta]
    return random.sample(opciones, n)

preguntas = []

# -------- PREGUNTAS BÁSICAS --------

def generar_pregunta_ganador_gp():
    cursor.execute("""
        SELECT r.year, r.name, d.forename, d.surname
        FROM results res
        JOIN races r ON res.raceId = r.raceId
        JOIN drivers d ON res.driverId = d.driverId
        WHERE res.positionOrder = 1
        ORDER BY RAND()
        LIMIT 1
    """)
    year, gp, nombre, apellido = cursor.fetchone()
    pregunta = f"¿Quién ganó el {gp} en {year}?"
    correcta = f"{nombre} {apellido}"

    cursor.execute("SELECT CONCAT(forename, ' ', surname) FROM drivers WHERE CONCAT(forename, ' ', surname) != %s ORDER BY RAND() LIMIT 3", (correcta,))
    opciones = [row[0] for row in cursor.fetchall()] + [correcta]
    random.shuffle(opciones)

    return {"question": pregunta, "answers": opciones, "correctAnswer": correcta, "knowledgeLevel": 1}


def generar_pregunta_escuderia_ganadora():
    cursor.execute("""
        SELECT r.year, r.name, c.name
        FROM results res
        JOIN races r ON res.raceId = r.raceId
        JOIN constructors c ON res.constructorId = c.constructorId
        WHERE res.positionOrder = 1
        ORDER BY RAND()
        LIMIT 1
    """)
    year, gp, team = cursor.fetchone()
    pregunta = f"¿Qué escudería ganó el {gp} en {year}?"

    cursor.execute("SELECT name FROM constructors WHERE name != %s ORDER BY RAND() LIMIT 3", (team,))
    opciones = [row[0] for row in cursor.fetchall()] + [team]
    random.shuffle(opciones)

    return {"question": pregunta, "answers": opciones, "correctAnswer": team, "knowledgeLevel": 1}


def generar_pregunta_pais_gp():
    cursor.execute("""
        SELECT r.year, r.name, c.country
        FROM races r
        JOIN circuits c ON r.circuitId = c.circuitId
        ORDER BY RAND()
        LIMIT 1
    """)
    year, gp, country = cursor.fetchone()
    pregunta = f"¿En qué país se celebró el {gp} en {year}?"

    cursor.execute("SELECT DISTINCT country FROM circuits WHERE country != %s ORDER BY RAND() LIMIT 3", (country,))
    opciones = [row[0] for row in cursor.fetchall()] + [country]
    random.shuffle(opciones)

    return {"question": pregunta, "answers": opciones, "correctAnswer": country, "knowledgeLevel": 1}


def generar_pregunta_segundo_gp():
    cursor.execute("""
        SELECT r.year, r.name, d.forename, d.surname
        FROM results res
        JOIN races r ON res.raceId = r.raceId
        JOIN drivers d ON res.driverId = d.driverId
        WHERE res.positionOrder = 2
        ORDER BY RAND()
        LIMIT 1
    """)
    year, gp, nombre, apellido = cursor.fetchone()
    pregunta = f"¿Quién quedó segundo en el {gp} en {year}?"
    correcta = f"{nombre} {apellido}"

    cursor.execute("SELECT CONCAT(forename, ' ', surname) FROM drivers WHERE CONCAT(forename, ' ', surname) != %s ORDER BY RAND() LIMIT 3", (correcta,))
    opciones = [row[0] for row in cursor.fetchall()] + [correcta]
    random.shuffle(opciones)

    return {"question": pregunta, "answers": opciones, "correctAnswer": correcta, "knowledgeLevel": 2}


def generar_pregunta_tercero_gp():
    cursor.execute("""
        SELECT r.year, r.name, d.forename, d.surname
        FROM results res
        JOIN races r ON res.raceId = r.raceId
        JOIN drivers d ON res.driverId = d.driverId
        WHERE res.positionOrder = 3
        ORDER BY RAND()
        LIMIT 1
    """)
    year, gp, nombre, apellido = cursor.fetchone()
    pregunta = f"¿Quién quedó tercero en el {gp} en {year}?"
    correcta = f"{nombre} {apellido}"

    cursor.execute("SELECT CONCAT(forename, ' ', surname) FROM drivers WHERE CONCAT(forename, ' ', surname) != %s ORDER BY RAND() LIMIT 3", (correcta,))
    opciones = [row[0] for row in cursor.fetchall()] + [correcta]
    random.shuffle(opciones)

    return {"question": pregunta, "answers": opciones, "correctAnswer": correcta, "knowledgeLevel": 2}


def generar_pregunta_campeon_pilotos():
    anio = random.randint(2000, 2023)
    cursor.execute("""
        SELECT d.forename, d.surname
        FROM driverStandings ds
        JOIN drivers d ON ds.driverId = d.driverId
        JOIN races r ON ds.raceId = r.raceId
        WHERE ds.position = 1 AND r.year = %s
        LIMIT 1
    """, (anio,))
    nombre, apellido = cursor.fetchone()
    correcta = f"{nombre} {apellido}"
    pregunta = f"¿Qué piloto ganó el campeonato de F1 en {anio}?"

    cursor.execute("SELECT CONCAT(forename, ' ', surname) FROM drivers WHERE CONCAT(forename, ' ', surname) != %s ORDER BY RAND() LIMIT 3", (correcta,))
    opciones = [row[0] for row in cursor.fetchall()] + [correcta]
    random.shuffle(opciones)

    return {"question": pregunta, "answers": opciones, "correctAnswer": correcta, "knowledgeLevel": 2}


def generar_pregunta_campeon_constructores():
    anio = random.randint(2000, 2023)
    cursor.execute("""
        SELECT c.name
        FROM constructorStandings cs
        JOIN constructors c ON cs.constructorId = c.constructorId
        JOIN races r ON cs.raceId = r.raceId
        WHERE cs.position = 1 AND r.year = %s
        LIMIT 1
    """, (anio,))
    (constructora,) = cursor.fetchone()
    pregunta = f"¿Qué constructor ganó el campeonato de F1 en {anio}?"

    cursor.execute("SELECT name FROM constructors WHERE name != %s ORDER BY RAND() LIMIT 3", (constructora,))
    opciones = [row[0] for row in cursor.fetchall()] + [constructora]
    random.shuffle(opciones)

    return {"question": pregunta, "answers": opciones, "correctAnswer": constructora, "knowledgeLevel": 2}

# -------- PREGUNTAS COMPLEJAS --------

def generar_pregunta_piloto_con_mas_victorias_en_gp():
    cursor.execute("""
        SELECT r.name
        FROM races r
        GROUP BY r.name
        HAVING COUNT(*) > 5
        ORDER BY RAND()
        LIMIT 1
    """)
    (gp_name,) = cursor.fetchone()

    cursor.execute("""
        SELECT d.forename, d.surname, COUNT(*) as wins
        FROM results res
        JOIN races r ON res.raceId = r.raceId
        JOIN drivers d ON res.driverId = d.driverId
        WHERE res.positionOrder = 1 AND r.name = %s
        GROUP BY d.driverId
        ORDER BY wins DESC
        LIMIT 1
    """, (gp_name,))
    nombre, apellido, _ = cursor.fetchone()
    correcta = f"{nombre} {apellido}"
    pregunta = f"¿Qué piloto ha ganado más veces el {gp_name}?"

    cursor.execute("SELECT CONCAT(forename, ' ', surname) FROM drivers WHERE CONCAT(forename, ' ', surname) != %s ORDER BY RAND() LIMIT 3", (correcta,))
    opciones = [row[0] for row in cursor.fetchall()] + [correcta]
    random.shuffle(opciones)

    return {"question": pregunta, "answers": opciones, "correctAnswer": correcta, "knowledgeLevel": 3}


def generar_pregunta_piloto_mas_victorias_en_circuito():
    cursor.execute("""
        SELECT c.name
        FROM circuits c
        JOIN races r ON c.circuitId = r.circuitId
        GROUP BY c.name
        HAVING COUNT(*) > 3
        ORDER BY RAND()
        LIMIT 1
    """)
    (circuito,) = cursor.fetchone()

    cursor.execute("""
        SELECT d.forename, d.surname, COUNT(*) as wins
        FROM results res
        JOIN races r ON res.raceId = r.raceId
        JOIN drivers d ON res.driverId = d.driverId
        JOIN circuits c ON r.circuitId = c.circuitId
        WHERE res.positionOrder = 1 AND c.name = %s
        GROUP BY d.driverId
        ORDER BY wins DESC
        LIMIT 1
    """, (circuito,))
    nombre, apellido, _ = cursor.fetchone()
    correcta = f"{nombre} {apellido}"
    pregunta = f"¿Qué piloto ha ganado más veces en el circuito {circuito}?"

    cursor.execute("SELECT CONCAT(forename, ' ', surname) FROM drivers WHERE CONCAT(forename, ' ', surname) != %s ORDER BY RAND() LIMIT 3", (correcta,))
    opciones = [row[0] for row in cursor.fetchall()] + [correcta]
    random.shuffle(opciones)

    return {"question": pregunta, "answers": opciones, "correctAnswer": correcta, "knowledgeLevel": 3}


def generar_pregunta_constructor_mas_victorias_en_pais():
    cursor.execute("""
        SELECT DISTINCT country
        FROM circuits
        WHERE country IS NOT NULL
        ORDER BY RAND()
        LIMIT 1
    """)
    (pais,) = cursor.fetchone()

    cursor.execute("""
        SELECT c.name, COUNT(*) as wins
        FROM results res
        JOIN races r ON res.raceId = r.raceId
        JOIN constructors c ON res.constructorId = c.constructorId
        JOIN circuits ci ON r.circuitId = ci.circuitId
        WHERE res.positionOrder = 1 AND ci.country = %s
        GROUP BY c.constructorId
        ORDER BY wins DESC
        LIMIT 1
    """, (pais,))
    (constructora, _) = cursor.fetchone()
    pregunta = f"¿Qué constructor ha ganado más veces en {pais}?"

    cursor.execute("SELECT name FROM constructors WHERE name != %s ORDER BY RAND() LIMIT 3", (constructora,))
    opciones = [row[0] for row in cursor.fetchall()] + [constructora]
    random.shuffle(opciones)

    return {"question": pregunta, "answers": opciones, "correctAnswer": constructora, "knowledgeLevel": 3}

# -------- GENERACIÓN --------

generadores = [
    generar_pregunta_ganador_gp,
    generar_pregunta_escuderia_ganadora,
    generar_pregunta_pais_gp,
    generar_pregunta_segundo_gp,
    generar_pregunta_tercero_gp,
    generar_pregunta_campeon_pilotos,
    generar_pregunta_campeon_constructores,
    generar_pregunta_piloto_con_mas_victorias_en_gp,
    generar_pregunta_piloto_mas_victorias_en_circuito,
    generar_pregunta_constructor_mas_victorias_en_pais
]

NUM_PREGUNTAS = 10
while len(preguntas) < NUM_PREGUNTAS:
    generador = random.choice(generadores)
    try:
        pregunta = generador()
        preguntas.append(pregunta)
    except:
        continue  # fallback en caso de error

conn.close()
print(json.dumps(preguntas, ensure_ascii=False))
