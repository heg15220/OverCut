# Versión corregida del script generate_questions.py con validaciones mejoradas
# Incluye: corrección de verificación de respuestas, eliminación de duplicados y coherencia de fechas

import mysql.connector
import random
import json
import argparse  # <- AÑADE ESTO AQUÍ


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

#Estadísticas genéricas parte 1
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
    contemporaneos = obtener_pilotos_entre_anios(year - 2, year + 2, correcta)
    opciones = random.sample(contemporaneos, min(3, len(contemporaneos))) + [correcta]
    random.shuffle(opciones)
    return {
            "question": pregunta,
            "answers": opciones,               # <- "answers" en lugar de "options"
            "correctAnswer": correcta,           # <- "correctAnswer" en lugar de "answer"
            "knowledgeLevel": 2,            # nivel conocimiento arbitrario (ejemplo: 2)
            "category": "GenericStats"
        }

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
            return {
                    "question": pregunta,
                    "answers": opciones,               # <- "answers" en lugar de "options"
                    "correctAnswer": c_nombre,           # <- "correctAnswer" en lugar de "answer"
                    "knowledgeLevel": 2,            # nivel conocimiento arbitrario (ejemplo: 2)
                    "category": "GenericStats"
                }
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
    return {
            "question": pregunta,
            "answers": opciones,               # <- "answers" en lugar de "options"
            "correctAnswer": correcta,           # <- "correctAnswer" en lugar de "answer"
            "knowledgeLevel": 1,            # nivel conocimiento arbitrario (ejemplo: 2)
            "category": "GenericStats"
        }


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
    return {
            "question": pregunta,
            "answers": opciones,               # <- "answers" en lugar de "options"
            "correctAnswer": constructora,           # <- "correctAnswer" en lugar de "answer"
            "knowledgeLevel": 1,            # nivel conocimiento arbitrario (ejemplo: 2)
            "category": "GenericStats"
        }



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
    return {
            "question": pregunta,
            "answers": opciones,               # <- "answers" en lugar de "options"
            "correctAnswer": correcta,           # <- "correctAnswer" en lugar de "answer"
            "knowledgeLevel": 1,            # nivel conocimiento arbitrario (ejemplo: 2)
            "category": "GenericStats"
        }

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
    return {
            "question": pregunta,
            "answers": opciones,               # <- "answers" en lugar de "options"
            "correctAnswer": correcta,           # <- "correctAnswer" en lugar de "answer"
            "knowledgeLevel": 2,            # nivel conocimiento arbitrario (ejemplo: 2)
            "category": "GenericStats"
        }

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
    return {
            "question": pregunta,
            "answers": opciones,               # <- "answers" en lugar de "options"
            "correctAnswer": correcta,           # <- "correctAnswer" en lugar de "answer"
            "knowledgeLevel": 2,            # nivel conocimiento arbitrario (ejemplo: 2)
            "category": "GenericStats"
        }


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
    return {
            "question": pregunta,
            "answers": opciones,               # <- "answers" en lugar de "options"
            "correctAnswer": team,           # <- "correctAnswer" en lugar de "answer"
            "knowledgeLevel": 1,            # nivel conocimiento arbitrario (ejemplo: 2)
            "category": "GenericStats"
        }

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
        "knowledgeLevel": 3,
        "category": "GenericStats"
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
                return {"question": pregunta, "answers": opciones, "correctAnswer": correcta_nombre,
                "knowledgeLevel": 3, "category": "GenericStats"}

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
    return {"question": pregunta, "answers": opciones, "correctAnswer": constructora, "knowledgeLevel": 2, "category": "GenericStats"}


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
    return {"question": pregunta, "answers": opciones, "correctAnswer": constructora, "knowledgeLevel": 3, "category": "GenericStats"}

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
            return {"question": pregunta, "answers": opciones, "correctAnswer": nombre_circuito,
             "knowledgeLevel": 2, "category": "GenericStats"}
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
    return {"question": pregunta, "answers": opciones, "correctAnswer": correcta, "knowledgeLevel": 3, "category": "GenericStats"}

# Bloques de funciones implementadas

# **Duelos Legendarios**
def pregunta_rival_de_senna_en_mclaren():
    piloto = "Alain Prost"
    pregunta = "¿Quién fue el gran rival de Ayrton Senna durante su etapa en McLaren?"
    incorrectas = get_respuestas_incorrectas(piloto, pilotos_cache)
    opciones = incorrectas + [piloto]
    random.shuffle(opciones)
    return {
            "question": pregunta,
            "answers": opciones,               # <- "answers" en lugar de "options"
            "correctAnswer": piloto,           # <- "correctAnswer" en lugar de "answer"
            "knowledgeLevel": 2,                # nivel conocimiento arbitrario (ejemplo: 2)
            "category": "Duels"
        }

def pregunta_piloto_perdio_titulo_en_ultima_curva_2008():
    cursor.execute("""
        SELECT d.forename, d.surname
        FROM driverStandings ds
        JOIN races ra ON ds.raceId = ra.raceId
        JOIN drivers d ON ds.driverId = d.driverId
        WHERE ra.year = 2008 AND ra.round = (
            SELECT MAX(round) FROM races WHERE year = 2008
        ) AND ds.position = 2
    """)
    row = cursor.fetchone()
    if not row:
        return None
    piloto = f"{row[0]} {row[1]}"
    pregunta = "¿Qué piloto perdió el campeonato del mundo en la última curva del último GP de 2008?"
    incorrectas = get_respuestas_incorrectas(piloto, pilotos_cache)
    opciones = incorrectas + [piloto]
    random.shuffle(opciones)
    return {
            "question": pregunta,
            "answers": opciones,               # <- "answers" en lugar de "options"
            "correctAnswer": piloto,           # <- "correctAnswer" en lugar de "answer"
            "knowledgeLevel": 2,                # nivel conocimiento arbitrario (ejemplo: 2)
            "category": "Duels"
        }

def pregunta_rival_schumacher_2000():
    cursor.execute("""
        SELECT d.forename, d.surname
        FROM driverStandings ds
        JOIN races ra ON ds.raceId = ra.raceId
        JOIN drivers d ON ds.driverId = d.driverId
        WHERE ra.year = 2000 AND ds.position = 2
        ORDER BY ra.round DESC
        LIMIT 1
    """)
    row = cursor.fetchone()
    if not row:
        return None
    piloto = f"{row[0]} {row[1]}"
    pregunta = "¿Quién fue el principal rival de Michael Schumacher durante su primer título con Ferrari en 2000?"
    incorrectas = get_respuestas_incorrectas(piloto, pilotos_cache)
    opciones = incorrectas + [piloto]
    random.shuffle(opciones)
    return {
            "question": pregunta,
            "answers": opciones,               # <- "answers" en lugar de "options"
            "correctAnswer": piloto,           # <- "correctAnswer" en lugar de "answer"
            "knowledgeLevel": 2,                # nivel conocimiento arbitrario (ejemplo: 2)
            "category": "Duels"
        }

def pregunta_ano_choque_hamilton_rosberg_espana():
    cursor.execute("""
        SELECT ra.year
        FROM races ra
        JOIN circuits c ON ra.circuitId = c.circuitId
        WHERE c.name LIKE '%Barcelona%' OR c.name LIKE '%Catalunya%'
        ORDER BY ra.year
    """)
    years = [row[0] for row in cursor.fetchall()]
    year = 2016 if 2016 in years else max(years)
    pregunta = "¿En qué temporada ocurrió el choque entre Hamilton y Rosberg en el GP de España?"
    opciones = get_respuestas_incorrectas(str(year), [str(y) for y in range(2010, 2021)])
    opciones.append(str(year))
    random.shuffle(opciones)
    return {
            "question": pregunta,
            "answers": opciones,               # <- "answers" en lugar de "options"
            "correctAnswer": str(year),           # <- "correctAnswer" en lugar de "answer"
            "knowledgeLevel": 2,                # nivel conocimiento arbitrario (ejemplo: 2)
            "category": "Duels"
        }

def pregunta_duelo_vettel_canada_2019():
    cursor.execute("""
        SELECT d.forename, d.surname
        FROM races ra
        JOIN results r ON ra.raceId = r.raceId
        JOIN drivers d ON r.driverId = d.driverId
        WHERE ra.year = 2019 AND ra.name LIKE '%Canada%' AND r.position = 1
    """)
    row = cursor.fetchone()
    if not row:
        return None
    piloto = f"{row[0]} {row[1]}"
    pregunta = "¿Quién ganó el polémico duelo con Sebastian Vettel en Canadá 2019 debido a una penalización?"
    incorrectas = get_respuestas_incorrectas(piloto, pilotos_cache)
    opciones = incorrectas + [piloto]
    random.shuffle(opciones)
    return {
            "question": pregunta,
            "answers": opciones,               # <- "answers" en lugar de "options"
            "correctAnswer": piloto,           # <- "correctAnswer" en lugar de "answer"
            "knowledgeLevel": 2,                # nivel conocimiento arbitrario (ejemplo: 2)
            "category": "Duels"
        }

#------------------------------------------------------------------------------------------------------

temporada_objetivo = random.randint(1950, 2023)
# **Temporadas Históricas**
def pregunta_piloto_campeon_temporada(temporada_objetivo):
    cursor.execute("""
        SELECT d.forename, d.surname
        FROM driverStandings ds
        JOIN races ra ON ds.raceId = ra.raceId
        JOIN drivers d ON ds.driverId = d.driverId
        WHERE ra.year = %s AND ds.position = 1
        ORDER BY ra.round DESC
        LIMIT 1
    """, (temporada_objetivo,))
    row = cursor.fetchone()
    if not row:
        return None
    nombre, apellido = row
    piloto = f"{nombre} {apellido}"
    pregunta = f"¿Qué piloto ganó el campeonato de pilotos en la temporada {temporada_objetivo}?"
    incorrectas = get_respuestas_incorrectas(piloto, pilotos_cache)
    opciones = incorrectas + [piloto]
    random.shuffle(opciones)
    return {
            "question": pregunta,
            "answers": opciones,               # <- "answers" en lugar de "options"
            "correctAnswer": piloto,           # <- "correctAnswer" en lugar de "answer"
            "knowledgeLevel": 2,                # nivel conocimiento arbitrario (ejemplo: 2)
            "category": "LegendarySeason"
        }

def pregunta_constructor_campeon_temporada(temporada_objetivo):
    cursor.execute("""
        SELECT c.name
        FROM constructorStandings cs
        JOIN races ra ON cs.raceId = ra.raceId
        JOIN constructors c ON cs.constructorId = c.constructorId
        WHERE ra.year = %s AND cs.position = 1
        ORDER BY ra.round DESC
        LIMIT 1
    """, (temporada_objetivo,))
    row = cursor.fetchone()
    if not row:
        return None
    constructor = row[0]
    pregunta = f"¿Qué escudería ganó el campeonato de constructores en la temporada {temporada_objetivo}?"
    incorrectas = get_respuestas_incorrectas(constructor, constructores_cache)
    opciones = incorrectas + [constructor]
    random.shuffle(opciones)
    return {
            "question": pregunta,
            "answers": opciones,               # <- "answers" en lugar de "options"
            "correctAnswer": constructor,           # <- "correctAnswer" en lugar de "answer"
            "knowledgeLevel": 2,                # nivel conocimiento arbitrario (ejemplo: 2)
            "category": "LegendarySeason"
        }


def pregunta_gp_mas_abandonos_temporada(temporada_objetivo):
    cursor.execute("""
        SELECT ra.name, COUNT(*) as abandonos
        FROM results r
        JOIN races ra ON r.raceId = ra.raceId
        JOIN status s ON r.statusId = s.statusId
        WHERE ra.year = %s AND (
            s.status LIKE '%accident%' OR
            s.status LIKE '%engine%' OR
            s.status LIKE '%gearbox%' OR
            s.status LIKE '%suspension%'
        )
        GROUP BY r.raceId
        ORDER BY abandonos DESC
        LIMIT 1
    """, (temporada_objetivo,))
    row = cursor.fetchone()
    if not row:
        return None
    gp = row[0]
    pregunta = f"¿Cuál fue la carrera con más abandonos en la temporada {temporada_objetivo}?"
    cursor.execute("SELECT DISTINCT name FROM races WHERE year = %s AND name != %s", (temporada_objetivo, gp))
    incorrectas = get_respuestas_incorrectas(gp, [r[0] for r in cursor.fetchall()])
    opciones = incorrectas + [gp]
    random.shuffle(opciones)
    return {
            "question": pregunta,
            "answers": opciones,               # <- "answers" en lugar de "options"
            "correctAnswer": gp,           # <- "correctAnswer" en lugar de "answer"
            "knowledgeLevel": 2,                # nivel conocimiento arbitrario (ejemplo: 2)
            "category": "LegendarySeason"
        }

def pregunta_victorias_campeon_temporada(temporada_objetivo):
    cursor.execute("""
        SELECT d.driverId, d.forename, d.surname
        FROM driverStandings ds
        JOIN races ra ON ds.raceId = ra.raceId
        JOIN drivers d ON ds.driverId = d.driverId
        WHERE ra.year = %s AND ds.position = 1
        ORDER BY ra.round DESC
        LIMIT 1
    """, (temporada_objetivo,))
    piloto = cursor.fetchone()
    if not piloto:
        return None
    driver_id, nombre, apellido = piloto
    cursor.execute("""
        SELECT COUNT(*) FROM results r
        JOIN races ra ON r.raceId = ra.raceId
        WHERE ra.year = %s AND r.driverId = %s AND r.position = 1
    """, (temporada_objetivo, driver_id))
    victorias = cursor.fetchone()[0]
    piloto_nombre = f"{nombre} {apellido}"
    pregunta = f"¿Cuántas victorias logró {piloto_nombre} durante la temporada {temporada_objetivo}?"
    opciones = get_respuestas_incorrectas(str(victorias), [str(i) for i in range(0, 15)])
    opciones.append(str(victorias))
    random.shuffle(opciones)
    return {
            "question": pregunta,
            "answers": opciones,               # <- "answers" en lugar de "options"
            "correctAnswer": str(victorias),           # <- "correctAnswer" en lugar de "answer"
            "knowledgeLevel": 2,                # nivel conocimiento arbitrario (ejemplo: 2)
            "category": "LegendarySeason"
        }

def pregunta_ultimo_gp_temporada(temporada_objetivo):
    cursor.execute("""
        SELECT c.name
        FROM races ra
        JOIN circuits c ON ra.circuitId = c.circuitId
        WHERE ra.year = %s
        ORDER BY ra.round DESC
        LIMIT 1
    """, (temporada_objetivo,))
    row = cursor.fetchone()
    if not row:
        return None
    circuito = row[0]
    pregunta = f"¿En qué circuito se disputó la última carrera de la temporada {temporada_objetivo}?"
    cursor.execute("SELECT name FROM circuits WHERE name != %s", (circuito,))
    incorrectas = get_respuestas_incorrectas(circuito, [r[0] for r in cursor.fetchall()])
    opciones = incorrectas + [circuito]
    random.shuffle(opciones)
    return {
            "question": pregunta,
            "answers": opciones,               # <- "answers" en lugar de "options"
            "correctAnswer": circuito,           # <- "correctAnswer" en lugar de "answer"
            "knowledgeLevel": 2,                # nivel conocimiento arbitrario (ejemplo: 2)
            "category": "LegendarySeason"
        }


def pregunta_piloto_mas_poles_temporada(temporada_objetivo):
    cursor.execute("""
        SELECT d.forename, d.surname, COUNT(*) as poles
        FROM qualifying q
        JOIN races ra ON q.raceId = ra.raceId
        JOIN drivers d ON q.driverId = d.driverId
        WHERE q.position = 1 AND ra.year = %s
        GROUP BY q.driverId
        ORDER BY poles DESC
        LIMIT 1
    """, (temporada_objetivo,))
    row = cursor.fetchone()
    if not row:
        return None
    nombre, apellido, _ = row
    piloto = f"{nombre} {apellido}"
    pregunta = f"¿Qué piloto consiguió más pole positions en la temporada {temporada_objetivo}?"
    incorrectas = get_respuestas_incorrectas(piloto, pilotos_cache)
    opciones = incorrectas + [piloto]
    random.shuffle(opciones)
    return {
            "question": pregunta,
            "answers": opciones,               # <- "answers" en lugar de "options"
            "correctAnswer": piloto,           # <- "correctAnswer" en lugar de "answer"
            "knowledgeLevel": 2,                # nivel conocimiento arbitrario (ejemplo: 2)
            "category": "LegendarySeason"
        }

def pregunta_circuito_mas_vueltas_temporada(temporada_objetivo):
    cursor.execute("""
        SELECT c.name, SUM(r.laps) as total_vueltas
        FROM results r
        JOIN races ra ON r.raceId = ra.raceId
        JOIN circuits c ON ra.circuitId = c.circuitId
        WHERE ra.year = %s
        GROUP BY ra.circuitId
        ORDER BY total_vueltas DESC
        LIMIT 1
    """, (temporada_objetivo,))
    row = cursor.fetchone()
    if not row:
        return None
    circuito = row[0]
    pregunta = f"¿Qué circuito tuvo el mayor número de vueltas disputadas durante la temporada {temporada_objetivo}?"
    cursor.execute("SELECT name FROM circuits WHERE name != %s", (circuito,))
    incorrectas = get_respuestas_incorrectas(circuito, [r[0] for r in cursor.fetchall()])
    opciones = incorrectas + [circuito]
    random.shuffle(opciones)
    return {
            "question": pregunta,
            "answers": opciones,               # <- "answers" en lugar de "options"
            "correctAnswer": circuito,           # <- "correctAnswer" en lugar de "answer"
            "knowledgeLevel": 2,                # nivel conocimiento arbitrario (ejemplo: 2)
            "category": "LegendarySeason"
        }

def pregunta_escuderia_mas_abandonos_temporada(temporada_objetivo):
    cursor.execute("""
        SELECT cs.name, COUNT(*) as abandonos
        FROM results r
        JOIN races ra ON r.raceId = ra.raceId
        JOIN status s ON r.statusId = s.statusId
        JOIN constructors cs ON r.constructorId = cs.constructorId
        WHERE ra.year = %s AND (
            s.status LIKE '%accident%' OR
            s.status LIKE '%engine%' OR
            s.status LIKE '%gearbox%' OR
            s.status LIKE '%electrical%'
        )
        GROUP BY cs.constructorId
        ORDER BY abandonos DESC
        LIMIT 1
    """, (temporada_objetivo,))
    row = cursor.fetchone()
    if not row:
        return None
    constructor = row[0]
    pregunta = f"¿Qué escudería tuvo más abandonos en la temporada {temporada_objetivo}?"
    incorrectas = get_respuestas_incorrectas(constructor, constructores_cache)
    opciones = incorrectas + [constructor]
    random.shuffle(opciones)
    return {
            "question": pregunta,
            "answers": opciones,               # <- "answers" en lugar de "options"
            "correctAnswer": constructor,           # <- "correctAnswer" en lugar de "answer"
            "knowledgeLevel": 2,                # nivel conocimiento arbitrario (ejemplo: 2)
            "category": "LegendarySeason"
        }

def pregunta_cuantos_pilotos_ganaron_temporada(temporada_objetivo):
    cursor.execute("""
        SELECT COUNT(DISTINCT r.driverId)
        FROM results r
        JOIN races ra ON r.raceId = ra.raceId
        WHERE ra.year = %s AND r.position = 1
    """, (temporada_objetivo,))
    row = cursor.fetchone()
    if not row:
        return None
    total = row[0]
    pregunta = f"¿Cuántos pilotos distintos ganaron al menos una carrera durante la temporada {temporada_objetivo}?"
    opciones = get_respuestas_incorrectas(str(total), [str(i) for i in range(0, 15)])
    opciones.append(str(total))
    random.shuffle(opciones)
    return {
            "question": pregunta,
            "answers": opciones,               # <- "answers" en lugar de "options"
            "correctAnswer": str(total),           # <- "correctAnswer" en lugar de "answer"
            "knowledgeLevel": 2,                # nivel conocimiento arbitrario (ejemplo: 2)
            "category": "LegendarySeason"
        }

def pregunta_piloto_mas_puntos_sin_ganar_temporada(temporada_objetivo):
    cursor.execute("""
        SELECT d.forename, d.surname, SUM(r.points) as puntos
        FROM results r
        JOIN races ra ON r.raceId = ra.raceId
        JOIN drivers d ON r.driverId = d.driverId
        WHERE ra.year = %s AND r.driverId NOT IN (
            SELECT driverId
            FROM results r2
            JOIN races ra2 ON r2.raceId = ra2.raceId
            WHERE ra2.year = %s AND r2.position = 1
        )
        GROUP BY r.driverId
        ORDER BY puntos DESC
        LIMIT 1
    """, (temporada_objetivo, temporada_objetivo))
    row = cursor.fetchone()
    if not row:
        return None
    nombre, apellido, _ = row
    piloto = f"{nombre} {apellido}"
    pregunta = f"¿Qué piloto sumó más puntos sin ganar ninguna carrera en la temporada {temporada_objetivo}?"
    incorrectas = get_respuestas_incorrectas(piloto, pilotos_cache)
    opciones = incorrectas + [piloto]
    random.shuffle(opciones)
    return {
            "question": pregunta,
            "answers": opciones,               # <- "answers" en lugar de "options"
            "correctAnswer": piloto,           # <- "correctAnswer" en lugar de "answer"
            "knowledgeLevel": 2,                # nivel conocimiento arbitrario (ejemplo: 2)
            "category": "LegendarySeason"
        }


# Wrappers para las preguntas de Temporadas Históricas
def pregunta_piloto_campeon_temporada_wrapper():
    return pregunta_piloto_campeon_temporada(temporada_objetivo)

def pregunta_constructor_campeon_temporada_wrapper():
    return pregunta_constructor_campeon_temporada(temporada_objetivo)

def pregunta_gp_mas_abandonos_temporada_wrapper():
    return pregunta_gp_mas_abandonos_temporada(temporada_objetivo)

def pregunta_victorias_campeon_temporada_wrapper():
    return pregunta_victorias_campeon_temporada(temporada_objetivo)

def pregunta_ultimo_gp_temporada_wrapper():
    return pregunta_ultimo_gp_temporada(temporada_objetivo)

def pregunta_piloto_mas_poles_temporada_wrapper():
    return pregunta_piloto_mas_poles_temporada(temporada_objetivo)

def pregunta_circuito_mas_vueltas_temporada_wrapper():
    return pregunta_circuito_mas_vueltas_temporada(temporada_objetivo)

def pregunta_escuderia_mas_abandonos_temporada_wrapper():
    return pregunta_escuderia_mas_abandonos_temporada(temporada_objetivo)

def pregunta_cuantos_pilotos_ganaron_temporada_wrapper():
    return pregunta_cuantos_pilotos_ganaron_temporada(temporada_objetivo)

def pregunta_piloto_mas_puntos_sin_ganar_temporada_wrapper():
    return pregunta_piloto_mas_puntos_sin_ganar_temporada(temporada_objetivo)

#------------------------------------------------------------------------------------------------------------------
# **Preguntas sobre escudería en concreto**

def pregunta_piloto_mas_victorias_escuderia():
    cursor.execute("SELECT name FROM constructors ORDER BY RAND() LIMIT 1")
    row = cursor.fetchone()
    if not row:
        return None
    escuderia_objetivo = row[0]

    cursor.execute("""
        SELECT d.forename, d.surname, COUNT(*) as wins
        FROM results r
        JOIN drivers d ON r.driverId = d.driverId
        JOIN constructors c ON r.constructorId = c.constructorId
        WHERE r.position = 1 AND c.name = %s
        GROUP BY d.driverId
        ORDER BY wins DESC
        LIMIT 1
    """, (escuderia_objetivo,))
    row = cursor.fetchone()
    if not row:
        return None
    nombre, apellido, _ = row
    piloto = f"{nombre} {apellido}"
    pregunta = f"¿Qué piloto logró más victorias para la escudería {escuderia_objetivo}?"
    incorrectas = get_respuestas_incorrectas(piloto, pilotos_cache)
    opciones = incorrectas + [piloto]
    random.shuffle(opciones)
    return {
            "question": pregunta,
            "answers": opciones,               # <- "answers" en lugar de "options"
            "correctAnswer": piloto,           # <- "correctAnswer" en lugar de "answer"
            "knowledgeLevel": 2,                # nivel conocimiento arbitrario (ejemplo: 2)
            "category": "Team"
        }


def pregunta_temporada_mas_puntos_escuderia():
    cursor.execute("SELECT name FROM constructors ORDER BY RAND() LIMIT 1")
    row = cursor.fetchone()
    if not row:
        return None
    escuderia_objetivo = row[0]

    cursor.execute("""
        SELECT ra.year, SUM(r.points) as total
        FROM results r
        JOIN races ra ON r.raceId = ra.raceId
        JOIN constructors c ON r.constructorId = c.constructorId
        WHERE c.name = %s
        GROUP BY ra.year
        ORDER BY total DESC
        LIMIT 1
    """, (escuderia_objetivo,))
    row = cursor.fetchone()
    if not row:
        return None
    anio, _ = row
    pregunta = f"¿En qué temporada consiguió más puntos la escudería {escuderia_objetivo}?"
    opciones = get_respuestas_incorrectas(str(anio), [str(y) for y in range(1950, 2024)])
    opciones.append(str(anio))
    random.shuffle(opciones)
    return {
            "question": pregunta,
            "answers": opciones,               # <- "answers" en lugar de "options"
            "correctAnswer": str(anio),           # <- "correctAnswer" en lugar de "answer"
            "knowledgeLevel": 2,                # nivel conocimiento arbitrario (ejemplo: 2)
            "category": "Team"
        }


def pregunta_poles_totales_escuderia():
    cursor.execute("SELECT name FROM constructors ORDER BY RAND() LIMIT 1")
    row = cursor.fetchone()
    if not row:
        return None
    escuderia_objetivo = row[0]

    cursor.execute("""
        SELECT COUNT(*)
        FROM qualifying q
        JOIN constructors c ON q.constructorId = c.constructorId
        WHERE q.position = 1 AND c.name = %s
    """, (escuderia_objetivo,))
    row = cursor.fetchone()
    if not row:
        return None
    total_poles = row[0]
    pregunta = f"¿Cuántas pole positions logró la escudería {escuderia_objetivo} en su historia?"
    opciones = get_respuestas_incorrectas(str(total_poles), [str(i) for i in range(0, 250)])
    opciones.append(str(total_poles))
    random.shuffle(opciones)
    return {
            "question": pregunta,
            "answers": opciones,               # <- "answers" en lugar de "options"
            "correctAnswer": str(total_poles),           # <- "correctAnswer" en lugar de "answer"
            "knowledgeLevel": 2,                # nivel conocimiento arbitrario (ejemplo: 2)
            "category": "Team"
        }


def pregunta_circuito_mas_victorias_escuderia():
    cursor.execute("SELECT name FROM constructors ORDER BY RAND() LIMIT 1")
    row = cursor.fetchone()
    if not row:
        return None
    escuderia_objetivo = row[0]

    cursor.execute("""
        SELECT c.name, COUNT(*) as wins
        FROM results r
        JOIN races ra ON r.raceId = ra.raceId
        JOIN circuits c ON ra.circuitId = c.circuitId
        JOIN constructors co ON r.constructorId = co.constructorId
        WHERE r.position = 1 AND co.name = %s
        GROUP BY c.circuitId
        ORDER BY wins DESC
        LIMIT 1
    """, (escuderia_objetivo,))
    row = cursor.fetchone()
    if not row:
        return None
    circuito = row[0]
    pregunta = f"¿En qué circuito logró más victorias la escudería {escuderia_objetivo}?"
    incorrectas = get_respuestas_incorrectas(circuito, [r[0] for r in cursor.execute("SELECT name FROM circuits WHERE name != %s", (circuito,)) or []])
    opciones = incorrectas + [circuito]
    random.shuffle(opciones)
    return {
            "question": pregunta,
            "answers": opciones,               # <- "answers" en lugar de "options"
            "correctAnswer": circuito,           # <- "correctAnswer" en lugar de "answer"
            "knowledgeLevel": 2,                # nivel conocimiento arbitrario (ejemplo: 2)
            "category": "Team"
        }


def pregunta_campeonatos_constructores_escuderia():
    cursor.execute("SELECT name FROM constructors ORDER BY RAND() LIMIT 1")
    row = cursor.fetchone()
    if not row:
        return None
    escuderia_objetivo = row[0]

    cursor.execute("""
        SELECT COUNT(DISTINCT ra.year)
        FROM constructorStandings cs
        JOIN races ra ON cs.raceId = ra.raceId
        JOIN constructors c ON cs.constructorId = c.constructorId
        WHERE cs.position = 1 AND c.name = %s
    """, (escuderia_objetivo,))
    row = cursor.fetchone()
    if not row:
        return None
    total = row[0]
    pregunta = f"¿Cuántas veces ganó el campeonato de constructores la escudería {escuderia_objetivo}?"
    opciones = get_respuestas_incorrectas(str(total), [str(i) for i in range(0, 20)])
    opciones.append(str(total))
    random.shuffle(opciones)
    return {
            "question": pregunta,
            "answers": opciones,               # <- "answers" en lugar de "options"
            "correctAnswer": str(total),           # <- "correctAnswer" en lugar de "answer"
            "knowledgeLevel": 1,                # nivel conocimiento arbitrario (ejemplo: 2)
            "category": "Team"
        }

def pregunta_piloto_mas_abandonos_escuderia():
    cursor.execute("SELECT name FROM constructors ORDER BY RAND() LIMIT 1")
    row = cursor.fetchone()
    if not row:
        return None
    escuderia_objetivo = row[0]

    cursor.execute("""
        SELECT d.forename, d.surname, COUNT(*) as abandonos
        FROM results r
        JOIN drivers d ON r.driverId = d.driverId
        JOIN constructors c ON r.constructorId = c.constructorId
        JOIN status s ON r.statusId = s.statusId
        WHERE c.name = %s AND (
            s.status LIKE '%accident%' OR
            s.status LIKE '%engine%' OR
            s.status LIKE '%gearbox%' OR
            s.status LIKE '%electrical%'
        )
        GROUP BY d.driverId
        ORDER BY abandonos DESC
        LIMIT 1
    """, (escuderia_objetivo,))
    row = cursor.fetchone()
    if not row:
        return None
    piloto = f"{row[0]} {row[1]}"
    pregunta = f"¿Qué piloto abandonó más veces con la escudería {escuderia_objetivo}?"
    incorrectas = get_respuestas_incorrectas(piloto, pilotos_cache)
    opciones = incorrectas + [piloto]
    random.shuffle(opciones)
    return {
            "question": pregunta,
            "answers": opciones,               # <- "answers" en lugar de "options"
            "correctAnswer": piloto,           # <- "correctAnswer" en lugar de "answer"
            "knowledgeLevel": 2,                # nivel conocimiento arbitrario (ejemplo: 2)
            "category": "Team"
        }

def pregunta_peor_temporada_puntos_escuderia():
    cursor.execute("SELECT name FROM constructors ORDER BY RAND() LIMIT 1")
    row = cursor.fetchone()
    if not row:
        return None
    escuderia_objetivo = row[0]

    cursor.execute("""
        SELECT ra.year, SUM(r.points) as total_puntos
        FROM results r
        JOIN races ra ON r.raceId = ra.raceId
        JOIN constructors c ON r.constructorId = c.constructorId
        WHERE c.name = %s
        GROUP BY ra.year
        ORDER BY total_puntos ASC
        LIMIT 1
    """, (escuderia_objetivo,))
    row = cursor.fetchone()
    if not row:
        return None
    year = row[0]
    pregunta = f"¿Cuál fue la peor temporada en puntos para la escudería {escuderia_objetivo}?"
    opciones = get_respuestas_incorrectas(str(year), [str(y) for y in range(1950, 2024)])
    opciones.append(str(year))
    random.shuffle(opciones)
    return {"question": pregunta, "options": opciones, "answer": str(year), "knowledgeLevel": 2, "category": "Team"}



def obtener_escuderia_aleatoria():
    cursor.execute("SELECT name FROM constructors ORDER BY RAND() LIMIT 1")
    escuderia = cursor.fetchone()
    return escuderia[0] if escuderia else None

escuderia = obtener_escuderia_aleatoria()

# Funciones Wrapped
def pregunta_piloto_mas_victorias_escuderia_wrapper():
    return pregunta_piloto_mas_victorias_escuderia()

def pregunta_temporada_mas_puntos_escuderia_wrapper():
    return pregunta_temporada_mas_puntos_escuderia()

def pregunta_poles_totales_escuderia_wrapper():
    return pregunta_poles_totales_escuderia()

def pregunta_circuito_mas_victorias_escuderia_wrapper():
    return pregunta_circuito_mas_victorias_escuderia()

def pregunta_campeonatos_constructores_escuderia_wrapper():
    return pregunta_campeonatos_constructores_escuderia()

def pregunta_piloto_mas_abandonos_escuderia_wrapped():
    return pregunta_piloto_mas_abandonos_escuderia()

def pregunta_peor_temporada_puntos_escuderia_wrapped():
    return pregunta_peor_temporada_puntos_escuderia()


def obtener_circuito_aleatorio():
    cursor.execute("""
        SELECT name
        FROM circuits
        ORDER BY RAND()
        LIMIT 1
    """)
    row = cursor.fetchone()
    if not row:
        return None
    circuito = row[0]
    return circuito

pista = obtener_circuito_aleatorio()


#------------------------------------------------------------------------------------------------------------------
# Preguntas sobre un circuito
def pregunta_constructor_mas_abandonos_circuito():
    cursor.execute("SELECT name FROM circuits ORDER BY RAND() LIMIT 1")
    row = cursor.fetchone()
    if not row:
        return None
    circuito_objetivo = row[0]
    cursor.execute("""
        SELECT cs.name, COUNT(*) as abandonos
        FROM results r
        JOIN races ra ON r.raceId = ra.raceId
        JOIN circuits c ON ra.circuitId = c.circuitId
        JOIN constructors cs ON r.constructorId = cs.constructorId
        JOIN status s ON r.statusId = s.statusId
        WHERE c.name = %s
        AND (
            s.status LIKE '%accident%' OR
            s.status LIKE '%engine%' OR
            s.status LIKE '%gearbox%' OR
            s.status LIKE '%electrical%'
        )
        GROUP BY r.constructorId
        ORDER BY abandonos DESC
        LIMIT 1
    """, (circuito_objetivo,))
    row = cursor.fetchone()
    if not row:
        return None
    constructor = row[0]
    pregunta = f"¿Qué escudería tuvo más abandonos en el circuito de {circuito_objetivo}?"
    incorrectas = get_respuestas_incorrectas(constructor, constructores_cache)
    opciones = incorrectas + [constructor]
    random.shuffle(opciones)
    return {
            "question": pregunta,
            "answers": opciones,               # <- "answers" en lugar de "options"
            "correctAnswer": constructor,           # <- "correctAnswer" en lugar de "answer"
            "knowledgeLevel": 2,                # nivel conocimiento arbitrario (ejemplo: 2)
            "category": "Circuit"
        }

def pregunta_piloto_mas_poles_sin_ganar_circuito():
    cursor.execute("SELECT name FROM circuits ORDER BY RAND() LIMIT 1")
    row = cursor.fetchone()
    if not row:
        return None
    circuito_objetivo = row[0]
    cursor.execute("""
        SELECT d.forename, d.surname, COUNT(*) as poles
        FROM qualifying q
        JOIN races ra ON q.raceId = ra.raceId
        JOIN circuits c ON ra.circuitId = c.circuitId
        JOIN drivers d ON q.driverId = d.driverId
        WHERE q.position = 1 AND c.name = %s
        AND q.driverId NOT IN (
            SELECT r.driverId
            FROM results r
            JOIN races ra2 ON r.raceId = ra2.raceId
            JOIN circuits c2 ON ra2.circuitId = c2.circuitId
            WHERE r.position = 1 AND c2.name = %s
        )
        GROUP BY q.driverId
        ORDER BY poles DESC
        LIMIT 1
    """, (circuito_objetivo, circuito_objetivo))
    row = cursor.fetchone()
    if not row:
        return None
    nombre, apellido, _ = row
    piloto = f"{nombre} {apellido}"
    pregunta = f"¿Qué piloto logró más poles sin ganar nunca en el circuito de {circuito_objetivo}?"
    incorrectas = get_respuestas_incorrectas(piloto, pilotos_cache)
    opciones = incorrectas + [piloto]
    random.shuffle(opciones)
    return {
            "question": pregunta,
            "answers": opciones,               # <- "answers" en lugar de "options"
            "correctAnswer": piloto,           # <- "correctAnswer" en lugar de "answer"
            "knowledgeLevel": 2,                # nivel conocimiento arbitrario (ejemplo: 2)
            "category": "Circuit"
        }


def pregunta_anio_mas_cambios_lider():
    cursor.execute("SELECT name FROM circuits ORDER BY RAND() LIMIT 1")
    row = cursor.fetchone()
    if not row:
        return None
    circuito_objetivo = row[0]
    cursor.execute("""
        SELECT ra.year, COUNT(DISTINCT l.driverId) as cambios
        FROM lapTimes l
        JOIN races ra ON l.raceId = ra.raceId
        JOIN circuits c ON ra.circuitId = c.circuitId
        WHERE l.position = 1 AND c.name = %s
        GROUP BY ra.year
        ORDER BY cambios DESC
        LIMIT 1
    """, (circuito_objetivo,))
    row = cursor.fetchone()
    if not row:
        return None
    year = row[0]
    pregunta = f"¿En qué año hubo más cambios de líder en el circuito de {circuito_objetivo}?"
    opciones = get_respuestas_incorrectas(str(year), [str(y) for y in range(1980, 2024)])
    opciones.append(str(year))
    random.shuffle(opciones)
    return {
            "question": pregunta,
            "answers": opciones,               # <- "answers" en lugar de "options"
            "correctAnswer": str(year),           # <- "correctAnswer" en lugar de "answer"
            "knowledgeLevel": 2,                # nivel conocimiento arbitrario (ejemplo: 2)
            "category": "Circuit"
        }


def pregunta_anio_mas_abandonos_circuito():
    cursor.execute("SELECT name FROM circuits ORDER BY RAND() LIMIT 1")
    row = cursor.fetchone()
    if not row:
        return None
    circuito_objetivo = row[0]
    cursor.execute("""
        SELECT ra.year, COUNT(*) as abandonos
        FROM results r
        JOIN races ra ON r.raceId = ra.raceId
        JOIN circuits c ON ra.circuitId = c.circuitId
        JOIN status s ON r.statusId = s.statusId
        WHERE c.name = %s AND (
            s.status LIKE '%accident%' OR
            s.status LIKE '%engine%' OR
            s.status LIKE '%gearbox%' OR
            s.status LIKE '%suspension%' OR
            s.status LIKE '%electrical%'
        )
        GROUP BY ra.year
        ORDER BY abandonos DESC
        LIMIT 1
    """, (circuito_objetivo,))
    row = cursor.fetchone()
    if not row:
        return None
    year = row[0]
    pregunta = f"¿Qué año tuvo más abandonos en el circuito de {circuito_objetivo}, indicando una carrera especialmente caótica?"
    opciones = get_respuestas_incorrectas(str(year), [str(y) for y in range(1980, 2024)])
    opciones.append(str(year))
    random.shuffle(opciones)
    return {
            "question": pregunta,
            "answers": opciones,               # <- "answers" en lugar de "options"
            "correctAnswer": str(year),           # <- "correctAnswer" en lugar de "answer"
            "knowledgeLevel": 2,                # nivel conocimiento arbitrario (ejemplo: 2)
            "category": "Circuit"
        }


def pregunta_piloto_pole_y_vuelta_rapida_misma_edicion():
    cursor.execute("SELECT name FROM circuits ORDER BY RAND() LIMIT 1")
    row = cursor.fetchone()
    if not row:
        return None
    circuito_objetivo = row[0]
    cursor.execute("""
        SELECT d.forename, d.surname
        FROM qualifying q
        JOIN lapTimes l ON q.raceId = l.raceId AND q.driverId = l.driverId
        JOIN races ra ON q.raceId = ra.raceId
        JOIN circuits c ON ra.circuitId = c.circuitId
        JOIN drivers d ON q.driverId = d.driverId
        WHERE q.position = 1 AND l.rank = 1 AND c.name = %s
        GROUP BY q.driverId
        ORDER BY COUNT(*) DESC
        LIMIT 1
    """, (circuito_objetivo,))
    row = cursor.fetchone()
    if not row:
        return None
    nombre, apellido = row
    piloto = f"{nombre} {apellido}"
    pregunta = f"¿Qué piloto logró la pole y la vuelta rápida en una misma edición en el circuito de {circuito_objetivo}?"
    incorrectas = get_respuestas_incorrectas(piloto, pilotos_cache)
    opciones = incorrectas + [piloto]
    random.shuffle(opciones)
    return {
            "question": pregunta,
            "answers": opciones,               # <- "answers" en lugar de "options"
            "correctAnswer": piloto,           # <- "correctAnswer" en lugar de "answer"
            "knowledgeLevel": 2,                # nivel conocimiento arbitrario (ejemplo: 2)
            "category": "Circuit"
        }

def pregunta_constructor_mas_abandonos_circuito_wrapped():
    return pregunta_constructor_mas_abandonos_circuito()


def pregunta_piloto_mas_poles_sin_ganar_circuito_wrapped():
    return pregunta_piloto_mas_poles_sin_ganar_circuito()

def pregunta_anio_mas_cambios_lider_wrapped():
    return pregunta_anio_mas_cambios_lider()


def pregunta_anio_mas_abandonos_circuito_wrapped():
    return pregunta_anio_mas_abandonos_circuito()


def pregunta_piloto_pole_y_vuelta_rapida_misma_edicion_wrapped():
    return pregunta_piloto_pole_y_vuelta_rapida_misma_edicion()


def pregunta_anio_velocidad_promedio_mas_alta():
    cursor.execute("SELECT name FROM circuits ORDER BY RAND() LIMIT 1")
    row = cursor.fetchone()
    if not row:
        return None
    circuito_objetivo = row[0]
    cursor.execute("""
        SELECT ra.year, AVG(r.milliseconds / r.laps) as avg_lap_time
        FROM results r
        JOIN races ra ON r.raceId = ra.raceId
        JOIN circuits c ON ra.circuitId = c.circuitId
        WHERE c.name = %s AND r.laps > 0 AND r.milliseconds IS NOT NULL
        GROUP BY ra.year
        ORDER BY avg_lap_time ASC
        LIMIT 1
    """, (circuito_objetivo,))
    row = cursor.fetchone()
    if not row:
        return None
    year = row[0]
    pregunta = f"¿En qué año se alcanzó la mayor velocidad promedio en el circuito de {circuito_objetivo}?"
    opciones = get_respuestas_incorrectas(str(year), [str(y) for y in range(1950, 2024)])
    opciones.append(str(year))
    random.shuffle(opciones)
    return {
            "question": pregunta,
            "answers": opciones,               # <- "answers" en lugar de "options"
            "correctAnswer": str(year),           # <- "correctAnswer" en lugar de "answer"
            "knowledgeLevel": 2,                # nivel conocimiento arbitrario (ejemplo: 2)
            "category": "Circuit"
        }


def pregunta_pais_circuito():
    cursor.execute("SELECT name FROM circuits ORDER BY RAND() LIMIT 1")
    row = cursor.fetchone()
    if not row:
        return None
    circuito_objetivo = row[0]
    cursor.execute("""
        SELECT country FROM circuits WHERE name = %s
    """, (circuito_objetivo,))
    row = cursor.fetchone()
    if not row:
        return None
    pais = row[0]
    pregunta = f"¿En qué país se encuentra el circuito de {circuito_objetivo}?"
    incorrectas = get_respuestas_incorrectas(pais, paises_cache)
    opciones = incorrectas + [pais]
    random.shuffle(opciones)
    return {
            "question": pregunta,
            "answers": opciones,               # <- "answers" en lugar de "options"
            "correctAnswer": pais,           # <- "correctAnswer" en lugar de "answer"
            "knowledgeLevel": 2,                # nivel conocimiento arbitrario (ejemplo: 2)
            "category": "Circuit"
        }


def pregunta_anio_cancelado_del_calendario():
    cursor.execute("SELECT name FROM circuits ORDER BY RAND() LIMIT 1")
    row = cursor.fetchone()
    if not row:
        return None
    circuito_objetivo = row[0]
    cursor.execute("""
        SELECT ra.year
        FROM races ra
        JOIN circuits c ON ra.circuitId = c.circuitId
        WHERE c.name = %s
        GROUP BY ra.year
        ORDER BY ra.year
    """, (circuito_objetivo,))
    years = [r[0] for r in cursor.fetchall()]
    if not years:
        return None
    gaps = []
    for i in range(1, len(years)):
        if years[i] != years[i-1] + 1:
            gaps.append(years[i-1] + 1)
    if not gaps:
        return None
    cancelado = gaps[0]
    pregunta = f"¿En qué año no se celebró el Gran Premio en {circuito_objetivo} aunque formaba parte del calendario en años cercanos?"
    opciones = get_respuestas_incorrectas(str(cancelado), [str(y) for y in range(1950, 2024)])
    opciones.append(str(cancelado))
    random.shuffle(opciones)
    return {
            "question": pregunta,
            "answers": opciones,               # <- "answers" en lugar de "options"
            "correctAnswer": str(cancelado),           # <- "correctAnswer" en lugar de "answer"
            "knowledgeLevel": 2,                # nivel conocimiento arbitrario (ejemplo: 2)
            "category": "Circuit"
        }


def pregunta_piloto_fue_campeon_en_ese_circuito():
    cursor.execute("SELECT name FROM circuits ORDER BY RAND() LIMIT 1")
    row = cursor.fetchone()
    if not row:
        return None
    circuito_objetivo = row[0]
    cursor.execute("""
        SELECT d.forename, d.surname, COUNT(*) as veces
        FROM driverStandings ds
        JOIN races ra ON ds.raceId = ra.raceId
        JOIN circuits c ON ra.circuitId = c.circuitId
        JOIN drivers d ON ds.driverId = d.driverId
        WHERE ds.position = 1 AND c.name = %s
        GROUP BY ds.driverId
        ORDER BY veces DESC
        LIMIT 1
    """, (circuito_objetivo,))
    row = cursor.fetchone()
    if not row:
        return None
    nombre, apellido, _ = row
    piloto = f"{nombre} {apellido}"
    pregunta = f"¿Qué piloto se proclamó campeón del mundo en el circuito de {circuito_objetivo} más de una vez?"
    incorrectas = get_respuestas_incorrectas(piloto, pilotos_cache)
    opciones = incorrectas + [piloto]
    random.shuffle(opciones)
    return {
            "question": pregunta,
            "answers": opciones,               # <- "answers" en lugar de "options"
            "correctAnswer": piloto,           # <- "correctAnswer" en lugar de "answer"
            "knowledgeLevel": 2,                # nivel conocimiento arbitrario (ejemplo: 2)
            "category": "Circuit"
        }


def pregunta_gp_con_mas_campeones_en_circuito():
    cursor.execute("SELECT name FROM circuits ORDER BY RAND() LIMIT 1")
    row = cursor.fetchone()
    if not row:
        return None
    circuito_objetivo = row[0]
    cursor.execute("""
        SELECT ra.year, COUNT(DISTINCT d.driverId) as campeones
        FROM races ra
        JOIN circuits c ON ra.circuitId = c.circuitId
        JOIN results r ON ra.raceId = r.raceId
        JOIN drivers d ON r.driverId = d.driverId
        WHERE c.name = %s AND d.driverId IN (
            SELECT driverId FROM driverStandings WHERE position = 1
        )
        GROUP BY ra.year
        ORDER BY campeones DESC
        LIMIT 1
    """, (circuito_objetivo,))
    row = cursor.fetchone()
    if not row:
        return None
    year = row[0]
    pregunta = f"¿En qué edición del GP de {circuito_objetivo} compitieron más campeones del mundo al mismo tiempo?"
    opciones = get_respuestas_incorrectas(str(year), [str(y) for y in range(1980, 2024)])
    opciones.append(str(year))
    random.shuffle(opciones)
    return {
            "question": pregunta,
            "answers": opciones,               # <- "answers" en lugar de "options"
            "correctAnswer": str(year),           # <- "correctAnswer" en lugar de "answer"
            "knowledgeLevel": 2,                # nivel conocimiento arbitrario (ejemplo: 2)
            "category": "Circuit"
        }

def pregunta_anio_velocidad_promedio_mas_alta_wrapped():
    return pregunta_anio_velocidad_promedio_mas_alta()


def pregunta_pais_circuito_wrapped():
    return pregunta_pais_circuito()

def pregunta_anio_cancelado_del_calendario_wrapped():
    return pregunta_anio_cancelado_del_calendario()


def pregunta_piloto_fue_campeon_en_ese_circuito_wrapped():
    return pregunta_piloto_fue_campeon_en_ese_circuito()


def pregunta_gp_con_mas_campeones_en_circuito_wrapped():
    return pregunta_gp_con_mas_campeones_en_circuito()

def pregunta_piloto_mas_victorias_circuito():
    cursor.execute("SELECT name FROM circuits ORDER BY RAND() LIMIT 1")
    row = cursor.fetchone()
    if not row:
        return None
    circuito_objetivo = row[0]
    cursor.execute("""
        SELECT d.forename, d.surname, COUNT(*) as victorias
        FROM results r
        JOIN races ra ON r.raceId = ra.raceId
        JOIN circuits c ON ra.circuitId = c.circuitId
        JOIN drivers d ON r.driverId = d.driverId
        WHERE c.name = %s AND r.position = 1
        GROUP BY r.driverId
        ORDER BY victorias DESC
        LIMIT 1
    """, (circuito_objetivo,))
    row = cursor.fetchone()
    if not row:
        return None
    piloto = f"{row[0]} {row[1]}"
    pregunta = f"¿Qué piloto ha ganado más veces en el circuito de {circuito_objetivo}?"
    incorrectas = get_respuestas_incorrectas(piloto, pilotos_cache)
    opciones = incorrectas + [piloto]
    random.shuffle(opciones)
    return {
            "question": pregunta,
            "answers": opciones,               # <- "answers" en lugar de "options"
            "correctAnswer": piloto,           # <- "correctAnswer" en lugar de "answer"
            "knowledgeLevel": 2,                # nivel conocimiento arbitrario (ejemplo: 2)
            "category": "Circuit"
        }


def pregunta_constructor_mas_poles_circuito():
    cursor.execute("SELECT name FROM circuits ORDER BY RAND() LIMIT 1")
    row = cursor.fetchone()
    if not row:
        return None
    circuito_objetivo = row[0]

    cursor.execute("""
        SELECT cs.name, COUNT(*) as poles
        FROM qualifying q
        JOIN races ra ON q.raceId = ra.raceId
        JOIN circuits c ON ra.circuitId = c.circuitId
        JOIN constructors cs ON q.constructorId = cs.constructorId
        WHERE c.name = %s AND q.position = 1
        GROUP BY q.constructorId
        ORDER BY poles DESC
        LIMIT 1
    """, (circuito_objetivo,))
    row = cursor.fetchone()
    if not row:
        return None
    constructor = row[0]
    pregunta = f"¿Qué constructor logró más poles en el circuito de {circuito_objetivo}?"
    incorrectas = get_respuestas_incorrectas(constructor, constructores_cache)
    opciones = incorrectas + [constructor]
    random.shuffle(opciones)
    return {
            "question": pregunta,
            "answers": opciones,               # <- "answers" en lugar de "options"
            "correctAnswer": constructor,           # <- "correctAnswer" en lugar de "answer"
            "knowledgeLevel": 2,                # nivel conocimiento arbitrario (ejemplo: 2)
            "category": "Circuit"
        }

def pregunta_ano_mas_abandonos_circuito():
    cursor.execute("SELECT name FROM circuits ORDER BY RAND() LIMIT 1")
    row = cursor.fetchone()
    if not row:
        return None
    circuito_objetivo = row[0]

    cursor.execute("""
        SELECT ra.year, COUNT(*) as abandonos
        FROM results r
        JOIN races ra ON r.raceId = ra.raceId
        JOIN circuits c ON ra.circuitId = c.circuitId
        JOIN status s ON r.statusId = s.statusId
        WHERE c.name = %s AND (
            s.status LIKE '%accident%' OR
            s.status LIKE '%engine%' OR
            s.status LIKE '%gearbox%' OR
            s.status LIKE '%electrical%'
        )
        GROUP BY ra.year
        ORDER BY abandonos DESC
        LIMIT 1
    """, (circuito_objetivo,))
    row = cursor.fetchone()
    if not row:
        return None
    year = row[0]
    pregunta = f"¿En qué año hubo más abandonos en el circuito de {circuito_objetivo}?"
    opciones = get_respuestas_incorrectas(str(year), [str(y) for y in range(1980, 2024)])
    opciones.append(str(year))
    random.shuffle(opciones)
    return {
            "question": pregunta,
            "answers": opciones,               # <- "answers" en lugar de "options"
            "correctAnswer": str(year),           # <- "correctAnswer" en lugar de "answer"
            "knowledgeLevel": 2,                # nivel conocimiento arbitrario (ejemplo: 2)
            "category": "Circuit"
        }


def pregunta_numero_gp_en_circuito():
    cursor.execute("SELECT name FROM circuits ORDER BY RAND() LIMIT 1")
    row = cursor.fetchone()
    if not row:
        return None
    circuito_objetivo = row[0]

    cursor.execute("""
        SELECT COUNT(*) as cantidad
        FROM races ra
        JOIN circuits c ON ra.circuitId = c.circuitId
        WHERE c.name = %s
    """, (circuito_objetivo,))
    row = cursor.fetchone()
    if not row:
        return None
    cantidad = row[0]
    pregunta = f"¿Cuántas veces se celebró un Gran Premio en el circuito de {circuito_objetivo}?"
    opciones = get_respuestas_incorrectas(str(cantidad), [str(i) for i in range(0, 100)])
    opciones.append(str(cantidad))
    random.shuffle(opciones)
    return {
            "question": pregunta,
            "answers": opciones,               # <- "answers" en lugar de "options"
            "correctAnswer": str(cantidad),           # <- "correctAnswer" en lugar de "answer"
            "knowledgeLevel": 2,                # nivel conocimiento arbitrario (ejemplo: 2)
            "category": "Circuit"
        }

def pregunta_anio_vuelta_rapida_circuito():
    cursor.execute("SELECT name FROM circuits ORDER BY RAND() LIMIT 1")
    row = cursor.fetchone()
    if not row:
        return None
    circuito_objetivo = row[0]

    cursor.execute("""
        SELECT ra.year, MIN(lapTime) as vuelta_rapida
        FROM lapTimes l
        JOIN races ra ON l.raceId = ra.raceId
        JOIN circuits c ON ra.circuitId = c.circuitId
        WHERE c.name = %s
        GROUP BY ra.year
        ORDER BY vuelta_rapida ASC
        LIMIT 1
    """, (circuito_objetivo,))
    row = cursor.fetchone()
    if not row:
        return None
    year = row[0]
    pregunta = f"¿En qué año se logró la vuelta rápida más rápida en el circuito de {circuito_objetivo}?"
    opciones = get_respuestas_incorrectas(str(year), [str(y) for y in range(1980, 2024)])
    opciones.append(str(year))
    random.shuffle(opciones)
    return {
            "question": pregunta,
            "answers": opciones,               # <- "answers" en lugar de "options"
            "correctAnswer": str(year),           # <- "correctAnswer" en lugar de "answer"
            "knowledgeLevel": 2,                # nivel conocimiento arbitrario (ejemplo: 2)
            "category": "Circuit"
        }

def pregunta_piloto_mas_victorias_circuito_wrapped():
    return pregunta_piloto_mas_victorias_circuito()


def pregunta_constructor_mas_poles_circuito_wrapped():
    return pregunta_constructor_mas_poles_circuito()

def pregunta_ano_mas_abandonos_circuito_wrapped():
    return pregunta_ano_mas_abandonos_circuito()


def pregunta_numero_gp_en_circuito_wrapped():
    return pregunta_numero_gp_en_circuito()


def pregunta_anio_vuelta_rapida_circuito_wrapped():
    return pregunta_anio_vuelta_rapida_circuito()

#---------------------------------------------------------------------------------------------------------------
# Preguntas sobre PILOTO en concreto

def pregunta_circuito_mas_abandonos_piloto(piloto_objetivo):
    cursor.execute("SELECT driverId FROM drivers ORDER BY RAND() LIMIT 1")
    row = cursor.fetchone()
    if not row:
        return None
    piloto_objetivo = row[0]

    cursor.execute("""
        SELECT c.name, COUNT(*) as abandonos
        FROM results r
        JOIN races ra ON r.raceId = ra.raceId
        JOIN circuits c ON ra.circuitId = c.circuitId
        JOIN status s ON r.statusId = s.statusId
        WHERE r.driverId = %s AND (
            s.status LIKE '%accident%' OR
            s.status LIKE '%engine%' OR
            s.status LIKE '%gearbox%' OR
            s.status LIKE '%electrical%'
        )
        GROUP BY c.name
        ORDER BY abandonos DESC
        LIMIT 1
    """, (piloto_objetivo,))
    row = cursor.fetchone()
    if not row:
        return None
    circuito = row[0]
    pregunta = f"¿En qué circuito abandonó más veces el piloto {piloto_objetivo}?"
    incorrectas = get_respuestas_incorrectas(circuito, [r[0] for r in cursor.execute("SELECT name FROM circuits WHERE name != %s", (circuito,)) or []])
    opciones = incorrectas + [circuito]
    random.shuffle(opciones)
    return {
            "question": pregunta,
            "answers": opciones,               # <- "answers" en lugar de "options"
            "correctAnswer": circuito,           # <- "correctAnswer" en lugar de "answer"
            "knowledgeLevel": 2,                # nivel conocimiento arbitrario (ejemplo: 2)
            "category": "Driver"
        }


def pregunta_puntos_consecutivos_piloto():
    cursor.execute("SELECT driverId FROM drivers ORDER BY RAND() LIMIT 1")
    row = cursor.fetchone()
    if not row:
        return None
    piloto_objetivo = row[0]

    cursor.execute("""
        SELECT COUNT(*) as rachas
        FROM (
            SELECT ra.year, COUNT(*) as carreras
            FROM results r
            JOIN races ra ON r.raceId = ra.raceId
            WHERE r.driverId = %s AND r.points > 0
            GROUP BY ra.year, ra.round
            HAVING carreras >= 5
        ) as rachas
    """, (piloto_objetivo,))
    row = cursor.fetchone()
    if not row:
        return None
    rachas = row[0]
    pregunta = f"¿Cuántas veces logró puntos consecutivos en al menos 5 carreras el piloto {piloto_objetivo}?"
    opciones = get_respuestas_incorrectas(str(rachas), [str(i) for i in range(0, 10)])
    opciones.append(str(rachas))
    random.shuffle(opciones)
    return {
            "question": pregunta,
            "answers": opciones,               # <- "answers" en lugar de "options"
            "correctAnswer": str(rachas),           # <- "correctAnswer" en lugar de "answer"
            "knowledgeLevel": 2,                # nivel conocimiento arbitrario (ejemplo: 2)
            "category": "Driver"
        }

def pregunta_promedio_posicion_clasificacion():
    cursor.execute("SELECT driverId FROM drivers ORDER BY RAND() LIMIT 1")
    row = cursor.fetchone()
    if not row:
        return None
    piloto_objetivo = row[0]

    cursor.execute("""
        SELECT AVG(q.position) as promedio
        FROM qualifying q
        JOIN races ra ON q.raceId = ra.raceId
        WHERE q.driverId = %s
    """, (piloto_objetivo,))
    row = cursor.fetchone()
    if not row:
        return None
    promedio = row[0]
    pregunta = f"¿Cuál fue el promedio de posición de clasificación de {piloto_objetivo} en toda su carrera?"
    opciones = get_respuestas_incorrectas(str(promedio), [str(i) for i in range(1, 11)])
    opciones.append(str(promedio))
    random.shuffle(opciones)
    return {
            "question": pregunta,
            "answers": opciones,               # <- "answers" en lugar de "options"
            "correctAnswer": str(promedio),           # <- "correctAnswer" en lugar de "answer"
            "knowledgeLevel": 2,                # nivel conocimiento arbitrario (ejemplo: 2)
            "category": "Driver"
        }

def pregunta_temporada_mas_paradas_boxes():
    cursor.execute("SELECT driverId FROM drivers ORDER BY RAND() LIMIT 1")
    row = cursor.fetchone()
    if not row:
        return None
    piloto_objetivo = row[0]

    cursor.execute("""
        SELECT ra.year, COUNT(*) as paradas
        FROM pitStops p
        JOIN races ra ON p.raceId = ra.raceId
        WHERE p.driverId = %s
        GROUP BY ra.year
        ORDER BY paradas DESC
        LIMIT 1
    """, (piloto_objetivo,))
    row = cursor.fetchone()
    if not row:
        return None
    year = row[0]
    pregunta = f"¿En qué temporada {piloto_objetivo} tuvo más paradas en boxes?"
    opciones = get_respuestas_incorrectas(str(year), [str(y) for y in range(1950, 2024)])
    opciones.append(str(year))
    random.shuffle(opciones)
    return {
            "question": pregunta,
            "answers": opciones,               # <- "answers" en lugar de "options"
            "correctAnswer": str(year),           # <- "correctAnswer" en lugar de "answer"
            "knowledgeLevel": 2,                # nivel conocimiento arbitrario (ejemplo: 2)
            "category": "Driver"
        }

def pregunta_porcentaje_carreras_finalizadas():
    cursor.execute("SELECT driverId FROM drivers ORDER BY RAND() LIMIT 1")
    row = cursor.fetchone()
    if not row:
        return None
    piloto_objetivo = row[0]

    cursor.execute("""
        SELECT
            (COUNT(*) FILTER (WHERE r.position != 0) * 100.0 / COUNT(*)) as porcentaje
        FROM results r
        JOIN races ra ON r.raceId = ra.raceId
        WHERE r.driverId = %s
    """, (piloto_objetivo,))
    row = cursor.fetchone()
    if not row:
        return None
    porcentaje = row[0]
    pregunta = f"¿Cuál fue el porcentaje de carreras finalizadas por {piloto_objetivo} respecto a las disputadas?"
    opciones = get_respuestas_incorrectas(str(porcentaje), [str(i) for i in range(0, 101)])
    opciones.append(str(porcentaje))
    random.shuffle(opciones)
    return {
            "question": pregunta,
            "answers": opciones,               # <- "answers" en lugar de "options"
            "correctAnswer": str(porcentaje),           # <- "correctAnswer" en lugar de "answer"
            "knowledgeLevel": 2,                # nivel conocimiento arbitrario (ejemplo: 2)
            "category": "Driver"
        }

def pregunta_circuito_no_victoria_piloto():
    cursor.execute("SELECT driverId FROM drivers ORDER BY RAND() LIMIT 1")
    row = cursor.fetchone()
    if not row:
        return None
    piloto_objetivo = row[0]

    cursor.execute("""
        SELECT c.name
        FROM circuits c
        WHERE c.name NOT IN (
            SELECT ra.name
            FROM results r
            JOIN races ra ON r.raceId = ra.raceId
            WHERE r.driverId = %s AND r.position = 1
        )
        ORDER BY RAND()
        LIMIT 1
    """, (piloto_objetivo,))
    row = cursor.fetchone()
    if not row:
        return None
    circuito = row[0]
    pregunta = f"¿En qué circuito {piloto_objetivo} no ha logrado nunca una victoria?"
    incorrectas = get_respuestas_incorrectas(circuito, [r[0] for r in cursor.execute("SELECT name FROM circuits WHERE name != %s", (circuito,)) or []])
    opciones = incorrectas + [circuito]
    random.shuffle(opciones)
    return {
            "question": pregunta,
            "answers": opciones,               # <- "answers" en lugar de "options"
            "correctAnswer": circuito,           # <- "correctAnswer" en lugar de "answer"
            "knowledgeLevel": 2,                # nivel conocimiento arbitrario (ejemplo: 2)
            "category": "Driver"
        }

def pregunta_pilotos_distintos_compitio():
    cursor.execute("SELECT driverId FROM drivers ORDER BY RAND() LIMIT 1")
    row = cursor.fetchone()
    if not row:
        return None
    piloto_objetivo = row[0]

    cursor.execute("""
        SELECT COUNT(DISTINCT r.driverId)
        FROM results r
        WHERE r.driverId = %s
    """, (piloto_objetivo,))
    row = cursor.fetchone()
    if not row:
        return None
    total = row[0]
    pregunta = f"¿Con cuántos pilotos distintos ha competido {piloto_objetivo} en su historia?"
    opciones = get_respuestas_incorrectas(str(total), [str(i) for i in range(0, 100)])
    opciones.append(str(total))
    random.shuffle(opciones)
    return {
            "question": pregunta,
            "answers": opciones,               # <- "answers" en lugar de "options"
            "correctAnswer": str(total),           # <- "correctAnswer" en lugar de "answer"
            "knowledgeLevel": 2,                # nivel conocimiento arbitrario (ejemplo: 2)
            "category": "Driver"
        }

def pregunta_racha_sin_ganar():
    cursor.execute("SELECT driverId FROM drivers ORDER BY RAND() LIMIT 1")
    row = cursor.fetchone()
    if not row:
        return None
    piloto_objetivo = row[0]

    cursor.execute("""
        SELECT ra.year, COUNT(*) as victorias
        FROM results r
        JOIN races ra ON r.raceId = ra.raceId
        WHERE r.driverId = %s AND r.position = 1
        GROUP BY ra.year
        ORDER BY ra.year
    """, (piloto_objetivo,))
    rows = cursor.fetchall()
    if not rows:
        return None
    racha = max_racha = 0
    for _, victorias in rows:
        if victorias == 0:
            racha += 1
            max_racha = max(max_racha, racha)
        else:
            racha = 0
    pregunta = f"¿Cuál fue la racha más larga de temporadas sin ganar {piloto_objetivo}?"
    opciones = get_respuestas_incorrectas(str(max_racha), [str(i) for i in range(0, 20)])
    opciones.append(str(max_racha))
    random.shuffle(opciones)
    return {
            "question": pregunta,
            "answers": opciones,               # <- "answers" en lugar de "options"
            "correctAnswer": str(max_racha),           # <- "correctAnswer" en lugar de "answer"
            "knowledgeLevel": 2,                # nivel conocimiento arbitrario (ejemplo: 2)
            "category": "Driver"
        }

def pregunta_peor_posicion_clasificacion_piloto():
    cursor.execute("SELECT driverId FROM drivers ORDER BY RAND() LIMIT 1")
    row = cursor.fetchone()
    if not row:
        return None
    piloto_objetivo = row[0]

    cursor.execute("""
        SELECT MIN(q.position)
        FROM qualifying q
        JOIN results r ON q.raceId = r.raceId AND q.driverId = r.driverId
        WHERE q.driverId = %s AND r.points > 0
    """, (piloto_objetivo,))
    row = cursor.fetchone()
    if not row:
        return None
    posicion = row[0]
    pregunta = f"¿Cuál fue la peor posición de clasificación desde la que logró puntuar {piloto_objetivo}?"
    opciones = get_respuestas_incorrectas(str(posicion), [str(i) for i in range(1, 25)])
    opciones.append(str(posicion))
    random.shuffle(opciones)
    return {
            "question": pregunta,
            "answers": opciones,               # <- "answers" en lugar de "options"
            "correctAnswer": str(posicion),           # <- "correctAnswer" en lugar de "answer"
            "knowledgeLevel": 2,                # nivel conocimiento arbitrario (ejemplo: 2)
            "category": "Driver"
        }

def pregunta_remontadas_puesto_15_piloto():
    cursor.execute("SELECT driverId FROM drivers ORDER BY RAND() LIMIT 1")
    row = cursor.fetchone()
    if not row:
        return None
    piloto_objetivo = row[0]

    cursor.execute("""
        SELECT COUNT(*) as remontadas
        FROM results r
        WHERE r.driverId = %s AND r.positionOrder <= 3 AND r.position >= 15
    """, (piloto_objetivo,))
    row = cursor.fetchone()
    if not row:
        return None
    remontadas = row[0]
    pregunta = f"¿Cuántas veces remontó del puesto 15 o peor al podio {piloto_objetivo}?"
    opciones = get_respuestas_incorrectas(str(remontadas), [str(i) for i in range(0, 20)])
    opciones.append(str(remontadas))
    random.shuffle(opciones)
    return {
            "question": pregunta,
            "answers": opciones,               # <- "answers" en lugar de "options"
            "correctAnswer": str(remontadas),           # <- "correctAnswer" en lugar de "answer"
            "knowledgeLevel": 2,                # nivel conocimiento arbitrario (ejemplo: 2)
            "category": "Driver"
        }

def pregunta_carreras_lideradas_piloto():
    cursor.execute("SELECT driverId FROM drivers ORDER BY RAND() LIMIT 1")
    row = cursor.fetchone()
    if not row:
        return None
    piloto_objetivo = row[0]

    cursor.execute("""
        SELECT COUNT(DISTINCT r.raceId)
        FROM results r
        JOIN lapTimes l ON r.raceId = l.raceId AND r.driverId = l.driverId
        WHERE r.driverId = %s AND l.position = 1
    """, (piloto_objetivo,))
    row = cursor.fetchone()
    if not row:
        return None
    lideradas = row[0]
    pregunta = f"¿En cuántas carreras lideró al menos una vuelta {piloto_objetivo}?"
    opciones = get_respuestas_incorrectas(str(lideradas), [str(i) for i in range(0, 20)])
    opciones.append(str(lideradas))
    random.shuffle(opciones)
    return {
            "question": pregunta,
            "answers": opciones,               # <- "answers" en lugar de "options"
            "correctAnswer": str(lideradas),           # <- "correctAnswer" en lugar de "answer"
            "knowledgeLevel": 2,                # nivel conocimiento arbitrario (ejemplo: 2)
            "category": "Driver"
        }

def pregunta_supero_mas_clasificacion():
    cursor.execute("SELECT driverId FROM drivers ORDER BY RAND() LIMIT 1")
    row = cursor.fetchone()
    if not row:
        return None
    piloto_objetivo = row[0]

    cursor.execute("""
        SELECT d.forename, d.surname, COUNT(*) as veces
        FROM qualifying q
        JOIN drivers d ON q.driverId = d.driverId
        JOIN results r ON q.raceId = r.raceId AND q.driverId = r.driverId
        WHERE r.driverId != %s AND q.position < r.position
        GROUP BY q.driverId
        ORDER BY veces DESC
        LIMIT 1
    """, (piloto_objetivo,))
    row = cursor.fetchone()
    if not row:
        return None
    piloto = f"{row[0]} {row[1]}"
    pregunta = f"¿A qué piloto superó más veces en clasificación directa {piloto_objetivo}?"
    incorrectas = get_respuestas_incorrectas(piloto, pilotos_cache)
    opciones = incorrectas + [piloto]
    random.shuffle(opciones)
    return {
            "question": pregunta,
            "answers": opciones,               # <- "answers" en lugar de "options"
            "correctAnswer": piloto,           # <- "correctAnswer" en lugar de "answer"
            "knowledgeLevel": 2,                # nivel conocimiento arbitrario (ejemplo: 2)
            "category": "Driver"
        }

def pregunta_mejor_vuelta_rapida():
    cursor.execute("SELECT driverId FROM drivers ORDER BY RAND() LIMIT 1")
    row = cursor.fetchone()
    if not row:
        return None
    piloto_objetivo = row[0]

    cursor.execute("""
        SELECT MIN(lapTime) as mejor_vuelta
        FROM lapTimes l
        JOIN results r ON l.raceId = r.raceId
        WHERE r.driverId = %s
    """, (piloto_objetivo,))
    row = cursor.fetchone()
    if not row:
        return None
    mejor_vuelta = row[0]
    pregunta = f"¿Cuál fue su mejor vuelta rápida (tiempo) en toda su carrera {piloto_objetivo}?"
    opciones = get_respuestas_incorrectas(str(mejor_vuelta), [str(i) for i in range(100, 200)])
    opciones.append(str(mejor_vuelta))
    random.shuffle(opciones)
    return {
            "question": pregunta,
            "answers": opciones,               # <- "answers" en lugar de "options"
            "correctAnswer": str(mejor_vuelta),           # <- "correctAnswer" en lugar de "answer"
            "knowledgeLevel": 2,                # nivel conocimiento arbitrario (ejemplo: 2)
            "category": "Driver"
        }

def pregunta_piloto_anio_mas_puntos():
    cursor.execute("SELECT driverId FROM drivers ORDER BY RAND() LIMIT 1")
    row = cursor.fetchone()
    if not row:
        return None
    piloto_objetivo = row[0]

    cursor.execute("""
        SELECT ra.year, SUM(r.points) as total_puntos
        FROM results r
        JOIN races ra ON r.raceId = ra.raceId
        WHERE r.driverId = %s
        GROUP BY ra.year
        ORDER BY total_puntos DESC
        LIMIT 1
    """, (piloto_objetivo,))
    row = cursor.fetchone()
    if not row:
        return None
    year = row[0]
    pregunta = f"¿En qué año logró más puntos {piloto_objetivo}?"
    opciones = get_respuestas_incorrectas(str(year), [str(y) for y in range(1950, 2024)])
    opciones.append(str(year))
    random.shuffle(opciones)
    return {
            "question": pregunta,
            "answers": opciones,               # <- "answers" en lugar de "options"
            "correctAnswer": str(year),           # <- "correctAnswer" en lugar de "answer"
            "knowledgeLevel": 2,                # nivel conocimiento arbitrario (ejemplo: 2)
            "category": "Driver"
        }

def pregunta_escuderias_distintas_piloto():
    cursor.execute("SELECT driverId FROM drivers ORDER BY RAND() LIMIT 1")
    row = cursor.fetchone()
    if not row:
        return None
    piloto_objetivo = row[0]

    cursor.execute("""
        SELECT COUNT(DISTINCT r.constructorId)
        FROM results r
        WHERE r.driverId = %s
    """, (piloto_objetivo,))
    row = cursor.fetchone()
    if not row:
        return None
    total = row[0]
    pregunta = f"¿Con cuántas escuderías distintas ha competido {piloto_objetivo}?"
    opciones = get_respuestas_incorrectas(str(total), [str(i) for i in range(0, 20)])
    opciones.append(str(total))
    random.shuffle(opciones)
    return {
            "question": pregunta,
            "answers": opciones,               # <- "answers" en lugar de "options"
            "correctAnswer": str(total),           # <- "correctAnswer" en lugar de "answer"
            "knowledgeLevel": 2,                # nivel conocimiento arbitrario (ejemplo: 2)
            "category": "Driver"
        }

def pregunta_gp_mas_participaciones_piloto():
    cursor.execute("SELECT driverId FROM drivers ORDER BY RAND() LIMIT 1")
    row = cursor.fetchone()
    if not row:
        return None
    piloto_objetivo = row[0]

    cursor.execute("""
        SELECT c.name, COUNT(*) as participaciones
        FROM results r
        JOIN races ra ON r.raceId = ra.raceId
        JOIN circuits c ON ra.circuitId = c.circuitId
        WHERE r.driverId = %s
        GROUP BY c.name
        ORDER BY participaciones DESC
        LIMIT 1
    """, (piloto_objetivo,))
    row = cursor.fetchone()
    if not row:
        return None
    circuito = row[0]
    pregunta = f"¿En qué Gran Premio participó más veces {piloto_objetivo}?"
    incorrectas = get_respuestas_incorrectas(circuito, [r[0] for r in cursor.execute("SELECT name FROM circuits WHERE name != %s", (circuito,)) or []])
    opciones = incorrectas + [circuito]
    random.shuffle(opciones)
    return {
            "question": pregunta,
            "answers": opciones,               # <- "answers" en lugar de "options"
            "correctAnswer": circuito,           # <- "correctAnswer" en lugar de "answer"
            "knowledgeLevel": 2,                # nivel conocimiento arbitrario (ejemplo: 2)
            "category": "Driver"
        }

def pregunta_abandonos_piloto():
    cursor.execute("SELECT driverId FROM drivers ORDER BY RAND() LIMIT 1")
    row = cursor.fetchone()
    if not row:
        return None
    piloto_objetivo = row[0]

    cursor.execute("""
        SELECT COUNT(*) as abandonos
        FROM results r
        JOIN status s ON r.statusId = s.statusId
        WHERE r.driverId = %s AND (
            s.status LIKE '%accident%' OR
            s.status LIKE '%engine%' OR
            s.status LIKE '%gearbox%' OR
            s.status LIKE '%electrical%'
        )
    """, (piloto_objetivo,))
    row = cursor.fetchone()
    if not row:
        return None
    abandonos = row[0]
    pregunta = f"¿Cuántas veces abandonó {piloto_objetivo} en su carrera?"
    opciones = get_respuestas_incorrectas(str(abandonos), [str(i) for i in range(0, 100)])
    opciones.append(str(abandonos))
    random.shuffle(opciones)
    return {
            "question": pregunta,
            "answers": opciones,               # <- "answers" en lugar de "options"
            "correctAnswer": str(abandonos),           # <- "correctAnswer" en lugar de "answer"
            "knowledgeLevel": 2,                # nivel conocimiento arbitrario (ejemplo: 2)
            "category": "Driver"
        }

def pregunta_ultimo_gp_victoria_piloto():
    cursor.execute("SELECT driverId FROM drivers ORDER BY RAND() LIMIT 1")
    row = cursor.fetchone()
    if not row:
        return None
    piloto_objetivo = row[0]

    cursor.execute("""
        SELECT c.name
        FROM results r
        JOIN races ra ON r.raceId = ra.raceId
        JOIN circuits c ON ra.circuitId = c.circuitId
        WHERE r.driverId = %s AND r.position = 1
        ORDER BY ra.year DESC, ra.round DESC
        LIMIT 1
    """, (piloto_objetivo,))
    row = cursor.fetchone()
    if not row:
        return None
    circuito = row[0]
    pregunta = f"¿En qué circuito logró su última victoria {piloto_objetivo}?"
    incorrectas = get_respuestas_incorrectas(circuito, [r[0] for r in cursor.execute("SELECT name FROM circuits WHERE name != %s", (circuito,)) or []])
    opciones = incorrectas + [circuito]
    random.shuffle(opciones)
    return {
            "question": pregunta,
            "answers": opciones,               # <- "answers" en lugar de "options"
            "correctAnswer": circuito,           # <- "correctAnswer" en lugar de "answer"
            "knowledgeLevel": 2,                # nivel conocimiento arbitrario (ejemplo: 2)
            "category": "Driver"
        }

def pregunta_companero_podio_piloto():
    cursor.execute("SELECT driverId FROM drivers ORDER BY RAND() LIMIT 1")
    row = cursor.fetchone()
    if not row:
        return None
    piloto_objetivo = row[0]

    cursor.execute("""
        SELECT d.forename, d.surname
        FROM results r
        JOIN drivers d ON r.driverId = d.driverId
        WHERE r.constructorId = (
            SELECT constructorId FROM results WHERE driverId = %s LIMIT 1
        ) AND r.driverId != %s AND r.position <= 3
        GROUP BY r.driverId
        ORDER BY COUNT(*) DESC
        LIMIT 1
    """, (piloto_objetivo, piloto_objetivo))
    row = cursor.fetchone()
    if not row:
        return None
    compañero = f"{row[0]} {row[1]}"
    pregunta = f"¿Qué compañero de equipo compartió más podios con {piloto_objetivo}?"
    incorrectas = get_respuestas_incorrectas(compañero, pilotos_cache)
    opciones = incorrectas + [compañero]
    random.shuffle(opciones)
    return {
            "question": pregunta,
            "answers": opciones,               # <- "answers" en lugar de "options"
            "correctAnswer": compañero,           # <- "correctAnswer" en lugar de "answer"
            "knowledgeLevel": 2,                # nivel conocimiento arbitrario (ejemplo: 2)
            "category": "Driver"
        }

def pregunta_ano_debut_piloto():
    cursor.execute("SELECT driverId FROM drivers ORDER BY RAND() LIMIT 1")
    row = cursor.fetchone()
    if not row:
        return None
    piloto_objetivo = row[0]

    cursor.execute("""
        SELECT MIN(ra.year)
        FROM races ra
        JOIN results r ON ra.raceId = r.raceId
        WHERE r.driverId = %s
    """, (piloto_objetivo,))
    row = cursor.fetchone()
    if not row:
        return None
    debut = row[0]
    pregunta = f"¿En qué año debutó {piloto_objetivo}?"
    opciones = get_respuestas_incorrectas(str(debut), [str(y) for y in range(1950, 2024)])
    opciones.append(str(debut))
    random.shuffle(opciones)
    return {
            "question": pregunta,
            "answers": opciones,               # <- "answers" en lugar de "options"
            "correctAnswer": str(debut),           # <- "correctAnswer" en lugar de "answer"
            "knowledgeLevel": 2,                # nivel conocimiento arbitrario (ejemplo: 2)
            "category": "Driver"
        }

def pregunta_primera_victoria_escuderia_piloto():
    cursor.execute("SELECT driverId FROM drivers ORDER BY RAND() LIMIT 1")
    row = cursor.fetchone()
    if not row:
        return None
    piloto_objetivo = row[0]

    cursor.execute("""
        SELECT c.name
        FROM results r
        JOIN races ra ON r.raceId = ra.raceId
        JOIN constructors c ON r.constructorId = c.constructorId
        WHERE r.driverId = %s AND r.position = 1
        ORDER BY ra.year ASC, ra.round ASC
        LIMIT 1
    """, (piloto_objetivo,))
    row = cursor.fetchone()
    if not row:
        return None
    escuderia = row[0]
    pregunta = f"¿Con qué escudería logró su primera victoria {piloto_objetivo}?"
    incorrectas = get_respuestas_incorrectas(escuderia, constructores_cache)
    opciones = incorrectas + [escuderia]
    random.shuffle(opciones)
    return {
            "question": pregunta,
            "answers": opciones,               # <- "answers" en lugar de "options"
            "correctAnswer": escuderia,           # <- "correctAnswer" en lugar de "answer"
            "knowledgeLevel": 2,                # nivel conocimiento arbitrario (ejemplo: 2)
            "category": "Driver"
        }

def pregunta_poles_piloto():
    cursor.execute("SELECT driverId FROM drivers ORDER BY RAND() LIMIT 1")
    row = cursor.fetchone()
    if not row:
        return None
    piloto_objetivo = row[0]

    cursor.execute("""
        SELECT COUNT(*) as poles
        FROM qualifying q
        WHERE q.driverId = %s AND q.position = 1
    """, (piloto_objetivo,))
    row = cursor.fetchone()
    if not row:
        return None
    poles = row[0]
    pregunta = f"¿Cuántas poles consiguió {piloto_objetivo} en su carrera?"
    opciones = get_respuestas_incorrectas(str(poles), [str(i) for i in range(0, 100)])
    opciones.append(str(poles))
    random.shuffle(opciones)
    return {
            "question": pregunta,
            "answers": opciones,               # <- "answers" en lugar de "options"
            "correctAnswer": str(poles),           # <- "correctAnswer" en lugar de "answer"
            "knowledgeLevel": 1,                # nivel conocimiento arbitrario (ejemplo: 2)
            "category": "Driver"
        }

def pregunta_circuito_mas_podios_piloto():
    cursor.execute("SELECT driverId FROM drivers ORDER BY RAND() LIMIT 1")
    row = cursor.fetchone()
    if not row:
        return None
    piloto_objetivo = row[0]

    cursor.execute("""
        SELECT c.name, COUNT(*) as podios
        FROM results r
        JOIN races ra ON r.raceId = ra.raceId
        JOIN circuits c ON ra.circuitId = c.circuitId
        WHERE r.driverId = %s AND r.position <= 3
        GROUP BY c.name
        ORDER BY podios DESC
        LIMIT 1
    """, (piloto_objetivo,))
    row = cursor.fetchone()
    if not row:
        return None
    circuito = row[0]
    pregunta = f"¿En qué circuito {piloto_objetivo} subió más veces al podio?"
    incorrectas = get_respuestas_incorrectas(circuito, [r[0] for r in cursor.execute("SELECT name FROM circuits WHERE name != %s", (circuito,)) or []])
    opciones = incorrectas + [circuito]
    random.shuffle(opciones)
    return {
            "question": pregunta,
            "answers": opciones,               # <- "answers" en lugar de "options"
            "correctAnswer": circuito,           # <- "correctAnswer" en lugar de "answer"
            "knowledgeLevel": 2,                # nivel conocimiento arbitrario (ejemplo: 2)
            "category": "Driver"
        }

def pregunta_pais_mas_victorias_piloto():
    cursor.execute("SELECT driverId FROM drivers ORDER BY RAND() LIMIT 1")
    row = cursor.fetchone()
    if not row:
        return None
    piloto_objetivo = row[0]

    cursor.execute("""
        SELECT c.country, COUNT(*) as victorias
        FROM results r
        JOIN races ra ON r.raceId = ra.raceId
        JOIN circuits c ON ra.circuitId = c.circuitId
        WHERE r.driverId = %s AND r.position = 1
        GROUP BY c.country
        ORDER BY victorias DESC
        LIMIT 1
    """, (piloto_objetivo,))
    row = cursor.fetchone()
    if not row:
        return None
    pais = row[0]
    pregunta = f"¿Qué país vio más victorias de {piloto_objetivo}?"
    incorrectas = get_respuestas_incorrectas(pais, [r[0] for r in cursor.execute("SELECT country FROM circuits WHERE country != %s", (pais,)) or []])
    opciones = incorrectas + [pais]
    random.shuffle(opciones)
    return {
            "question": pregunta,
            "answers": opciones,               # <- "answers" en lugar de "options"
            "correctAnswer": pais,           # <- "correctAnswer" en lugar de "answer"
            "knowledgeLevel": 2,                # nivel conocimiento arbitrario (ejemplo: 2)
            "category": "Driver"
        }

def obtener_victorias_piloto():
    cursor.execute("SELECT driverId FROM drivers ORDER BY RAND() LIMIT 1")
    row = cursor.fetchone()
    if not row:
        return None
    piloto_objetivo = row[0]

    # Extraemos el primer nombre y apellido
    forename, surname = nombre_completo_piloto.split(' ', 1)

    # Realizamos la consulta para obtener el total de victorias del piloto
    cursor.execute("""
        SELECT COUNT(*)
        FROM results r
        JOIN drivers d ON r.driverId = d.driverId
        WHERE d.forename = %s AND d.surname = %s AND r.position = 1
    """, (forename, surname))
    row = cursor.fetchone()
    if not row:
        return None
    victorias = row[0]
    pregunta = f"¿Cuántas victorias consiguió {piloto_objetivo} en su carrera?"
    opciones = get_respuestas_incorrectas(str(victorias), [str(i) for i in range(0, 100)])
    opciones.append(str(victorias))
    random.shuffle(opciones)
    return {
            "question": pregunta,
            "answers": opciones,               # <- "answers" en lugar de "options"
            "correctAnswer": str(victorias),           # <- "correctAnswer" en lugar de "answer"
            "knowledgeLevel": 1,            # nivel conocimiento arbitrario (ejemplo: 2)
            "category": "Driver"
        }



def pregunta_peor_temporada_puntos_piloto():
    cursor.execute("SELECT driverId FROM drivers ORDER BY RAND() LIMIT 1")
    row = cursor.fetchone()
    if not row:
        return None
    piloto_objetivo = row[0]

    cursor.execute("""
        SELECT ra.year, SUM(r.points) as total_puntos
        FROM results r
        JOIN races ra ON r.raceId = ra.raceId
        WHERE r.driverId = %s
        GROUP BY ra.year
        HAVING total_puntos > 0
        ORDER BY total_puntos ASC
        LIMIT 1
    """, (piloto_objetivo,))
    row = cursor.fetchone()
    if not row:
        return None
    year = row[0]
    pregunta = f"¿Cuál fue la peor temporada en puntos para {piloto_objetivo}?"
    opciones = get_respuestas_incorrectas(str(year), [str(y) for y in range(1950, 2024)])
    opciones.append(str(year))
    random.shuffle(opciones)
    return {
            "question": pregunta,
            "answers": opciones,               # <- "answers" en lugar de "options"
            "correctAnswer": str(year),           # <- "correctAnswer" en lugar de "answer"
            "knowledgeLevel": 1,            # nivel conocimiento arbitrario (ejemplo: 2)
            "category": "Driver"
        }

def pregunta_temporadas_sin_puntos_piloto():
    cursor.execute("SELECT driverId FROM drivers ORDER BY RAND() LIMIT 1")
    row = cursor.fetchone()
    if not row:
        return None
    piloto_objetivo = row[0]

    cursor.execute("""
        SELECT COUNT(DISTINCT ra.year)
        FROM results r
        JOIN races ra ON r.raceId = ra.raceId
        WHERE r.driverId = %s AND r.points = 0
    """, (piloto_objetivo,))
    row = cursor.fetchone()
    if not row:
        return None
    total = row[0]
    pregunta = f"¿Cuántas veces finalizó una temporada sin sumar ningún punto {piloto_objetivo}?"
    opciones = get_respuestas_incorrectas(str(total), [str(i) for i in range(0, 20)])
    opciones.append(str(total))
    random.shuffle(opciones)
    return {
            "question": pregunta,
            "answers": opciones,               # <- "answers" en lugar de "options"
            "correctAnswer": str(total),           # <- "correctAnswer" en lugar de "answer"
            "knowledgeLevel": 1,            # nivel conocimiento arbitrario (ejemplo: 2)
            "category": "Driver"
        }


def obtener_piloto_aleatorio():
    cursor.execute("""
        SELECT forename, surname
        FROM drivers
        ORDER BY RAND()
        LIMIT 1
    """)
    row = cursor.fetchone()
    if not row:
        return None
    nombre_completo = f"{row[0]} {row[1]}"
    return nombre_completo

piloto_aleatorio = obtener_piloto_aleatorio()

def pregunta_circuito_mas_abandonos_piloto_wrapped():
    return pregunta_circuito_mas_abandonos_piloto()


def pregunta_puntos_consecutivos_piloto_wrapped():
    return pregunta_puntos_consecutivos_piloto()

def pregunta_promedio_posicion_clasificacion_wrapped():
    return pregunta_promedio_posicion_clasificacion()

def pregunta_temporada_mas_paradas_boxes_wrapped():
    return pregunta_temporada_mas_paradas_boxes()

def pregunta_porcentaje_carreras_finalizadas_wrapped():
    return pregunta_porcentaje_carreras_finalizadas()

def pregunta_circuito_no_victoria_piloto_wrapped():
    return pregunta_circuito_no_victoria_piloto()

def pregunta_pilotos_distintos_compitio_wrapped():
    return pregunta_pilotos_distintos_compitio()

def pregunta_racha_sin_ganar_wrapped():
    return pregunta_racha_sin_ganar()

def pregunta_peor_posicion_clasificacion_piloto_wrapped():
    return pregunta_peor_posicion_clasificacion_piloto()

def pregunta_peor_posicion_clasificacion_piloto_wrapped():
    return pregunta_peor_posicion_clasificacion_piloto()

def pregunta_remontadas_puesto_15_piloto_wrapped():
    return pregunta_remontadas_puesto_15_piloto()

def pregunta_carreras_lideradas_piloto_wrapped():
    return pregunta_carreras_lideradas_piloto()

def pregunta_supero_mas_clasificacion_wrapped():
    return pregunta_supero_mas_clasificacion()

def pregunta_mejor_vuelta_rapida_wrapped():
    return pregunta_mejor_vuelta_rapida()





def pregunta_piloto_anio_mas_puntos_wrapped():
    return pregunta_piloto_anio_mas_puntos()

def pregunta_escuderias_distintas_piloto_wrapped():
    return pregunta_escuderias_distintas_piloto()

def pregunta_gp_mas_participaciones_piloto_wrapped():
    return pregunta_gp_mas_participaciones_piloto()

def pregunta_abandonos_piloto_wrapped():
    return pregunta_abandonos_piloto()

def pregunta_ultimo_gp_victoria_piloto_wrapped():
    return pregunta_ultimo_gp_victoria_piloto()

def pregunta_companero_podio_piloto_wrapped():
    return pregunta_companero_podio_piloto()

def pregunta_ano_debut_piloto_wrapped():
    return pregunta_ano_debut_piloto()

def pregunta_primera_victoria_escuderia_piloto_wrapped():
    return pregunta_primera_victoria_escuderia_piloto()

def pregunta_poles_piloto_wrapped():
    return pregunta_poles_piloto()

def pregunta_circuito_mas_podios_piloto_wrapped():
    return pregunta_circuito_mas_podios_piloto()

def pregunta_poles_piloto_wrapped():
    return pregunta_poles_piloto()

def pregunta_circuito_mas_podios_piloto_wrapped():
    return pregunta_circuito_mas_podios_piloto()

def pregunta_pais_mas_victorias_piloto_wrapped():
    return pregunta_pais_mas_victorias_piloto()

def pregunta_obtener_victorias_piloto_wrapped():
    return obtener_victorias_piloto()

def pregunta_peor_temporada_puntos_piloto_wrapped():
    return pregunta_peor_temporada_puntos_piloto()

def pregunta_temporadas_sin_puntos_piloto_wrapped():
    return pregunta_temporadas_sin_puntos_piloto()

#-------------------------------------------------------------------------------------------------------------------
# Estadísticas genéricas parte 2
def pregunta_piloto_gano_en_mas_paises():
    cursor.execute("""
        SELECT d.forename, d.surname, COUNT(DISTINCT c.country) as paises
        FROM results r
        JOIN races ra ON r.raceId = ra.raceId
        JOIN circuits c ON ra.circuitId = c.circuitId
        JOIN drivers d ON r.driverId = d.driverId
        WHERE r.position = 1
        GROUP BY r.driverId
        ORDER BY paises DESC
        LIMIT 1
    """)
    row = cursor.fetchone()
    if not row:
        return None
    piloto = f"{row[0]} {row[1]}"
    pregunta = f"¿Qué piloto ganó en más países diferentes?"
    incorrectas = get_respuestas_incorrectas(piloto, pilotos_cache)
    opciones = incorrectas + [piloto]
    random.shuffle(opciones)
    return {
            "question": pregunta,
            "answers": opciones,               # <- "answers" en lugar de "options"
            "correctAnswer": piloto,           # <- "correctAnswer" en lugar de "answer"
            "knowledgeLevel": 1,            # nivel conocimiento arbitrario (ejemplo: 2)
            "category": "GenericStats"
        }

def pregunta_circuito_campeones_distintos():
    cursor.execute("""
        SELECT c.name, COUNT(DISTINCT d.driverId) as campeones
        FROM results r
        JOIN races ra ON r.raceId = ra.raceId
        JOIN circuits c ON ra.circuitId = c.circuitId
        JOIN drivers d ON r.driverId = d.driverId
        WHERE r.position = 1 AND d.driverId IN (
            SELECT driverId FROM driverStandings WHERE position = 1
        )
        GROUP BY c.name
        ORDER BY campeones DESC
        LIMIT 1
    """)
    row = cursor.fetchone()
    if not row:
        return None
    circuito = row[0]
    pregunta = f"¿Qué circuito ha visto ganar a más campeones del mundo diferentes?"
    incorrectas = get_respuestas_incorrectas(circuito, [r[0] for r in cursor.execute("SELECT name FROM circuits WHERE name != %s", (circuito,)) or []])
    opciones = incorrectas + [circuito]
    random.shuffle(opciones)
    return {
            "question": pregunta,
            "answers": opciones,               # <- "answers" en lugar de "options"
            "correctAnswer": circuito,           # <- "correctAnswer" en lugar de "answer"
            "knowledgeLevel": 1,            # nivel conocimiento arbitrario (ejemplo: 2)
            "category": "GenericStats"
        }


def pregunta_piloto_sin_pole_subio_podio():
    cursor.execute("""
        SELECT d.forename, d.surname
        FROM results r
        JOIN races ra ON r.raceId = ra.raceId
        JOIN drivers d ON r.driverId = d.driverId
        LEFT JOIN qualifying q ON r.raceId = q.raceId AND r.driverId = q.driverId
        WHERE r.position <= 3 AND q.position != 1
        GROUP BY d.driverId
        ORDER BY COUNT(r.position) DESC
        LIMIT 1
    """)
    row = cursor.fetchone()
    if not row:
        return None
    piloto = f"{row[0]} {row[1]}"
    pregunta = f"¿Qué piloto subió más veces al podio sin hacer pole esa temporada?"
    incorrectas = get_respuestas_incorrectas(piloto, pilotos_cache)
    opciones = incorrectas + [piloto]
    random.shuffle(opciones)
    return {
            "question": pregunta,
            "answers": opciones,               # <- "answers" en lugar de "options"
            "correctAnswer": piloto,           # <- "correctAnswer" en lugar de "answer"
            "knowledgeLevel": 1,            # nivel conocimiento arbitrario (ejemplo: 2)
            "category": "GenericStats"
        }

def pregunta_pais_mas_constructores():
    cursor.execute("""
        SELECT c.country, COUNT(DISTINCT c.name) as constructores
        FROM constructors c
        GROUP BY c.country
        ORDER BY constructores DESC
        LIMIT 1
    """)
    row = cursor.fetchone()
    if not row:
        return None
    pais = row[0]
    pregunta = f"¿Qué país ha tenido más constructores participando en la historia de la F1?"
    incorrectas = get_respuestas_incorrectas(pais, [r[0] for r in cursor.execute("SELECT country FROM constructors WHERE country != %s", (pais,)) or []])
    opciones = incorrectas + [pais]
    random.shuffle(opciones)
    return {
            "question": pregunta,
            "answers": opciones,               # <- "answers" en lugar de "options"
            "correctAnswer": pais,           # <- "correctAnswer" en lugar de "answer"
            "knowledgeLevel": 1,            # nivel conocimiento arbitrario (ejemplo: 2)
            "category": "GenericStats"
        }

def pregunta_piloto_mas_vueltas_rapidas_sin_puntos():
    cursor.execute("""
        SELECT d.forename, d.surname, COUNT(*) as vueltas_rapidas
        FROM lapTimes l
        JOIN results r ON l.raceId = r.raceId AND l.driverId = r.driverId
        JOIN drivers d ON r.driverId = d.driverId
        WHERE r.points = 0 AND l.rank = 1
        GROUP BY d.driverId
        ORDER BY vueltas_rapidas DESC
        LIMIT 1
    """)
    row = cursor.fetchone()
    if not row:
        return None
    piloto = f"{row[0]} {row[1]}"
    pregunta = f"¿Qué piloto logró más vueltas rápidas en GPs donde no puntuó?"
    incorrectas = get_respuestas_incorrectas(piloto, pilotos_cache)
    opciones = incorrectas + [piloto]
    random.shuffle(opciones)
    return {
            "question": pregunta,
            "answers": opciones,               # <- "answers" en lugar de "options"
            "correctAnswer": piloto,           # <- "correctAnswer" en lugar de "answer"
            "knowledgeLevel": 1,            # nivel conocimiento arbitrario (ejemplo: 2)
            "category": "GenericStats"
        }
#------------------------------------------------------------------------------------------------------------
# Preguntas estadísticas genéricas parte 2


def pregunta_piloto_perdio_campeonato_por_un_punto():
    cursor.execute("""
        SELECT d.forename, d.surname, ra.year
        FROM results r
        JOIN races ra ON r.raceId = ra.raceId
        JOIN drivers d ON r.driverId = d.driverId
        JOIN driverStandings ds ON r.driverId = ds.driverId
        WHERE ds.position = 2 AND ds.year = 2008 AND ds.points = 97
    """)
    row = cursor.fetchone()
    if not row:
        return None
    piloto = f"{row[0]} {row[1]}"
    pregunta = f"¿Qué piloto perdió un campeonato por 1 solo punto en la última carrera?"
    incorrectas = get_respuestas_incorrectas(piloto, pilotos_cache)
    opciones = incorrectas + [piloto]
    random.shuffle(opciones)
    return {
            "question": pregunta,
            "answers": opciones,               # <- "answers" en lugar de "options"
            "correctAnswer": piloto,           # <- "correctAnswer" en lugar de "answer"
            "knowledgeLevel": 1,            # nivel conocimiento arbitrario (ejemplo: 2)
            "category": "GenericStats"
        }


def pregunta_escuderia_descalificada_aleron_ilegal():
    cursor.execute("""
        SELECT c.name
        FROM results r
        JOIN races ra ON r.raceId = ra.raceId
        JOIN constructors c ON r.constructorId = c.constructorId
        WHERE ra.year = 2012 AND ra.round = 18 AND r.position = 1 AND r.constructorId = 7
    """)
    row = cursor.fetchone()
    if not row:
        return None
    escuderia = row[0]
    pregunta = f"¿Qué escudería fue descalificada por un alerón ilegal en clasificación?"
    incorrectas = get_respuestas_incorrectas(escuderia, constructores_cache)
    opciones = incorrectas + [escuderia]
    random.shuffle(opciones)
    return {
            "question": pregunta,
            "answers": opciones,               # <- "answers" en lugar de "options"
            "correctAnswer": escuderia,           # <- "correctAnswer" en lugar de "answer"
            "knowledgeLevel": 1,            # nivel conocimiento arbitrario (ejemplo: 2)
            "category": "GenericStats"
        }

def pregunta_piloto_victoria_ultimo_cambio_neumaticos():
    cursor.execute("""
        SELECT d.forename, d.surname, c.name
        FROM results r
        JOIN races ra ON r.raceId = ra.raceId
        JOIN circuits c ON ra.circuitId = c.circuitId
        JOIN drivers d ON r.driverId = d.driverId
        WHERE ra.year = 2020 AND r.position = 1 AND ra.circuitId = 14
    """)
    row = cursor.fetchone()
    if not row:
        return None
    piloto = f"{row[0]} {row[1]}"
    pregunta = f"¿Qué piloto ganó un GP tras cambiar de neumáticos en la última vuelta?"
    incorrectas = get_respuestas_incorrectas(piloto, pilotos_cache)
    opciones = incorrectas + [piloto]
    random.shuffle(opciones)
    return {
            "question": pregunta,
            "answers": opciones,               # <- "answers" en lugar de "options"
            "correctAnswer": piloto,           # <- "correctAnswer" en lugar de "answer"
            "knowledgeLevel": 1,            # nivel conocimiento arbitrario (ejemplo: 2)
            "category": "GenericStats"
        }

def pregunta_piloto_debut_victoria():
    cursor.execute("""
        SELECT d.forename, d.surname
        FROM results r
        JOIN drivers d ON r.driverId = d.driverId
        JOIN races ra ON r.raceId = ra.raceId
        WHERE r.position = 1 AND ra.round = 1 AND ra.year = 1950
    """)
    row = cursor.fetchone()
    if not row:
        return None
    piloto = f"{row[0]} {row[1]}"
    pregunta = f"¿Qué piloto ganó en su debut en Fórmula 1?"
    incorrectas = get_respuestas_incorrectas(piloto, pilotos_cache)
    opciones = incorrectas + [piloto]
    random.shuffle(opciones)
    return {
            "question": pregunta,
            "answers": opciones,               # <- "answers" en lugar de "options"
            "correctAnswer": piloto,           # <- "correctAnswer" en lugar de "answer"
            "knowledgeLevel": 1,            # nivel conocimiento arbitrario (ejemplo: 2)
            "category": "GenericStats"
        }

def pregunta_primer_circuito_urbano():
    pregunta = "¿Cuál fue el primer circuito urbano en albergar un GP?"
    opciones = ["Monaco", "Baku", "Singapur", "Azerbaiyán"]
    random.shuffle(opciones)
    return {
            "question": pregunta,
            "answers": opciones,               # <- "answers" en lugar de "options"
            "correctAnswer": "Monaco",           # <- "correctAnswer" en lugar de "answer"
            "knowledgeLevel": 1,            # nivel conocimiento arbitrario (ejemplo: 2)
            "category": "GenericStats"
        }

def pregunta_escuderia_debut_victoria():
    cursor.execute("""
        SELECT c.name
        FROM results r
        JOIN constructors c ON r.constructorId = c.constructorId
        WHERE r.position = 1 AND ra.round = 1
    """)
    row = cursor.fetchone()
    if not row:
        return None
    escuderia = row[0]
    pregunta = f"¿Qué escudería debutó con victoria en su primera carrera?"
    incorrectas = get_respuestas_incorrectas(escuderia, constructores_cache)
    opciones = incorrectas + [escuderia]
    random.shuffle(opciones)
    return {
            "question": pregunta,
            "answers": opciones,               # <- "answers" en lugar de "options"
            "correctAnswer": escuderia,           # <- "correctAnswer" en lugar de "answer"
            "knowledgeLevel": 1,            # nivel conocimiento arbitrario (ejemplo: 2)
            "category": "GenericStats"
        }

def pregunta_piloto_sin_podio_largo():
    cursor.execute("""
        SELECT d.forename, d.surname, COUNT(*) as años
        FROM results r
        JOIN drivers d ON r.driverId = d.driverId
        WHERE r.position != 1 AND r.position != 2 AND r.position != 3
        GROUP BY d.driverId
        ORDER BY años DESC
        LIMIT 1
    """)
    row = cursor.fetchone()
    if not row:
        return None
    piloto = f"{row[0]} {row[1]}"
    pregunta = f"¿Qué piloto corrió más años sin subir al podio?"
    incorrectas = get_respuestas_incorrectas(piloto, pilotos_cache)
    opciones = incorrectas + [piloto]
    random.shuffle(opciones)
    return {
            "question": pregunta,
            "answers": opciones,               # <- "answers" en lugar de "options"
            "correctAnswer": piloto,           # <- "correctAnswer" en lugar de "answer"
            "knowledgeLevel": 1,            # nivel conocimiento arbitrario (ejemplo: 2)
            "category": "GenericStats"
        }

def pregunta_primer_gp_fuera_europa():
    cursor.execute("""
        SELECT ra.year, c.name
        FROM races ra
        JOIN circuits c ON ra.circuitId = c.circuitId
        WHERE c.country != 'Europe'
        ORDER BY ra.year ASC
        LIMIT 1
    """)
    row = cursor.fetchone()
    if not row:
        return None
    pais = row[1]
    pregunta = f"¿Cuál fue el primer país en celebrar un GP fuera de Europa?"
    opciones = get_respuestas_incorrectas(pais, [r[0] for r in cursor.execute("SELECT country FROM circuits WHERE country != %s", (pais,)) or []])
    opciones.append(pais)
    random.shuffle(opciones)
    return {
            "question": pregunta,
            "answers": opciones,               # <- "answers" en lugar de "options"
            "correctAnswer": pais,           # <- "correctAnswer" en lugar de "answer"
            "knowledgeLevel": 1,            # nivel conocimiento arbitrario (ejemplo: 2)
            "category": "GenericStats"
        }

def pregunta_circuito_mas_largo():
    cursor.execute("""
        SELECT c.name
        FROM circuits c
        WHERE c.length = (SELECT MAX(length) FROM circuits)
    """)
    row = cursor.fetchone()
    if not row:
        return None
    circuito = row[0]
    pregunta = f"¿Qué circuito es el más largo del calendario?"
    opciones = get_respuestas_incorrectas(circuito, [r[0] for r in cursor.execute("SELECT name FROM circuits WHERE name != %s", (circuito,)) or []])
    opciones.append(circuito)
    random.shuffle(opciones)
    return {
            "question": pregunta,
            "answers": opciones,               # <- "answers" en lugar de "options"
            "correctAnswer": circuito,           # <- "correctAnswer" en lugar de "answer"
            "knowledgeLevel": 1,            # nivel conocimiento arbitrario (ejemplo: 2)
            "category": "GenericStats"
        }

def pregunta_pais_mas_gran_premios():
    cursor.execute("""
        SELECT c.country, COUNT(*) as total_gp
        FROM races r
        JOIN circuits c ON r.circuitId = c.circuitId
        GROUP BY c.country
        ORDER BY total_gp DESC
        LIMIT 1
    """)
    row = cursor.fetchone()
    if not row:
        return None
    pais = row[0]
    pregunta = f"¿En qué país se ha disputado el mayor número de Grandes Premios?"
    opciones = get_respuestas_incorrectas(pais, [r[0] for r in cursor.execute("SELECT country FROM circuits WHERE country != %s", (pais,)) or []])
    opciones.append(pais)
    random.shuffle(opciones)
    return {
            "question": pregunta,
            "answers": opciones,               # <- "answers" en lugar de "options"
            "correctAnswer": pais,           # <- "correctAnswer" en lugar de "answer"
            "knowledgeLevel": 1,            # nivel conocimiento arbitrario (ejemplo: 2)
            "category": "GenericStats"
        }

def pregunta_piloto_combustible_ilegal():
    cursor.execute("""
        SELECT d.forename, d.surname
        FROM results r
        JOIN drivers d ON r.driverId = d.driverId
        WHERE r.statusId = (SELECT statusId FROM status WHERE status LIKE 'Fuel%' LIMIT 1)
    """)
    row = cursor.fetchone()
    if not row:
        return None
    piloto = f"{row[0]} {row[1]}"
    pregunta = f"¿Qué piloto fue descalificado por tener combustible ilegal?"
    incorrectas = get_respuestas_incorrectas(piloto, pilotos_cache)
    opciones = incorrectas + [piloto]
    random.shuffle(opciones)
    return {
            "question": pregunta,
            "answers": opciones,               # <- "answers" en lugar de "options"
            "correctAnswer": piloto,           # <- "correctAnswer" en lugar de "answer"
            "knowledgeLevel": 1,            # nivel conocimiento arbitrario (ejemplo: 2)
            "category": "GenericStats"
        }

def pregunta_gp_suspendido_por_lluvia():
    cursor.execute("""
        SELECT ra.year, c.name
        FROM races ra
        JOIN circuits c ON ra.circuitId = c.circuitId
        WHERE ra.status = 'Suspended' AND ra.laps_completed = 0
    """)
    row = cursor.fetchone()
    if not row:
        return None
    circuito = row[1]
    pregunta = f"¿Qué GP fue suspendido por lluvia intensa sin dar una vuelta completa?"
    opciones = get_respuestas_incorrectas(circuito, [r[0] for r in cursor.execute("SELECT name FROM circuits WHERE name != %s", (circuito,)) or []])
    opciones.append(circuito)
    random.shuffle(opciones)
    return {
            "question": pregunta,
            "answers": opciones,               # <- "answers" en lugar de "options"
            "correctAnswer": circuito,           # <- "correctAnswer" en lugar de "answer"
            "knowledgeLevel": 1,            # nivel conocimiento arbitrario (ejemplo: 2)
            "category": "GenericStats"
        }

def pregunta_ciudad_carrera_nocturna():
    cursor.execute("""
        SELECT c.name
        FROM circuits c
        WHERE c.name LIKE '%Night%'
    """)
    row = cursor.fetchone()
    if not row:
        return None
    ciudad = row[0]
    pregunta = f"¿Qué ciudad ha acogido una carrera nocturna de Fórmula 1?"
    opciones = get_respuestas_incorrectas(ciudad, [r[0] for r in cursor.execute("SELECT name FROM circuits WHERE name != %s", (ciudad,)) or []])
    opciones.append(ciudad)
    random.shuffle(opciones)
    return {
            "question": pregunta,
            "answers": opciones,               # <- "answers" en lugar de "options"
            "correctAnswer": ciudad,           # <- "correctAnswer" en lugar de "answer"
            "knowledgeLevel": 1,            # nivel conocimiento arbitrario (ejemplo: 2)
            "category": "GenericStats"
        }

def pregunta_piloto_mas_participaciones_escuderia():
    cursor.execute("""
        SELECT d.forename, d.surname, c.name, COUNT(*) as participaciones
        FROM results r
        JOIN drivers d ON r.driverId = d.driverId
        JOIN constructors c ON r.constructorId = c.constructorId
        GROUP BY d.driverId, c.constructorId
        ORDER BY participaciones DESC
        LIMIT 1
    """)
    row = cursor.fetchone()
    if not row:
        return None
    piloto = f"{row[0]} {row[1]}"
    escuderia = row[2]
    pregunta = f"¿Qué piloto tiene más participaciones en una misma escudería?"
    incorrectas = get_respuestas_incorrectas(piloto, pilotos_cache)
    opciones = incorrectas + [f"{piloto} ({escuderia})"]
    random.shuffle(opciones)
    return {
            "question": pregunta,
            "answers": opciones,               # <- "answers" en lugar de "options"
            "correctAnswer": f"{piloto} ({escuderia})",           # <- "correctAnswer" en lugar de "answer"
            "knowledgeLevel": 1,            # nivel conocimiento arbitrario (ejemplo: 2)
            "category": "GenericStats"
        }

def pregunta_gp_mas_antiguo():
    cursor.execute("""
        SELECT ra.year, c.name
        FROM races ra
        JOIN circuits c ON ra.circuitId = c.circuitId
        ORDER BY ra.year ASC
        LIMIT 1
    """)
    row = cursor.fetchone()
    if not row:
        return None
    circuito = row[1]
    pregunta = f"¿Cuál es el Gran Premio más antiguo del calendario actual?"
    opciones = get_respuestas_incorrectas(circuito, [r[0] for r in cursor.execute("SELECT name FROM circuits WHERE name != %s", (circuito,)) or []])
    opciones.append(circuito)
    random.shuffle(opciones)
    return {
            "question": pregunta,
            "answers": opciones,               # <- "answers" en lugar de "options"
            "correctAnswer": circuito,           # <- "correctAnswer" en lugar de "answer"
            "knowledgeLevel": 1,            # nivel conocimiento arbitrario (ejemplo: 2)
            "category": "GenericStats"
        }

def pregunta_piloto_primera_victoria_joven():
    cursor.execute("""
        SELECT d.forename, d.surname, MIN(ra.year) as anio_victoria
        FROM results r
        JOIN races ra ON r.raceId = ra.raceId
        JOIN drivers d ON r.driverId = d.driverId
        WHERE r.position = 1
        GROUP BY r.driverId
        ORDER BY anio_victoria ASC
        LIMIT 1
    """)
    row = cursor.fetchone()
    if not row:
        return None
    piloto = f"{row[0]} {row[1]}"
    pregunta = f"¿Qué piloto logró su primera victoria más joven?"
    opciones = get_respuestas_incorrectas(piloto, pilotos_cache)
    opciones.append(piloto)
    random.shuffle(opciones)
    return {
            "question": pregunta,
            "answers": opciones,               # <- "answers" en lugar de "options"
            "correctAnswer": piloto,           # <- "correctAnswer" en lugar de "answer"
            "knowledgeLevel": 1,            # nivel conocimiento arbitrario (ejemplo: 2)
            "category": "GenericStats"
        }
def pregunta_escuderia_mas_dobletes():
    cursor.execute("""
        SELECT c.name, COUNT(*) as dobletes
        FROM results r
        JOIN constructors c ON r.constructorId = c.constructorId
        WHERE r.position = 1 OR r.position = 2
        GROUP BY c.name
        ORDER BY dobletes DESC
        LIMIT 1
    """)
    row = cursor.fetchone()
    if not row:
        return None
    escuderia = row[0]
    pregunta = f"¿Qué escudería ha logrado más dobletes (1º y 2º puesto) en la misma carrera?"
    opciones = get_respuestas_incorrectas(escuderia, constructores_cache)
    opciones.append(escuderia)
    random.shuffle(opciones)
    return {
            "question": pregunta,
            "answers": opciones,               # <- "answers" en lugar de "options"
            "correctAnswer": escuderia,           # <- "correctAnswer" en lugar de "answer"
            "knowledgeLevel": 1,            # nivel conocimiento arbitrario (ejemplo: 2)
            "category": "GenericStats"
        }

def pregunta_piloto_mas_temporadas_consecutivas():
    cursor.execute("""
        SELECT d.forename, d.surname, COUNT(DISTINCT ra.year) as temporadas
        FROM results r
        JOIN races ra ON r.raceId = ra.raceId
        JOIN drivers d ON r.driverId = d.driverId
        WHERE r.position != 0
        GROUP BY r.driverId
        ORDER BY temporadas DESC
        LIMIT 1
    """)
    row = cursor.fetchone()
    if not row:
        return None
    piloto = f"{row[0]} {row[1]}"
    pregunta = f"¿Qué piloto tiene más temporadas consecutivas en F1?"
    opciones = get_respuestas_incorrectas(piloto, pilotos_cache)
    opciones.append(piloto)
    random.shuffle(opciones)
    return {
            "question": pregunta,
            "answers": opciones,               # <- "answers" en lugar de "options"
            "correctAnswer": piloto,           # <- "correctAnswer" en lugar de "answer"
            "knowledgeLevel": 1,            # nivel conocimiento arbitrario (ejemplo: 2)
            "category": "GenericStats"
        }


def pregunta_piloto_mas_victorias_temporada():
    cursor.execute("""
        SELECT d.forename, d.surname, ra.year, COUNT(*) as victorias
        FROM results r
        JOIN drivers d ON r.driverId = d.driverId
        JOIN races ra ON r.raceId = ra.raceId
        WHERE r.position = 1
        GROUP BY d.driverId, ra.year
        ORDER BY victorias DESC
        LIMIT 1
    """)
    row = cursor.fetchone()
    if not row:
        return None
    piloto = f"{row[0]} {row[1]}"
    pregunta = f"¿Qué piloto logró más victorias en una temporada?"
    incorrectas = get_respuestas_incorrectas(piloto, pilotos_cache)
    opciones = incorrectas + [piloto]
    random.shuffle(opciones)
    return {
            "question": pregunta,
            "answers": opciones,               # <- "answers" en lugar de "options"
            "correctAnswer": piloto,           # <- "correctAnswer" en lugar de "answer"
            "knowledgeLevel": 1,            # nivel conocimiento arbitrario (ejemplo: 2)
            "category": "GenericStats"
        }

def pregunta_piloto_compartio_podio_mas_veces():
    cursor.execute("""
        SELECT d.forename, d.surname, COUNT(*) as podios
        FROM results r
        JOIN drivers d ON r.driverId = d.driverId
        WHERE r.position <= 3
        GROUP BY r.driverId
        ORDER BY podios DESC
        LIMIT 1
    """)
    row = cursor.fetchone()
    if not row:
        return None
    piloto = f"{row[0]} {row[1]}"
    pregunta = f"¿Qué piloto compartió más veces podio con otro piloto?"
    incorrectas = get_respuestas_incorrectas(piloto, pilotos_cache)
    opciones = incorrectas + [piloto]
    random.shuffle(opciones)
    return {
            "question": pregunta,
            "answers": opciones,               # <- "answers" en lugar de "options"
            "correctAnswer": piloto,           # <- "correctAnswer" en lugar de "answer"
            "knowledgeLevel": 1,            # nivel conocimiento arbitrario (ejemplo: 2)
            "category": "GenericStats"
        }

def pregunta_piloto_mas_carreras_sin_victoria():
    cursor.execute("""
        SELECT d.forename, d.surname, COUNT(*) as carreras
        FROM results r
        JOIN drivers d ON r.driverId = d.driverId
        WHERE r.position != 1
        GROUP BY r.driverId
        ORDER BY carreras DESC
        LIMIT 1
    """)
    row = cursor.fetchone()
    if not row:
        return None
    piloto = f"{row[0]} {row[1]}"
    pregunta = f"¿Qué piloto ha disputado más carreras sin victoria?"
    incorrectas = get_respuestas_incorrectas(piloto, pilotos_cache)
    opciones = incorrectas + [piloto]
    random.shuffle(opciones)
    return {
            "question": pregunta,
            "answers": opciones,               # <- "answers" en lugar de "options"
            "correctAnswer": piloto,           # <- "correctAnswer" en lugar de "answer"
            "knowledgeLevel": 1,            # nivel conocimiento arbitrario (ejemplo: 2)
            "category": "GenericStats"
        }

def pregunta_constructor_mas_podios_temporada():
    cursor.execute("""
        SELECT c.name, COUNT(*) as podios
        FROM results r
        JOIN constructors c ON r.constructorId = c.constructorId
        WHERE r.position <= 3
        GROUP BY c.name
        ORDER BY podios DESC
        LIMIT 1
    """)
    row = cursor.fetchone()
    if not row:
        return None
    escuderia = row[0]
    pregunta = f"¿Qué constructor logró más podios en una temporada?"
    incorrectas = get_respuestas_incorrectas(escuderia, constructores_cache)
    opciones = incorrectas + [escuderia]
    random.shuffle(opciones)
    return {
            "question": pregunta,
            "answers": opciones,               # <- "answers" en lugar de "options"
            "correctAnswer": escuderia,           # <- "correctAnswer" en lugar de "answer"
            "knowledgeLevel": 1,            # nivel conocimiento arbitrario (ejemplo: 2)
            "category": "GenericStats"
        }


    return {
            "question": pregunta,
            "answers": opciones,               # <- "answers" en lugar de "options"
            "correctAnswer": escuderia,           # <- "correctAnswer" en lugar de "answer"
            "knowledgeLevel": 1,            # nivel conocimiento arbitrario (ejemplo: 2)
            "category": "SafetyCar"
        }


generadores = [
    # **Estadísticas genéricas parte 1**
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
    generar_pregunta_campeon_constructores,

    # **Duelos Legendarios**
    pregunta_rival_de_senna_en_mclaren,
    pregunta_piloto_perdio_titulo_en_ultima_curva_2008,
    pregunta_rival_schumacher_2000,
    pregunta_ano_choque_hamilton_rosberg_espana,
    pregunta_duelo_vettel_canada_2019,

    # Temporadas Históricas (Wrappers)
    pregunta_piloto_campeon_temporada_wrapper,
    pregunta_constructor_campeon_temporada_wrapper,
    pregunta_gp_mas_abandonos_temporada_wrapper,
    pregunta_victorias_campeon_temporada_wrapper,
    pregunta_ultimo_gp_temporada_wrapper,
    pregunta_piloto_mas_poles_temporada_wrapper,
    pregunta_circuito_mas_vueltas_temporada_wrapper,
    pregunta_escuderia_mas_abandonos_temporada_wrapper,
    pregunta_cuantos_pilotos_ganaron_temporada_wrapper,
    pregunta_piloto_mas_puntos_sin_ganar_temporada_wrapper,

    # **Preguntas sobre escudería en concreto**
    pregunta_piloto_mas_victorias_escuderia_wrapper,
    pregunta_temporada_mas_puntos_escuderia_wrapper,
    pregunta_poles_totales_escuderia_wrapper,
    pregunta_circuito_mas_victorias_escuderia_wrapper,
    pregunta_campeonatos_constructores_escuderia_wrapper,

    # **Preguntas sobre un circuito en concreto
    pregunta_constructor_mas_abandonos_circuito_wrapped,
    pregunta_piloto_mas_poles_sin_ganar_circuito_wrapped,
    pregunta_anio_mas_cambios_lider_wrapped,
    pregunta_anio_mas_abandonos_circuito_wrapped,
    pregunta_piloto_pole_y_vuelta_rapida_misma_edicion_wrapped,
    pregunta_anio_velocidad_promedio_mas_alta_wrapped,
    pregunta_pais_circuito_wrapped,
    pregunta_anio_cancelado_del_calendario_wrapped,
    pregunta_piloto_fue_campeon_en_ese_circuito_wrapped,
    pregunta_gp_con_mas_campeones_en_circuito_wrapped,
    pregunta_piloto_mas_victorias_circuito_wrapped,
    pregunta_constructor_mas_poles_circuito_wrapped,
    pregunta_ano_mas_abandonos_circuito_wrapped,
    pregunta_numero_gp_en_circuito_wrapped,
    pregunta_anio_vuelta_rapida_circuito_wrapped,
    pregunta_piloto_mas_abandonos_escuderia_wrapped,
    pregunta_peor_temporada_puntos_escuderia_wrapped,

    # **Preguntas sobre un PILOTO en concreto
    pregunta_circuito_mas_abandonos_piloto_wrapped,
    pregunta_puntos_consecutivos_piloto_wrapped,
    pregunta_promedio_posicion_clasificacion_wrapped,
    pregunta_temporada_mas_paradas_boxes_wrapped,
    pregunta_porcentaje_carreras_finalizadas_wrapped,
    pregunta_circuito_no_victoria_piloto_wrapped,
    pregunta_pilotos_distintos_compitio_wrapped,
    pregunta_racha_sin_ganar_wrapped,
    pregunta_peor_posicion_clasificacion_piloto_wrapped,
    pregunta_remontadas_puesto_15_piloto_wrapped,
    pregunta_carreras_lideradas_piloto_wrapped,
    pregunta_supero_mas_clasificacion_wrapped,
    pregunta_mejor_vuelta_rapida_wrapped,
    pregunta_piloto_anio_mas_puntos_wrapped,
    pregunta_escuderias_distintas_piloto_wrapped,
    pregunta_gp_mas_participaciones_piloto_wrapped,
    pregunta_abandonos_piloto_wrapped,
    pregunta_ultimo_gp_victoria_piloto_wrapped,
    pregunta_companero_podio_piloto_wrapped,
    pregunta_ano_debut_piloto_wrapped,
    pregunta_primera_victoria_escuderia_piloto_wrapped,
    pregunta_poles_piloto_wrapped,
    pregunta_circuito_mas_podios_piloto_wrapped,
    pregunta_pais_mas_victorias_piloto_wrapped,
    pregunta_obtener_victorias_piloto_wrapped,

    # **Estadísticas genéricas parte 2**
    pregunta_piloto_gano_en_mas_paises,
    pregunta_circuito_campeones_distintos,
    pregunta_piloto_sin_pole_subio_podio,
    pregunta_pais_mas_constructores,
    pregunta_piloto_mas_vueltas_rapidas_sin_puntos,
    pregunta_piloto_perdio_campeonato_por_un_punto,
    pregunta_escuderia_descalificada_aleron_ilegal,
    pregunta_piloto_victoria_ultimo_cambio_neumaticos,
    pregunta_piloto_debut_victoria,
    pregunta_primer_circuito_urbano,
    pregunta_escuderia_debut_victoria,
    pregunta_piloto_sin_podio_largo,
    pregunta_primer_gp_fuera_europa,
    pregunta_circuito_mas_largo,
    pregunta_pais_mas_gran_premios,
    pregunta_piloto_combustible_ilegal,
    pregunta_gp_suspendido_por_lluvia,
    pregunta_ciudad_carrera_nocturna,
    pregunta_piloto_mas_participaciones_escuderia,
    pregunta_gp_mas_antiguo,
    pregunta_piloto_primera_victoria_joven,
    pregunta_escuderia_mas_dobletes,
    pregunta_piloto_mas_temporadas_consecutivas,
    pregunta_piloto_mas_victorias_temporada,
    pregunta_piloto_mas_carreras_sin_victoria,
    pregunta_piloto_compartio_podio_mas_veces,
    pregunta_piloto_mas_victorias_temporada,
    pregunta_constructor_mas_podios_temporada
]

if __name__ == "__main__":

    NUM_PREGUNTAS = 10
    MAX_INTENTOS = 50



    intentos_totales = 0
    while len(preguntas) < NUM_PREGUNTAS and intentos_totales < 50:
        intentos_totales += 1
        generador = random.choice(generadores)
        try:
            resultado = generador()
            if resultado is not None:  # Añade esta validación
                preguntas.append(resultado)
        except Exception as e:
            continue

        parser = argparse.ArgumentParser()
        parser.add_argument("--category", type=str, help="Filtrar por categoría (opcional)", default=None)
        args = parser.parse_args()

        categoria_objetivo = args.category.strip() if args.category else None

        # Importar o definir la lista de generadores
        from generate_questions import generadores  # o asegúrate que esté arriba

        # 🔍 Filtrar los generadores por categoría
        generadores_filtrados = []
        for gen in generadores:
            try:
                muestra = gen()
                if muestra is None:
                    continue
                if categoria_objetivo and muestra.get("category") != categoria_objetivo:
                    continue
                generadores_filtrados.append(gen)
            except Exception:
                continue

        if categoria_objetivo and not generadores_filtrados:
            print(f"[ERROR] No hay funciones disponibles para la categoría: {categoria_objetivo}", file=sys.stderr)
            sys.exit(1)

        # 🎯 Ahora usar solo generadores de la categoría deseada (o todos si no hay filtro)
        generadores_uso = generadores_filtrados if categoria_objetivo else generadores

        intentos = 0
        while len(preguntas) < NUM_PREGUNTAS and intentos < MAX_INTENTOS:
            intentos += 1
            generador = random.choice(generadores_uso)
            try:
                resultado = generador()
                if resultado is None:
                    continue
                if resultado not in preguntas:
                    preguntas.append(resultado)
            except Exception:
                continue

        if not preguntas:
            print(f"[ERROR] No se encontraron preguntas para la categoría: {categoria_objetivo}", file=sys.stderr)
            sys.exit(1)

    conn.close()
    print(json.dumps(preguntas, ensure_ascii=False))
