# Versión corregida del script generate_questions.py con validaciones mejoradas
# Incluye: corrección de verificación de respuestas, eliminación de duplicados y coherencia de fechas

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

def obtener_pilotos_entre_anios(anio_inicio, anio_fin, excluido=None):
    query = """
        SELECT DISTINCT CONCAT(d.forename, ' ', d.surname)
        FROM results res
        JOIN drivers d ON res.driverId = d.driverId
        JOIN races r ON res.raceId = r.raceId
        WHERE r.year BETWEEN %s AND %s
    """
    params = [anio_inicio, anio_fin]
    if excluido:
        query += " AND CONCAT(d.forename, ' ', d.surname) != %s"
        params.append(excluido)
    cursor.execute(query, params)
    return [row[0] for row in cursor.fetchall()]

def obtener_constructores_entre_anios(anio_inicio, anio_fin, excluido=None):
    query = """
        SELECT DISTINCT c.name
        FROM results res
        JOIN constructors c ON res.constructorId = c.constructorId
        JOIN races r ON res.raceId = r.raceId
        WHERE r.year BETWEEN %s AND %s
    """
    params = [anio_inicio, anio_fin]
    if excluido:
        query += " AND c.name != %s"
        params.append(excluido)
    cursor.execute(query, params)
    return [row[0] for row in cursor.fetchall()]


preguntas = []


def generar_pregunta_piloto_primera_victoria_reciente():
    cursor.execute("""
        SELECT r.year, r.name, d.forename, d.surname
        FROM results res
        JOIN races r ON res.raceId = r.raceId
        JOIN drivers d ON res.driverId = d.driverId
        WHERE res.positionOrder = 1 AND r.year >= 2020
        AND res.driverId NOT IN (
            SELECT res2.driverId
            FROM results res2
            JOIN races r2 ON res2.raceId = r2.raceId
            WHERE res2.positionOrder = 1 AND r2.year < r.year
        )
        ORDER BY RAND()
        LIMIT 1
    """)
    year, gp, nombre, apellido = cursor.fetchone()
    correcta = f"{nombre} {apellido}"
    pregunta = f"¿Qué piloto logró su primera victoria en el GP de {gp} en {year}?"
    contemporaneos = obtener_pilotos_entre_anios(anio - 2, anio + 2, correcta)
    opciones = random.sample(contemporaneos, min(3, len(contemporaneos))) + [correcta]
    random.shuffle(opciones)
    return {"question": pregunta, "answers": opciones, "correctAnswer": correcta, "knowledgeLevel": 2}


def generar_pregunta_piloto_mas_podios_totales():
    # Obtener pilotos con número total de podios
    cursor.execute("""
        SELECT CONCAT(d.forename, ' ', d.surname) AS nombre, COUNT(*) AS podios
        FROM results res
        JOIN drivers d ON res.driverId = d.driverId
        WHERE res.positionOrder <= 3
        GROUP BY res.driverId
        HAVING podios > 0
    """)
    datos = cursor.fetchall()
    if len(datos) < 4:
        raise Exception("No hay suficientes pilotos con podios para generar la pregunta.")

    intentos = 0
    while intentos < 10:
        seleccion = random.sample(datos, 4)
        seleccion.sort(key=lambda x: x[1], reverse=True)
        correcta = seleccion[0]
        c_nombre, c_podios = correcta
        if all(c_podios > otro[1] for otro in seleccion[1:]):
            pregunta = "¿Qué piloto tiene más podios en su carrera?"
            opciones = [row[0] for row in seleccion]
            random.shuffle(opciones)
            return {"question": pregunta, "answers": opciones, "correctAnswer": c_nombre, "knowledgeLevel": 2}
        intentos += 1

    raise Exception("No se pudo generar una pregunta válida de podios sin empates.")


def generar_pregunta_campeon_pilotos():
    anio = random.randint(1980, 2023)

    # Obtener el último raceId del año en standings
    cursor.execute("""
        SELECT MAX(r.raceId)
        FROM driverStandings ds
        JOIN races r ON ds.raceId = r.raceId
        WHERE r.year = %s
    """, (anio,))
    (race_id,) = cursor.fetchone()

    cursor.execute("""
        SELECT d.forename, d.surname
        FROM driverStandings ds
        JOIN drivers d ON ds.driverId = d.driverId
        WHERE ds.raceId = %s AND ds.position = 1
    """, (race_id,))
    nombre, apellido = cursor.fetchone()
    correcta = f"{nombre} {apellido}"
    pregunta = f"¿Qué piloto ganó el campeonato de F1 en {anio}?"
    contemporaneos = obtener_pilotos_entre_anios(anio - 2, anio + 2, correcta)
    opciones = random.sample(contemporaneos, min(3, len(contemporaneos))) + [correcta]
    random.shuffle(opciones)
    return {"question": pregunta, "answers": opciones, "correctAnswer": correcta, "knowledgeLevel": 1}


def generar_pregunta_campeon_constructores():
    anio = random.randint(1980, 2023)

    # Última entrada en constructorStandings del año
    cursor.execute("""
        SELECT MAX(r.raceId)
        FROM constructorStandings cs
        JOIN races r ON cs.raceId = r.raceId
        WHERE r.year = %s
    """, (anio,))
    (race_id,) = cursor.fetchone()

    cursor.execute("""
        SELECT c.name
        FROM constructorStandings cs
        JOIN constructors c ON cs.constructorId = c.constructorId
        WHERE cs.raceId = %s AND cs.position = 1
    """, (race_id,))
    (constructora,) = cursor.fetchone()

    pregunta = f"¿Qué constructor ganó el campeonato de F1 en {anio}?"
    cursor.execute("SELECT name FROM constructors WHERE name != %s ORDER BY RAND() LIMIT 3", (constructora,))
    opciones = [row[0] for row in cursor.fetchall()] + [constructora]
    random.shuffle(opciones)
    return {"question": pregunta, "answers": opciones, "correctAnswer": constructora, "knowledgeLevel": 1}



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
    contemporaneos = obtener_pilotos_entre_anios(year - 2, year + 2, correcta)
    opciones = random.sample(contemporaneos, min(3, len(contemporaneos))) + [correcta]
    random.shuffle(opciones)
    return {"question": pregunta, "answers": opciones, "correctAnswer": correcta, "knowledgeLevel": 1}

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
    contemporaneos = obtener_pilotos_entre_anios(year, year, correcta)
    opciones = random.sample(contemporaneos, min(3, len(contemporaneos))) + [correcta]
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
    contemporaneos = obtener_pilotos_entre_anios(year, year, correcta)
    opciones = random.sample(contemporaneos, min(3, len(contemporaneos))) + [correcta]
    random.shuffle(opciones)
    return {"question": pregunta, "answers": opciones, "correctAnswer": correcta, "knowledgeLevel": 2}


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

def generar_pregunta_constructor_mas_titulos():
    cursor.execute("""
        SELECT c.name, COUNT(DISTINCT r.year) as titulos, MIN(r.year), MAX(r.year)
        FROM constructorStandings cs
        JOIN constructors c ON cs.constructorId = c.constructorId
        JOIN races r ON cs.raceId = r.raceId
        WHERE cs.position = 1
        GROUP BY cs.constructorId
        ORDER BY titulos DESC
        LIMIT 1
    """)
    constructor, _, anio_inicio, anio_fin = cursor.fetchone()
    pregunta = "¿Qué constructor ha ganado más títulos de constructores en F1?"
    contemporaneos = obtener_constructores_entre_anios(anio_inicio, anio_fin, constructor)
    opciones = random.sample(contemporaneos, min(3, len(contemporaneos))) + [constructor]
    random.shuffle(opciones)
    return {
        "question": pregunta,
        "answers": opciones,
        "correctAnswer": constructor,
        "knowledgeLevel": 3
    }

def generar_pregunta_piloto_mas_poles_en_circuito():
    intentos = 0
    while intentos < 5:
        cursor.execute("""
            SELECT c.name
            FROM circuits c
            JOIN races r ON c.circuitId = r.circuitId
            GROUP BY c.name
            HAVING COUNT(*) >= 5
            ORDER BY RAND()
            LIMIT 1
        """)
        result = cursor.fetchone()
        if not result:
            intentos += 1
            continue
        (circuito,) = result

        cursor.execute("""
            SELECT CONCAT(d.forename, ' ', d.surname) AS nombre, COUNT(*) as poles
            FROM qualifying q
            JOIN races r ON q.raceId = r.raceId
            JOIN circuits c ON r.circuitId = c.circuitId
            JOIN drivers d ON q.driverId = d.driverId
            WHERE q.position = 1 AND c.name = %s
            GROUP BY q.driverId
            HAVING poles > 0
        """, (circuito,))
        datos = cursor.fetchall()

        if len(datos) >= 4:
            seleccion = random.sample(datos, 4)
            seleccion.sort(key=lambda x: x[1], reverse=True)
            correcta = seleccion[0]
            if all(correcta[1] > otro[1] for otro in seleccion[1:]):
                correcta_nombre = correcta[0]
                pregunta = f"¿Qué piloto ha conseguido más poles en el circuito {circuito}?"
                opciones = [row[0] for row in seleccion]
                random.shuffle(opciones)
                return {"question": pregunta, "answers": opciones, "correctAnswer": correcta_nombre, "knowledgeLevel": 3}

        intentos += 1
    raise Exception("No se pudo generar una pregunta válida de poles sin empates.")

def generar_pregunta_constructor_mas_victorias_en_circuito():
    cursor.execute("""
        SELECT c.name
        FROM circuits c
        JOIN races r ON c.circuitId = r.circuitId
        GROUP BY c.name
        HAVING COUNT(*) >= 5
        ORDER BY RAND()
        LIMIT 1
    """)
    (circuito,) = cursor.fetchone()
    cursor.execute("""
        SELECT cons.name, COUNT(*) as wins, MIN(r.year), MAX(r.year)
        FROM results res
        JOIN races r ON res.raceId = r.raceId
        JOIN circuits c ON r.circuitId = c.circuitId
        JOIN constructors cons ON res.constructorId = cons.constructorId
        WHERE res.positionOrder = 1 AND c.name = %s
        GROUP BY cons.constructorId
        ORDER BY wins DESC
        LIMIT 1
    """, (circuito,))
    constructora, _, anio_inicio, anio_fin = cursor.fetchone()
    pregunta = f"¿Qué constructor ha ganado más veces en el circuito de {circuito}?"
    contemporaneos = obtener_constructores_entre_anios(anio_inicio, anio_fin, constructora)
    opciones = random.sample(contemporaneos, min(3, len(contemporaneos))) + [constructora]
    random.shuffle(opciones)
    return {"question": pregunta, "answers": opciones, "correctAnswer": constructora, "knowledgeLevel": 2}


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
        SELECT c.name, COUNT(*) as wins, MIN(r.year), MAX(r.year)
        FROM results res
        JOIN races r ON res.raceId = r.raceId
        JOIN constructors c ON res.constructorId = c.constructorId
        JOIN circuits ci ON r.circuitId = ci.circuitId
        WHERE res.positionOrder = 1 AND ci.country = %s
        GROUP BY c.constructorId
        ORDER BY wins DESC
        LIMIT 1
    """, (pais,))
    constructora, _, anio_inicio, anio_fin = cursor.fetchone()
    pregunta = f"¿Qué constructor ha ganado más veces en {pais}?"
    contemporaneos = obtener_constructores_entre_anios(anio_inicio, anio_fin, constructora)
    opciones = random.sample(contemporaneos, min(3, len(contemporaneos))) + [constructora]
    random.shuffle(opciones)
    return {"question": pregunta, "answers": opciones, "correctAnswer": constructora, "knowledgeLevel": 3}

def generar_pregunta_circuito_mas_carreras():
    # Obtener circuitos con al menos 10 carreras
    cursor.execute("""
        SELECT c.name, COUNT(*) as veces
        FROM races r
        JOIN circuits c ON r.circuitId = c.circuitId
        GROUP BY c.name
        HAVING veces >= 10
    """)
    datos = cursor.fetchall()
    if len(datos) < 4:
        raise Exception("No hay suficientes circuitos con carreras para generar la pregunta.")

    intentos = 0
    while intentos < 10:
        seleccion = random.sample(datos, 4)
        seleccion.sort(key=lambda x: x[1], reverse=True)
        correcta = seleccion[0]
        if all(correcta[1] > otro[1] for otro in seleccion[1:]):
            nombre_circuito = correcta[0]
            pregunta = "¿Qué circuito ha sido usado más veces en la historia de la F1?"
            opciones = [row[0] for row in seleccion]
            random.shuffle(opciones)
            return {"question": pregunta, "answers": opciones, "correctAnswer": nombre_circuito, "knowledgeLevel": 2}
        intentos += 1

    raise Exception("No se pudo generar una pregunta válida de circuitos sin empates.")

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
        SELECT d.forename, d.surname, COUNT(*) as wins, MIN(r.year), MAX(r.year)
        FROM results res
        JOIN races r ON res.raceId = r.raceId
        JOIN drivers d ON res.driverId = d.driverId
        JOIN circuits c ON r.circuitId = c.circuitId
        WHERE res.positionOrder = 1 AND c.name = %s
        GROUP BY d.driverId
        ORDER BY wins DESC
        LIMIT 1
    """, (circuito,))
    nombre, apellido, _, anio_inicio, anio_fin = cursor.fetchone()
    correcta = f"{nombre} {apellido}"
    pregunta = f"¿Qué piloto ha ganado más veces en el circuito {circuito}?"
    contemporaneos = obtener_pilotos_entre_anios(anio_inicio, anio_fin, correcta)
    opciones = random.sample(contemporaneos, min(3, len(contemporaneos))) + [correcta]
    random.shuffle(opciones)
    return {"question": pregunta, "answers": opciones, "correctAnswer": correcta, "knowledgeLevel": 3}


generadores = [
    generar_pregunta_piloto_primera_victoria_reciente,
    generar_pregunta_ganador_gp,
    generar_pregunta_escuderia_ganadora,
    generar_pregunta_segundo_gp,
    generar_pregunta_tercero_gp,
    generar_pregunta_piloto_mas_podios_totales,
    generar_pregunta_piloto_mas_poles_en_circuito,
    generar_pregunta_piloto_mas_victorias_en_circuito,
    generar_pregunta_constructor_mas_titulos,
    generar_pregunta_constructor_mas_victorias_en_circuito,
    generar_pregunta_constructor_mas_victorias_en_pais,
    generar_pregunta_circuito_mas_carreras,
    generar_pregunta_campeon_pilotos,
    generar_pregunta_campeon_constructores
]


NUM_PREGUNTAS = 5
while len(preguntas) < NUM_PREGUNTAS:
    generador = random.choice(generadores)
    try:
        preguntas.append(generador())
    except Exception:
        continue

conn.close()
print(json.dumps(preguntas, ensure_ascii=False))
