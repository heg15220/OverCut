import json
import mysql.connector

import pymysql

DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': 'root',
    'database': 'f1db',
    'charset': 'utf8mb4',
    'cursorclass': pymysql.cursors.Cursor
}



OUTPUT_FILE = "generic_stats_data.json"

def fetch_all_data():
    conn = pymysql.connect(**DB_CONFIG)
    cursor = conn.cursor()
    data = {}

    # Pilotos
    cursor.execute("SELECT CONCAT(forename, ' ', surname) FROM drivers")
    data["pilotos"] = [row[0] for row in cursor.fetchall()]

    # Constructores
    cursor.execute("SELECT DISTINCT name FROM constructors")
    data["constructores"] = [row[0] for row in cursor.fetchall()]

    # Circuitos
    cursor.execute("SELECT DISTINCT name FROM circuits")
    data["circuitos"] = [row[0] for row in cursor.fetchall()]

    # Países
    cursor.execute("SELECT DISTINCT country FROM circuits WHERE country IS NOT NULL")
    data["paises"] = [row[0] for row in cursor.fetchall()]

    # Pilotos con podios
    cursor.execute("""
        SELECT CONCAT(d.forename, ' ', d.surname), COUNT(*) as podios
        FROM results r
        JOIN drivers d ON r.driverId = d.driverId
        WHERE r.positionOrder <= 3
        GROUP BY r.driverId
    """)
    data["pilotos_podios"] = [{"nombre": row[0], "podios": row[1]} for row in cursor.fetchall()]

    # GP por país
    cursor.execute("""
        SELECT c.country, COUNT(*)
        FROM races r
        JOIN circuits c ON r.circuitId = c.circuitId
        WHERE c.country IS NOT NULL
        GROUP BY c.country
    """)
    data["gp_por_pais"] = [{"pais": row[0], "count": row[1]} for row in cursor.fetchall()]

    # Circuitos con carreras
    cursor.execute("""
        SELECT c.name, COUNT(*)
        FROM races r
        JOIN circuits c ON r.circuitId = c.circuitId
        GROUP BY c.name
    """)
    data["circuitos_con_carreras"] = [{"nombre": row[0], "count": row[1]} for row in cursor.fetchall()]

    # Constructores con títulos
    cursor.execute("""
        SELECT c.name, COUNT(DISTINCT r.year), MIN(r.year), MAX(r.year)
        FROM constructorStandings cs
        JOIN constructors c ON cs.constructorId = c.constructorId
        JOIN races r ON cs.raceId = r.raceId
        WHERE cs.position = 1
        GROUP BY c.constructorId
    """)
    data["constructores_titulos"] = [
        {"nombre": row[0], "titulos": row[1], "anio_inicio": row[2], "anio_fin": row[3]}
        for row in cursor.fetchall()
    ]

    # Temporadas
    cursor.execute("SELECT DISTINCT year FROM races ORDER BY year")
    data["temporadas"] = [row[0] for row in cursor.fetchall()]

    # Pilotos por año
    cursor.execute("""
        SELECT DISTINCT ra.year, CONCAT(d.forename, ' ', d.surname)
        FROM results r
        JOIN races ra ON r.raceId = ra.raceId
        JOIN drivers d ON r.driverId = d.driverId
    """)
    pilotos_por_anio = {}
    for year, nombre in cursor.fetchall():
        pilotos_por_anio.setdefault(str(year), []).append(nombre)
    data["pilotos_por_anio"] = pilotos_por_anio

    # Constructores por año
    cursor.execute("""
        SELECT DISTINCT ra.year, c.name
        FROM results r
        JOIN races ra ON r.raceId = ra.raceId
        JOIN constructors c ON r.constructorId = c.constructorId
    """)
    constructores_por_anio = {}
    for year, name in cursor.fetchall():
        constructores_por_anio.setdefault(str(year), []).append(name)
    data["constructores_por_anio"] = constructores_por_anio


    # 1️⃣ Crear pilotos_por_periodo (±2 años)
    pilotos_por_periodo = {}
    for year in pilotos_por_anio.keys():
        pool = set()
        for y in range(int(year) - 2, int(year) + 3):
            pool.update(pilotos_por_anio.get(str(y), []))
        pilotos_por_periodo[year] = list(pool)

    data["pilotos_por_periodo"] = pilotos_por_periodo

    # 2️⃣ Crear constructores_por_periodo (±2 años)
    constructores_por_periodo = {}
    for year in constructores_por_anio.keys():
        pool = set()
        for y in range(int(year) - 2, int(year) + 3):
            pool.update(constructores_por_anio.get(str(y), []))
        constructores_por_periodo[year] = list(pool)

    data["constructores_por_periodo"] = constructores_por_periodo


    # Campeones pilotos por año
    cursor.execute("""
        SELECT r.year, CONCAT(d.forename, ' ', d.surname)
        FROM driverStandings ds
        JOIN drivers d ON ds.driverId = d.driverId
        JOIN races r ON ds.raceId = r.raceId
        WHERE ds.position = 1
        AND r.raceId = (
            SELECT MAX(r2.raceId)
            FROM races r2
            WHERE r2.year = r.year
        )
    """)
    data["campeones_pilotos_por_anio"] = [{"year": row[0], "piloto": row[1]} for row in cursor.fetchall()]

    # Campeones constructores por año
    cursor.execute("""
        SELECT r.year, c.name
        FROM constructorStandings cs
        JOIN constructors c ON cs.constructorId = c.constructorId
        JOIN races r ON cs.raceId = r.raceId
        WHERE cs.position = 1
        AND r.raceId = (
            SELECT MAX(r2.raceId)
            FROM races r2
            WHERE r2.year = r.year
        )
    """)
    data["campeones_constructores_por_anio"] = [{"year": row[0], "constructor": row[1]} for row in cursor.fetchall()]


    # Pilotos con más países diferentes donde han ganado
    cursor.execute("""
        SELECT CONCAT(d.forename, ' ', d.surname), COUNT(DISTINCT c.country)
        FROM results r
        JOIN races ra ON r.raceId = ra.raceId
        JOIN circuits c ON ra.circuitId = c.circuitId
        JOIN drivers d ON r.driverId = d.driverId
        WHERE r.position = 1
        GROUP BY r.driverId
    """)
    data["pilotos_mas_paises"] = [{"nombre": row[0], "count": row[1]} for row in cursor.fetchall()]

    # Circuitos con más campeones del mundo distintos ganadores
    cursor.execute("""
        SELECT c.name, COUNT(DISTINCT d.driverId)
        FROM results r
        JOIN races ra ON r.raceId = ra.raceId
        JOIN circuits c ON ra.circuitId = c.circuitId
        JOIN drivers d ON r.driverId = d.driverId
        WHERE r.position = 1 AND d.driverId IN (
            SELECT driverId FROM driverStandings WHERE position = 1
        )
        GROUP BY c.name
    """)
    data["circuitos_campeones_distintos"] = [{"nombre": row[0], "count": row[1]} for row in cursor.fetchall()]

    # Ganadores de GP (piloto)
    cursor.execute("""
        SELECT r.year, r.name, CONCAT(d.forename, ' ', d.surname)
        FROM results res
        JOIN races r ON res.raceId = r.raceId
        JOIN drivers d ON res.driverId = d.driverId
        WHERE res.positionOrder = 1
    """)
    data["resultados_gp_ganadores"] = [
        {"year": row[0], "gp": row[1], "piloto": row[2]} for row in cursor.fetchall()
    ]

    # Segundos de GP
    cursor.execute("""
        SELECT r.year, r.name, CONCAT(d.forename, ' ', d.surname)
        FROM results res
        JOIN races r ON res.raceId = r.raceId
        JOIN drivers d ON res.driverId = d.driverId
        WHERE res.positionOrder = 2
    """)
    data["resultados_gp_segundos"] = [
        {"year": row[0], "gp": row[1], "piloto": row[2]} for row in cursor.fetchall()
    ]

    # Terceros de GP
    cursor.execute("""
        SELECT r.year, r.name, CONCAT(d.forename, ' ', d.surname)
        FROM results res
        JOIN races r ON res.raceId = r.raceId
        JOIN drivers d ON res.driverId = d.driverId
        WHERE res.positionOrder = 3
    """)
    data["resultados_gp_terceros"] = [
        {"year": row[0], "gp": row[1], "piloto": row[2]} for row in cursor.fetchall()
    ]

    # Escuderías ganadoras
    cursor.execute("""
        SELECT r.year, r.name, c.name
        FROM results res
        JOIN races r ON res.raceId = r.raceId
        JOIN constructors c ON res.constructorId = c.constructorId
        WHERE res.positionOrder = 1
    """)
    data["resultados_gp_escuderias_ganadoras"] = [
        {"year": row[0], "gp": row[1], "escuderia": row[2]} for row in cursor.fetchall()
    ]

    cursor.execute("""
        SELECT CONCAT(d.forename, ' ', d.surname), MIN(r.year) - d.dob
        FROM results res
        JOIN races r ON res.raceId = r.raceId
        JOIN drivers d ON res.driverId = d.driverId
        WHERE res.positionOrder = 1
        GROUP BY res.driverId
    """)
    data["pilotos_primera_victoria_edad"] = [{"nombre": row[0], "edad": row[1]} for row in cursor.fetchall()]


    cursor.execute("""
        SELECT c.name, COUNT(*)
        FROM (
            SELECT r.raceId, r.constructorId
            FROM results r
            WHERE r.position IN (1,2)
            GROUP BY r.raceId, r.constructorId
            HAVING COUNT(DISTINCT r.position) = 2
        ) as dobles
        JOIN constructors c ON dobles.constructorId = c.constructorId
        GROUP BY c.name
    """)
    data["constructores_dobletes"] = [{"nombre": row[0], "dobletes": row[1]} for row in cursor.fetchall()]


    cursor.execute("""
        SELECT CONCAT(d.forename, ' ', d.surname), COUNT(DISTINCT r.year)
        FROM results res
        JOIN races r ON res.raceId = r.raceId
        JOIN drivers d ON res.driverId = d.driverId
        GROUP BY res.driverId
    """)
    data["pilotos_temporadas"] = [{"nombre": row[0], "temporadas": row[1]} for row in cursor.fetchall()]

    cursor.execute("""
        SELECT CONCAT(d.forename, ' ', d.surname), r.year, COUNT(*)
        FROM results res
        JOIN races r ON res.raceId = r.raceId
        JOIN drivers d ON res.driverId = d.driverId
        WHERE res.positionOrder = 1
        GROUP BY res.driverId, r.year
    """)
    data["pilotos_victorias_por_temporada"] = [{"nombre": row[0], "year": row[1], "victorias": row[2]} for row in cursor.fetchall()]

    cursor.execute("""
        SELECT CONCAT(d.forename, ' ', d.surname), COUNT(*)
        FROM results res
        JOIN drivers d ON res.driverId = d.driverId
        WHERE res.position != 1
        GROUP BY res.driverId
    """)
    data["pilotos_carreras_sin_victoria"] = [{"nombre": row[0], "carreras": row[1]} for row in cursor.fetchall()]

    cursor.execute("""
        SELECT c.name, r.year, COUNT(*)
        FROM results res
        JOIN races r ON res.raceId = r.raceId
        JOIN constructors c ON res.constructorId = c.constructorId
        WHERE res.positionOrder <= 3
        GROUP BY c.constructorId, r.year
    """)
    data["constructores_podios_por_temporada"] = [{"nombre": row[0], "year": row[1], "podios": row[2]} for row in cursor.fetchall()]

    cursor.execute("""
        SELECT CONCAT(d.forename, ' ', d.surname), c.name, COUNT(*) as participaciones
        FROM results r
        JOIN drivers d ON r.driverId = d.driverId
        JOIN constructors c ON r.constructorId = c.constructorId
        GROUP BY r.driverId, r.constructorId
    """)
    data["pilotos_participaciones_escuderia"] = [
        {"piloto": row[0], "escuderia": row[1], "participaciones": row[2]} for row in cursor.fetchall()
    ]

    cursor.execute("SELECT name, year FROM races ORDER BY year ASC LIMIT 1")
    row = cursor.fetchone()
    data["gp_mas_antiguo"] = {"nombre": row[0], "year": row[1]} if row else None

    cursor.execute("""
        SELECT DISTINCT c.name
        FROM results r
        JOIN races ra ON r.raceId = ra.raceId
        JOIN constructors c ON r.constructorId = c.constructorId
        WHERE r.positionOrder = 1 AND ra.round = 1
    """)
    data["escuderias_debut_victoria"] = [row[0] for row in cursor.fetchall()]

    cursor.execute("""
        SELECT CONCAT(d.forename, ' ', d.surname), COUNT(*) as carreras
        FROM results r
        JOIN drivers d ON r.driverId = d.driverId
        WHERE r.positionOrder NOT IN (1, 2, 3)
        GROUP BY r.driverId
    """)
    data["pilotos_sin_podio"] = [
        {"nombre": row[0], "carreras": row[1]} for row in cursor.fetchall()
    ]

    cursor.execute("""
        SELECT ra.year, c.country
        FROM races ra
        JOIN circuits c ON ra.circuitId = c.circuitId
        WHERE c.country NOT IN ('Europe')
        ORDER BY ra.year ASC LIMIT 1
    """)
    row = cursor.fetchone()
    data["primer_gp_fuera_europa"] = {"year": row[0], "pais": row[1]} if row else None

    cursor.execute("""
        SELECT CONCAT(d.forename, ' ', d.surname)
        FROM results r
        JOIN races ra ON r.raceId = ra.raceId
        JOIN drivers d ON r.driverId = d.driverId
        WHERE r.positionOrder = 1 AND ra.round = 1
    """)
    data["pilotos_debut_victoria"] = [row[0] for row in cursor.fetchall()]

    cursor.execute("""
        SELECT c.name, CONCAT(d.forename, ' ', d.surname), COUNT(*) as victorias
        FROM results r
        JOIN races ra ON r.raceId = ra.raceId
        JOIN circuits c ON ra.circuitId = c.circuitId
        JOIN drivers d ON r.driverId = d.driverId
        WHERE r.positionOrder = 1
        GROUP BY c.name, d.driverId
    """)
    data["pilotos_victorias_en_circuito"] = [
        {"circuito": row[0], "piloto": row[1], "victorias": row[2]} for row in cursor.fetchall()
    ]

    cursor.execute("""
        SELECT CONCAT(d.forename, ' ', d.surname), COUNT(*)
        FROM results r
        JOIN drivers d ON r.driverId = d.driverId
        LEFT JOIN qualifying q ON r.raceId = q.raceId AND r.driverId = q.driverId
        WHERE r.positionOrder <= 3 AND (q.position IS NULL OR q.position != 1)
        GROUP BY r.driverId
    """)
    data["pilotos_podio_sin_pole"] = [
        {"nombre": row[0], "podios": row[1]} for row in cursor.fetchall()
    ]

    cursor.execute("""
        SELECT nationality, COUNT(*) as total
        FROM constructors
        WHERE nationality IS NOT NULL
        GROUP BY nationality
    """)
    data["constructores_por_pais"] = [
        {"pais": row[0], "count": row[1]} for row in cursor.fetchall()
    ]

    cursor.execute("""
        SELECT c.name, CONCAT(d.forename, ' ', d.surname), COUNT(*) as poles
        FROM qualifying q
        JOIN races r ON q.raceId = r.raceId
        JOIN circuits c ON r.circuitId = c.circuitId
        JOIN drivers d ON q.driverId = d.driverId
        WHERE q.position = 1
        GROUP BY c.name, d.driverId
    """)
    data["pilotos_poles_en_circuito"] = [
        {"circuito": row[0], "piloto": row[1], "poles": row[2]} for row in cursor.fetchall()
    ]

    cursor.execute("""
        SELECT c.name, cons.name, COUNT(*) as victorias
        FROM results r
        JOIN races ra ON r.raceId = ra.raceId
        JOIN circuits c ON ra.circuitId = c.circuitId
        JOIN constructors cons ON r.constructorId = cons.constructorId
        WHERE r.positionOrder = 1
        GROUP BY c.name, cons.constructorId
    """)
    data["constructores_victorias_en_circuito"] = [
        {"circuito": row[0], "constructor": row[1], "victorias": row[2]} for row in cursor.fetchall()
    ]

    cursor.execute("""
        SELECT ci.country, cons.name, COUNT(*) as victorias
        FROM results r
        JOIN races ra ON r.raceId = ra.raceId
        JOIN circuits ci ON ra.circuitId = ci.circuitId
        JOIN constructors cons ON r.constructorId = cons.constructorId
        WHERE ci.country IS NOT NULL AND r.positionOrder = 1
        GROUP BY ci.country, cons.constructorId
    """)
    data["constructores_victorias_en_pais"] = [
        {"pais": row[0], "constructor": row[1], "victorias": row[2]} for row in cursor.fetchall()
    ]



    cursor.close()
    conn.close()
    return data

def main():
    data = fetch_all_data()
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"[OK] Datos guardados en {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
