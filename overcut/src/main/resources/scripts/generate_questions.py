# Versión corregida del script generate_questions.py con validaciones mejoradas
# Incluye: corrección de verificación de respuestas, eliminación de duplicados y coherencia de fechas

import sys
import mysql.connector
import random
import json
import argparse  # <- AÑADE ESTO AQUÍ
import concurrent.futures

from sqlalchemy import create_engine
import pymysql


# pymysql no necesita cambiar plugin
pymysql.install_as_MySQLdb()

engine = create_engine(
    "mysql+pymysql://root:root@localhost:3306/f1db",
    pool_size=32,           # máximo de conexiones activas
    max_overflow=15,        # conexiones adicionales temporales
    pool_pre_ping=True,     # verifica que la conexión esté viva
    pool_recycle=1800       # recicla conexiones cada 30 minutos
)

connection = engine.raw_connection()

def crear_cursor_local():
    conn = engine.raw_connection()
    return conn, conn.cursor()

_pilotos_cache = None
def get_pilotos_cache():
    global _pilotos_cache
    if _pilotos_cache is None:
        conn, cursor = crear_cursor_local()
        cursor.execute("SELECT CONCAT(forename, ' ', surname) FROM drivers")
        _pilotos_cache = [row[0] for row in cursor.fetchall()]
        cursor.close()
        conn.close()
    return _pilotos_cache

def get_constructores_cache():
    conn, cursor = crear_cursor_local()
    try:
        cursor.execute("SELECT name FROM constructors")
        return [row[0] for row in cursor.fetchall()]
    finally:
        cursor.close()
        conn.close()


def get_paises_cache():
    conn, cursor = crear_cursor_local()
    try:
        cursor.execute("SELECT DISTINCT country FROM circuits WHERE country IS NOT NULL")
        return [row[0] for row in cursor.fetchall()]
    finally:
        cursor.close()
        conn.close()

pilotos_cache = get_pilotos_cache()
constructores_cache = get_constructores_cache()
paises_cache = get_paises_cache()

def get_respuestas_incorrectas(correcta, pool, n=3):
    opciones = [x for x in pool if x != correcta]
    return random.sample(opciones, n)


#Estadísticas genéricas parte 1
def obtener_pilotos_entre_anios(anio_inicio, anio_fin, excluido=None):
    conn, cursor = crear_cursor_local()
    try:
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
    finally:
            cursor.close()
            conn.close()

def obtener_constructores_entre_anios(anio_inicio, anio_fin, excluido=None):
    conn, cursor = crear_cursor_local()
    try:
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
    finally:
            cursor.close()
            conn.close()


preguntas = []


def generar_pregunta_piloto_primera_victoria_reciente():
    conn, cursor = crear_cursor_local()
    try:

        # Limpieza del cursor por seguridad
        while cursor.nextset():
            pass

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
        if LANG == "es":
            pregunta = f"¿Qué piloto logró su primera victoria en el GP de {gp} en {year}?"
        elif LANG == "en":
            pregunta = f"Which driver achieved their first victory at the {gp} Grand Prix in {year}?"
        contemporaneos = obtener_pilotos_entre_anios(year - 2, year + 2, correcta)
        opciones = random.sample(contemporaneos, min(3, len(contemporaneos))) + [correcta]
        random.shuffle(opciones)
        return {
                "question": pregunta,
                "answers": opciones,               # <- "answers" en lugar de "options"
                "correctAnswer": correcta,           # <- "correctAnswer" en lugar de "answer"
                "knowledgeLevel": 2,            # nivel conocimiento arbitrario (ejemplo: 2)
                "category": "GenericStats",
                "language": LANG
            }
    finally:
            cursor.close()
            conn.close()

def generar_pregunta_piloto_mas_podios_totales():
    conn, cursor = crear_cursor_local()
    try:

        # Limpieza del cursor por seguridad
        while cursor.nextset():
            pass

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
                if LANG == "es":
                    pregunta = "¿Qué piloto tiene más podios en su carrera?"
                elif LANG == "en":
                    pregunta = "Which driver has the most podiums in their career?"
                opciones = [row[0] for row in seleccion]
                random.shuffle(opciones)
                return {
                        "question": pregunta,
                        "answers": opciones,               # <- "answers" en lugar de "options"
                        "correctAnswer": c_nombre,           # <- "correctAnswer" en lugar de "answer"
                        "knowledgeLevel": 2,            # nivel conocimiento arbitrario (ejemplo: 2)
                        "category": "GenericStats",
                        "language": LANG
                    }
            intentos += 1

        raise Exception("No se pudo generar una pregunta válida de podios sin empates.")
    finally:
            cursor.close()
            conn.close()


def generar_pregunta_campeon_pilotos():
    conn, cursor = crear_cursor_local()
    try:

        # Limpieza del cursor por seguridad
        while cursor.nextset():
            pass

        anio = random.randint(1980, 2023)

        # Obtener el último raceId del año en standings
        cursor.execute("""
            SELECT MAX(r.raceId)
            FROM driverStandings ds
            JOIN races r ON ds.raceId = r.raceId
            WHERE r.year = %s
        """, (anio,))
        (race_id,) = cursor.fetchone()
        # Limpieza del cursor por seguridad
        while cursor.nextset():
            pass

        cursor.execute("""
            SELECT d.forename, d.surname
            FROM driverStandings ds
            JOIN drivers d ON ds.driverId = d.driverId
            WHERE ds.raceId = %s AND ds.position = 1
        """, (race_id,))
        nombre, apellido = cursor.fetchone()
        correcta = f"{nombre} {apellido}"
        if LANG == "es":
            pregunta = f"¿Qué piloto ganó el campeonato de F1 en {anio}?"
        elif LANG == "en":
            pregunta = f"Which driver won the {anio} F1 championship?"
        contemporaneos = obtener_pilotos_entre_anios(anio - 2, anio + 2, correcta)
        opciones = random.sample(contemporaneos, min(3, len(contemporaneos))) + [correcta]
        random.shuffle(opciones)
        return {
                "question": pregunta,
                "answers": opciones,               # <- "answers" en lugar de "options"
                "correctAnswer": correcta,           # <- "correctAnswer" en lugar de "answer"
                "knowledgeLevel": 1,            # nivel conocimiento arbitrario (ejemplo: 2)
                "category": "GenericStats",
                "language": LANG
            }
    finally:
            cursor.close()
            conn.close()


def generar_pregunta_campeon_constructores():
    conn, cursor = crear_cursor_local()
    try:

        # Limpieza del cursor por seguridad
        while cursor.nextset():
            pass

        anio = random.randint(1980, 2023)

        # Última entrada en constructorStandings del año
        cursor.execute("""
            SELECT MAX(r.raceId)
            FROM constructorStandings cs
            JOIN races r ON cs.raceId = r.raceId
            WHERE r.year = %s
        """, (anio,))
        (race_id,) = cursor.fetchone()
        # Limpieza del cursor por seguridad
        while cursor.nextset():
            pass

        cursor.execute("""
            SELECT c.name
            FROM constructorStandings cs
            JOIN constructors c ON cs.constructorId = c.constructorId
            WHERE cs.raceId = %s AND cs.position = 1
        """, (race_id,))
        (constructora,) = cursor.fetchone()
        if LANG == "es":
            pregunta = f"¿Qué constructor ganó el campeonato de F1 en {anio}?"
        elif LANG == "en":
            pregunta = f"Which team won the {anio} F1 constructors championship?"
        cursor.execute("SELECT name FROM constructors WHERE name != %s ORDER BY RAND() LIMIT 3", (constructora,))
        opciones = [row[0] for row in cursor.fetchall()] + [constructora]
        random.shuffle(opciones)
        return {
                "question": pregunta,
                "answers": opciones,               # <- "answers" en lugar de "options"
                "correctAnswer": constructora,           # <- "correctAnswer" en lugar de "answer"
                "knowledgeLevel": 1,            # nivel conocimiento arbitrario (ejemplo: 2)
                "category": "GenericStats",
                "language": LANG
            }

    finally:
            cursor.close()
            conn.close()


def generar_pregunta_ganador_gp():
    conn, cursor = crear_cursor_local()
    try:

        # Limpieza del cursor por seguridad
        while cursor.nextset():
            pass

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
        if LANG == "es":
            pregunta = f"¿Quién ganó el {gp} en {year}?"
        elif LANG == "en":
            pregunta = f"Who won the {year} {gp}?"
        correcta = f"{nombre} {apellido}"
        contemporaneos = obtener_pilotos_entre_anios(year - 2, year + 2, correcta)
        opciones = random.sample(contemporaneos, min(3, len(contemporaneos))) + [correcta]
        random.shuffle(opciones)
        return {
                "question": pregunta,
                "answers": opciones,               # <- "answers" en lugar de "options"
                "correctAnswer": correcta,           # <- "correctAnswer" en lugar de "answer"
                "knowledgeLevel": 1,            # nivel conocimiento arbitrario (ejemplo: 2)
                "category": "GenericStats",
                "language": LANG
            }
    finally:
            cursor.close()
            conn.close()


def generar_pregunta_segundo_gp():
    conn, cursor = crear_cursor_local()
    try:

        # Limpieza del cursor por seguridad
        while cursor.nextset():
            pass

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
        if LANG == "es":
            pregunta = f"¿Quién quedó segundo en el {gp} en {year}?"
        elif LANG == "en":
            pregunta = f"Who finished second at the {year} {gp}?"
        correcta = f"{nombre} {apellido}"
        contemporaneos = obtener_pilotos_entre_anios(year, year, correcta)
        opciones = random.sample(contemporaneos, min(3, len(contemporaneos))) + [correcta]
        random.shuffle(opciones)
        return {
                "question": pregunta,
                "answers": opciones,               # <- "answers" en lugar de "options"
                "correctAnswer": correcta,           # <- "correctAnswer" en lugar de "answer"
                "knowledgeLevel": 2,            # nivel conocimiento arbitrario (ejemplo: 2)
                "category": "GenericStats",
                "language": LANG
            }
    finally:
            cursor.close()
            conn.close()


def generar_pregunta_tercero_gp():
    conn, cursor = crear_cursor_local()
    try:

        # Limpieza del cursor por seguridad
        while cursor.nextset():
            pass

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
        if LANG == "es":
            pregunta = f"¿Quién quedó tercero en el {gp} en {year}?"
        elif LANG == "en":
            pregunta = f"Who finished third at the {year} {gp}?"
        correcta = f"{nombre} {apellido}"
        contemporaneos = obtener_pilotos_entre_anios(year, year, correcta)
        opciones = random.sample(contemporaneos, min(3, len(contemporaneos))) + [correcta]
        random.shuffle(opciones)
        return {
                "question": pregunta,
                "answers": opciones,               # <- "answers" en lugar de "options"
                "correctAnswer": correcta,           # <- "correctAnswer" en lugar de "answer"
                "knowledgeLevel": 2,            # nivel conocimiento arbitrario (ejemplo: 2)
                "category": "GenericStats",
                "language": LANG
            }
    finally:
            cursor.close()
            conn.close()


def generar_pregunta_escuderia_ganadora():
    conn, cursor = crear_cursor_local()
    try:

        # Limpieza del cursor por seguridad
        while cursor.nextset():
            pass

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
        if LANG == "es":
            pregunta = f"¿Qué escudería ganó el {gp} en {year}?"
        elif LANG == "en":
            pregunta = f"Which team won the {year} {gp}?"
        cursor.execute("SELECT name FROM constructors WHERE name != %s ORDER BY RAND() LIMIT 3", (team,))
        opciones = [row[0] for row in cursor.fetchall()] + [team]
        random.shuffle(opciones)
        return {
                "question": pregunta,
                "answers": opciones,               # <- "answers" en lugar de "options"
                "correctAnswer": team,           # <- "correctAnswer" en lugar de "answer"
                "knowledgeLevel": 1,            # nivel conocimiento arbitrario (ejemplo: 2)
                "category": "GenericStats",
                "language": LANG
            }
    finally:
            cursor.close()
            conn.close()


def generar_pregunta_constructor_mas_titulos():
    conn, cursor = crear_cursor_local()
    try:

        # Limpieza del cursor por seguridad
        while cursor.nextset():
            pass

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
        if LANG == "es":
            pregunta = "¿Qué constructor ha ganado más títulos de constructores en F1?"
        elif LANG == "en":
            pregunta = "Which team has won more F1 constructors championships?"
        contemporaneos = obtener_constructores_entre_anios(anio_inicio, anio_fin, constructor)
        opciones = random.sample(contemporaneos, min(3, len(contemporaneos))) + [constructor]
        random.shuffle(opciones)
        return {
            "question": pregunta,
            "answers": opciones,
            "correctAnswer": constructor,
            "knowledgeLevel": 3,
            "category": "GenericStats",
            "language": LANG
        }
    finally:
            cursor.close()
            conn.close()



def generar_pregunta_piloto_mas_poles_en_circuito():
    conn, cursor = crear_cursor_local()
    try:
        while cursor.nextset():
            pass

        intentos = 0
        max_intentos = 10  # Aumentamos para dar más oportunidades

        while intentos < max_intentos:
            intentos += 1

            # Buscar circuito con al menos 5 ediciones
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
                continue
            (circuito,) = result

            while cursor.nextset():
                pass

            # Obtener pilotos con poles en ese circuito
            cursor.execute("""
                SELECT CONCAT(d.forename, ' ', d.surname) AS nombre, COUNT(*) as poles
                FROM qualifying q
                JOIN races r ON q.raceId = r.raceId
                JOIN circuits c ON r.circuitId = c.circuitId
                JOIN drivers d ON q.driverId = d.driverId
                WHERE q.position = 1 AND c.name = %s
                GROUP BY q.driverId
                HAVING poles > 0
                ORDER BY poles DESC
            """, (circuito,))
            datos = cursor.fetchall()

            if len(datos) < 4:
                continue

            # Usar los 4-6 mejores pilotos para formar las opciones
            top_n = min(6, len(datos))
            seleccion = datos[:top_n]

            mayor = seleccion[0][1]
            top_pilotos = [row for row in seleccion if row[1] == mayor]

            if len(top_pilotos) == 1:
                correcta_nombre = top_pilotos[0][0]
                opciones = [row[0] for row in seleccion if row[0] != correcta_nombre]
                opciones = random.sample(opciones, min(3, len(opciones))) + [correcta_nombre]
                random.shuffle(opciones)
                if LANG == "es":
                    pregunta = f"¿Qué piloto ha conseguido más poles en el circuito {circuito}?"
                elif LANG == "en":
                    pregunta = f"Which has more pole positions in {circuito}?"
                return {
                    "question": pregunta,
                    "answers": opciones,
                    "correctAnswer": correcta_nombre,
                    "knowledgeLevel": 3,
                    "category": "GenericStats",
                    "language": LANG
                }

        raise Exception("No se pudo generar una pregunta válida de poles sin empates tras múltiples intentos.")
    finally:
        cursor.close()
        conn.close()



def generar_pregunta_constructor_mas_victorias_en_circuito():
    conn, cursor = crear_cursor_local()
    try:

        # Limpieza del cursor por seguridad
        while cursor.nextset():
            pass

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
        # Limpieza del cursor por seguridad
        while cursor.nextset():
            pass

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
        if LANG == "es":
            pregunta = f"¿Qué constructor ha ganado más veces en el circuito de {circuito}?"
        elif LANG == "en":
            pregunta = f"Which team has won more times in {circuito}?"
        contemporaneos = obtener_constructores_entre_anios(anio_inicio, anio_fin, constructora)
        opciones = random.sample(contemporaneos, min(3, len(contemporaneos))) + [constructora]
        random.shuffle(opciones)
        return {"question": pregunta, "answers": opciones, "correctAnswer": constructora, "knowledgeLevel": 2, "category": "GenericStats", "language": LANG}
    finally:
            cursor.close()
            conn.close()


def generar_pregunta_constructor_mas_victorias_en_pais():
    conn, cursor = crear_cursor_local()
    try:

        # Limpieza del cursor por seguridad
        while cursor.nextset():
            pass

        cursor.execute("""
            SELECT DISTINCT country
            FROM circuits
            WHERE country IS NOT NULL
            ORDER BY RAND()
            LIMIT 1
        """)
        (pais,) = cursor.fetchone()
        # Limpieza del cursor por seguridad
        while cursor.nextset():
            pass

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
        if LANG == "es":
            pregunta = f"¿Qué constructor ha ganado más veces en {pais}?"
        elif LANG == "en":
            pregunta = f"Which team has won more times at {pais}?"
        contemporaneos = obtener_constructores_entre_anios(anio_inicio, anio_fin, constructora)
        opciones = random.sample(contemporaneos, min(3, len(contemporaneos))) + [constructora]
        random.shuffle(opciones)
        return {"question": pregunta, "answers": opciones, "correctAnswer": constructora, "knowledgeLevel": 3, "category": "GenericStats", "language": LANG}
    finally:
            cursor.close()
            conn.close()

def generar_pregunta_circuito_mas_carreras():
    conn, cursor = crear_cursor_local()
    try:

        # Limpieza del cursor por seguridad
        while cursor.nextset():
            pass

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
                if LANG == "es":
                    pregunta = "¿Qué circuito ha sido usado más veces en la historia de la F1?"
                elif LANG == "en":
                    pregunta = "Which track has been used more times in F1 history?"
                opciones = [row[0] for row in seleccion]
                random.shuffle(opciones)
                return {"question": pregunta, "answers": opciones, "correctAnswer": nombre_circuito,
                 "knowledgeLevel": 2, "category": "GenericStats", "language": LANG}
            intentos += 1

        raise Exception("No se pudo generar una pregunta válida de circuitos sin empates.")
    finally:
            cursor.close()
            conn.close()

def generar_pregunta_piloto_mas_victorias_en_circuito():
    conn, cursor = crear_cursor_local()
    try:

        # Limpieza del cursor por seguridad
        while cursor.nextset():
            pass

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
        # Limpieza del cursor por seguridad
        while cursor.nextset():
            pass

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
        if LANG == "es":
            pregunta = f"¿Qué piloto ha ganado más veces en el circuito {circuito}?"
        elif LANG == "en":
            pregunta = f"Which driver has won more times in {circuito}?"
        contemporaneos = obtener_pilotos_entre_anios(anio_inicio, anio_fin, correcta)
        opciones = random.sample(contemporaneos, min(3, len(contemporaneos))) + [correcta]
        random.shuffle(opciones)
        return {"question": pregunta, "answers": opciones, "correctAnswer": correcta, "knowledgeLevel": 3, "category": "GenericStats", "language": LANG}
    finally:
            cursor.close()
            conn.close()

# Bloques de funciones implementadas

# **Duelos Legendarios**
def pregunta_rival_de_senna_en_mclaren():
    piloto = "Alain Prost"
    if LANG == "es":
        pregunta = "¿Quién fue el gran rival de Ayrton Senna durante su etapa en McLaren?"
        opciones = ["Nigel Mansell", "Nelson Piquet", "Gerhard Berger", piloto]
    else:
        pregunta = "Who was Ayrton Senna's biggest rival in the McLaren days?"
        opciones = ["Nigel Mansell", "Nelson Piquet", "Gerhard Berger", piloto]

    random.shuffle(opciones)
    return {
        "question": pregunta,
        "answers": opciones,
        "correctAnswer": piloto,
        "knowledgeLevel": 2,
        "category": "Duels",
        "language": LANG
    }


def pregunta_piloto_perdio_titulo_en_ultima_curva_2008():
    piloto = "Felipe Massa"
    if LANG == "es":
        pregunta = "¿Qué piloto perdió el campeonato del mundo en la última curva del último GP de 2008?"
        opciones = ["Robert Kubica", "Lewis Hamilton", "Fernando Alonso", piloto]
    else:
        pregunta = "Which driver lost the 2008 F1 championship at the last corner of the last GP?"
        opciones = ["Robert Kubica", "Lewis Hamilton", "Fernando Alonso", piloto]

    random.shuffle(opciones)
    return {
        "question": pregunta,
        "answers": opciones,
        "correctAnswer": piloto,
        "knowledgeLevel": 2,
        "category": "Duels",
        "language": LANG
    }


def pregunta_rival_schumacher_2000():
    piloto = "Mika Häkkinen"
    if LANG == "es":
        pregunta = "¿Quién fue el principal rival de Michael Schumacher durante su primer título con Ferrari en 2000?"
        opciones = ["David Coulthard", "Rubens Barrichello", "Jacques Villeneuve", piloto]
    else:
        pregunta = "Who was Michael Schumacher's biggest rival during his first title with Ferrari in 2000?"
        opciones = ["David Coulthard", "Rubens Barrichello", "Jacques Villeneuve", piloto]

    random.shuffle(opciones)
    return {
        "question": pregunta,
        "answers": opciones,
        "correctAnswer": piloto,
        "knowledgeLevel": 2,
        "category": "Duels",
        "language": LANG
    }


def pregunta_ano_choque_hamilton_rosberg_espana():
    year = "2016"
    if LANG == "es":
        pregunta = "¿En qué temporada ocurrió el choque entre Hamilton y Rosberg en el GP de España?"
        opciones = ["2015", "2014", "2017", year]
    else:
        pregunta = "In which season did Hamilton and Rosberg crash at the Spanish GP?"
        opciones = ["2015", "2014", "2017", year]

    random.shuffle(opciones)
    return {
        "question": pregunta,
        "answers": opciones,
        "correctAnswer": year,
        "knowledgeLevel": 2,
        "category": "Duels",
        "language": LANG
    }


def pregunta_duelo_vettel_canada_2019():
    piloto = "Lewis Hamilton"
    if LANG == "es":
        pregunta = "¿Quién ganó el polémico duelo con Sebastian Vettel en Canadá 2019 debido a una penalización?"
        opciones = ["Charles Leclerc", "Valtteri Bottas", "Max Verstappen", piloto]
    else:
        pregunta = "Who won the controversial duel with Sebastian Vettel at the 2019 Canadian GP?"
        opciones = ["Charles Leclerc", "Valtteri Bottas", "Max Verstappen", piloto]

    random.shuffle(opciones)
    return {
        "question": pregunta,
        "answers": opciones,
        "correctAnswer": piloto,
        "knowledgeLevel": 2,
        "category": "Duels",
        "language": LANG
    }


#------------------------------------------------------------------------------------------------------

# **Temporadas Históricas**
def pregunta_piloto_campeon_temporada():
    conn, cursor = crear_cursor_local()
    try:

        # Limpieza del cursor por seguridad
        while cursor.nextset():
            pass

        temporada_objetivo = random.randint(1950, 2023)
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
        if LANG == "es":
            pregunta = f"¿Qué piloto ganó el campeonato de pilotos en la temporada {temporada_objetivo}?"
        elif LANG == "en":
            pregunta = f"Which driver won the {temporada_objetivo} championship?"
        incorrectas = get_respuestas_incorrectas(piloto, get_pilotos_cache())
        opciones = incorrectas + [piloto]
        random.shuffle(opciones)
        return {
                "question": pregunta,
                "answers": opciones,               # <- "answers" en lugar de "options"
                "correctAnswer": piloto,           # <- "correctAnswer" en lugar de "answer"
                "knowledgeLevel": 2,                # nivel conocimiento arbitrario (ejemplo: 2)
                "category": "LegendarySeason",
                "language": LANG
            }
    finally:
            cursor.close()
            conn.close()

def pregunta_constructor_campeon_temporada():
    conn, cursor = crear_cursor_local()
    try:

        # Limpieza del cursor por seguridad
        while cursor.nextset():
            pass

        temporada_objetivo = random.randint(1950, 2023)
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
        if LANG == "es":
            pregunta = f"¿Qué escudería ganó el campeonato de constructores en la temporada {temporada_objetivo}?"
        elif LANG == "en":
            pregunta = f"Which team won the constructors championship in {temporada_objetivo}?"
        incorrectas = get_respuestas_incorrectas(constructor, get_constructores_cache())
        opciones = incorrectas + [constructor]
        random.shuffle(opciones)
        return {
                "question": pregunta,
                "answers": opciones,               # <- "answers" en lugar de "options"
                "correctAnswer": constructor,           # <- "correctAnswer" en lugar de "answer"
                "knowledgeLevel": 2,                # nivel conocimiento arbitrario (ejemplo: 2)
                "category": "LegendarySeason",
                "language": LANG
            }
    finally:
            cursor.close()
            conn.close()


def pregunta_gp_mas_abandonos_temporada():
    conn, cursor = crear_cursor_local()
    try:

        # Limpieza del cursor por seguridad
        while cursor.nextset():
            pass

        temporada_objetivo = random.randint(1950, 2023)

        # Primera consulta: obtener el GP con más abandonos
        cursor.execute("""
            SELECT ra.name, COUNT(*) as abandonos
            FROM results r
            JOIN races ra ON r.raceId = ra.raceId
            JOIN status s ON r.statusId = s.statusId
            WHERE ra.year = %s AND (
                s.status LIKE 'Accident%%' OR
                s.status LIKE 'Engine%%' OR
                s.status LIKE 'Gearbox%%' OR
                s.status LIKE 'Suspension%%'
            )
            GROUP BY ra.raceId
            ORDER BY abandonos DESC
            LIMIT 1
        """, (temporada_objetivo,))
        row = cursor.fetchone()
        if not row:
            return None

        gp = row[0]

        # Limpiar el cursor antes de la siguiente consulta
        while cursor.nextset():
            pass

        # Segunda consulta: obtener posibles opciones incorrectas
        cursor.execute("SELECT DISTINCT name FROM races WHERE year = %s AND name != %s", (temporada_objetivo, gp))
        rows = cursor.fetchall()
        if LANG == "es":
            pregunta = f"¿Cuál fue la carrera con más abandonos en la temporada {temporada_objetivo}?"
        elif LANG == "en":
            pregunta = f"Which race had the most retirements in {temporada_objetivo}?"
        incorrectas = get_respuestas_incorrectas(gp, [r[0] for r in rows])
        opciones = incorrectas + [gp]
        random.shuffle(opciones)

        return {
            "question": pregunta,
            "answers": opciones,
            "correctAnswer": gp,
            "knowledgeLevel": 2,
            "category": "LegendarySeason",
            "language": LANG
        }

    finally:
            cursor.close()
            conn.close()


def pregunta_victorias_campeon_temporada():
    conn, cursor = crear_cursor_local()
    try:

        # Limpieza del cursor por seguridad
        while cursor.nextset():
            pass

        temporada_objetivo = random.randint(1950, 2023)
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
        # Limpieza del cursor por seguridad
        while cursor.nextset():
            pass

        cursor.execute("""
            SELECT COUNT(*) FROM results r
            JOIN races ra ON r.raceId = ra.raceId
            WHERE ra.year = %s AND r.driverId = %s AND r.position = 1
        """, (temporada_objetivo, driver_id))
        victorias = cursor.fetchone()[0]
        piloto_nombre = f"{nombre} {apellido}"
        if LANG == "es":
            pregunta = f"¿Cuántas victorias logró {piloto_nombre} durante la temporada {temporada_objetivo}?"
        elif LANG == "en":
            pregunta = f"How many wins did {piloto_nombre} get during the {temporada_objetivo} season?"
        opciones = get_respuestas_incorrectas(str(victorias), [str(i) for i in range(0, 15)])
        opciones.append(str(victorias))
        random.shuffle(opciones)
        return {
                "question": pregunta,
                "answers": opciones,               # <- "answers" en lugar de "options"
                "correctAnswer": str(victorias),           # <- "correctAnswer" en lugar de "answer"
                "knowledgeLevel": 2,                # nivel conocimiento arbitrario (ejemplo: 2)
                "category": "LegendarySeason",
                "language": LANG
            }
    finally:
            cursor.close()
            conn.close()

def pregunta_ultimo_gp_temporada():
    conn, cursor = crear_cursor_local()
    try:

        # Limpieza del cursor por seguridad
        while cursor.nextset():
            pass

        temporada_objetivo = random.randint(1950, 2023)
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
        if LANG == "es":
            pregunta = f"¿En qué circuito se disputó la última carrera de la temporada {temporada_objetivo}?"
        elif LANG == "en":
            pregunta = f"In which circuit was held the last GP of the {temporada_objetivo} season?"
        cursor.execute("SELECT name FROM circuits WHERE name != %s", (circuito,))
        incorrectas = get_respuestas_incorrectas(circuito, [r[0] for r in cursor.fetchall()])
        opciones = incorrectas + [circuito]
        random.shuffle(opciones)
        return {
                "question": pregunta,
                "answers": opciones,               # <- "answers" en lugar de "options"
                "correctAnswer": circuito,           # <- "correctAnswer" en lugar de "answer"
                "knowledgeLevel": 2,                # nivel conocimiento arbitrario (ejemplo: 2)
                "category": "LegendarySeason",
                "language": LANG
            }
    finally:
            cursor.close()
            conn.close()


def pregunta_piloto_mas_poles_temporada():
    conn, cursor = crear_cursor_local()
    try:

        # Limpieza del cursor por seguridad
        while cursor.nextset():
            pass

        temporada_objetivo = random.randint(1950, 2023)
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
        if LANG == "es":
            pregunta = f"¿Qué piloto consiguió más pole positions en la temporada {temporada_objetivo}?"
        elif LANG == "en":
            pregunta = f"Which driver got more pole positions in the {temporada_objetivo} season?"
        incorrectas = get_respuestas_incorrectas(piloto, get_pilotos_cache())
        opciones = incorrectas + [piloto]
        random.shuffle(opciones)
        return {
                "question": pregunta,
                "answers": opciones,               # <- "answers" en lugar de "options"
                "correctAnswer": piloto,           # <- "correctAnswer" en lugar de "answer"
                "knowledgeLevel": 2,                # nivel conocimiento arbitrario (ejemplo: 2)
                "category": "LegendarySeason",
                "language": LANG
            }
    finally:
            cursor.close()
            conn.close()

def pregunta_circuito_mas_vueltas_temporada():
    conn, cursor = crear_cursor_local()
    try:

        # Limpieza del cursor por seguridad
        while cursor.nextset():
            pass

        temporada_objetivo = random.randint(1950, 2023)
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
        if LANG == "es":
            pregunta = f"¿Qué circuito tuvo el mayor número de vueltas disputadas durante la temporada {temporada_objetivo}?"
        elif LANG == "en":
            pregunta = f"Which circuit had the biggest amount of laps held during the {temporada_objetivo} season?"
        cursor.execute("SELECT name FROM circuits WHERE name != %s", (circuito,))
        incorrectas = get_respuestas_incorrectas(circuito, [r[0] for r in cursor.fetchall()])
        opciones = incorrectas + [circuito]
        random.shuffle(opciones)
        return {
                "question": pregunta,
                "answers": opciones,               # <- "answers" en lugar de "options"
                "correctAnswer": circuito,           # <- "correctAnswer" en lugar de "answer"
                "knowledgeLevel": 2,                # nivel conocimiento arbitrario (ejemplo: 2)
                "category": "LegendarySeason",
                "language": LANG
            }
    finally:
            cursor.close()
            conn.close()

def pregunta_escuderia_mas_abandonos_temporada():
    conn, cursor = crear_cursor_local()
    try:

        # Limpieza del cursor por seguridad
        while cursor.nextset():
            pass

        temporada_objetivo = random.randint(1950, 2023)
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
        if LANG == "es":
            pregunta = f"¿Qué escudería tuvo más abandonos en la temporada {temporada_objetivo}?"
        elif LANG == "en":
            pregunta = f"Which team had more retirements in the {temporada_objetivo} season?"
        incorrectas = get_respuestas_incorrectas(constructor, get_constructores_cache())
        opciones = incorrectas + [constructor]
        random.shuffle(opciones)
        return {
                "question": pregunta,
                "answers": opciones,               # <- "answers" en lugar de "options"
                "correctAnswer": constructor,           # <- "correctAnswer" en lugar de "answer"
                "knowledgeLevel": 2,                # nivel conocimiento arbitrario (ejemplo: 2)
                "category": "LegendarySeason",
                "language": LANG
            }
    finally:
            cursor.close()
            conn.close()

def pregunta_cuantos_pilotos_ganaron_temporada():
    conn, cursor = crear_cursor_local()
    try:

        # Limpieza del cursor por seguridad
        while cursor.nextset():
            pass

        temporada_objetivo = random.randint(1950, 2023)
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
        if LANG == "es":
            pregunta = f"¿Cuántos pilotos distintos ganaron al menos una carrera durante la temporada {temporada_objetivo}?"
        elif LANG == "en":
            pregunta = f"How many different drivers won at least 1 GP during the {temporada_objetivo} season?"
        opciones = get_respuestas_incorrectas(str(total), [str(i) for i in range(0, 15)])
        opciones.append(str(total))
        random.shuffle(opciones)
        return {
                "question": pregunta,
                "answers": opciones,               # <- "answers" en lugar de "options"
                "correctAnswer": str(total),           # <- "correctAnswer" en lugar de "answer"
                "knowledgeLevel": 2,                # nivel conocimiento arbitrario (ejemplo: 2)
                "category": "LegendarySeason",
                "language": LANG
            }
    finally:
            cursor.close()
            conn.close()

def pregunta_piloto_mas_puntos_sin_ganar_temporada():
    conn, cursor = crear_cursor_local()
    try:

        # Limpieza del cursor por seguridad
        while cursor.nextset():
            pass

        temporada_objetivo = random.randint(1950, 2023)
        # Limpieza del cursor por seguridad
        while cursor.nextset():
            pass

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
        if LANG == "es":
            pregunta = f"¿Qué piloto sumó más puntos sin ganar ninguna carrera en la temporada {temporada_objetivo}?"
        elif LANG == "en":
            pregunta = f"Which driver got more points without winning any race un the {temporada_objetivo} season?"
        incorrectas = get_respuestas_incorrectas(piloto, get_pilotos_cache())
        opciones = incorrectas + [piloto]
        random.shuffle(opciones)
        return {
                "question": pregunta,
                "answers": opciones,               # <- "answers" en lugar de "options"
                "correctAnswer": piloto,           # <- "correctAnswer" en lugar de "answer"
                "knowledgeLevel": 2,                # nivel conocimiento arbitrario (ejemplo: 2)
                "category": "LegendarySeason",
                "language": LANG
            }
    finally:
            cursor.close()
            conn.close()


#------------------------------------------------------------------------------------------------------------------
# **Preguntas sobre escudería en concreto**

def pregunta_piloto_mas_victorias_escuderia():
    conn, cursor = crear_cursor_local()
    try:

        # Limpieza del cursor por seguridad
        while cursor.nextset():
            pass

        cursor.execute("SELECT name FROM constructors ORDER BY RAND() LIMIT 1")
        row = cursor.fetchone()
        if not row:
            return None
        escuderia = row[0]
        # Limpieza del cursor por seguridad
        while cursor.nextset():
            pass

        cursor.execute("""
            SELECT d.forename, d.surname, COUNT(*) as wins
            FROM results r
            JOIN drivers d ON r.driverId = d.driverId
            JOIN constructors c ON r.constructorId = c.constructorId
            WHERE r.position = 1 AND c.name = %s
            GROUP BY d.driverId
            ORDER BY wins DESC
            LIMIT 1
        """, (escuderia,))
        row = cursor.fetchone()
        if not row:
            return None
        piloto = f"{row[0]} {row[1]}"
        if LANG == "es":
            pregunta = f"¿Qué piloto logró más victorias para la escudería {escuderia}?"
        elif LANG == "en":
            pregunta = f"Which driver got more wins for {escuderia}?"
        incorrectas = get_respuestas_incorrectas(piloto, get_pilotos_cache())
        opciones = incorrectas + [piloto]
        random.shuffle(opciones)

        return {
            "question": pregunta,
            "answers": opciones,
            "correctAnswer": piloto,
            "knowledgeLevel": 2,
            "category": "Team",
            "language": LANG
        }
    finally:
            cursor.close()
            conn.close()



def pregunta_temporada_mas_puntos_escuderia():
    conn, cursor = crear_cursor_local()
    try:

        # Limpieza del cursor por seguridad
        while cursor.nextset():
            pass

        cursor.execute("SELECT name FROM constructors ORDER BY RAND() LIMIT 1")
        row = cursor.fetchone()
        if not row:
            return None
        escuderia = row[0]
        # Limpieza del cursor por seguridad
        while cursor.nextset():
            pass

        cursor.execute("""
            SELECT ra.year, SUM(r.points) as total
            FROM results r
            JOIN races ra ON r.raceId = ra.raceId
            JOIN constructors c ON r.constructorId = c.constructorId
            WHERE c.name = %s
            GROUP BY ra.year
            ORDER BY total DESC
            LIMIT 1
        """, (escuderia,))
        row = cursor.fetchone()
        if not row:
            return None
        year = row[0]
        if LANG == "es":
            pregunta = f"¿En qué temporada consiguió más puntos la escudería {escuderia}?"
        elif LANG == "en":
            pregunta = f"In which season did {escuderia} get more points?"
        opciones = get_respuestas_incorrectas(str(year), [str(y) for y in range(1950, 2024)])
        opciones.append(str(year))
        random.shuffle(opciones)

        return {
            "question": pregunta,
            "answers": opciones,
            "correctAnswer": str(year),
            "knowledgeLevel": 2,
            "category": "Team",
            "language": LANG
        }
    finally:
            cursor.close()
            conn.close()


def pregunta_poles_totales_escuderia():
    conn, cursor = crear_cursor_local()
    try:

        # Limpieza del cursor por seguridad
        while cursor.nextset():
            pass

        cursor.execute("SELECT name FROM constructors ORDER BY RAND() LIMIT 1")
        row = cursor.fetchone()
        if not row:
            return None
        escuderia = row[0]
        # Limpieza del cursor por seguridad
        while cursor.nextset():
            pass

        cursor.execute("""
            SELECT COUNT(*)
            FROM qualifying q
            JOIN constructors c ON q.constructorId = c.constructorId
            WHERE q.position = 1 AND c.name = %s
        """, (escuderia,))
        row = cursor.fetchone()
        if not row:
            return None
        total_poles = row[0]
        if LANG == "es":
            pregunta = f"¿Cuántas pole positions logró la escudería {escuderia} en su historia?"
        elif LANG == "en":
            pregunta = f"How many pole positions achieved {escuderia} during its history?"
        opciones = get_respuestas_incorrectas(str(total_poles), [str(i) for i in range(0, 250)])
        opciones.append(str(total_poles))
        random.shuffle(opciones)

        return {
            "question": pregunta,
            "answers": opciones,
            "correctAnswer": str(total_poles),
            "knowledgeLevel": 2,
            "category": "Team",
            "language": LANG
        }
    finally:
            cursor.close()
            conn.close()



def pregunta_circuito_mas_victorias_escuderia():
    conn, cursor = crear_cursor_local()
    try:
        while cursor.nextset():
            pass

        cursor.execute("SELECT name FROM constructors ORDER BY RAND() LIMIT 1")
        row = cursor.fetchone()
        if not row:
            return None
        escuderia = row[0]

        while cursor.nextset():
            pass

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
        """, (escuderia,))
        row = cursor.fetchone()
        if not row:
            return None
        circuito = row[0]

        cursor.execute("SELECT name FROM circuits WHERE name != %s", (circuito,))
        otros = [r[0] for r in cursor.fetchall()]
        if len(otros) < 3:
            return None
        if LANG == "es":
            pregunta = f"¿En qué circuito logró más victorias la escudería {escuderia}?"
        elif LANG == "en":
            pregunta = f"In which circuit did {escuderia} get more victories at?"
        incorrectas = get_respuestas_incorrectas(circuito, otros)
        opciones = incorrectas + [circuito]
        random.shuffle(opciones)

        return {
            "question": pregunta,
            "answers": opciones,
            "correctAnswer": circuito,
            "knowledgeLevel": 2,
            "category": "Team",
            "language": LANG

        }
    finally:
        cursor.close()
        conn.close()


def pregunta_campeonatos_constructores_escuderia():
    conn, cursor = crear_cursor_local()
    try:

        # Limpieza del cursor por seguridad
        while cursor.nextset():
            pass

        cursor.execute("SELECT name FROM constructors ORDER BY RAND() LIMIT 1")
        row = cursor.fetchone()
        if not row:
            return None
        escuderia = row[0]
        # Limpieza del cursor por seguridad
        while cursor.nextset():
            pass

        cursor.execute("""
            SELECT COUNT(DISTINCT ra.year)
            FROM constructorStandings cs
            JOIN races ra ON cs.raceId = ra.raceId
            JOIN constructors c ON cs.constructorId = c.constructorId
            WHERE cs.position = 1 AND c.name = %s
        """, (escuderia,))
        row = cursor.fetchall()
        if not row:
            return None
        total = row[0]
        if LANG == "es":
            pregunta = f"¿Cuántas veces ganó el campeonato de constructores la escudería {escuderia}?"
        elif LANG == "en":
            pregunta = f"How many times did {escuderia} win the constructors championship?"
        opciones = get_respuestas_incorrectas(str(total), [str(i) for i in range(0, 20)])
        opciones.append(str(total))
        random.shuffle(opciones)

        return {
            "question": pregunta,
            "answers": opciones,
            "correctAnswer": str(total),
            "knowledgeLevel": 1,
            "category": "Team",
            "language": LANG
        }
    finally:
            cursor.close()
            conn.close()

def pregunta_piloto_mas_abandonos_escuderia():
    conn, cursor = crear_cursor_local()
    try:

        # Limpieza del cursor por seguridad
        while cursor.nextset():
            pass

        cursor.execute("SELECT name FROM constructors ORDER BY RAND() LIMIT 1")
        row = cursor.fetchone()
        if not row:
            return None
        escuderia = row[0]
        # Limpieza del cursor por seguridad
        while cursor.nextset():
            pass

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
        """, (escuderia,))
        row = cursor.fetchone()
        cursor.fetchall()
        if not row:
            return None
        piloto = f"{row[0]} {row[1]}"
        if LANG == "es":
            pregunta = f"¿Qué piloto abandonó más veces con la escudería {escuderia}?"
        elif LANG == "en":
            pregunta = f"Which driver retired the most with {escuderia}?"
        incorrectas = get_respuestas_incorrectas(piloto, get_pilotos_cache())
        opciones = incorrectas + [piloto]
        random.shuffle(opciones)

        return {
            "question": pregunta,
            "answers": opciones,
            "correctAnswer": piloto,
            "knowledgeLevel": 2,
            "category": "Team",
            "language": LANG
        }
    finally:
            cursor.close()
            conn.close()


def pregunta_peor_temporada_puntos_escuderia():
    conn, cursor = crear_cursor_local()
    try:

        # Limpieza del cursor por seguridad
        while cursor.nextset():
            pass

        cursor.execute("SELECT name FROM constructors ORDER BY RAND() LIMIT 1")
        row = cursor.fetchone()
        if not row:
            return None
        escuderia = row[0]
        # Limpieza del cursor por seguridad
        while cursor.nextset():
            pass

        cursor.execute("""
            SELECT ra.year, SUM(r.points) as total_puntos
            FROM results r
            JOIN races ra ON r.raceId = ra.raceId
            JOIN constructors c ON r.constructorId = c.constructorId
            WHERE c.name = %s
            GROUP BY ra.year
            ORDER BY total_puntos ASC
            LIMIT 1
        """, (escuderia,))
        row = cursor.fetchone()
        cursor.fetchall()
        if not row:
            return None
        year = row[0]
        if LANG == "es":
            pregunta = f"¿Cuál fue la peor temporada en puntos para la escudería {escuderia}?"
        elif LANG == "en":
            pregunta = f"Which was {escuderia} worst season in points?"
        opciones = get_respuestas_incorrectas(str(year), [str(y) for y in range(1950, 2024)])
        opciones.append(str(year))
        random.shuffle(opciones)

        return {
            "question": pregunta,
            "answers": opciones,
            "correctAnswer": str(year),
            "knowledgeLevel": 2,
            "category": "Team",
            "language": LANG
        }
    finally:
            cursor.close()
            conn.close()








#------------------------------------------------------------------------------------------------------------------
# Preguntas sobre un circuito
def pregunta_constructor_mas_abandonos_circuito():
    conn, cursor = crear_cursor_local()
    try:

        # Limpieza del cursor por seguridad
        while cursor.nextset():
            pass

        cursor.execute("SELECT name FROM circuits ORDER BY RAND() LIMIT 1")
        row = cursor.fetchone()
        if not row:
            return None
        circuito_objetivo = row[0]

        # De nuevo: asegurarse de que no quedan resultados pendientes
        while cursor.nextset():
            pass

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

        if LANG == "es":
            pregunta = f"¿Qué escudería tuvo más abandonos en el circuito de {circuito_objetivo}?"
        elif LANG == "en":
            pregunta = f"Which team retired the most at {circuito_objetivo}?"
        incorrectas = get_respuestas_incorrectas(constructor, get_constructores_cache())
        opciones = incorrectas + [constructor]
        random.shuffle(opciones)

        return {
            "question": pregunta,
            "answers": opciones,
            "correctAnswer": constructor,
            "knowledgeLevel": 2,
            "category": "Circuit",
            "language": LANG
        }
    finally:
            cursor.close()
            conn.close()


def pregunta_piloto_mas_poles_sin_ganar_circuito():
    conn, cursor = crear_cursor_local()
    try:

        # Limpieza del cursor por seguridad
        while cursor.nextset():
            pass
        cursor.execute("SELECT name FROM circuits ORDER BY RAND() LIMIT 1")
        row = cursor.fetchone()
        if not row:
            return None
        circuito_objetivo = row[0]
        # De nuevo: asegurarse de que no quedan resultados pendientes
        while cursor.nextset():
            pass
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
        if LANG == "es":
            pregunta = f"¿Qué piloto logró más poles sin ganar nunca en el circuito de {circuito_objetivo}?"
        elif LANG == "en":
            pregunta = f"Which driver got more poles without winning any race at {circuito_objetivo}?"
        incorrectas = get_respuestas_incorrectas(piloto, get_pilotos_cache())
        opciones = incorrectas + [piloto]
        random.shuffle(opciones)
        return {
                "question": pregunta,
                "answers": opciones,               # <- "answers" en lugar de "options"
                "correctAnswer": piloto,           # <- "correctAnswer" en lugar de "answer"
                "knowledgeLevel": 2,                # nivel conocimiento arbitrario (ejemplo: 2)
                "category": "Circuit",
                "language": LANG
            }
    finally:
            cursor.close()
            conn.close()


def pregunta_anio_mas_cambios_lider():
    conn, cursor = crear_cursor_local()
    try:

        # De nuevo: asegurarse de que no quedan resultados pendientes
        while cursor.nextset():
            pass
        cursor.execute("SELECT name FROM circuits ORDER BY RAND() LIMIT 1")
        row = cursor.fetchone()
        if not row:
            return None
        circuito_objetivo = row[0]
        # De nuevo: asegurarse de que no quedan resultados pendientes
        while cursor.nextset():
            pass
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
        if LANG == "es":
            pregunta = f"¿En qué año hubo más cambios de líder en el circuito de {circuito_objetivo}?"
        elif LANG == "en":
            pregunta = f"Which year had more lead changes in the {circuito_objetivo} circuit?"
        opciones = get_respuestas_incorrectas(str(year), [str(y) for y in range(1980, 2024)])
        opciones.append(str(year))
        random.shuffle(opciones)
        return {
                "question": pregunta,
                "answers": opciones,               # <- "answers" en lugar de "options"
                "correctAnswer": str(year),           # <- "correctAnswer" en lugar de "answer"
                "knowledgeLevel": 2,                # nivel conocimiento arbitrario (ejemplo: 2)
                "category": "Circuit",
                "language": LANG
            }
    finally:
            cursor.close()
            conn.close()


def pregunta_anio_mas_abandonos_circuito():
    conn, cursor = crear_cursor_local()
    try:

        # De nuevo: asegurarse de que no quedan resultados pendientes
        while cursor.nextset():
            pass
        # Seleccionamos un circuito aleatorio
        cursor.execute("SELECT name FROM circuits ORDER BY RAND() LIMIT 1")
        row = cursor.fetchone()
        if not row:
            return None
        circuito_objetivo = row[0]
        # De nuevo: asegurarse de que no quedan resultados pendientes
        while cursor.nextset():
            pass
        if not circuito_objetivo:
            return None  # Protección adicional

        # Consulta para obtener el año con más abandonos en ese circuito
        cursor.execute("""
            SELECT ra.year, COUNT(*) as abandonos
            FROM results r
            JOIN races ra ON r.raceId = ra.raceId
            JOIN circuits c ON ra.circuitId = c.circuitId
            JOIN status s ON r.statusId = s.statusId
            WHERE c.name = %s AND (
                s.status LIKE 'Accident%%' OR
                s.status LIKE 'Engine%%' OR
                s.status LIKE 'Gearbox%%' OR
                s.status LIKE 'Suspension%%' OR
                s.status LIKE 'Electrical%%'
            )
            GROUP BY ra.year
            ORDER BY abandonos DESC
            LIMIT 1
        """, (circuito_objetivo,))
        row = cursor.fetchone()
        if not row:
            return None

        year = row[0]
        if LANG == "es":
            pregunta = f"¿Qué año tuvo más abandonos en el circuito de {circuito_objetivo}?"
        elif LANG == "en":
            pregunta = f"In which year did the {circuito_objetivo} circuit have more retirements?"
        opciones = get_respuestas_incorrectas(str(year), [str(y) for y in range(1980, 2024)])
        opciones.append(str(year))
        random.shuffle(opciones)

        return {
            "question": pregunta,
            "answers": opciones,
            "correctAnswer": str(year),
            "knowledgeLevel": 2,
            "category": "Circuit",
            "language": LANG
        }
    finally:
            cursor.close()
            conn.close()



def pregunta_piloto_pole_y_vuelta_rapida_misma_edicion():
    conn, cursor = crear_cursor_local()
    try:

        # De nuevo: asegurarse de que no quedan resultados pendientes
        while cursor.nextset():
            pass
        cursor.execute("SELECT name FROM circuits ORDER BY RAND() LIMIT 1")
        row = cursor.fetchone()
        if not row:
            return None
        circuito_objetivo = row[0]
        # De nuevo: asegurarse de que no quedan resultados pendientes
        while cursor.nextset():
            pass
        cursor.execute("""
            SELECT d.forename, d.surname
            FROM qualifying q
            JOIN races ra ON q.raceId = ra.raceId
            JOIN circuits c ON ra.circuitId = c.circuitId
            JOIN drivers d ON q.driverId = d.driverId
            WHERE q.position = 1 AND q.driverId = (
                SELECT l.driverId
                FROM lapTimes l
                JOIN races ra2 ON l.raceId = ra2.raceId
                JOIN circuits c2 ON ra2.circuitId = c2.circuitId
                WHERE c2.name = %s
                ORDER BY l.milliseconds ASC
                LIMIT 1
            ) AND c.name = %s
            LIMIT 1
        """, (circuito_objetivo, circuito_objetivo))
        row = cursor.fetchone()
        if not row:
            return None
        nombre, apellido = row
        piloto = f"{nombre} {apellido}"
        if LANG == "es":
            pregunta = f"¿Qué piloto logró la pole y la vuelta rápida en una misma edición en el circuito de {circuito_objetivo}?"
        elif LANG == "en":
            pregunta = f"Which driver got pole and fastest lap at the same GP  in the {circuito_objetivo} circuit?"
        incorrectas = get_respuestas_incorrectas(piloto, get_pilotos_cache())
        opciones = incorrectas + [piloto]
        random.shuffle(opciones)
        return {
            "question": pregunta,
            "answers": opciones,
            "correctAnswer": piloto,
            "knowledgeLevel": 2,
            "category": "Circuit",
            "language": LANG
        }
    finally:
            cursor.close()
            conn.close()



def pregunta_anio_velocidad_promedio_mas_alta():
    conn, cursor = crear_cursor_local()
    try:

        # De nuevo: asegurarse de que no quedan resultados pendientes
        while cursor.nextset():
            pass
        cursor.execute("SELECT name FROM circuits ORDER BY RAND() LIMIT 1")
        row = cursor.fetchone()
        if not row:
            return None
        circuito_objetivo = row[0]
        # De nuevo: asegurarse de que no quedan resultados pendientes
        while cursor.nextset():
            pass
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
        if LANG == "es":
            pregunta = f"¿En qué año se alcanzó la mayor velocidad promedio en el circuito de {circuito_objetivo}?"
        elif LANG == "en":
            pregunta = f"In what year was the highest average speed reached on the {circuito_objetivo} circuit?"
        opciones = get_respuestas_incorrectas(str(year), [str(y) for y in range(1950, 2024)])
        opciones.append(str(year))
        random.shuffle(opciones)
        return {
                "question": pregunta,
                "answers": opciones,               # <- "answers" en lugar de "options"
                "correctAnswer": str(year),           # <- "correctAnswer" en lugar de "answer"
                "knowledgeLevel": 2,                # nivel conocimiento arbitrario (ejemplo: 2)
                "category": "Circuit",
                "language": LANG
            }
    finally:
            cursor.close()
            conn.close()


def pregunta_pais_circuito():
    conn, cursor = crear_cursor_local()
    try:

        # De nuevo: asegurarse de que no quedan resultados pendientes
        while cursor.nextset():
            pass
        cursor.execute("SELECT name FROM circuits ORDER BY RAND() LIMIT 1")
        row = cursor.fetchone()
        if not row:
            return None
        circuito_objetivo = row[0]
        # De nuevo: asegurarse de que no quedan resultados pendientes
        while cursor.nextset():
            pass
        cursor.execute("""
            SELECT country FROM circuits WHERE name = %s
        """, (circuito_objetivo,))
        row = cursor.fetchone()
        if not row:
            return None
        pais = row[0]
        if LANG == "es":
            pregunta = f"¿En qué país se encuentra el circuito de {circuito_objetivo}?"
        elif LANG == "en":
            pregunta = f"In what country is {circuito_objetivo} circuit placed?"
        incorrectas = get_respuestas_incorrectas(pais, get_paises_cache())
        opciones = incorrectas + [pais]
        random.shuffle(opciones)
        return {
                "question": pregunta,
                "answers": opciones,               # <- "answers" en lugar de "options"
                "correctAnswer": pais,           # <- "correctAnswer" en lugar de "answer"
                "knowledgeLevel": 2,                # nivel conocimiento arbitrario (ejemplo: 2)
                "category": "Circuit",
                "language": LANG
            }
    finally:
            cursor.close()
            conn.close()


def pregunta_anio_cancelado_del_calendario():
    conn, cursor = crear_cursor_local()
    try:

        # De nuevo: asegurarse de que no quedan resultados pendientes
        while cursor.nextset():
            pass
        cursor.execute("SELECT name FROM circuits ORDER BY RAND() LIMIT 1")
        row = cursor.fetchone()
        if not row:
            return None
        circuito_objetivo = row[0]
        # De nuevo: asegurarse de que no quedan resultados pendientes
        while cursor.nextset():
            pass
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
        if LANG == "es":
            pregunta = f"¿En qué año no se celebró el Gran Premio en {circuito_objetivo} aunque formaba parte del calendario en años cercanos?"
        elif LANG == "en":
            pregunta = f"In what year was not held the GP at {circuito_objetivo} even though formed part of calendar in recent years?"
        opciones = get_respuestas_incorrectas(str(cancelado), [str(y) for y in range(1950, 2024)])
        opciones.append(str(cancelado))
        random.shuffle(opciones)
        return {
                "question": pregunta,
                "answers": opciones,               # <- "answers" en lugar de "options"
                "correctAnswer": str(cancelado),           # <- "correctAnswer" en lugar de "answer"
                "knowledgeLevel": 2,                # nivel conocimiento arbitrario (ejemplo: 2)
                "category": "Circuit",
                "language": LANG
            }
    finally:
            cursor.close()
            conn.close()


def pregunta_piloto_fue_campeon_en_ese_circuito():
    conn, cursor = crear_cursor_local()
    try:

        # De nuevo: asegurarse de que no quedan resultados pendientes
        while cursor.nextset():
            pass
        cursor.execute("SELECT name FROM circuits ORDER BY RAND() LIMIT 1")
        row = cursor.fetchone()
        if not row:
            return None
        circuito_objetivo = row[0]
        # De nuevo: asegurarse de que no quedan resultados pendientes
        while cursor.nextset():
            pass
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
        if LANG == "es":
            pregunta = f"¿Qué piloto se proclamó campeón del mundo en el circuito de {circuito_objetivo} más de una vez?"
        elif LANG == "en":
            pregunta = f"Which driver became F1 world champion at the {circuito_objetivo} circuit more tha once?"
        incorrectas = get_respuestas_incorrectas(piloto, get_pilotos_cache())
        opciones = incorrectas + [piloto]
        random.shuffle(opciones)
        return {
                "question": pregunta,
                "answers": opciones,               # <- "answers" en lugar de "options"
                "correctAnswer": piloto,           # <- "correctAnswer" en lugar de "answer"
                "knowledgeLevel": 2,                # nivel conocimiento arbitrario (ejemplo: 2)
                "category": "Circuit",
                "language": LANG
            }
    finally:
            cursor.close()
            conn.close()


def pregunta_gp_con_mas_campeones_en_circuito():
    conn, cursor = crear_cursor_local()
    try:

        # De nuevo: asegurarse de que no quedan resultados pendientes
        while cursor.nextset():
            pass
        cursor.execute("SELECT name FROM circuits ORDER BY RAND() LIMIT 1")
        row = cursor.fetchone()
        if not row:
            return None
        circuito_objetivo = row[0]
        # De nuevo: asegurarse de que no quedan resultados pendientes
        while cursor.nextset():
            pass
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
        if LANG == "es":
            pregunta = f"¿En qué edición del GP de {circuito_objetivo} compitieron más campeones del mundo al mismo tiempo?"
        elif LANG == "en":
            pregunta = f"In what edition of the GP at {circuito_objetivo} competed more world champions at the same time?"
        opciones = get_respuestas_incorrectas(str(year), [str(y) for y in range(1980, 2024)])
        opciones.append(str(year))
        random.shuffle(opciones)
        return {
                "question": pregunta,
                "answers": opciones,               # <- "answers" en lugar de "options"
                "correctAnswer": str(year),           # <- "correctAnswer" en lugar de "answer"
                "knowledgeLevel": 2,                # nivel conocimiento arbitrario (ejemplo: 2)
                "category": "Circuit",
                "language": LANG
            }
    finally:
            cursor.close()
            conn.close()


def pregunta_piloto_mas_victorias_circuito():
    conn, cursor = crear_cursor_local()
    try:

        # De nuevo: asegurarse de que no quedan resultados pendientes
        while cursor.nextset():
            pass
        cursor.execute("SELECT name FROM circuits ORDER BY RAND() LIMIT 1")
        row = cursor.fetchone()
        if not row:
            return None
        circuito_objetivo = row[0]
        # De nuevo: asegurarse de que no quedan resultados pendientes
        while cursor.nextset():
            pass
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
        if LANG == "es":
            pregunta = f"¿Qué piloto ha ganado más veces en el circuito de {circuito_objetivo}?"
        elif LANG == "en":
            pregunta = f"Which driver has won more times at the {circuito_objetivo} circuit?"
        incorrectas = get_respuestas_incorrectas(piloto, get_pilotos_cache())
        opciones = incorrectas + [piloto]
        random.shuffle(opciones)
        return {
                "question": pregunta,
                "answers": opciones,               # <- "answers" en lugar de "options"
                "correctAnswer": piloto,           # <- "correctAnswer" en lugar de "answer"
                "knowledgeLevel": 2,                # nivel conocimiento arbitrario (ejemplo: 2)
                "category": "Circuit",
                "language": LANG
            }
    finally:
            cursor.close()
            conn.close()


def pregunta_constructor_mas_poles_circuito():
    conn, cursor = crear_cursor_local()
    try:

        # De nuevo: asegurarse de que no quedan resultados pendientes
        while cursor.nextset():
            pass
        cursor.execute("SELECT name FROM circuits ORDER BY RAND() LIMIT 1")
        row = cursor.fetchone()
        if not row:
            return None
        circuito_objetivo = row[0]
        # De nuevo: asegurarse de que no quedan resultados pendientes
        while cursor.nextset():
            pass
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
        if LANG == "es":
            pregunta = f"¿Qué constructor logró más poles en el circuito de {circuito_objetivo}?"
        elif LANG == "en":
            pregunta = f"Which team got more poles at {circuito_objetivo} circuit?"
        incorrectas = get_respuestas_incorrectas(constructor, get_constructores_cache())
        opciones = incorrectas + [constructor]
        random.shuffle(opciones)
        return {
                "question": pregunta,
                "answers": opciones,               # <- "answers" en lugar de "options"
                "correctAnswer": constructor,           # <- "correctAnswer" en lugar de "answer"
                "knowledgeLevel": 2,                # nivel conocimiento arbitrario (ejemplo: 2)
                "category": "Circuit",
                "language": LANG
            }
    finally:
            cursor.close()
            conn.close()

def pregunta_ano_mas_abandonos_circuito():
    conn, cursor = crear_cursor_local()
    try:

        # De nuevo: asegurarse de que no quedan resultados pendientes
        while cursor.nextset():
            pass
        cursor.execute("SELECT name FROM circuits ORDER BY RAND() LIMIT 1")
        row = cursor.fetchone()
        if not row:
            return None
        circuito_objetivo = row[0]
        # De nuevo: asegurarse de que no quedan resultados pendientes
        while cursor.nextset():
            pass
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
        if LANG == "es":
            pregunta = f"¿En qué año hubo más abandonos en el circuito de {circuito_objetivo}?"
        elif LANG == "en":
            pregunta = f"In what year were more retirements in {circuito_objetivo}?"
        opciones = get_respuestas_incorrectas(str(year), [str(y) for y in range(1980, 2024)])
        opciones.append(str(year))
        random.shuffle(opciones)
        return {
                "question": pregunta,
                "answers": opciones,               # <- "answers" en lugar de "options"
                "correctAnswer": str(year),           # <- "correctAnswer" en lugar de "answer"
                "knowledgeLevel": 2,                # nivel conocimiento arbitrario (ejemplo: 2)
                "category": "Circuit",
                "language": LANG
            }
    finally:
            cursor.close()
            conn.close()


def pregunta_numero_gp_en_circuito():
    conn, cursor = crear_cursor_local()
    try:

        # De nuevo: asegurarse de que no quedan resultados pendientes
        while cursor.nextset():
            pass
        cursor.execute("SELECT name FROM circuits ORDER BY RAND() LIMIT 1")
        row = cursor.fetchone()
        if not row:
            return None
        circuito_objetivo = row[0]
        # De nuevo: asegurarse de que no quedan resultados pendientes
        while cursor.nextset():
            pass
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
        if LANG == "es":
            pregunta = f"¿Cuántas veces se celebró un Gran Premio en el circuito de {circuito_objetivo}?"
        elif LANG == "en":
            pregunta = f"How many times was a Gran Prix held at {circuito_objetivo}?"
        opciones = get_respuestas_incorrectas(str(cantidad), [str(i) for i in range(0, 100)])
        opciones.append(str(cantidad))
        random.shuffle(opciones)
        return {
                "question": pregunta,
                "answers": opciones,               # <- "answers" en lugar de "options"
                "correctAnswer": str(cantidad),           # <- "correctAnswer" en lugar de "answer"
                "knowledgeLevel": 2,                # nivel conocimiento arbitrario (ejemplo: 2)
                "category": "Circuit",
                "language": LANG
            }
    finally:
            cursor.close()
            conn.close()

def pregunta_anio_vuelta_rapida_circuito():
    conn, cursor = crear_cursor_local()
    try:

        # De nuevo: asegurarse de que no quedan resultados pendientes
        while cursor.nextset():
            pass
        cursor.execute("SELECT name FROM circuits ORDER BY RAND() LIMIT 1")
        row = cursor.fetchone()
        if not row:
            return None
        circuito_objetivo = row[0]

        # De nuevo: asegurarse de que no quedan resultados pendientes
        while cursor.nextset():
            pass
        cursor.execute("""
            SELECT ra.year, MIN(milliseconds) as vuelta_rapida
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
        if LANG == "es":
            pregunta = f"¿En qué año se logró la vuelta rápida más rápida en el circuito de {circuito_objetivo}?"
        elif LANG == "en":
            pregunta = f"In which year the {circuito_objetivo} circuit`s fastest lap was achieved?"
        opciones = get_respuestas_incorrectas(str(year), [str(y) for y in range(1980, 2024)])
        opciones.append(str(year))
        random.shuffle(opciones)

        return {
                "question": pregunta,
                "answers": opciones,               # <- "answers" en lugar de "options"
                "correctAnswer": str(year),           # <- "correctAnswer" en lugar de "answer"
                "knowledgeLevel": 2,                # nivel conocimiento arbitrario (ejemplo: 2)
                "category": "Circuit",
                "language": LANG
            }
    finally:
            cursor.close()
            conn.close()

#---------------------------------------------------------------------------------------------------------------
# Preguntas sobre PILOTO en concreto

def pregunta_circuito_mas_abandonos_piloto():
    conn, cursor = crear_cursor_local()
    try:

        # De nuevo: asegurarse de que no quedan resultados pendientes
        while cursor.nextset():
            pass
        cursor.execute("SELECT driverId FROM drivers ORDER BY RAND() LIMIT 1")
        row = cursor.fetchone()
        if not row:
            return None
        piloto_objetivo = row[0]
        while cursor.nextset():
            pass
        cursor.execute("SELECT forename, surname FROM drivers WHERE driverId = %s", (piloto_objetivo,))
        row = cursor.fetchone()

        if not row:
            return None
        piloto_objetivo_name = f"{row[0]} {row[1]}"

        # De nuevo: asegurarse de que no quedan resultados pendientes
        while cursor.nextset():
            pass
        cursor.execute("""
            SELECT c.name, COUNT(*) as abandonos
            FROM results r
            JOIN races ra ON r.raceId = ra.raceId
            JOIN circuits c ON ra.circuitId = c.circuitId
            JOIN status s ON r.statusId = s.statusId
            WHERE r.driverId = %s AND (
                s.status LIKE '%%accident%%' OR
                s.status LIKE '%%engine%%' OR
                s.status LIKE '%%gearbox%%' OR
                s.status LIKE '%%electrical%%'
            )
            GROUP BY c.name
            ORDER BY abandonos DESC
            LIMIT 1
        """, (piloto_objetivo,))
        row = cursor.fetchone()
        if not row:
            return None
        circuito = row[0]

        cursor.execute("SELECT name FROM circuits WHERE name != %s ORDER BY RAND() LIMIT 3", (circuito,))
        if LANG == "es":
            pregunta = f"¿En qué circuito abandonó más veces el piloto {piloto_objetivo_name}?"
        elif LANG == "en":
            pregunta = f"In what track {piloto_objetivo_name} retired the most?"
        incorrectas = [r[0] for r in cursor.fetchall()]

        opciones = incorrectas + [circuito]
        random.shuffle(opciones)

        return {
            "question": pregunta,
            "answers": opciones,
            "correctAnswer": circuito,
            "knowledgeLevel": 2,
            "category": "Driver",
            "language": LANG
        }
    finally:
            cursor.close()
            conn.close()


def pregunta_puntos_consecutivos_piloto():
    conn, cursor = crear_cursor_local()
    try:

        # De nuevo: asegurarse de que no quedan resultados pendientes
        while cursor.nextset():
            pass
        cursor.execute("SELECT driverId, forename, surname FROM drivers ORDER BY RAND() LIMIT 1")
        row = cursor.fetchone()
        if not row:
            return None
        piloto_objetivo, forename, surname = row
        nombre_piloto = f"{forename} {surname}"
        # De nuevo: asegurarse de que no quedan resultados pendientes
        while cursor.nextset():
            pass
        cursor.execute("""
            SELECT ra.year, ra.round, r.points
            FROM results r
            JOIN races ra ON r.raceId = ra.raceId
            WHERE r.driverId = %s
            ORDER BY ra.year, ra.round
        """, (piloto_objetivo,))
        rows = cursor.fetchall()
        if not rows:
            return None

        rachas = []
        actual = 0
        for _, _, puntos in rows:
            if puntos > 0:
                actual += 1
            else:
                if actual >= 5:
                    rachas.append(actual)
                actual = 0
        if actual >= 5:
            rachas.append(actual)

        total_rachas = len(rachas)
        if LANG == "es":
            pregunta = f"¿Cuántas veces logró puntos consecutivos en al menos 5 carreras el piloto {nombre_piloto}?"
        elif LANG == "en":
            pregunta = f"How many times {nombre_piloto} achieved at least 5 consecutive races in the points?"
        incorrectas = get_respuestas_incorrectas(str(total_rachas), [str(i) for i in range(0, 10)])
        opciones = incorrectas + [str(total_rachas)]
        random.shuffle(opciones)

        return {
            "question": pregunta,
            "answers": opciones,
            "correctAnswer": str(total_rachas),
            "knowledgeLevel": 2,
            "category": "Driver",
            "language": LANG
        }
    finally:
            cursor.close()
            conn.close()


def pregunta_promedio_posicion_clasificacion():
    conn, cursor = crear_cursor_local()
    try:

        # De nuevo: asegurarse de que no quedan resultados pendientes
        while cursor.nextset():
            pass
        cursor.execute("SELECT driverId, forename, surname FROM drivers ORDER BY RAND() LIMIT 1")
        row = cursor.fetchone()
        if not row:
            return None
        piloto_objetivo, forename, surname = row
        nombre_piloto = f"{forename} {surname}"
        # De nuevo: asegurarse de que no quedan resultados pendientes
        while cursor.nextset():
            pass
        cursor.execute("""
            SELECT AVG(q.position) as promedio
            FROM qualifying q
            JOIN races ra ON q.raceId = ra.raceId
            WHERE q.driverId = %s AND q.position IS NOT NULL
        """, (piloto_objetivo,))
        row = cursor.fetchone()
        if not row or row[0] is None:
            return None
        promedio = round(float(row[0]), 1)
        if LANG == "es":
            pregunta = f"¿Cuál fue el promedio de posición de clasificación de {nombre_piloto} en toda su carrera?"
        elif LANG == "en":
            pregunta = f"What is {nombre_piloto} qualifying average position in his whole career?"
        incorrectas = get_respuestas_incorrectas(str(promedio), [str(round(i + 0.5, 1)) for i in range(1, 11)])
        opciones = incorrectas + [str(promedio)]
        random.shuffle(opciones)

        return {
            "question": pregunta,
            "answers": opciones,
            "correctAnswer": str(promedio),
            "knowledgeLevel": 2,
            "category": "Driver",
            "language": LANG
        }
    finally:
            cursor.close()
            conn.close()


def pregunta_temporada_mas_paradas_boxes():
    conn, cursor = crear_cursor_local()
    try:

        # De nuevo: asegurarse de que no quedan resultados pendientes
        while cursor.nextset():
            pass
        cursor.execute("SELECT driverId, forename, surname FROM drivers ORDER BY RAND() LIMIT 1")
        row = cursor.fetchone()
        if not row:
            return None
        piloto_objetivo, forename, surname = row
        nombre_piloto = f"{forename} {surname}"
        # De nuevo: asegurarse de que no quedan resultados pendientes
        while cursor.nextset():
            pass
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
        if not row or row[0] is None:
            return None
        year = row[0]
        if LANG == "es":
            pregunta = f"¿En qué temporada {nombre_piloto} tuvo más paradas en boxes?"
        elif LANG == "en":
            pregunta = f"Which season did {nombre_piloto} have more pit stops?"
        incorrectas = get_respuestas_incorrectas(str(year), [str(y) for y in range(1950, 2024) if y != year])
        opciones = incorrectas + [str(year)]
        random.shuffle(opciones)

        return {
            "question": pregunta,
            "answers": opciones,
            "correctAnswer": str(year),
            "knowledgeLevel": 2,
            "category": "Driver",
            "language": LANG
        }
    finally:
            cursor.close()
            conn.close()


def pregunta_porcentaje_carreras_finalizadas():
    conn, cursor = crear_cursor_local()
    try:

        # De nuevo: asegurarse de que no quedan resultados pendientes
        while cursor.nextset():
            pass
        cursor.execute("SELECT driverId, forename, surname FROM drivers ORDER BY RAND() LIMIT 1")
        row = cursor.fetchone()
        if not row:
            return None
        piloto_objetivo, forename, surname = row
        nombre_piloto = f"{forename} {surname}"
        # De nuevo: asegurarse de que no quedan resultados pendientes
        while cursor.nextset():
            pass
        cursor.execute("""
            SELECT
                ROUND(SUM(CASE WHEN r.statusId IN (
                    SELECT statusId FROM status WHERE status NOT LIKE '%accident%'
                                                   AND status NOT LIKE '%engine%'
                                                   AND status NOT LIKE '%gearbox%'
                                                   AND status NOT LIKE '%electrical%'
                ) THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) AS porcentaje
            FROM results r
            WHERE r.driverId = %s
        """, (piloto_objetivo,))
        row = cursor.fetchone()
        if not row or row[0] is None:
            return None
        porcentaje = row[0]

        if LANG == "es":
            pregunta = f"¿Cuál fue el porcentaje de carreras finalizadas por {nombre_piloto} respecto a las disputadas?"
        elif LANG == "en":
            pregunta = f"What is {nombre_piloto} completed races average regarding the races contested?"
        incorrectas = get_respuestas_incorrectas(str(porcentaje), [str(round(i, 2)) for i in range(40, 101, 10)])
        opciones = incorrectas + [str(porcentaje)]
        random.shuffle(opciones)

        return {
            "question": pregunta,
            "answers": opciones,
            "correctAnswer": str(porcentaje),
            "knowledgeLevel": 2,
            "category": "Driver",
            "language": LANG
        }
    finally:
            cursor.close()
            conn.close()


def pregunta_circuito_no_victoria_piloto():
    conn, cursor = crear_cursor_local()
    try:
        while cursor.nextset():
            pass

        # Escoger piloto aleatorio que haya ganado al menos en 3 circuitos
        cursor.execute("""
            SELECT d.driverId, d.forename, d.surname
            FROM drivers d
            WHERE (
                SELECT COUNT(DISTINCT ra.circuitId)
                FROM results r
                JOIN races ra ON r.raceId = ra.raceId
                WHERE r.driverId = d.driverId AND r.position = 1
            ) >= 3
            ORDER BY RAND()
            LIMIT 1
        """)
        row = cursor.fetchone()
        if not row:
            return None
        piloto_id, forename, surname = row
        nombre_piloto = f"{forename} {surname}"

        while cursor.nextset():
            pass

        # Obtener circuitos en los que NO ha ganado
        cursor.execute("""
            SELECT c.name
            FROM circuits c
            WHERE c.circuitId NOT IN (
                SELECT ra.circuitId
                FROM results r
                JOIN races ra ON r.raceId = ra.raceId
                WHERE r.driverId = %s AND r.position = 1
            )
            ORDER BY RAND()
            LIMIT 1
        """, (piloto_id,))
        row = cursor.fetchone()
        if not row:
            return None
        circuito_no_ganado = row[0]

        while cursor.nextset():
            pass

        # Obtener 3 circuitos donde SÍ ha ganado
        cursor.execute("""
            SELECT DISTINCT c.name
            FROM results r
            JOIN races ra ON r.raceId = ra.raceId
            JOIN circuits c ON ra.circuitId = c.circuitId
            WHERE r.driverId = %s AND r.position = 1
            ORDER BY RAND()
            LIMIT 3
        """, (piloto_id,))
        circuitos_ganados = [r[0] for r in cursor.fetchall()]

        if len(circuitos_ganados) < 3:
            return None  # Seguridad extra

        opciones = circuitos_ganados + [circuito_no_ganado]
        random.shuffle(opciones)

        if LANG == "es":
            pregunta = f"¿En qué circuito {nombre_piloto} no ha logrado nunca una victoria?"
        elif LANG == "en":
            pregunta = f"In which track did not {nombre_piloto} achieve any race win?"

        return {
            "question": pregunta,
            "answers": opciones,
            "correctAnswer": circuito_no_ganado,
            "knowledgeLevel": 2,
            "category": "Driver",
            "language": LANG
        }
    finally:
        cursor.close()
        conn.close()



def pregunta_pilotos_distintos_compitio():
    conn, cursor = crear_cursor_local()
    try:

        # De nuevo: asegurarse de que no quedan resultados pendientes
        while cursor.nextset():
            pass
        cursor.execute("SELECT driverId, forename, surname FROM drivers ORDER BY RAND() LIMIT 1")
        row = cursor.fetchone()
        if not row:
            return None
        piloto_objetivo, forename, surname = row
        nombre_piloto = f"{forename} {surname}"
        # De nuevo: asegurarse de que no quedan resultados pendientes
        while cursor.nextset():
            pass
        cursor.execute("""
            SELECT COUNT(DISTINCT r2.driverId)
            FROM results r1
            JOIN results r2 ON r1.raceId = r2.raceId
            WHERE r1.driverId = %s AND r2.driverId != %s
        """, (piloto_objetivo, piloto_objetivo))
        row = cursor.fetchone()
        if not row:
            return None
        total = row[0]
        if LANG == "es":
            pregunta = f"¿Con cuántos pilotos distintos ha competido {nombre_piloto} en su historia?"
        elif LANG == "en":
            pregunta = f"With how many drivers has {nombre_piloto} competed during his career?"
        opciones = get_respuestas_incorrectas(str(total), [str(i) for i in range(50, 150)])
        opciones.append(str(total))
        random.shuffle(opciones)

        return {
            "question": pregunta,
            "answers": opciones,
            "correctAnswer": str(total),
            "knowledgeLevel": 2,
            "category": "Driver",
            "language": LANG
        }
    finally:
            cursor.close()
            conn.close()

def pregunta_racha_sin_ganar():
    conn, cursor = crear_cursor_local()
    try:

        # De nuevo: asegurarse de que no quedan resultados pendientes
        while cursor.nextset():
            pass
        cursor.execute("SELECT driverId, forename, surname FROM drivers ORDER BY RAND() LIMIT 1")
        row = cursor.fetchone()
        if not row:
            return None
        piloto_objetivo, forename, surname = row
        nombre_piloto = f"{forename} {surname}"
        # De nuevo: asegurarse de que no quedan resultados pendientes
        while cursor.nextset():
            pass
        # Obtener todas las temporadas en las que participó
        cursor.execute("""
            SELECT DISTINCT ra.year
            FROM results r
            JOIN races ra ON r.raceId = ra.raceId
            WHERE r.driverId = %s
            ORDER BY ra.year
        """, (piloto_objetivo,))
        temporadas = [row[0] for row in cursor.fetchall()]

        # De nuevo: asegurarse de que no quedan resultados pendientes
        while cursor.nextset():
            pass
        # Obtener temporadas con al menos una victoria
        cursor.execute("""
            SELECT DISTINCT ra.year
            FROM results r
            JOIN races ra ON r.raceId = ra.raceId
            WHERE r.driverId = %s AND r.position = 1
        """, (piloto_objetivo,))
        temporadas_con_victoria = set(row[0] for row in cursor.fetchall())

        # Calcular la racha más larga de años sin victoria
        racha = max_racha = 0
        for anio in temporadas:
            if anio not in temporadas_con_victoria:
                racha += 1
                max_racha = max(max_racha, racha)
            else:
                racha = 0

        if LANG == "es":
            pregunta = f"¿Cuál fue la racha más larga de temporadas sin ganar para {nombre_piloto}?"
        elif LANG == "en":
            pregunta = f"Which was {nombre_piloto} biggest no seasons winning streak?"
        opciones = get_respuestas_incorrectas(str(max_racha), [str(i) for i in range(1, 10)])
        opciones.append(str(max_racha))
        random.shuffle(opciones)

        return {
            "question": pregunta,
            "answers": opciones,
            "correctAnswer": str(max_racha),
            "knowledgeLevel": 2,
            "category": "Driver",
            "language": LANG
        }
    finally:
            cursor.close()
            conn.close()


def pregunta_peor_posicion_clasificacion_piloto():
    conn, cursor = crear_cursor_local()
    try:

        # De nuevo: asegurarse de que no quedan resultados pendientes
        while cursor.nextset():
            pass
        cursor.execute("SELECT driverId, forename, surname FROM drivers ORDER BY RAND() LIMIT 1")
        row = cursor.fetchone()
        if not row:
            return None
        piloto_objetivo, forename, surname = row
        nombre_piloto = f"{forename} {surname}"
        # De nuevo: asegurarse de que no quedan resultados pendientes
        while cursor.nextset():
            pass
        cursor.execute("""
            SELECT MAX(q.position)
            FROM qualifying q
            JOIN results r ON q.raceId = r.raceId AND q.driverId = r.driverId
            WHERE q.driverId = %s AND r.points > 0 AND q.position IS NOT NULL
        """, (piloto_objetivo,))
        row = cursor.fetchone()
        if not row or row[0] is None:
            return None
        posicion = int(row[0])
        if LANG == "es":
            pregunta = f"¿Cuál fue la peor posición de clasificación desde la que logró puntuar {nombre_piloto}?"
        elif LANG == "en":
            pregunta = f"Which was {nombre_piloto} worst qualifying positions from which he managed to score points?"
        opciones = get_respuestas_incorrectas(str(posicion), [str(i) for i in range(1, 25)])
        opciones.append(str(posicion))
        random.shuffle(opciones)

        return {
            "question": pregunta,
            "answers": opciones,
            "correctAnswer": str(posicion),
            "knowledgeLevel": 2,
            "category": "Driver",
            "language": LANG
        }
    finally:
            cursor.close()
            conn.close()


def pregunta_remontadas_puesto_15_piloto():
    conn, cursor = crear_cursor_local()
    try:

        # De nuevo: asegurarse de que no quedan resultados pendientes
        while cursor.nextset():
            pass
        cursor.execute("SELECT driverId, forename, surname FROM drivers ORDER BY RAND() LIMIT 1")
        row = cursor.fetchone()
        if not row:
            return None
        piloto_objetivo, forename, surname = row
        nombre_piloto = f"{forename} {surname}"
        # De nuevo: asegurarse de que no quedan resultados pendientes
        while cursor.nextset():
            pass
        cursor.execute("""
            SELECT COUNT(*)
            FROM results
            WHERE driverId = %s AND grid >= 15 AND position <= 3
        """, (piloto_objetivo,))
        row = cursor.fetchone()
        if not row:
            return None
        remontadas = row[0]
        if LANG == "es":
            pregunta = f"¿Cuántas veces remontó del puesto 15 o peor al podio {nombre_piloto}?"
        elif LANG == "en":
            pregunta = f"How many times did {nombre_piloto} comeback from 15th place or lower to the podium?"
        opciones = get_respuestas_incorrectas(str(remontadas), [str(i) for i in range(0, 20)])
        opciones.append(str(remontadas))
        random.shuffle(opciones)

        return {
            "question": pregunta,
            "answers": opciones,
            "correctAnswer": str(remontadas),
            "knowledgeLevel": 2,
            "category": "Driver",
            "language": LANG
        }
    finally:
            cursor.close()
            conn.close()


def pregunta_carreras_lideradas_piloto():
    conn, cursor = crear_cursor_local()
    try:

        # De nuevo: asegurarse de que no quedan resultados pendientes
        while cursor.nextset():
            pass
        cursor.execute("SELECT driverId, forename, surname FROM drivers ORDER BY RAND() LIMIT 1")
        row = cursor.fetchone()
        if not row:
            return None
        piloto_objetivo, forename, surname = row
        nombre_piloto = f"{forename} {surname}"
        # De nuevo: asegurarse de que no quedan resultados pendientes
        while cursor.nextset():
            pass
        cursor.execute("""
            SELECT COUNT(DISTINCT l.raceId)
            FROM lapTimes l
            JOIN results r ON l.raceId = r.raceId AND l.driverId = r.driverId
            WHERE l.driverId = %s AND l.position = 1
        """, (piloto_objetivo,))
        row = cursor.fetchone()
        if not row:
            return None
        lideradas = row[0]
        if LANG == "es":
            pregunta = f"¿En cuántas carreras lideró al menos una vuelta {nombre_piloto}?"
        elif LANG == "en":
            pregunta = f"How many races did {nombre_piloto} lead at least one lap?"
        opciones = get_respuestas_incorrectas(str(lideradas), [str(i) for i in range(0, 20)])
        opciones.append(str(lideradas))
        random.shuffle(opciones)

        return {
            "question": pregunta,
            "answers": opciones,
            "correctAnswer": str(lideradas),
            "knowledgeLevel": 2,
            "category": "Driver",
            "language": LANG
        }
    finally:
            cursor.close()
            conn.close()


def pregunta_supero_mas_clasificacion():
    conn, cursor = crear_cursor_local()
    try:

        # De nuevo: asegurarse de que no quedan resultados pendientes
        while cursor.nextset():
            pass
        cursor.execute("SELECT driverId, forename, surname FROM drivers ORDER BY RAND() LIMIT 1")
        row = cursor.fetchone()
        if not row:
            return None
        piloto_id, forename, surname = row
        nombre_piloto = f"{forename} {surname}"
        # De nuevo: asegurarse de que no quedan resultados pendientes
        while cursor.nextset():
            pass
        cursor.execute("""
            SELECT d.forename, d.surname, COUNT(*) as veces
            FROM qualifying q1
            JOIN qualifying q2 ON q1.raceId = q2.raceId
            JOIN drivers d ON q2.driverId = d.driverId
            WHERE q1.driverId = %s AND q2.driverId != %s AND q1.position < q2.position
            GROUP BY q2.driverId
            ORDER BY veces DESC
            LIMIT 1
        """, (piloto_id, piloto_id))
        row = cursor.fetchone()
        if not row:
            return None
        piloto_superado = f"{row[0]} {row[1]}"
        if LANG == "es":
            pregunta = f"¿A qué piloto superó más veces en clasificación directa {nombre_piloto}?"
        elif LANG == "en":
            pregunta = f" To which driver did {nombre_piloto} qualified ahead more times?"
        incorrectas = get_respuestas_incorrectas(piloto_superado, get_pilotos_cache())
        opciones = incorrectas + [piloto_superado]
        random.shuffle(opciones)

        return {
            "question": pregunta,
            "answers": opciones,
            "correctAnswer": piloto_superado,
            "knowledgeLevel": 2,
            "category": "Driver",
            "language": LANG
        }
    finally:
            cursor.close()
            conn.close()

def pregunta_mejor_vuelta_rapida():
    conn, cursor = crear_cursor_local()
    try:

        # De nuevo: asegurarse de que no quedan resultados pendientes
        while cursor.nextset():
            pass
        cursor.execute("SELECT driverId, forename, surname FROM drivers ORDER BY RAND() LIMIT 1")
        row = cursor.fetchone()
        if not row:
            return None
        piloto_id, forename, surname = row
        nombre_piloto = f"{forename} {surname}"
        # De nuevo: asegurarse de que no quedan resultados pendientes
        while cursor.nextset():
            pass
        cursor.execute("""
            SELECT MIN(l.milliseconds)
            FROM lapTimes l
            JOIN results r ON l.raceId = r.raceId AND l.driverId = r.driverId
            WHERE r.driverId = %s AND l.milliseconds IS NOT NULL
        """, (piloto_id,))
        row = cursor.fetchone()
        if not row or row[0] is None:
            return None
        mejor_vuelta = int(row[0])
        if LANG == "es":
            pregunta = f"¿Cuál fue la mejor vuelta rápida (en milisegundos) de {nombre_piloto}?"
        elif LANG == "en":
            pregunta = f"Which has been {nombre_piloto} best fastest lap (in milliseconds)?"
        opciones = get_respuestas_incorrectas(str(mejor_vuelta), [str(i * 1000) for i in range(55, 75)])  # 55s-75s
        opciones.append(str(mejor_vuelta))
        random.shuffle(opciones)

        return {
            "question": pregunta,
            "answers": opciones,
            "correctAnswer": str(mejor_vuelta),
            "knowledgeLevel": 2,
            "category": "Driver",
            "language": LANG
        }
    finally:
            cursor.close()
            conn.close()


def pregunta_piloto_anio_mas_puntos():
    conn, cursor = crear_cursor_local()
    try:

        # De nuevo: asegurarse de que no quedan resultados pendientes
        while cursor.nextset():
            pass
        cursor.execute("SELECT driverId, forename, surname FROM drivers ORDER BY RAND() LIMIT 1")
        row = cursor.fetchone()
        if not row:
            return None
        piloto_id, forename, surname = row
        nombre_piloto = f"{forename} {surname}"
        # De nuevo: asegurarse de que no quedan resultados pendientes
        while cursor.nextset():
            pass
        cursor.execute("""
            SELECT ra.year, SUM(r.points) as total_puntos
            FROM results r
            JOIN races ra ON r.raceId = ra.raceId
            WHERE r.driverId = %s
            GROUP BY ra.year
            ORDER BY total_puntos DESC
            LIMIT 1
        """, (piloto_id,))
        row = cursor.fetchone()
        if not row:
            return None
        year = row[0]
        if LANG == "es":
            pregunta = f"¿En qué año logró más puntos {nombre_piloto}?"
        elif LANG == "en":
            pregunta = f"What year did {nombre_piloto} score more points?"
        opciones = get_respuestas_incorrectas(str(year), [str(y) for y in range(1950, 2024)])
        opciones.append(str(year))
        random.shuffle(opciones)

        return {
            "question": pregunta,
            "answers": opciones,
            "correctAnswer": str(year),
            "knowledgeLevel": 2,
            "category": "Driver",
            "language": LANG
        }
    finally:
            cursor.close()
            conn.close()

def pregunta_escuderias_distintas_piloto():
    conn, cursor = crear_cursor_local()
    try:

        # De nuevo: asegurarse de que no quedan resultados pendientes
        while cursor.nextset():
            pass
        cursor.execute("SELECT driverId, forename, surname FROM drivers ORDER BY RAND() LIMIT 1")
        row = cursor.fetchone()
        if not row:
            return None
        piloto_id, forename, surname = row
        nombre_piloto = f"{forename} {surname}"
        # De nuevo: asegurarse de que no quedan resultados pendientes
        while cursor.nextset():
            pass
        cursor.execute("""
            SELECT COUNT(DISTINCT constructorId)
            FROM results
            WHERE driverId = %s
        """, (piloto_id,))
        row = cursor.fetchone()
        if not row:
            return None
        total = row[0]
        if LANG == "es":
            pregunta = f"¿Con cuántas escuderías distintas ha competido {nombre_piloto}?"
        elif LANG == "en":
            pregunta = f"With how many different teams has {nombre_piloto} raced for?"
        opciones = get_respuestas_incorrectas(str(total), [str(i) for i in range(1, 15)])
        opciones.append(str(total))
        random.shuffle(opciones)

        return {
            "question": pregunta,
            "answers": opciones,
            "correctAnswer": str(total),
            "knowledgeLevel": 2,
            "category": "Driver",
            "language": LANG
        }
    finally:
            cursor.close()
            conn.close()


def pregunta_gp_mas_participaciones_piloto():
    conn, cursor = crear_cursor_local()
    try:

        # De nuevo: asegurarse de que no quedan resultados pendientes
        while cursor.nextset():
            pass
        cursor.execute("SELECT driverId, forename, surname FROM drivers ORDER BY RAND() LIMIT 1")
        row = cursor.fetchone()
        if not row:
            return None
        piloto_id, forename, surname = row
        nombre_piloto = f"{forename} {surname}"
        # De nuevo: asegurarse de que no quedan resultados pendientes
        while cursor.nextset():
            pass
        cursor.execute("""
            SELECT c.name, COUNT(*) as participaciones
            FROM results r
            JOIN races ra ON r.raceId = ra.raceId
            JOIN circuits c ON ra.circuitId = c.circuitId
            WHERE r.driverId = %s
            GROUP BY c.name
            ORDER BY participaciones DESC
            LIMIT 1
        """, (piloto_id,))
        row = cursor.fetchone()
        if not row:
            return None
        circuito = row[0]

        cursor.execute("SELECT name FROM circuits WHERE name != %s ORDER BY RAND() LIMIT 3", (circuito,))
        incorrectas = [r[0] for r in cursor.fetchall()]
        opciones = incorrectas + [circuito]
        random.shuffle(opciones)
        if LANG == "es":
            pregunta = f"¿En qué Gran Premio participó más veces {nombre_piloto}?"
        elif LANG == "en":
            pregunta = f"In what Gran Prix has {nombre_piloto} participated more times at?"
        return {
            "question": pregunta,
            "answers": opciones,
            "correctAnswer": circuito,
            "knowledgeLevel": 2,
            "category": "Driver",
            "language": LANG
        }
    finally:
            cursor.close()
            conn.close()


def pregunta_abandonos_piloto():
    conn, cursor = crear_cursor_local()
    try:

        # De nuevo: asegurarse de que no quedan resultados pendientes
        while cursor.nextset():
            pass

        cursor.execute("SELECT driverId, forename, surname FROM drivers ORDER BY RAND() LIMIT 1")
        row = cursor.fetchone()
        if not row:
            return None
        piloto_id, forename, surname = row
        nombre_piloto = f"{forename} {surname}"
        # De nuevo: asegurarse de que no quedan resultados pendientes
        while cursor.nextset():
            pass

        cursor.execute("""
            SELECT COUNT(*)
            FROM results r
            JOIN status s ON r.statusId = s.statusId
            WHERE r.driverId = %s AND (
                s.status LIKE '%accident%' OR
                s.status LIKE '%engine%' OR
                s.status LIKE '%gearbox%' OR
                s.status LIKE '%electrical%'
            )
        """, (piloto_id,))
        row = cursor.fetchone()
        if not row:
            return None
        abandonos = row[0]
        if LANG == "es":
            pregunta = f"¿Cuántas veces abandonó {nombre_piloto} en su carrera?"
        elif LANG == "en":
            pregunta = f"How many times {nombre_piloto} retired in his career?"
        opciones = get_respuestas_incorrectas(str(abandonos), [str(i) for i in range(0, 100)])
        opciones.append(str(abandonos))
        random.shuffle(opciones)

        return {
            "question": pregunta,
            "answers": opciones,
            "correctAnswer": str(abandonos),
            "knowledgeLevel": 2,
            "category": "Driver",
            "language": LANG
        }
    finally:
            cursor.close()
            conn.close()


def pregunta_ultimo_gp_victoria_piloto():
    conn, cursor = crear_cursor_local()
    try:

        # De nuevo: asegurarse de que no quedan resultados pendientes
        while cursor.nextset():
            pass

        cursor.execute("SELECT driverId, forename, surname FROM drivers ORDER BY RAND() LIMIT 1")
        row = cursor.fetchone()
        if not row:
            return None
        piloto_id, forename, surname = row
        nombre_piloto = f"{forename} {surname}"
        # De nuevo: asegurarse de que no quedan resultados pendientes
        while cursor.nextset():
            pass

        cursor.execute("""
            SELECT c.name
            FROM results r
            JOIN races ra ON r.raceId = ra.raceId
            JOIN circuits c ON ra.circuitId = c.circuitId
            WHERE r.driverId = %s AND r.position = 1
            ORDER BY ra.year DESC, ra.round DESC
            LIMIT 1
        """, (piloto_id,))
        row = cursor.fetchone()
        if not row:
            return None
        circuito = row[0]
        if LANG == "es":
            pregunta = f"¿En qué circuito logró su última victoria {nombre_piloto}?"
        elif LANG == "en":
            pregunta = f"In which track {nombre_piloto} won his last Gran Prix?"
        cursor.execute("SELECT name FROM circuits WHERE name != %s ORDER BY RAND() LIMIT 3", (circuito,))
        incorrectas = [r[0] for r in cursor.fetchall()]
        opciones = incorrectas + [circuito]
        random.shuffle(opciones)
        return {
            "question": pregunta,
            "answers": opciones,
            "correctAnswer": circuito,
            "knowledgeLevel": 2,
            "category": "Driver",
            "language": LANG
        }
    finally:
            cursor.close()
            conn.close()


def pregunta_companero_podio_piloto():
    conn, cursor = crear_cursor_local()
    try:

        # De nuevo: asegurarse de que no quedan resultados pendientes
        while cursor.nextset():
            pass

        cursor.execute("SELECT driverId, forename, surname FROM drivers ORDER BY RAND() LIMIT 1")
        row = cursor.fetchone()
        if not row:
            return None
        piloto_id, forename, surname = row
        nombre_piloto = f"{forename} {surname}"
        # De nuevo: asegurarse de que no quedan resultados pendientes
        while cursor.nextset():
            pass

        # Equipo con más participaciones del piloto
        cursor.execute("""
            SELECT constructorId
            FROM results
            WHERE driverId = %s
            GROUP BY constructorId
            ORDER BY COUNT(*) DESC
            LIMIT 1
        """, (piloto_id,))
        row = cursor.fetchone()
        if not row:
            return None
        constructor_id = row[0]
        # De nuevo: asegurarse de que no quedan resultados pendientes
        while cursor.nextset():
            pass

        cursor.execute("""
            SELECT d.forename, d.surname, COUNT(*) as podios
            FROM results r
            JOIN drivers d ON r.driverId = d.driverId
            WHERE r.constructorId = %s AND r.driverId != %s AND r.position <= 3
            GROUP BY r.driverId
            ORDER BY podios DESC
            LIMIT 1
        """, (constructor_id, piloto_id))
        row = cursor.fetchone()
        if not row:
            return None
        compañero = f"{row[0]} {row[1]}"
        if LANG == "es":
            pregunta = f"¿Qué compañero de equipo compartió más podios con {nombre_piloto}?"
        elif LANG == "en":
            pregunta = f"Which teammate shared more podiums with {nombre_piloto}?"
        incorrectas = get_respuestas_incorrectas(compañero, get_pilotos_cache())
        opciones = incorrectas + [compañero]
        random.shuffle(opciones)
        return {
            "question": pregunta,
            "answers": opciones,
            "correctAnswer": compañero,
            "knowledgeLevel": 2,
            "category": "Driver",
            "language": LANG
        }
    finally:
            cursor.close()
            conn.close()

def pregunta_ano_debut_piloto():
    conn, cursor = crear_cursor_local()
    try:

        # De nuevo: asegurarse de que no quedan resultados pendientes
        while cursor.nextset():
            pass

        cursor.execute("SELECT driverId, forename, surname FROM drivers ORDER BY RAND() LIMIT 1")
        row = cursor.fetchone()
        if not row:
            return None
        piloto_id, forename, surname = row
        nombre_piloto = f"{forename} {surname}"
        # De nuevo: asegurarse de que no quedan resultados pendientes
        while cursor.nextset():
            pass

        cursor.execute("""
            SELECT MIN(ra.year)
            FROM races ra
            JOIN results r ON ra.raceId = r.raceId
            WHERE r.driverId = %s
        """, (piloto_id,))
        row = cursor.fetchone()
        if not row:
            return None
        debut = row[0]
        if LANG == "es":
            pregunta = f"¿En qué año debutó {nombre_piloto}?"
        elif LANG == "en":
            pregunta = f"What year did {nombre_piloto} make his F1 debut?"
        opciones = get_respuestas_incorrectas(str(debut), [str(y) for y in range(1950, 2024)])
        opciones.append(str(debut))
        random.shuffle(opciones)
        return {
            "question": pregunta,
            "answers": opciones,
            "correctAnswer": str(debut),
            "knowledgeLevel": 2,
            "category": "Driver",
            "language": LANG
        }
    finally:
            cursor.close()
            conn.close()

def pregunta_primera_victoria_escuderia_piloto():
    conn, cursor = crear_cursor_local()
    try:

        # De nuevo: asegurarse de que no quedan resultados pendientes
        while cursor.nextset():
            pass

        cursor.execute("SELECT driverId, forename, surname FROM drivers ORDER BY RAND() LIMIT 1")
        row = cursor.fetchone()
        if not row:
            return None
        piloto_id, forename, surname = row
        nombre_piloto = f"{forename} {surname}"
        # De nuevo: asegurarse de que no quedan resultados pendientes
        while cursor.nextset():
            pass

        cursor.execute("""
            SELECT c.name
            FROM results r
            JOIN races ra ON r.raceId = ra.raceId
            JOIN constructors c ON r.constructorId = c.constructorId
            WHERE r.driverId = %s AND r.position = 1
            ORDER BY ra.year ASC, ra.round ASC
            LIMIT 1
        """, (piloto_id,))
        row = cursor.fetchone()
        if not row:
            return None
        escuderia = row[0]
        if LANG == "es":
            pregunta = f"¿Con qué escudería logró su primera victoria {nombre_piloto}?"
        elif LANG == "en":
            pregunta = f"With which team did {nombre_piloto} achieve his first win?"
        incorrectas = get_respuestas_incorrectas(escuderia, get_constructores_cache())
        opciones = incorrectas + [escuderia]
        random.shuffle(opciones)

        return {
            "question": pregunta,
            "answers": opciones,
            "correctAnswer": escuderia,
            "knowledgeLevel": 2,
            "category": "Driver",
            "language": LANG
        }
    finally:
            cursor.close()
            conn.close()


def pregunta_poles_piloto():
    conn, cursor = crear_cursor_local()
    try:

        # De nuevo: asegurarse de que no quedan resultados pendientes
        while cursor.nextset():
            pass

        cursor.execute("SELECT driverId, forename, surname FROM drivers ORDER BY RAND() LIMIT 1")
        row = cursor.fetchone()
        if not row:
            return None
        piloto_id, forename, surname = row
        nombre_piloto = f"{forename} {surname}"
        # De nuevo: asegurarse de que no quedan resultados pendientes
        while cursor.nextset():
            pass

        cursor.execute("""
            SELECT COUNT(*) as poles
            FROM qualifying q
            WHERE q.driverId = %s AND q.position = 1
        """, (piloto_id,))
        row = cursor.fetchone()
        if not row:
            return None
        poles = row[0]
        if LANG == "es":
            pregunta = f"¿Cuántas poles consiguió {nombre_piloto} en su carrera?"
        elif LANG == "en":
            pregunta = f"How many poles did {nombre_piloto} get in his career?"
        opciones = get_respuestas_incorrectas(str(poles), [str(i) for i in range(0, 100)])
        opciones.append(str(poles))
        random.shuffle(opciones)

        return {
            "question": pregunta,
            "answers": opciones,
            "correctAnswer": str(poles),
            "knowledgeLevel": 1,
            "category": "Driver",
            "language": LANG
        }
    finally:
            cursor.close()
            conn.close()

def pregunta_circuito_mas_podios_piloto():
    conn, cursor = crear_cursor_local()
    try:

        # De nuevo: asegurarse de que no quedan resultados pendientes
        while cursor.nextset():
            pass

        cursor.execute("SELECT driverId, forename, surname FROM drivers ORDER BY RAND() LIMIT 1")
        row = cursor.fetchone()
        if not row:
            return None
        piloto_id, forename, surname = row
        nombre_piloto = f"{forename} {surname}"
        # De nuevo: asegurarse de que no quedan resultados pendientes
        while cursor.nextset():
            pass

        cursor.execute("""
            SELECT c.name, COUNT(*) as podios
            FROM results r
            JOIN races ra ON r.raceId = ra.raceId
            JOIN circuits c ON ra.circuitId = c.circuitId
            WHERE r.driverId = %s AND r.position <= 3
            GROUP BY c.name
            ORDER BY podios DESC
            LIMIT 1
        """, (piloto_id,))
        row = cursor.fetchone()
        if not row:
            return None
        circuito = row[0]
        # De nuevo: asegurarse de que no quedan resultados pendientes
        while cursor.nextset():
            pass

        cursor.execute("SELECT name FROM circuits WHERE name != %s ORDER BY RAND() LIMIT 3", (circuito,))
        if LANG == "es":
            pregunta = f"¿En qué circuito {nombre_piloto} subió más veces al podio?"
        elif LANG == "en":
            pregunta = f"In which track did {nombre_piloto} stand on the podium the most?"
        incorrectas = [r[0] for r in cursor.fetchall()]
        opciones = incorrectas + [circuito]
        random.shuffle(opciones)

        return {
            "question": pregunta,
            "answers": opciones,
            "correctAnswer": circuito,
            "knowledgeLevel": 2,
            "category": "Driver",
            "language": LANG
        }
    finally:
            cursor.close()
            conn.close()


def pregunta_pais_mas_victorias_piloto():
    conn, cursor = crear_cursor_local()
    try:

        # De nuevo: asegurarse de que no quedan resultados pendientes
        while cursor.nextset():
            pass

        cursor.execute("SELECT driverId, forename, surname FROM drivers ORDER BY RAND() LIMIT 1")
        row = cursor.fetchone()
        if not row:
            return None
        piloto_id, forename, surname = row
        nombre_piloto = f"{forename} {surname}"
        # De nuevo: asegurarse de que no quedan resultados pendientes
        while cursor.nextset():
            pass

        cursor.execute("""
            SELECT c.country, COUNT(*) as victorias
            FROM results r
            JOIN races ra ON r.raceId = ra.raceId
            JOIN circuits c ON ra.circuitId = c.circuitId
            WHERE r.driverId = %s AND r.position = 1
            GROUP BY c.country
            ORDER BY victorias DESC
            LIMIT 1
        """, (piloto_id,))
        row = cursor.fetchone()
        if not row:
            return None
        pais = row[0]
        # De nuevo: asegurarse de que no quedan resultados pendientes
        while cursor.nextset():
            pass

        cursor.execute("SELECT DISTINCT country FROM circuits WHERE country != %s ORDER BY RAND() LIMIT 3", (pais,))
        if LANG == "es":
            pregunta = f"¿Qué país vio más victorias de {nombre_piloto}?"
        elif LANG == "en":
            pregunta = f"In which country did {nombre_piloto} win more times at?"
        incorrectas = [r[0] for r in cursor.fetchall()]
        opciones = incorrectas + [pais]
        random.shuffle(opciones)

        return {
            "question": pregunta,
            "answers": opciones,
            "correctAnswer": pais,
            "knowledgeLevel": 2,
            "category": "Driver",
            "language": LANG
        }
    finally:
            cursor.close()
            conn.close()


def obtener_victorias_piloto():
    conn, cursor = crear_cursor_local()
    try:

        # De nuevo: asegurarse de que no quedan resultados pendientes
        while cursor.nextset():
            pass

        cursor.execute("SELECT driverId, forename, surname FROM drivers ORDER BY RAND() LIMIT 1")
        row = cursor.fetchone()
        if not row:
            return None
        piloto_id, forename, surname = row
        nombre_piloto = f"{forename} {surname}"
        # De nuevo: asegurarse de que no quedan resultados pendientes
        while cursor.nextset():
            pass

        cursor.execute("""
            SELECT COUNT(*)
            FROM results
            WHERE driverId = %s AND position = 1
        """, (piloto_id,))
        row = cursor.fetchone()
        if not row:
            return None
        victorias = row[0]
        if LANG == "es":
            pregunta = f"¿Cuántas victorias consiguió {nombre_piloto} en su carrera?"
        elif LANG == "en":
            pregunta = f"How many F1 wins achieved {nombre_piloto} in his career?"
        opciones = get_respuestas_incorrectas(str(victorias), [str(i) for i in range(0, 100)])
        opciones.append(str(victorias))
        random.shuffle(opciones)

        return {
            "question": pregunta,
            "answers": opciones,
            "correctAnswer": str(victorias),
            "knowledgeLevel": 1,
            "category": "Driver",
            "language": LANG
        }
    finally:
            cursor.close()
            conn.close()



def pregunta_peor_temporada_puntos_piloto():
    conn, cursor = crear_cursor_local()
    try:

        # De nuevo: asegurarse de que no quedan resultados pendientes
        while cursor.nextset():
            pass

        cursor.execute("SELECT driverId, forename, surname FROM drivers ORDER BY RAND() LIMIT 1")
        row = cursor.fetchone()
        if not row:
            return None
        piloto_id, forename, surname = row
        nombre_piloto = f"{forename} {surname}"
        # De nuevo: asegurarse de que no quedan resultados pendientes
        while cursor.nextset():
            pass

        cursor.execute("""
            SELECT ra.year, SUM(r.points) as total_puntos
            FROM results r
            JOIN races ra ON r.raceId = ra.raceId
            WHERE r.driverId = %s
            GROUP BY ra.year
            HAVING total_puntos > 0
            ORDER BY total_puntos ASC
            LIMIT 1
        """, (piloto_id,))
        row = cursor.fetchone()
        if not row:
            return None
        year = row[0]
        if LANG == "es":
            pregunta = f"¿Cuál fue la peor temporada en puntos para {nombre_piloto}?"
        elif LANG == "en":
            pregunta = f"Which was {nombre_piloto} worst season in terms of points?"
        opciones = get_respuestas_incorrectas(str(year), [str(y) for y in range(1950, 2024)])
        opciones.append(str(year))
        random.shuffle(opciones)

        return {
            "question": pregunta,
            "answers": opciones,
            "correctAnswer": str(year),
            "knowledgeLevel": 1,
            "category": "Driver",
            "language": LANG
        }
    finally:
            cursor.close()
            conn.close()


def pregunta_temporadas_sin_puntos_piloto():
    conn, cursor = crear_cursor_local()
    try:

        # De nuevo: asegurarse de que no quedan resultados pendientes
        while cursor.nextset():
            pass

        cursor.execute("SELECT driverId, forename, surname FROM drivers ORDER BY RAND() LIMIT 1")
        row = cursor.fetchone()
        if not row:
            return None
        piloto_id, forename, surname = row
        nombre_piloto = f"{forename} {surname}"
        # De nuevo: asegurarse de que no quedan resultados pendientes
        while cursor.nextset():
            pass

        cursor.execute("""
            SELECT COUNT(DISTINCT ra.year)
            FROM results r
            JOIN races ra ON r.raceId = ra.raceId
            WHERE r.driverId = %s AND r.points = 0
        """, (piloto_id,))
        row = cursor.fetchone()
        if not row:
            return None
        total = row[0]
        if LANG == "es":
            pregunta = f"¿Cuántas veces finalizó una temporada sin sumar ningún punto {nombre_piloto}?"
        elif LANG == "en":
            pregunta = f"How many seasons did {nombre_piloto} finish without points?"
        opciones = get_respuestas_incorrectas(str(total), [str(i) for i in range(0, 20)])
        opciones.append(str(total))
        random.shuffle(opciones)

        return {
            "question": pregunta,
            "answers": opciones,
            "correctAnswer": str(total),
            "knowledgeLevel": 1,
            "category": "Driver",
            "language": LANG
        }
    finally:
            cursor.close()
            conn.close()




#-------------------------------------------------------------------------------------------------------------------
# Estadísticas genéricas parte 2
def pregunta_piloto_gano_en_mas_paises():
    conn, cursor = crear_cursor_local()
    try:

        # De nuevo: asegurarse de que no quedan resultados pendientes
        while cursor.nextset():
            pass

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
        if LANG == "es":
            pregunta = "¿Qué piloto ganó en más países diferentes?"
        elif LANG == "en":
            pregunta = "Which driver won in more different countries?"
        incorrectas = get_respuestas_incorrectas(piloto, get_pilotos_cache())
        opciones = incorrectas + [piloto]
        random.shuffle(opciones)
        return {
                "question": pregunta,
                "answers": opciones,               # <- "answers" en lugar de "options"
                "correctAnswer": piloto,           # <- "correctAnswer" en lugar de "answer"
                "knowledgeLevel": 1,            # nivel conocimiento arbitrario (ejemplo: 2)
                "category": "GenericStats",
                "language": LANG
            }
    finally:
            cursor.close()
            conn.close()

def pregunta_circuito_campeones_distintos():
    conn, cursor = crear_cursor_local()
    try:

        # De nuevo: asegurarse de que no quedan resultados pendientes
        while cursor.nextset():
            pass

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
        # De nuevo: asegurarse de que no quedan resultados pendientes
        while cursor.nextset():
            pass

        cursor.execute("SELECT name FROM circuits WHERE name != %s", (circuito,))
        otros_circuitos = [r[0] for r in cursor.fetchall()]
        if len(otros_circuitos) < 3:
            return None  # protección para evitar el error de muestra
        if LANG == "es":
            pregunta = "¿Qué circuito ha visto ganar a más campeones del mundo diferentes?"
        elif LANG == "en":
            pregunta = "Wihich country has seen more different world champions win?"
        incorrectas = get_respuestas_incorrectas(circuito, otros_circuitos)
        opciones = incorrectas + [circuito]
        random.shuffle(opciones)
        return {
            "question": pregunta,
            "answers": opciones,
            "correctAnswer": circuito,
            "knowledgeLevel": 1,
            "category": "GenericStats",
            "language": LANG
        }
    finally:
            cursor.close()
            conn.close()



def pregunta_piloto_sin_pole_subio_podio():
    conn, cursor = crear_cursor_local()
    try:

        # De nuevo: asegurarse de que no quedan resultados pendientes
        while cursor.nextset():
            pass

        cursor.execute("""
            SELECT d.driverId, d.forename, d.surname
            FROM results r
            JOIN races ra ON r.raceId = ra.raceId
            JOIN drivers d ON r.driverId = d.driverId
            LEFT JOIN qualifying q ON r.raceId = q.raceId AND r.driverId = q.driverId
            WHERE r.position <= 3 AND (q.position IS NULL OR q.position != 1)
            GROUP BY d.driverId
            ORDER BY COUNT(r.position) DESC
            LIMIT 1
        """)
        row = cursor.fetchone()
        if not row:
            return None
        _, nombre, apellido = row
        piloto = f"{nombre} {apellido}"

        # De nuevo: asegurarse de que no quedan resultados pendientes
        while cursor.nextset():
            pass
        if LANG == "es":
            pregunta = "¿Qué piloto subió más veces al podio sin hacer pole?"
        elif LANG == "en":
            pregunta = "Which driver stood on the podium more times without taking pole position?"
        incorrectas = get_respuestas_incorrectas(piloto, get_pilotos_cache())
        opciones = incorrectas + [piloto]
        random.shuffle(opciones)
        return {
            "question": pregunta,
            "answers": opciones,
            "correctAnswer": piloto,
            "knowledgeLevel": 1,
            "category": "GenericStats",
            "language": LANG
        }
    finally:
            cursor.close()
            conn.close()


def pregunta_pais_mas_constructores():
    conn, cursor = crear_cursor_local()
    try:

        # De nuevo: asegurarse de que no quedan resultados pendientes
        while cursor.nextset():
            pass

        cursor.execute("""
            SELECT nationality, COUNT(*) as constructores
            FROM constructors
            WHERE nationality IS NOT NULL
            GROUP BY nationality
            ORDER BY constructores DESC
            LIMIT 1
        """)
        row = cursor.fetchone()
        if not row:
            return None
        pais = row[0]

        # De nuevo: asegurarse de que no quedan resultados pendientes
        while cursor.nextset():
            pass

        cursor.execute("SELECT DISTINCT nationality FROM constructors WHERE nationality != %s", (pais,))
        otros_paises = [r[0] for r in cursor.fetchall()]
        if len(otros_paises) < 3:
            return None
        if LANG == "es":
            pregunta = "¿Qué país ha tenido más constructores participando en la historia de la F1?"
        elif LANG == "en":
            pregunta = "Which country has had more teams participating in F1 history?"
        incorrectas = get_respuestas_incorrectas(pais, otros_paises)
        opciones = incorrectas + [pais]
        random.shuffle(opciones)
        return {
            "question": pregunta,
            "answers": opciones,
            "correctAnswer": pais,
            "knowledgeLevel": 1,
            "category": "GenericStats",
            "language": LANG
        }
    finally:
            cursor.close()
            conn.close()


def pregunta_piloto_mas_vueltas_rapidas_sin_puntos():
    conn, cursor = crear_cursor_local()
    try:

        # De nuevo: asegurarse de que no quedan resultados pendientes
        while cursor.nextset():
            pass

        cursor.execute("""
            SELECT d.driverId, d.forename, d.surname, COUNT(*) as vueltas_rapidas
            FROM lapTimes l
            JOIN results r ON l.raceId = r.raceId AND l.driverId = r.driverId
            JOIN drivers d ON r.driverId = d.driverId
            WHERE r.points = 0 AND l.position = 1
            GROUP BY d.driverId
            ORDER BY vueltas_rapidas DESC
            LIMIT 1
        """)
        row = cursor.fetchone()
        if not row:
            return None
        _, nombre, apellido, _ = row
        piloto = f"{nombre} {apellido}"

        if LANG == "es":
            pregunta = "¿Qué piloto logró más vueltas rápidas en GPs donde no puntuó?"
        elif LANG == "en":
            pregunta = "Which driver took more fastest laps in GPs where he did not score points?"
        incorrectas = get_respuestas_incorrectas(piloto, get_pilotos_cache())
        opciones = incorrectas + [piloto]
        random.shuffle(opciones)
        return {
            "question": pregunta,
            "answers": opciones,
            "correctAnswer": piloto,
            "knowledgeLevel": 1,
            "category": "GenericStats",
            "language": LANG
        }
    finally:
            cursor.close()
            conn.close()

#------------------------------------------------------------------------------------------------------------
# Preguntas estadísticas genéricas parte 2


def pregunta_piloto_perdio_campeonato_por_un_punto():
    conn, cursor = crear_cursor_local()
    try:

        # De nuevo: asegurarse de que no quedan resultados pendientes
        while cursor.nextset():
            pass

        cursor.execute("""
            SELECT d.forename, d.surname
            FROM driverStandings ds
            JOIN drivers d ON ds.driverId = d.driverId
            JOIN races ra ON ds.raceId = ra.raceId
            WHERE ds.position = 2 AND ra.year = 2008 AND ds.points = 97
            LIMIT 1
        """)
        row = cursor.fetchone()
        if not row:
            return None
        nombre, apellido = row
        piloto = f"{nombre} {apellido}"

        if LANG == "es":
            pregunta = "¿Qué piloto perdió un campeonato por 1 solo punto en la última carrera?"
        elif LANG == "en":
            pregunta = "Which driver lost a championship by 1 point on the last race?"
        incorrectas = get_respuestas_incorrectas(piloto, get_pilotos_cache())
        opciones = incorrectas + [piloto]
        random.shuffle(opciones)
        return {
            "question": pregunta,
            "answers": opciones,
            "correctAnswer": piloto,
            "knowledgeLevel": 1,
            "category": "GenericStats",
            "language": LANG
        }
    finally:
            cursor.close()
            conn.close()




def pregunta_escuderia_descalificada_aleron_ilegal():
    conn, cursor = crear_cursor_local()
    try:

        # De nuevo: asegurarse de que no quedan resultados pendientes
        while cursor.nextset():
            pass

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

        if LANG == "es":
            pregunta = "¿Qué escudería fue descalificada por un alerón ilegal en clasificación?"
        elif LANG == "en":
            pregunta = "Which team was disqualified because of an illegal rear wing in qualifying?"
        incorrectas = get_respuestas_incorrectas(escuderia, get_constructores_cache())
        opciones = incorrectas + [escuderia]
        random.shuffle(opciones)
        return {
            "question": pregunta,
            "answers": opciones,
            "correctAnswer": escuderia,
            "knowledgeLevel": 1,
            "category": "GenericStats",
            "language": LANG
        }
    finally:
            cursor.close()
            conn.close()


def pregunta_piloto_victoria_ultimo_cambio_neumaticos():
    conn, cursor = crear_cursor_local()
    try:

        # De nuevo: asegurarse de que no quedan resultados pendientes
        while cursor.nextset():
            pass

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

        if LANG == "es":
            pregunta = "¿Qué piloto ganó un GP tras cambiar de neumáticos en la última vuelta?"
        elif LANG == "en":
            pregunta = "Which driver won a GP by changing tyres on the last lap?"
        incorrectas = get_respuestas_incorrectas(piloto, get_pilotos_cache())
        opciones = incorrectas + [piloto]
        random.shuffle(opciones)
        return {
            "question": pregunta,
            "answers": opciones,
            "correctAnswer": piloto,
            "knowledgeLevel": 1,
            "category": "GenericStats",
            "language": LANG
        }
    finally:
            cursor.close()
            conn.close()


def pregunta_piloto_debut_victoria():
    conn, cursor = crear_cursor_local()
    try:

        # De nuevo: asegurarse de que no quedan resultados pendientes
        while cursor.nextset():
            pass

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

        if LANG == "es":
            pregunta = "¿Qué piloto ganó en su debut en Fórmula 1?"
        elif LANG == "en":
            pregunta = "Which driver won on his F1 debut?"
        incorrectas = get_respuestas_incorrectas(piloto, get_pilotos_cache())
        opciones = incorrectas + [piloto]
        random.shuffle(opciones)
        return {
            "question": pregunta,
            "answers": opciones,
            "correctAnswer": piloto,
            "knowledgeLevel": 1,
            "category": "GenericStats",
            "language": LANG
        }
    finally:
            cursor.close()
            conn.close()


def pregunta_primer_circuito_urbano():
    conn, cursor = crear_cursor_local()
    try:
        if LANG == "es":
            pregunta = "¿Cuál fue el primer circuito urbano en albergar un GP?"
        elif LANG == "en":
            pregunta = "Which urban circuit was the first one to take a GP?"
        opciones = ["Monaco", "Baku", "Singapur", "Azerbaiyán"]
        random.shuffle(opciones)
        return {
                "question": pregunta,
                "answers": opciones,               # <- "answers" en lugar de "options"
                "correctAnswer": "Monaco",           # <- "correctAnswer" en lugar de "answer"
                "knowledgeLevel": 1,            # nivel conocimiento arbitrario (ejemplo: 2)
                "category": "GenericStats",
                "language": LANG
            }
    finally:
            cursor.close()
            conn.close()

def pregunta_escuderia_debut_victoria():
    conn, cursor = crear_cursor_local()
    try:
        # Asegura limpieza antes de ejecutar
        while cursor.nextset():
            pass

        cursor.execute("""
            SELECT c.name
            FROM results r
            JOIN races ra ON r.raceId = ra.raceId
            JOIN constructors c ON r.constructorId = c.constructorId
            WHERE r.position = 1 AND ra.round = 1
        """)
        row = cursor.fetchone()

        # Limpia cualquier resto de resultados antes de continuar
        while cursor.nextset():
            pass

        if not row:
            return None
        escuderia = row[0]
        if LANG == "es":
            pregunta = "¿Qué escudería debutó con victoria en su primera carrera?"
        elif LANG == "en":
            pregunta = "Which team made its debut by winning the first race?"
        incorrectas = get_respuestas_incorrectas(escuderia, get_constructores_cache())
        opciones = incorrectas + [escuderia]
        random.shuffle(opciones)

        return {
            "question": pregunta,
            "answers": opciones,
            "correctAnswer": escuderia,
            "knowledgeLevel": 1,
            "category": "GenericStats",
            "language": LANG
        }

    finally:
        cursor.close()
        conn.close()



def pregunta_piloto_sin_podio_largo():
    conn, cursor = crear_cursor_local()
    try:

        # De nuevo: asegurarse de que no quedan resultados pendientes
        while cursor.nextset():
            pass

        cursor.execute("""
            SELECT d.forename, d.surname, COUNT(*) as carreras_sin_podio
            FROM results r
            JOIN drivers d ON r.driverId = d.driverId
            WHERE r.position NOT IN (1, 2, 3)
            GROUP BY d.driverId
            ORDER BY carreras_sin_podio DESC
            LIMIT 1
        """)
        row = cursor.fetchone()
        if not row:
            return None
        piloto = f"{row[0]} {row[1]}"

        if LANG == "es":
            pregunta = "¿Qué piloto corrió más carreras sin subir al podio?"
        elif LANG == "en":
            pregunta = "Which driver raced more times without standing on the podium?"
        incorrectas = get_respuestas_incorrectas(piloto, get_pilotos_cache())
        opciones = incorrectas + [piloto]
        random.shuffle(opciones)
        return {
            "question": pregunta,
            "answers": opciones,
            "correctAnswer": piloto,
            "knowledgeLevel": 1,
            "category": "GenericStats",
            "language": LANG
        }
    finally:
            cursor.close()
            conn.close()

def pregunta_primer_gp_fuera_europa():
    conn, cursor = crear_cursor_local()
    try:

        # De nuevo: asegurarse de que no quedan resultados pendientes
        while cursor.nextset():
            pass

        cursor.execute("""
            SELECT ra.year, c.country
            FROM races ra
            JOIN circuits c ON ra.circuitId = c.circuitId
            WHERE c.country NOT IN ('Europe')
            ORDER BY ra.year ASC
            LIMIT 1
        """)
        row = cursor.fetchone()
        if not row:
            return None
        pais = row[1]

        if LANG == "es":
            pregunta = "¿Cuál de entre estos países fue el primero en celebrar un Gran Premio?"
        elif LANG == "en":
            pregunta = "Which country was the first one to celebrate a Gran Prix between them?"
        cursor.execute("SELECT DISTINCT country FROM circuits WHERE country != %s", (pais,))
        incorrectas = get_respuestas_incorrectas(pais, [r[0] for r in cursor.fetchall()])
        opciones = incorrectas + [pais]
        random.shuffle(opciones)
        return {
            "question": pregunta,
            "answers": opciones,
            "correctAnswer": pais,
            "knowledgeLevel": 1,
            "category": "GenericStats",
            "language": LANG
        }
    finally:
            cursor.close()
            conn.close()


def pregunta_pais_mas_gran_premios():
    conn, cursor = crear_cursor_local()
    try:

        # De nuevo: asegurarse de que no quedan resultados pendientes
        while cursor.nextset():
            pass

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

        if LANG == "es":
            pregunta = "¿En qué país se ha disputado el mayor número de Grandes Premios?"
        elif LANG == "en":
            pregunta = "Which country hosted more GPs?"
        cursor.execute("SELECT DISTINCT country FROM circuits WHERE country != %s", (pais,))
        incorrectas = get_respuestas_incorrectas(pais, [r[0] for r in cursor.fetchall()])
        opciones = incorrectas + [pais]
        random.shuffle(opciones)
        return {
            "question": pregunta,
            "answers": opciones,
            "correctAnswer": pais,
            "knowledgeLevel": 1,
            "category": "GenericStats",
            "language": LANG
        }
    finally:
            cursor.close()
            conn.close()


def pregunta_piloto_combustible_ilegal():
    conn, cursor = crear_cursor_local()
    try:

        # De nuevo: asegurarse de que no quedan resultados pendientes
        while cursor.nextset():
            pass

        cursor.execute("""
            SELECT statusId FROM status WHERE status LIKE 'Fuel%' LIMIT 1
        """)
        result = cursor.fetchone()
        if not result:
            return None
        status_id = result[0]
        # De nuevo: asegurarse de que no quedan resultados pendientes
        while cursor.nextset():
            pass

        cursor.execute("""
            SELECT d.forename, d.surname
            FROM results r
            JOIN drivers d ON r.driverId = d.driverId
            WHERE r.statusId = %s
            LIMIT 1
        """, (status_id,))
        row = cursor.fetchone()
        if not row:
            return None
        piloto = f"{row[0]} {row[1]}"
        if LANG == "es":
            pregunta = "¿Qué piloto fue descalificado por tener combustible ilegal?"
        elif LANG == "en":
            pregunta = "Which driver was disqualified for having illegal fuel?"
        incorrectas = get_respuestas_incorrectas(piloto, get_pilotos_cache())
        opciones = incorrectas + [piloto]
        random.shuffle(opciones)
        return {
            "question": pregunta,
            "answers": opciones,
            "correctAnswer": piloto,
            "knowledgeLevel": 1,
            "category": "GenericStats",
            "language": LANG

        }
    finally:
            cursor.close()
            conn.close()


def pregunta_gp_suspendido_por_lluvia():
    conn, cursor = crear_cursor_local()
    try:

        # De nuevo: asegurarse de que no quedan resultados pendientes
        while cursor.nextset():
            pass

        cursor.execute("""
            SELECT ra.year, c.name
            FROM results r
            JOIN races ra ON r.raceId = ra.raceId
            JOIN circuits c ON ra.circuitId = c.circuitId
            JOIN status s ON r.statusId = s.statusId
            WHERE s.status LIKE '%Suspended%' OR s.status LIKE '%rain%' OR s.status LIKE '%weather%'
            ORDER BY ra.year DESC
            LIMIT 1
        """)
        row = cursor.fetchone()
        if not row:
            return None
        year, circuito = row

        if LANG == "es":
            pregunta = "¿Qué GP fue suspendido por lluvia intensa sin dar una vuelta completa?"
        elif LANG == "en":
            pregunta = "Which GP was suspended because of heavy rain without making a single lap?"
        cursor.execute("SELECT name FROM circuits WHERE name != %s", (circuito,))
        incorrectas = get_respuestas_incorrectas(circuito, [r[0] for r in cursor.fetchall()])
        opciones = incorrectas + [circuito]
        random.shuffle(opciones)
        return {
            "question": pregunta,
            "answers": opciones,
            "correctAnswer": circuito,
            "knowledgeLevel": 1,
            "category": "GenericStats",
            "language": LANG
        }
    finally:
            cursor.close()
            conn.close()


def pregunta_ciudad_carrera_nocturna():
    conn, cursor = crear_cursor_local()
    try:

        # De nuevo: asegurarse de que no quedan resultados pendientes
        while cursor.nextset():
            pass

        cursor.execute("""
            SELECT c.location
            FROM circuits c
            WHERE c.name LIKE '%night%' OR c.location LIKE '%night%' OR c.name LIKE '%Singapore%'
            LIMIT 1
        """)
        row = cursor.fetchone()
        if not row:
            return None
        ciudad = row[0]
        # De nuevo: asegurarse de que no quedan resultados pendientes
        while cursor.nextset():
            pass
        if LANG == "es":
            pregunta = "¿Qué ciudad ha acogido una carrera nocturna de Fórmula 1?"
        elif LANG == "en":
            pregunta = "Which city has hosted a night race in F1?"
        cursor.execute("SELECT location FROM circuits WHERE location != %s", (ciudad,))
        incorrectas = get_respuestas_incorrectas(ciudad, [r[0] for r in cursor.fetchall()])
        opciones = incorrectas + [ciudad]
        random.shuffle(opciones)

        return {
            "question": pregunta,
            "answers": opciones,
            "correctAnswer": ciudad,
            "knowledgeLevel": 1,
            "category": "GenericStats",
            "language": LANG
        }
    finally:
            cursor.close()
            conn.close()


def pregunta_piloto_mas_participaciones_escuderia():
    conn, cursor = crear_cursor_local()
    try:

        # De nuevo: asegurarse de que no quedan resultados pendientes
        while cursor.nextset():
            pass

        cursor.execute("""
            SELECT d.forename, d.surname, c.name, COUNT(*) as participaciones
            FROM results r
            JOIN drivers d ON r.driverId = d.driverId
            JOIN constructors c ON r.constructorId = c.constructorId
            GROUP BY r.driverId, r.constructorId
            ORDER BY participaciones DESC
            LIMIT 1
        """)
        row = cursor.fetchone()
        if not row:
            return None
        nombre, apellido, escuderia, _ = row
        piloto = f"{nombre} {apellido}"
        respuesta_correcta = f"{piloto} ({escuderia})"
        if LANG == "es":
            pregunta = "¿Qué piloto tiene más participaciones en una misma escudería?"
        elif LANG == "en":
            pregunta = "Which driver has more races with the same team?"
        incorrectas = get_respuestas_incorrectas(respuesta_correcta, [f"{p} ({e})" for p in get_pilotos_cache() for e in get_constructores_cache()])
        opciones = incorrectas + [respuesta_correcta]
        random.shuffle(opciones)

        return {
            "question": pregunta,
            "answers": opciones,
            "correctAnswer": respuesta_correcta,
            "knowledgeLevel": 1,
            "category": "GenericStats",
            "language": LANG
        }
    finally:
            cursor.close()
            conn.close()


def pregunta_gp_mas_antiguo():
    conn, cursor = crear_cursor_local()
    try:

        # De nuevo: asegurarse de que no quedan resultados pendientes
        while cursor.nextset():
            pass

        cursor.execute("""
            SELECT ra.name, ra.year
            FROM races ra
            ORDER BY ra.year ASC
            LIMIT 1
        """)
        row = cursor.fetchone()
        if not row:
            return None
        gp, anio = row
        # De nuevo: asegurarse de que no quedan resultados pendientes
        while cursor.nextset():
            pass

        if LANG == "es":
            pregunta = "¿Cuál es el Gran Premio más antiguo celebrado en la historia de la F1?"
        elif LANG == "en":
            pregunta = "What is the oldest GP held in F1 history?"
        cursor.execute("SELECT DISTINCT name FROM races WHERE name != %s", (gp,))
        incorrectas = get_respuestas_incorrectas(gp, [r[0] for r in cursor.fetchall()])
        opciones = incorrectas + [gp]
        random.shuffle(opciones)

        return {
            "question": pregunta,
            "answers": opciones,
            "correctAnswer": gp,
            "knowledgeLevel": 1,
            "category": "GenericStats",
            "language": LANG
        }
    finally:
            cursor.close()
            conn.close()


def pregunta_piloto_primera_victoria_joven():
    conn, cursor = crear_cursor_local()
    try:

        # De nuevo: asegurarse de que no quedan resultados pendientes
        while cursor.nextset():
            pass

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

        if LANG == "es":
            pregunta = "¿Qué piloto fue el primero en lograr una victoria en la historia de la F1?"
        elif LANG == "en":
            pregunta = "Which was the first driver to take a win in F1 history?"
        incorrectas = get_respuestas_incorrectas(piloto, get_pilotos_cache())
        opciones = incorrectas + [piloto]
        random.shuffle(opciones)

        return {
            "question": pregunta,
            "answers": opciones,
            "correctAnswer": piloto,
            "knowledgeLevel": 1,
            "category": "GenericStats",
            "language": LANG
        }
    finally:
            cursor.close()
            conn.close()

def pregunta_escuderia_mas_dobletes():
    conn, cursor = crear_cursor_local()
    try:

        # De nuevo: asegurarse de que no quedan resultados pendientes
        while cursor.nextset():
            pass

        cursor.execute("""
            SELECT c.name, COUNT(*) as dobletes
            FROM (
                SELECT r.raceId, r.constructorId
                FROM results r
                WHERE r.position IN (1, 2)
                GROUP BY r.raceId, r.constructorId
                HAVING COUNT(DISTINCT r.position) = 2
            ) as dobles
            JOIN constructors c ON dobles.constructorId = c.constructorId
            GROUP BY c.name
            ORDER BY dobletes DESC
            LIMIT 1
        """)
        row = cursor.fetchone()
        if not row:
            return None
        escuderia = row[0]
        if LANG == "es":
            pregunta = "¿Qué escudería ha logrado más dobletes (1º y 2º puesto) en la misma carrera?"
        elif LANG == "en":
            pregunta = "Which team has achieved more 1-2 finishes in the same GP?"
        opciones = get_respuestas_incorrectas(escuderia, get_constructores_cache())
        opciones.append(escuderia)
        random.shuffle(opciones)
        return {
            "question": pregunta,
            "answers": opciones,
            "correctAnswer": escuderia,
            "knowledgeLevel": 1,
            "category": "GenericStats",
            "language": LANG
        }
    finally:
            cursor.close()
            conn.close()


def pregunta_piloto_mas_temporadas_consecutivas():
    conn, cursor = crear_cursor_local()
    try:

        # De nuevo: asegurarse de que no quedan resultados pendientes
        while cursor.nextset():
            pass

        cursor.execute("""
            SELECT d.forename, d.surname, COUNT(DISTINCT ra.year) as temporadas
            FROM results r
            JOIN races ra ON r.raceId = ra.raceId
            JOIN drivers d ON r.driverId = d.driverId
            GROUP BY r.driverId
            ORDER BY temporadas DESC
            LIMIT 1
        """)
        row = cursor.fetchone()
        if not row:
            return None
        piloto = f"{row[0]} {row[1]}"
        if LANG == "es":
            pregunta = "¿Qué piloto tiene más temporadas en Fórmula 1?"
        elif LANG == "en":
            pregunta = "Which driver has more seasons in F1?"
        opciones = get_respuestas_incorrectas(piloto, get_pilotos_cache())
        opciones.append(piloto)
        random.shuffle(opciones)
        return {
            "question": pregunta,
            "answers": opciones,
            "correctAnswer": piloto,
            "knowledgeLevel": 1,
            "category": "GenericStats",
            "language": LANG
        }
    finally:
            cursor.close()
            conn.close()


def pregunta_piloto_mas_victorias_temporada():
    conn, cursor = crear_cursor_local()
    try:

        # De nuevo: asegurarse de que no quedan resultados pendientes
        while cursor.nextset():
            pass

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
        cursor.fetchall()
        if LANG == "es":
            pregunta = "¿Qué piloto logró más victorias en una temporada?"
        elif LANG == "en":
            pregunta = "Which driver won more races in a season?"
        opciones = get_respuestas_incorrectas(piloto, get_pilotos_cache())
        opciones.append(piloto)
        random.shuffle(opciones)
        return {
            "question": pregunta,
            "answers": opciones,
            "correctAnswer": piloto,
            "knowledgeLevel": 1,
            "category": "GenericStats",
            "language": LANG
        }
    finally:
            cursor.close()
            conn.close()



def pregunta_piloto_compartio_podio_mas_veces():
    conn, cursor = crear_cursor_local()
    try:

        # De nuevo: asegurarse de que no quedan resultados pendientes
        while cursor.nextset():
            pass

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
        cursor.fetchall()  # limpia resultados si quedaran más
        if LANG == "es":
            pregunta = "¿Qué piloto ha subido más veces al podio?"
        elif LANG == "en":
            pregunta = "Which driver stood more time on the podium?"
        incorrectas = get_respuestas_incorrectas(piloto, get_pilotos_cache())
        opciones = incorrectas + [piloto]
        random.shuffle(opciones)
        return {
            "question": pregunta,
            "answers": opciones,
            "correctAnswer": piloto,
            "knowledgeLevel": 1,
            "category": "GenericStats",
            "language": LANG
        }
    finally:
            cursor.close()
            conn.close()


def pregunta_piloto_mas_carreras_sin_victoria():
    conn, cursor = crear_cursor_local()
    try:


        # De nuevo: asegurarse de que no quedan resultados pendientes
        while cursor.nextset():
            pass

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
        # Aseguramos que la consulta anterior ha terminado antes de seguir
        cursor.fetchall()  # Vacía el cursor por si acaso
        if LANG == "es":
            pregunta = "¿Qué piloto ha disputado más carreras sin victoria?"
        elif LANG == "en":
            pregunta = "Which driver raced more times without winning?"
        incorrectas = get_respuestas_incorrectas(piloto, get_pilotos_cache())
        opciones = incorrectas + [piloto]
        random.shuffle(opciones)
        return {
            "question": pregunta,
            "answers": opciones,
            "correctAnswer": piloto,
            "knowledgeLevel": 1,
            "category": "GenericStats",
            "language": LANG
        }
    finally:
            cursor.close()
            conn.close()


def pregunta_constructor_mas_podios_temporada():
    conn, cursor = crear_cursor_local()
    try:

        # De nuevo: asegurarse de que no quedan resultados pendientes
        while cursor.nextset():
            pass

        cursor.execute("""
            SELECT c.name, ra.year, COUNT(*) as podios
            FROM results r
            JOIN constructors c ON r.constructorId = c.constructorId
            JOIN races ra ON r.raceId = ra.raceId
            WHERE r.position <= 3
            GROUP BY c.constructorId, ra.year
            ORDER BY podios DESC
            LIMIT 1
        """)
        row = cursor.fetchone()
        if not row:
            return None
        escuderia = row[0]
        year = row[1]
        if LANG == "es":
            pregunta = "¿Qué constructor logró más podios en una sola temporada?"
        elif LANG == "en":
            pregunta = "Which team stood on the podium the most in a single season?"
        incorrectas = get_respuestas_incorrectas(escuderia, get_constructores_cache())
        opciones = incorrectas + [escuderia]
        random.shuffle(opciones)
        return {
            "question": pregunta,
            "answers": opciones,
            "correctAnswer": escuderia,
            "knowledgeLevel": 1,
            "category": "GenericStats",
            "language": LANG
        }
    finally:
            cursor.close()
            conn.close()

generadores_por_categoria = {
    "GenericStats": [
        generar_pregunta_piloto_primera_victoria_reciente,
        generar_pregunta_piloto_mas_podios_totales,
        generar_pregunta_campeon_pilotos,
        generar_pregunta_campeon_constructores,
        generar_pregunta_ganador_gp,
        generar_pregunta_segundo_gp,
        generar_pregunta_tercero_gp,
        generar_pregunta_escuderia_ganadora,
        generar_pregunta_constructor_mas_titulos,
        generar_pregunta_piloto_mas_poles_en_circuito,
        generar_pregunta_constructor_mas_victorias_en_circuito,
        generar_pregunta_constructor_mas_victorias_en_pais,
        generar_pregunta_circuito_mas_carreras,
        generar_pregunta_piloto_mas_victorias_en_circuito,
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
        pregunta_constructor_mas_podios_temporada
    ],
    "Circuit": [
        pregunta_constructor_mas_abandonos_circuito,
        pregunta_piloto_mas_poles_sin_ganar_circuito,
        pregunta_anio_mas_cambios_lider,
        pregunta_anio_mas_abandonos_circuito,
        pregunta_piloto_pole_y_vuelta_rapida_misma_edicion,
        pregunta_anio_velocidad_promedio_mas_alta
    ],
    "LegendarySeason": [
        pregunta_piloto_campeon_temporada,
        pregunta_constructor_campeon_temporada,
        pregunta_gp_mas_abandonos_temporada,
        pregunta_victorias_campeon_temporada,
        pregunta_ultimo_gp_temporada,
        pregunta_piloto_mas_poles_temporada,
        pregunta_circuito_mas_vueltas_temporada,
        pregunta_escuderia_mas_abandonos_temporada,
        pregunta_cuantos_pilotos_ganaron_temporada,
        pregunta_piloto_mas_puntos_sin_ganar_temporada
    ],
    "Duels": [
        pregunta_rival_de_senna_en_mclaren,
        pregunta_piloto_perdio_titulo_en_ultima_curva_2008,
        pregunta_rival_schumacher_2000,
        pregunta_ano_choque_hamilton_rosberg_espana,
        pregunta_duelo_vettel_canada_2019
    ],
    "Team": [
        pregunta_piloto_mas_victorias_escuderia,
        pregunta_temporada_mas_puntos_escuderia,
        pregunta_poles_totales_escuderia,
        pregunta_circuito_mas_victorias_escuderia,
        pregunta_campeonatos_constructores_escuderia,
        pregunta_piloto_mas_abandonos_escuderia,
        pregunta_peor_temporada_puntos_escuderia
    ],
    "Driver": [
        pregunta_circuito_mas_abandonos_piloto,
        pregunta_puntos_consecutivos_piloto,
        pregunta_promedio_posicion_clasificacion,
        pregunta_temporada_mas_paradas_boxes,
        pregunta_porcentaje_carreras_finalizadas,
        pregunta_circuito_no_victoria_piloto,
        pregunta_pilotos_distintos_compitio,
        pregunta_racha_sin_ganar,
        pregunta_peor_posicion_clasificacion_piloto,
        pregunta_remontadas_puesto_15_piloto,
        pregunta_carreras_lideradas_piloto,
        pregunta_supero_mas_clasificacion,
        pregunta_mejor_vuelta_rapida,
        pregunta_piloto_anio_mas_puntos,
        pregunta_escuderias_distintas_piloto,
        pregunta_gp_mas_participaciones_piloto,
        pregunta_abandonos_piloto,
        pregunta_ultimo_gp_victoria_piloto,
        pregunta_companero_podio_piloto,
        pregunta_ano_debut_piloto,
        pregunta_primera_victoria_escuderia_piloto,
        pregunta_poles_piloto,
        pregunta_circuito_mas_podios_piloto,
        pregunta_pais_mas_victorias_piloto,
        obtener_victorias_piloto
    ]
}

def generar_preguntas_concurrentemente_por_categoria(categoria, max_workers=10):
    if categoria not in generadores_por_categoria:
        raise ValueError(f"La categoría '{categoria}' no está definida.")

    preguntas = []
    funciones = generadores_por_categoria[categoria]

    with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
        futuros = {executor.submit(funcion): funcion for funcion in funciones}

        for future in concurrent.futures.as_completed(futuros):
            try:
                pregunta = future.result()
                if pregunta:
                    preguntas.append(pregunta)
            except Exception as e:
                print(f"Error en {futuros[future].__name__}: {e}")

    return preguntas

def main():
    global LANG  # ✅ Esto hace que se modifique la variable global y no una local
    parser = argparse.ArgumentParser()
    parser.add_argument("--category", type=str, help="Filtrar por categoría (opcional)", default=None)
    parser.add_argument('--lang', type=str, default='es')
    args = parser.parse_args()
    LANG = args.lang  # Ahora sí modifica la global

    categoria_objetivo = args.category.strip() if args.category else None

    preguntas_generadas = generar_preguntas_concurrentemente_por_categoria(categoria_objetivo)
    preguntas_generadas = preguntas_generadas[:10]

    print(json.dumps(preguntas_generadas, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()