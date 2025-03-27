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

def generar_pregunta_piloto_con_mas_gp_disputados():
    cursor.execute("""
        SELECT d.forename, d.surname, COUNT(*) as carreras
        FROM results res
        JOIN drivers d ON res.driverId = d.driverId
        GROUP BY d.driverId
        ORDER BY carreras DESC
        LIMIT 1
    """)
    nombre, apellido, _ = cursor.fetchone()
    correcta = f"{nombre} {apellido}"
    pregunta = "¿Qué piloto ha disputado más Grandes Premios en la historia de la F1?"

    opciones = get_respuestas_incorrectas(correcta, pilotos_cache) + [correcta]
    random.shuffle(opciones)

    return {"question": pregunta, "answers": opciones, "correctAnswer": correcta, "knowledgeLevel": 2}

def generar_pregunta_piloto_primera_victoria_reciente():
    cursor.execute("""
        SELECT r.year, r.name, d.forename, d.surname
        FROM results res
        JOIN races r ON res.raceId = r.raceId
        JOIN drivers d ON res.driverId = d.driverId
        WHERE res.positionOrder = 1 AND r.year >= 2020
        ORDER BY RAND()
        LIMIT 1
    """)
    year, gp, nombre, apellido = cursor.fetchone()
    correcta = f"{nombre} {apellido}"
    pregunta = f"¿Qué piloto logró su primera victoria en el GP de {gp} en {year}?"

    opciones = get_respuestas_incorrectas(correcta, pilotos_cache) + [correcta]
    random.shuffle(opciones)

    return {"question": pregunta, "answers": opciones, "correctAnswer": correcta, "knowledgeLevel": 2}

def generar_pregunta_constructor_mas_titulos():
    cursor.execute("""
        SELECT c.name, COUNT(DISTINCT r.year) as titulos
        FROM constructorStandings cs
        JOIN constructors c ON cs.constructorId = c.constructorId
        JOIN races r ON cs.raceId = r.raceId
        WHERE cs.position = 1
        GROUP BY cs.constructorId
        ORDER BY titulos DESC
        LIMIT 1
    """)
    (constructor, _) = cursor.fetchone()
    pregunta = "¿Qué constructor ha ganado más títulos de constructores en F1?"

    opciones = get_respuestas_incorrectas(constructor, constructores_cache) + [constructor]
    random.shuffle(opciones)

    return {"question": pregunta, "answers": opciones, "correctAnswer": constructor, "knowledgeLevel": 3}

def generar_pregunta_donde_nacio_piloto():
    cursor.execute("""
        SELECT forename, surname, nationality
        FROM drivers
        WHERE nationality IS NOT NULL
        ORDER BY RAND()
        LIMIT 1
    """)
    nombre, apellido, nacionalidad = cursor.fetchone()
    correcta = nacionalidad
    piloto = f"{nombre} {apellido}"
    pregunta = f"¿Cuál es la nacionalidad de {piloto}?"

    opciones = get_respuestas_incorrectas(correcta, paises_cache) + [correcta]
    random.shuffle(opciones)

    return {"question": pregunta, "answers": opciones, "correctAnswer": correcta, "knowledgeLevel": 1}

def generar_pregunta_piloto_ultimo_gp_anio():
    cursor.execute("""
        SELECT r.year, r.name, d.forename, d.surname
        FROM results res
        JOIN races r ON res.raceId = r.raceId
        JOIN drivers d ON res.driverId = d.driverId
        WHERE res.positionOrder = 1 AND r.round = (
            SELECT MAX(round) FROM races r2 WHERE r2.year = r.year
        )
        ORDER BY r.year DESC
        LIMIT 1
    """)
    year, gp, nombre, apellido = cursor.fetchone()
    correcta = f"{nombre} {apellido}"
    pregunta = f"¿Quién ganó el último Gran Premio de la temporada {year} ({gp})?"

    opciones = get_respuestas_incorrectas(correcta, pilotos_cache) + [correcta]
    random.shuffle(opciones)

    return {"question": pregunta, "answers": opciones, "correctAnswer": correcta, "knowledgeLevel": 2}


def generar_pregunta_piloto_mas_podios_en_gp():
    cursor.execute("""
        SELECT r.name, d.forename, d.surname, COUNT(*) as podios
        FROM results res
        JOIN races r ON res.raceId = r.raceId
        JOIN drivers d ON res.driverId = d.driverId
        WHERE res.positionOrder <= 3
        GROUP BY r.name, res.driverId
        HAVING podios >= 2
        ORDER BY RAND()
        LIMIT 1
    """)
    gp, nombre, apellido, _ = cursor.fetchone()
    correcta = f"{nombre} {apellido}"
    pregunta = f"¿Qué piloto tiene más podios en el GP de {gp}?"

    opciones = get_respuestas_incorrectas(correcta, pilotos_cache) + [correcta]
    random.shuffle(opciones)
    return {"question": pregunta, "answers": opciones, "correctAnswer": correcta, "knowledgeLevel": 3}


def generar_pregunta_piloto_mas_podios_totales():
    cursor.execute("""
        SELECT d.forename, d.surname, COUNT(*) as podios
        FROM results res
        JOIN drivers d ON res.driverId = d.driverId
        WHERE res.positionOrder <= 3
        GROUP BY res.driverId
        HAVING podios > 20
        ORDER BY RAND()
        LIMIT 1
    """)
    nombre, apellido, _ = cursor.fetchone()
    correcta = f"{nombre} {apellido}"
    pregunta = f"¿Qué piloto tiene más podios en su carrera?"

    opciones = get_respuestas_incorrectas(correcta, pilotos_cache) + [correcta]
    random.shuffle(opciones)
    return {"question": pregunta, "answers": opciones, "correctAnswer": correcta, "knowledgeLevel": 2}


def generar_pregunta_piloto_mas_poles_en_circuito():
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
        SELECT d.forename, d.surname, COUNT(*) as poles
        FROM qualifying q
        JOIN races r ON q.raceId = r.raceId
        JOIN circuits c ON r.circuitId = c.circuitId
        JOIN drivers d ON q.driverId = d.driverId
        WHERE q.position = 1 AND c.name = %s
        GROUP BY q.driverId
        ORDER BY poles DESC
        LIMIT 1
    """, (circuito,))
    nombre, apellido, _ = cursor.fetchone()
    correcta = f"{nombre} {apellido}"
    pregunta = f"¿Qué piloto ha conseguido más poles en el circuito {circuito}?"

    opciones = get_respuestas_incorrectas(correcta, pilotos_cache) + [correcta]
    random.shuffle(opciones)
    return {"question": pregunta, "answers": opciones, "correctAnswer": correcta, "knowledgeLevel": 3}


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
        SELECT cons.name, COUNT(*) as wins
        FROM results res
        JOIN races r ON res.raceId = r.raceId
        JOIN circuits c ON r.circuitId = c.circuitId
        JOIN constructors cons ON res.constructorId = cons.constructorId
        WHERE res.positionOrder = 1 AND c.name = %s
        GROUP BY cons.constructorId
        ORDER BY wins DESC
        LIMIT 1
    """, (circuito,))
    (constructora, _) = cursor.fetchone()
    pregunta = f"¿Qué constructor ha ganado más veces en el circuito de {circuito}?"

    opciones = get_respuestas_incorrectas(constructora, constructores_cache) + [constructora]
    random.shuffle(opciones)
    return {"question": pregunta, "answers": opciones, "correctAnswer": constructora, "knowledgeLevel": 2}


def generar_pregunta_circuito_mas_carreras():
    cursor.execute("""
        SELECT name, COUNT(*) as veces
        FROM races
        GROUP BY name
        HAVING veces >= 10
        ORDER BY veces DESC
        LIMIT 1
    """)
    (nombre_circuito, _) = cursor.fetchone()
    pregunta = "¿Qué circuito ha sido usado más veces en la historia de la F1?"

    opciones = get_respuestas_incorrectas(nombre_circuito, paises_cache) + [nombre_circuito]
    random.shuffle(opciones)
    return {"question": pregunta, "answers": opciones, "correctAnswer": nombre_circuito, "knowledgeLevel": 2}

def generar_pregunta_piloto_mas_podios_en_gp():
    cursor.execute("""
        SELECT r.name, d.forename, d.surname, COUNT(*) as podios
        FROM results res
        JOIN races r ON res.raceId = r.raceId
        JOIN drivers d ON res.driverId = d.driverId
        WHERE res.positionOrder <= 3
        GROUP BY r.name, res.driverId
        HAVING podios >= 2
        ORDER BY RAND()
        LIMIT 1
    """)
    gp, nombre, apellido, _ = cursor.fetchone()
    correcta = f"{nombre} {apellido}"
    pregunta = f"¿Qué piloto tiene más podios en el GP de {gp}?"

    opciones = get_respuestas_incorrectas(correcta, pilotos_cache) + [correcta]
    random.shuffle(opciones)
    return {"question": pregunta, "answers": opciones, "correctAnswer": correcta, "knowledgeLevel": 3}


def generar_pregunta_piloto_mas_poles_en_circuito():
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
        SELECT d.forename, d.surname, COUNT(*) as poles
        FROM qualifying q
        JOIN races r ON q.raceId = r.raceId
        JOIN circuits c ON r.circuitId = c.circuitId
        JOIN drivers d ON q.driverId = d.driverId
        WHERE q.position = 1 AND c.name = %s
        GROUP BY q.driverId
        ORDER BY poles DESC
        LIMIT 1
    """, (circuito,))
    nombre, apellido, _ = cursor.fetchone()
    correcta = f"{nombre} {apellido}"
    pregunta = f"¿Qué piloto ha conseguido más poles en el circuito {circuito}?"

    opciones = get_respuestas_incorrectas(correcta, pilotos_cache) + [correcta]
    random.shuffle(opciones)
    return {"question": pregunta, "answers": opciones, "correctAnswer": correcta, "knowledgeLevel": 3}


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
        SELECT cons.name, COUNT(*) as wins
        FROM results res
        JOIN races r ON res.raceId = r.raceId
        JOIN circuits c ON r.circuitId = c.circuitId
        JOIN constructors cons ON res.constructorId = cons.constructorId
        WHERE res.positionOrder = 1 AND c.name = %s
        GROUP BY cons.constructorId
        ORDER BY wins DESC
        LIMIT 1
    """, (circuito,))
    (constructora, _) = cursor.fetchone()
    pregunta = f"¿Qué constructor ha ganado más veces en el circuito de {circuito}?"

    opciones = get_respuestas_incorrectas(constructora, constructores_cache) + [constructora]
    random.shuffle(opciones)
    return {"question": pregunta, "answers": opciones, "correctAnswer": constructora, "knowledgeLevel": 2}


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

    return {"question": pregunta, "answers": opciones, "correctAnswer": correcta, "knowledgeLevel": 1}


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

generadores = [
    generar_pregunta_ganador_gp,
    generar_pregunta_escuderia_ganadora,
    generar_pregunta_tercero_gp,
    generar_pregunta_piloto_con_mas_gp_disputados,
    generar_pregunta_piloto_primera_victoria_reciente,
    generar_pregunta_constructor_mas_titulos,
    generar_pregunta_donde_nacio_piloto,
    generar_pregunta_piloto_ultimo_gp_anio,
    generar_pregunta_piloto_mas_podios_en_gp,
    generar_pregunta_piloto_mas_podios_totales,
    generar_pregunta_piloto_mas_poles_en_circuito,
    generar_pregunta_constructor_mas_victorias_en_circuito,
    generar_pregunta_circuito_mas_carreras,
    generar_pregunta_piloto_mas_victorias_en_circuito,
    generar_pregunta_constructor_mas_victorias_en_pais,
    generar_pregunta_segundo_gp,
    generar_pregunta_campeon_pilotos,
    generar_pregunta_campeon_constructores
]

NUM_PREGUNTAS = 10
while len(preguntas) < NUM_PREGUNTAS:
   generador = random.choice(generadores)
   try:
       preguntas.append(generador())
   except Exception:
       continue


conn.close()
print(json.dumps(preguntas, ensure_ascii=False))