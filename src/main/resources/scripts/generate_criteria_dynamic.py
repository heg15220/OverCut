import random
import json
import sys
import argparse
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# --- CONFIGURACIÓN BBDD ---
DB_URL = 'mysql+pymysql://root:root@localhost/f1db'
engine = create_engine(DB_URL, pool_size=25, max_overflow=20)
Session = sessionmaker(bind=engine)

NUM_CRITERIOS = 3  # Número de filas y columnas


def son_incompatibles(criterio1, criterio2):
    code1 = criterio1['code']
    code2 = criterio2['code']

    # No pueden ser dos nacionalidades distintas
    if code1.startswith('nationality_') and code2.startswith('nationality_'):
        nationality1 = code1.split('_', 1)[1]
        nationality2 = code2.split('_', 1)[1]
        if nationality1 != nationality2:
            return True

    # No pueden ser dos debut distintos
    if code1.startswith('debut_') and code2.startswith('debut_'):
        debut1 = code1.split('_', 1)[1]
        debut2 = code2.split('_', 1)[1]
        if debut1 != debut2:
            return True

    # Circuito ganador vs podio o ganador vs ganador o podio vs podio → incompatibles siempre
    if (
        (code1.startswith('winner_') and code2.startswith('winner_')) or
        (code1.startswith('podium_') and code2.startswith('podium_')) or
        (code1.startswith('winner_') and code2.startswith('podium_')) or
        (code1.startswith('podium_') and code2.startswith('winner_'))
    ):
        return True

    return False



# Todos los criterios ↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓

def criterio_nacionalidad(session):
    result = session.execute(text("""
        SELECT nationality, COUNT(*) as total
        FROM drivers
        WHERE nationality IS NOT NULL
        GROUP BY nationality
        HAVING total >= 2
    """)).fetchall()
    if not result:
        return None
    row = random.choice(result)
    return {"description": f"Piloto {row[0]}", "code": f"nationality_{row[0].lower().replace(' ', '_')}"}

def criterio_anyo_debut(session):
    result = session.execute(text("""
        SELECT DISTINCT year
        FROM races
        WHERE year IS NOT NULL
    """)).fetchall()
    if not result:
        return None
    year = random.choice(result)[0]
    return {"description": f"Debutó en {year}", "code": f"debut_{year}"}

def criterio_constructor(session):
    result = session.execute(text("""
        SELECT c.name, COUNT(DISTINCT res.driverId) as total
        FROM results res
        JOIN constructors c ON res.constructorId = c.constructorId
        GROUP BY c.name
        HAVING total >= 2
    """)).fetchall()
    if not result:
        return None
    row = random.choice(result)
    return {"description": f"Corrió para {row[0]}", "code": f"team_{row[0].lower().replace(' ','_')}"}

def criterio_victorias(session, min_wins=1):
    result = session.execute(text("""
        SELECT d.driverId, COUNT(*) as wins
        FROM results res
        JOIN drivers d ON res.driverId = d.driverId
        WHERE res.positionOrder = 1
        GROUP BY d.driverId
        HAVING wins >= :min_wins
    """), {"min_wins": min_wins}).fetchall()
    if len(result) < 2:
        return None
    return {"description": f"Piloto con al menos {min_wins} victorias", "code": f"min_{min_wins}_wins"}

def criterio_podios(session, min_podiums=5):
    result = session.execute(text("""
        SELECT d.driverId, COUNT(*) as podiums
        FROM results res
        JOIN drivers d ON res.driverId = d.driverId
        WHERE res.positionOrder <= 3
        GROUP BY d.driverId
        HAVING podiums >= :min_podiums
    """), {"min_podiums": min_podiums}).fetchall()
    if len(result) < 2:
        return None
    return {"description": f"Piloto con al menos {min_podiums} podios", "code": f"min_{min_podiums}_podiums"}

def criterio_epoca(session, year_start, year_end):
    result = session.execute(text("""
        SELECT DISTINCT CONCAT(d.forename, ' ', d.surname)
        FROM results res
        JOIN drivers d ON res.driverId = d.driverId
        JOIN races r ON res.raceId = r.raceId
        WHERE r.year BETWEEN :y1 AND :y2
    """), {"y1": year_start, "y2": year_end}).fetchall()
    if len(result) < 2:
        return None
    return {"description": f"Piloto activo entre {year_start}-{year_end}", "code": f"era_{year_start}_{year_end}"}

def criterio_companero_equipo(session):
    result = session.execute(text("""
        SELECT DISTINCT CONCAT(d.forename, ' ', d.surname) AS nombre, d.driverId
        FROM drivers d
    """)).fetchall()
    if not result:
        return None
    piloto_objetivo = random.choice(result)
    piloto_id = piloto_objetivo[1]  # Cambiado de 'driverId' a índice 1
    piloto_nombre = piloto_objetivo[0]  # Cambiado de 'nombre' a índice 0
    query = """
        SELECT DISTINCT CONCAT(d2.forename, ' ', d2.surname)
        FROM results r1
        JOIN results r2 ON r1.raceId = r2.raceId AND r1.constructorId = r2.constructorId
        JOIN drivers d2 ON r2.driverId = d2.driverId
        WHERE r1.driverId = :pilot_id AND r2.driverId != :pilot_id
    """
    companeros = session.execute(text(query), {"pilot_id": piloto_id}).fetchall()
    if len(companeros) < 2:
        return None
    return {"description": f"Compañero de equipo de {piloto_nombre}", "code": f"teammate_of_{piloto_nombre.lower().replace(' ','_')}"}

INGENIEROS_FAMOSOS = {
    "Adrian Newey": ["Red Bull", "McLaren", "Williams"],
    "Ross Brawn": ["Ferrari", "Benetton", "Honda"],
    "Pat Symonds": ["Renault", "Benetton"]
}

def criterio_ingeniero_famoso(session):
    ingeniero, equipos = random.choice(list(INGENIEROS_FAMOSOS.items()))
    query = """
        SELECT DISTINCT d.driverId
        FROM results res
        JOIN constructors c ON res.constructorId = c.constructorId
        JOIN drivers d ON res.driverId = d.driverId
        WHERE c.name IN :equipos
    """
    pilotos = session.execute(text(query), {"equipos": tuple(equipos)}).fetchall()
    if len(pilotos) < 2:
        return None
    return {"description": f"Piloto dirigido por {ingeniero}", "code": f"coached_by_{ingeniero.lower().replace(' ','_')}"}



def es_code_circuito_valido(session, code, criterios_existentes):
    if not (code.startswith('winner_') or code.startswith('podium_')):
        return True  # No es circuito → válido

    circuito_name = code.split('_', 1)[1].replace('_', ' ').title()

    result = session.execute(text("""
        SELECT DISTINCT r.year
        FROM circuits c
        JOIN races r ON c.circuitId = r.circuitId
        WHERE c.name = :name
    """), {"name": circuito_name}).fetchall()

    anos_circuito = {row[0] for row in result}

    for criterio in criterios_existentes:
        if criterio['code'].startswith('era_'):
            _, year_start, year_end = criterio['code'].split('_')
            year_start, year_end = int(year_start), int(year_end)
            if not any(year_start <= ano <= year_end for ano in anos_circuito):
                return False

    return True


def es_circuito_id_valido(session, circuito_id, criterios_existentes):
    result = session.execute(text("""
        SELECT DISTINCT r.year
        FROM races r
        WHERE r.circuitId = :circuit_id
    """), {"circuit_id": circuito_id}).fetchall()

    anos_circuito = {row[0] for row in result}

    for criterio in criterios_existentes:
        if criterio['code'].startswith('era_'):
            _, year_start, year_end = criterio['code'].split('_')
            year_start, year_end = int(year_start), int(year_end)
            if not any(year_start <= ano <= year_end for ano in anos_circuito):
                return False

    return True


def criterio_podio_en_circuito(session, criterios_existentes):
    # Obtener circuitos donde al menos dos pilotos han logrado un podio
    result = session.execute(text("""
        SELECT c.circuitId, c.name
        FROM circuits c
        JOIN races r ON c.circuitId = r.circuitId
        JOIN results res ON r.raceId = res.raceId
        WHERE res.positionOrder <= 3
        GROUP BY c.circuitId, c.name
        HAVING COUNT(DISTINCT res.driverId) >= 2
    """)).fetchall()

    if not result:
        return None

    # Filtrar circuitos que sean compatibles con los criterios existentes
    circuitos_validos = []
    for circuito_id, circuito_nombre in result:
        if es_circuito_id_valido(session, circuito_id, criterios_existentes):
            circuitos_validos.append((circuito_id, circuito_nombre))


    if not circuitos_validos:
        return None

    circuito_id, circuito_nombre = random.choice(circuitos_validos)
    return {
        "description": f"Podio en {circuito_nombre}",
        "code": f"podium_{circuito_nombre.lower().replace(' ', '_')}"
    }


def criterio_victoria_en_circuito(session, criterios_existentes):
    # Obtener circuitos donde al menos dos pilotos han logrado una victoria
    result = session.execute(text("""
        SELECT c.circuitId, c.name
        FROM circuits c
        JOIN races r ON c.circuitId = r.circuitId
        JOIN results res ON r.raceId = res.raceId
        WHERE res.positionOrder = 1
        GROUP BY c.circuitId, c.name
        HAVING COUNT(DISTINCT res.driverId) >= 2
    """)).fetchall()

    if not result:
        return None

    # Filtrar circuitos que sean compatibles con los criterios existentes
    circuitos_validos = []
    for circuito_id, circuito_nombre in result:
        if es_circuito_id_valido(session, circuito_id, criterios_existentes):
            circuitos_validos.append((circuito_id, circuito_nombre))

    if not circuitos_validos:
        return None

    circuito_id, circuito_nombre = random.choice(circuitos_validos)
    return {
        "description": f"Ganador en {circuito_nombre}",
        "code": f"winner_{circuito_nombre.lower().replace(' ', '_')}"
    }






CRITERIOS_FUNCTIONS = [
    criterio_nacionalidad,
    criterio_constructor,
    lambda s: criterio_victorias(s, 2),
    lambda s: criterio_podios(s, 5),
    lambda s: criterio_epoca(s, 1990, 2000),
    lambda s: criterio_epoca(s, 2001, 2010),
    lambda s: criterio_epoca(s, 2011, 2024),
    criterio_companero_equipo,
    criterio_ingeniero_famoso,
    criterio_podio_en_circuito,
    criterio_victoria_en_circuito
]

def convertir_code_a_sql(code):
    if code.startswith('winner_') or code.startswith('podium_'):
        circuit_name = code.split('_', 1)[1].replace('_', ' ').title()
        return f"c.name = '{circuit_name}'"

    if code.startswith('nationality_'):
        nationality = code.split('_', 1)[1].replace('_', ' ').title()
        return f"d.nationality = '{nationality}'"

    if code.startswith('team_'):
        team_name = code.split('_', 1)[1].replace('_', ' ').title()
        return f"c.name = '{team_name}'"

    return None



def existen_pilotos_para_combinar(session, code1, code2):
    cond1 = convertir_code_a_sql(code1)
    cond2 = convertir_code_a_sql(code2)

    if cond1 is None or cond2 is None:
        return True

    query = f"""
        SELECT DISTINCT d.driverId
        FROM drivers d
        JOIN results r ON d.driverId = r.driverId
        JOIN races ra ON r.raceId = ra.raceId
        JOIN circuits c ON ra.circuitId = c.circuitId
        WHERE {cond1} AND {cond2}
        LIMIT 1
    """

    result = session.execute(text(query)).fetchone()
    return result is not None


def existen_pilotos_compatibles(session, criterio1, criterio2):
    # Check SQL conditions (for circuits, nationality, team)
    if not existen_pilotos_para_combinar(session, criterio1['code'], criterio2['code']):
        return False

    query = """
        SELECT DISTINCT d.driverId
        FROM drivers d
        WHERE 1=1
    """

    condiciones = []
    params = {}

    for idx, crit in enumerate([criterio1, criterio2]):
        if crit['code'].startswith('era_'):
            _, inicio, fin = crit['code'].split('_')
            condiciones.append(f"""EXISTS (
                SELECT 1 FROM results res
                JOIN races r ON res.raceId = r.raceId
                WHERE res.driverId = d.driverId AND r.year BETWEEN :inicio{idx} AND :fin{idx}
            )""")
            params[f"inicio{idx}"] = int(inicio)
            params[f"fin{idx}"] = int(fin)

        if crit['code'].startswith('teammate_of_'):
            nombre = crit['code'].replace('teammate_of_', '').replace('_', ' ').title()
            condiciones.append(f"""EXISTS (
                SELECT 1 FROM results r1
                JOIN results r2 ON r1.raceId = r2.raceId AND r1.constructorId = r2.constructorId
                JOIN drivers d2 ON r2.driverId = d2.driverId
                WHERE r1.driverId = d.driverId AND CONCAT(d2.forename, ' ', d2.surname) = :nombre{idx}
            )""")
            params[f"nombre{idx}"] = nombre

    if condiciones:
        query += " AND " + " AND ".join(condiciones)

    result = session.execute(text(query), params).fetchall()
    return len(result) >= 1






def generar_criterio_valido(session, usados, funciones, criterios_existentes):
    while True:
        funcion = random.choice(funciones)

        # Si la función requiere criterios existentes → se los pasamos
        if funcion.__code__.co_argcount == 2:  # (session, criterios_existentes)
            criterio = funcion(session, criterios_existentes)
        else:  # Solo session
            criterio = funcion(session)

        if criterio and criterio['code'] not in usados:
            usados.add(criterio['code'])
            return criterio


def generar_criterios():
    session = Session()
    try:
        usados = set()
        filas, columnas = [], []

        # Generar filas (sin restricciones extra)
        for _ in range(NUM_CRITERIOS):
            filas.append(generar_criterio_valido(session, usados, CRITERIOS_FUNCTIONS, filas))

        # Generar columnas (validando que cada celda fila[i] - columna[i] tenga al menos un piloto compatible)
        for i in range(NUM_CRITERIOS):
            intentos = 0
            while True:
                nuevo = generar_criterio_valido(session, usados, CRITERIOS_FUNCTIONS, filas + columnas)

                if existen_pilotos_compatibles(session, filas[i], nuevo):
                    if not son_incompatibles(filas[i], nuevo):
                        # Validar que ambos criterios (fila y columna) comparten años si alguno es circuito
                        if es_code_circuito_valido(session, filas[i]['code'], [nuevo]) and es_code_circuito_valido(session, nuevo['code'], [filas[i]]):
                            columnas.append(nuevo)
                            break
                intentos += 1
                if intentos > 100:  # Seguridad anti bucle infinito
                    raise Exception("No se han podido generar columnas compatibles tras muchos intentos")

        if len(filas) < NUM_CRITERIOS or len(columnas) < NUM_CRITERIOS:
            raise Exception("No se han podido generar suficientes criterios")

        output = {
            "rowCriteria": filas,
            "columnCriteria": columnas
        }

        print(json.dumps(output, ensure_ascii=False))

    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

    finally:
        session.close()





# Entrada del script
if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('--lang', type=str, default='es')
    args = parser.parse_args()
    generar_criterios()