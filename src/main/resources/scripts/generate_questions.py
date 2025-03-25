import os

# Idioma configurable: "es" o "en"
LANG = os.getenv("LANG", "es")

# Diccionario de traducciones
TRANSLATIONS = {
    "es": {
        "gp_win": "¿Quién ganó el {gp} en {year}?",
        "team_win": "¿Qué escudería ganó el {gp} en {year}?",
        "gp_country": "¿En qué país se celebró el {gp} en {year}?",
        "gp_second": "¿Quién quedó segundo en el {gp} en {year}?",
        "gp_third": "¿Quién quedó tercero en el {gp} en {year}?",
        "champ_driver": "¿Qué piloto ganó el campeonato de F1 en {year}?",
        "champ_constructor": "¿Qué constructor ganó el campeonato de F1 en {year}?",
        "most_gp_driver": "¿Qué piloto ha ganado más veces el {gp}?",
        "most_circuit_driver": "¿Qué piloto ha ganado más veces en el circuito {circuit}?",
        "most_country_constructor": "¿Qué constructor ha ganado más veces en {country}?",
        "most_podiums_gp": "¿Qué piloto tiene más podios en el GP de {gp}?",
        "most_podiums_total": "¿Qué piloto tiene más podios en su carrera?",
        "most_poles_circuit": "¿Qué piloto ha conseguido más poles en el circuito {circuit}?",
        "most_constructor_circuit": "¿Qué constructor ha ganado más veces en el circuito de {circuit}?",
        "most_used_circuit": "¿Qué circuito ha sido usado más veces en la historia de la F1?",
        "year_win_gp": "¿En qué año ganó {driver} el {gp}?",
        "most_podium_driver": "¿Qué piloto ha conseguido más podios en la historia de la F1?",
        "most_seconds_constructor": "¿Qué constructor ha finalizado en segunda posición más veces?",
        "most_driver_victories_circuit": "¿Qué piloto ha ganado más veces en el circuito {circuit}?",
        "gp_team_win": "¿Qué equipo ganó el {gp} en {year}?",
        "gp_country_static": "¿En qué país se celebra el Gran Premio {gp}?",
    },
    "en": {
        "gp_win": "Who won the {gp} in {year}?",
        "team_win": "Which team won the {gp} in {year}?",
        "gp_country": "In which country was the {gp} held in {year}?",
        "gp_second": "Who finished second in the {gp} in {year}?",
        "gp_third": "Who finished third in the {gp} in {year}?",
        "champ_driver": "Which driver won the F1 championship in {year}?",
        "champ_constructor": "Which constructor won the F1 championship in {year}?",
        "most_gp_driver": "Which driver has won the {gp} the most times?",
        "most_circuit_driver": "Which driver has the most wins at the {circuit} circuit?",
        "most_country_constructor": "Which constructor has the most wins in {country}?",
        "most_podiums_gp": "Which driver has the most podiums in the {gp} GP?",
        "most_podiums_total": "Which driver has the most career podiums?",
        "most_poles_circuit": "Which driver has the most poles at the {circuit} circuit?",
        "most_constructor_circuit": "Which constructor has the most wins at the {circuit} circuit?",
        "most_used_circuit": "Which circuit has been used most in F1 history?",
        "year_win_gp": "In which year did {driver} win the {gp}?",
        "most_podium_driver": "Which driver has achieved the most podiums in F1 history?",
        "most_seconds_constructor": "Which constructor has finished second the most times?",
        "most_driver_victories_circuit": "Which driver has won the most times at the {circuit} circuit?",
        "gp_team_win": "Which team won the {gp} in {year}?",
        "gp_country_static": "In which country is the {gp} Grand Prix held?",
    }
}

def t(key, **kwargs):
    return TRANSLATIONS[LANG].get(key, key).format(**kwargs)

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
    pregunta = t("gp_win", gp=gp, year=year)
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
    pregunta = t("team_win", gp=gp, year=year)

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
    pregunta = t("gp_country", gp=gp, year=year)

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
    pregunta = t("gp_second", gp=gp, year=year)
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
    pregunta = t("gp_third", gp=gp, year=year)
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
    pregunta = t("champ_driver", year=anio)

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
    pregunta = t("champ_constructor", year=anio)

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
    pregunta = t("most_gp_driver", gp=gp_name)

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
    pregunta = t("most_driver_victories_circuit", circuit=circuito)

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
    pregunta = t("most_country_constructor", country=pais)

    cursor.execute("SELECT name FROM constructors WHERE name != %s ORDER BY RAND() LIMIT 3", (constructora,))
    opciones = [row[0] for row in cursor.fetchall()] + [constructora]
    random.shuffle(opciones)

    return {"question": pregunta, "answers": opciones, "correctAnswer": constructora, "knowledgeLevel": 3}

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
        pregunta = t("most_podiums_gp", gp=gp)

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
        pregunta = t("most_podiums_total")

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
        pregunta = t("most_poles_circuit", circuit=circuito)

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
        pregunta = t("most_constructor_circuit", circuit=circuito)

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

    # --- LISTA DE FUNCIONES ---
    generadores = [
        # Básicas y complejas previas (las que ya tenías)
        generar_pregunta_ganador_gp,
        generar_pregunta_escuderia_ganadora,
        generar_pregunta_pais_gp,
        generar_pregunta_segundo_gp,
        generar_pregunta_tercero_gp,
        generar_pregunta_campeon_pilotos,
        generar_pregunta_campeon_constructores,
        generar_pregunta_piloto_con_mas_victorias_en_gp,
        generar_pregunta_piloto_mas_victorias_en_circuito,
        generar_pregunta_constructor_mas_victorias_en_pais,

        # Nuevas
        generar_pregunta_piloto_mas_podios_en_gp,
        generar_pregunta_piloto_mas_podios_totales,
        generar_pregunta_piloto_mas_poles_en_circuito,
        generar_pregunta_constructor_mas_victorias_en_circuito,
        generar_pregunta_circuito_mas_carreras
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
       pregunta = t("most_podiums_gp", gp=gp)

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
       pregunta = t("most_podiums_total")

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
       pregunta = t("most_poles_circuit", circuit=circuito)

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
       pregunta = t("most_constructor_circuit", circuit=circuito)

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

def generar_pregunta_piloto_con_mas_podios_en_circuito():
    cursor.execute("""
        SELECT c.name
        FROM circuits c
        JOIN races r ON c.circuitId = r.circuitId
        GROUP BY c.name
        HAVING COUNT(*) > 5
        ORDER BY RAND()
        LIMIT 1
    """)
    (circuito,) = cursor.fetchone()

    cursor.execute("""
        SELECT d.forename, d.surname, COUNT(*) AS podios
        FROM results res
        JOIN races r ON res.raceId = r.raceId
        JOIN drivers d ON res.driverId = d.driverId
        JOIN circuits c ON r.circuitId = c.circuitId
        WHERE res.positionOrder IN (1, 2, 3) AND c.name = %s
        GROUP BY d.driverId
        ORDER BY podios DESC
        LIMIT 1
    """, (circuito,))
    nombre, apellido, _ = cursor.fetchone()
    correcta = f"{nombre} {apellido}"
    pregunta = f"¿Qué piloto ha conseguido más podios en el circuito {circuito}?"

    cursor.execute("SELECT CONCAT(forename, ' ', surname) FROM drivers WHERE CONCAT(forename, ' ', surname) != %s ORDER BY RAND() LIMIT 3", (correcta,))
    opciones = [row[0] for row in cursor.fetchall()] + [correcta]
    random.shuffle(opciones)

    return {
        "question": pregunta,
        "answers": opciones,
        "correctAnswer": correcta,
        "knowledgeLevel": 3
    }

def generar_pregunta_anio_victoria_gp():
    cursor.execute("""
        SELECT d.forename, d.surname, r.name, r.year
        FROM results res
        JOIN races r ON res.raceId = r.raceId
        JOIN drivers d ON res.driverId = d.driverId
        WHERE res.positionOrder = 1
        ORDER BY RAND()
        LIMIT 1
    """)
    nombre, apellido, gp, year = cursor.fetchone()
    correcta = str(year)
    piloto = f"{nombre} {apellido}"
    pregunta = t("year_win_gp", driver=piloto, gp=gp)

    years = [str(y) for y in random.sample([y for y in range(1990, 2024) if y != year], 3)] + [correcta]
    random.shuffle(years)

    return {
        "question": pregunta,
        "answers": years,
        "correctAnswer": correcta,
        "knowledgeLevel": 2
    }


def generar_pregunta_piloto_mas_podios():
    cursor.execute("""
        SELECT d.forename, d.surname, COUNT(*) as podios
        FROM results res
        JOIN drivers d ON res.driverId = d.driverId
        WHERE res.positionOrder IN (1, 2, 3)
        GROUP BY res.driverId
        HAVING podios > 30
        ORDER BY podios DESC
        LIMIT 1
    """)
    nombre, apellido, _ = cursor.fetchone()
    correcta = f"{nombre} {apellido}"
    pregunta = "¿Qué piloto ha conseguido más podios en la historia de la F1?"

    opciones = get_respuestas_incorrectas(correcta, pilotos_cache)
    return {
        "question": pregunta,
        "answers": random.sample(opciones + [correcta], 4),
        "correctAnswer": correcta,
        "knowledgeLevel": 3
    }

def generar_pregunta_constructor_mas_segundos():
    cursor.execute("""
        SELECT c.name, COUNT(*) as segundos
        FROM results res
        JOIN constructors c ON res.constructorId = c.constructorId
        WHERE res.positionOrder = 2
        GROUP BY c.constructorId
        HAVING segundos > 20
        ORDER BY segundos DESC
        LIMIT 1
    """)
    (constructora, _) = cursor.fetchone()
    pregunta = t("most_seconds_constructor")

    opciones = get_respuestas_incorrectas(constructora, constructores_cache)
    return {
        "question": pregunta,
        "answers": random.sample(opciones + [constructora], 4),
        "correctAnswer": constructora,
        "knowledgeLevel": 3
    }


def pregunta_doble_relacion_victorias_en_circuito():
    cursor.execute("""
        SELECT c.name, d.forename, d.surname, COUNT(*) as victorias
        FROM results res
        JOIN races r ON res.raceId = r.raceId
        JOIN circuits c ON r.circuitId = c.circuitId
        JOIN drivers d ON res.driverId = d.driverId
        WHERE res.positionOrder = 1
        GROUP BY c.name, res.driverId
        HAVING victorias >= 2
        ORDER BY RAND()
        LIMIT 1
    """)
    circuito, nombre, apellido, _ = cursor.fetchone()
    correcta = f"{nombre} {apellido}"
    pregunta = t("most_driver_victories_circuit", circuit=circuito)

    cursor.execute("SELECT CONCAT(forename, ' ', surname) FROM drivers WHERE CONCAT(forename, ' ', surname) != %s ORDER BY RAND() LIMIT 3", (correcta,))
    opciones = [row[0] for row in cursor.fetchall()] + [correcta]
    random.shuffle(opciones)

    return {"question": pregunta, "answers": opciones, "correctAnswer": correcta, "knowledgeLevel": 3}


def pregunta_doble_relacion_equipo_en_gp():
    cursor.execute("""
        SELECT r.name, r.year, c.name
        FROM results res
        JOIN races r ON res.raceId = r.raceId
        JOIN constructors c ON res.constructorId = c.constructorId
        WHERE res.positionOrder = 1
        ORDER BY RAND()
        LIMIT 1
    """)
    gp, anio, team = cursor.fetchone()
    pregunta = t("gp_team_win", gp=gp, year=anio)

    cursor.execute("SELECT name FROM constructors WHERE name != %s ORDER BY RAND() LIMIT 3", (team,))
    opciones = [row[0] for row in cursor.fetchall()] + [team]
    random.shuffle(opciones)

    return {"question": pregunta, "answers": opciones, "correctAnswer": team, "knowledgeLevel": 2}



# ---------------- FUNCIÓN PARA GP CONCRETO ----------------

def generar_preguntas_para_gp(nombre_gp):
    preguntas = []

    # Ganador de un GP específico
    cursor.execute("""
        SELECT r.year, d.forename, d.surname
        FROM results res
        JOIN races r ON res.raceId = r.raceId
        JOIN drivers d ON res.driverId = d.driverId
        WHERE res.positionOrder = 1 AND r.name = %s
        ORDER BY RAND()
        LIMIT 1
    """, (nombre_gp,))
    row = cursor.fetchone()
    if row:
        year, nombre, apellido = row
        correcta = f"{nombre} {apellido}"
        pregunta = f"¿Quién ganó el {nombre_gp} en {year}?"
        opciones = get_respuestas_incorrectas(correcta, pilotos_cache)
        preguntas.append({
            "question": pregunta,
            "answers": random.sample(opciones + [correcta], 4),
            "correctAnswer": correcta,
            "knowledgeLevel": 2
        })

    # Piloto con más victorias en ese GP
    cursor.execute("""
        SELECT d.forename, d.surname, COUNT(*) as victorias
        FROM results res
        JOIN races r ON res.raceId = r.raceId
        JOIN drivers d ON res.driverId = d.driverId
        WHERE res.positionOrder = 1 AND r.name = %s
        GROUP BY d.driverId
        ORDER BY victorias DESC
        LIMIT 1
    """, (nombre_gp,))
    row = cursor.fetchone()
    if row:
        nombre, apellido, _ = row
        correcta = f"{nombre} {apellido}"
        pregunta = f"¿Qué piloto ha ganado más veces el {nombre_gp}?"
        opciones = get_respuestas_incorrectas(correcta, pilotos_cache)
        preguntas.append({
            "question": pregunta,
            "answers": random.sample(opciones + [correcta], 4),
            "correctAnswer": correcta,
            "knowledgeLevel": 3
        })

    # País del GP
    cursor.execute("""
        SELECT DISTINCT c.country
        FROM races r
        JOIN circuits c ON r.circuitId = c.circuitId
        WHERE r.name = %s
        LIMIT 1
    """, (nombre_gp,))
    row = cursor.fetchone()
    if row:
        (pais,) = row
        pregunta = t("gp_country_static", gp=nombre_gp)
        opciones = get_respuestas_incorrectas(pais, paises_cache)
        preguntas.append({
            "question": pregunta,
            "answers": random.sample(opciones + [pais], 4),
            "correctAnswer": pais,
            "knowledgeLevel": 1
        })

    return preguntas

   # --- LISTA DE FUNCIONES ---
   generadores = [
       # Básicas y complejas previas (las que ya tenías)
       generar_pregunta_ganador_gp,
       generar_pregunta_escuderia_ganadora,
       generar_pregunta_pais_gp,
       generar_pregunta_segundo_gp,
       generar_pregunta_tercero_gp,
       generar_pregunta_campeon_pilotos,
       generar_pregunta_campeon_constructores,
       generar_pregunta_piloto_con_mas_victorias_en_gp,
       generar_pregunta_piloto_mas_victorias_en_circuito,
       generar_pregunta_constructor_mas_victorias_en_pais,

       # Nuevas
       generar_pregunta_piloto_mas_podios_en_gp,
       generar_pregunta_piloto_mas_podios_totales,
       generar_pregunta_piloto_mas_poles_en_circuito,
       generar_pregunta_constructor_mas_victorias_en_circuito,
       generar_pregunta_circuito_mas_carreras,
       generar_pregunta_piloto_con_mas_podios_en_circuito,
       generar_pregunta_anio_victoria_gp,
       generar_pregunta_piloto_mas_podios,
       generar_pregunta_constructor_mas_segundos,
       pregunta_doble_relacion_victorias_en_circuito,
       pregunta_doble_relacion_equipo_en_gp,



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