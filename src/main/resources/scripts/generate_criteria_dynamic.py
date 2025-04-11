import random
import json
import sys
import argparse
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

DB_URL = 'mysql+pymysql://root:root@localhost/f1db'
engine = create_engine(DB_URL, pool_size=25, max_overflow=20)
Session = sessionmaker(bind=engine)

NUM_CRITERIOS = 3

CRITERIOS = [
    'nationality',
    'team',
    'era',
    'min_wins',
    'min_podiums'
]


def eras_incompatibles(code1, code2):
    if code1.startswith('era_') and code2.startswith('era_'):
        _, inicio1, fin1 = code1.split('_')
        _, inicio2, fin2 = code2.split('_')
        inicio1, fin1, inicio2, fin2 = int(inicio1), int(fin1), int(inicio2), int(fin2)
        return fin1 < inicio2 or fin2 < inicio1
    return False


def nacionalidades_incompatibles(code1, code2):
    if code1.startswith('nationality_') and code2.startswith('nationality_'):
        nacionalidad1 = code1.replace('nationality_', '')
        nacionalidad2 = code2.replace('nationality_', '')
        return nacionalidad1 != nacionalidad2
    return False


def check_nationality_and_stats(session, code1, code2):
    if code1.startswith('nationality_') and (code2.startswith('min_') and ('wins' in code2 or 'podiums' in code2)):
        nationality_code, stats_code = code1, code2
    elif code2.startswith('nationality_') and (code1.startswith('min_') and ('wins' in code1 or 'podiums' in code1)):
        nationality_code, stats_code = code2, code1
    else:
        return True

    nationality = nationality_code.replace('nationality_', '').replace('_', ' ').title()

    min_required = int(stats_code.split('_')[1])
    if 'wins' in stats_code:
        pos = 1
    else:
        pos = 3

    query = text("""
        SELECT 1
        FROM drivers d
        JOIN results r ON d.driverId = r.driverId
        JOIN races ra ON r.raceId = ra.raceId
        WHERE d.nationality = :nationality
        AND r.positionOrder <= :pos
        AND ra.year >= 1980
        GROUP BY d.driverId
        HAVING COUNT(*) >= :min_required
        LIMIT 1
    """)

    result = session.execute(query, {"nationality": nationality, "pos": pos, "min_required": min_required}).fetchone()
    return result is not None


def check_nationality_or_stats_with_team(session, code1, code2):
    if code1.startswith('nationality_') and code2.startswith('team_'):
        nationality_code, team_code = code1, code2
    elif code2.startswith('nationality_') and code1.startswith('team_'):
        nationality_code, team_code = code2, code1
    else:
        return True

    nationality = nationality_code.replace('nationality_', '').replace('_', ' ').title()
    team = team_code.replace('team_', '').replace('_', ' ').title()

    query = text("""
        SELECT 1
        FROM drivers d
        JOIN results r ON d.driverId = r.driverId
        JOIN races ra ON r.raceId = ra.raceId
        JOIN constructors c ON r.constructorId = c.constructorId
        WHERE d.nationality = :nationality
        AND c.name = :team
        AND ra.year >= 1980
        LIMIT 1
    """)

    result = session.execute(query, {"nationality": nationality, "team": team}).fetchone()
    return result is not None

def check_nationality_with_era(session, code1, code2):
    if code1.startswith('nationality_') and code2.startswith('era_'):
        nationality_code, era_code = code1, code2
    elif code2.startswith('nationality_') and code1.startswith('era_'):
        nationality_code, era_code = code2, code1
    else:
        return True  # No aplica

    nationality = nationality_code.replace('nationality_', '').replace('_', ' ').title()
    _, inicio, fin = era_code.split('_')
    inicio, fin = int(inicio), int(fin)

    query = text("""
        SELECT 1
        FROM drivers d
        JOIN results r ON d.driverId = r.driverId
        JOIN races ra ON r.raceId = ra.raceId
        WHERE d.nationality = :nationality
        AND ra.year BETWEEN :inicio AND :fin
        LIMIT 1
    """)

    result = session.execute(query, {"nationality": nationality, "inicio": inicio, "fin": fin}).fetchone()
    return result is not None


def check_team_with_team_or_era(session, code1, code2):
    if code1.startswith('team_') and code2.startswith('era_'):
        team_code, era_code = code1, code2
    elif code2.startswith('team_') and code1.startswith('era_'):
        team_code, era_code = code2, code1
    elif code1.startswith('team_') and code2.startswith('team_'):
        team1 = code1.replace('team_', '').replace('_', ' ').title()
        team2 = code2.replace('team_', '').replace('_', ' ').title()
        query = text("""
            SELECT 1
            FROM results r1
            JOIN results r2 ON r1.driverId = r2.driverId
            JOIN constructors c1 ON r1.constructorId = c1.constructorId
            JOIN constructors c2 ON r2.constructorId = c2.constructorId
            WHERE c1.name = :team1
            AND c2.name = :team2
            LIMIT 1
        """)
        result = session.execute(query, {"team1": team1, "team2": team2}).fetchone()
        return result is not None
    else:
        return True

    team = team_code.replace('team_', '').replace('_', ' ').title()
    _, inicio, fin = era_code.split('_')
    inicio, fin = int(inicio), int(fin)

    query = text("""
        SELECT 1
        FROM results r
        JOIN races ra ON r.raceId = ra.raceId
        JOIN constructors c ON r.constructorId = c.constructorId
        WHERE c.name = :team
        AND ra.year BETWEEN :inicio AND :fin
        LIMIT 1
    """)
    result = session.execute(query, {"team": team, "inicio": inicio, "fin": fin}).fetchone()
    return result is not None


def check_team_with_stats(session, code1, code2):
    if code1.startswith('team_') and (code2.startswith('min_') and ('wins' in code2 or 'podiums' in code2)):
        team_code, stats_code = code1, code2
    elif code2.startswith('team_') and (code1.startswith('min_') and ('wins' in code1 or 'podiums' in code1)):
        team_code, stats_code = code2, code1
    else:
        return True

    team = team_code.replace('team_', '').replace('_', ' ').title()
    min_required = int(stats_code.split('_')[1])
    pos = 1 if 'wins' in stats_code else 3

    query = text("""
        SELECT 1
        FROM results r
        JOIN races ra ON r.raceId = ra.raceId
        JOIN constructors c ON r.constructorId = c.constructorId
        WHERE c.name = :team
        AND r.positionOrder <= :pos
        AND ra.year >= 1980
        GROUP BY r.driverId
        HAVING COUNT(*) >= :min_required
        LIMIT 1
    """)

    result = session.execute(query, {"team": team, "pos": pos, "min_required": min_required}).fetchone()
    return result is not None


def existen_pilotos_para_fila_columna(session, criterio_fila, criterio_columna):
    if eras_incompatibles(criterio_fila['code'], criterio_columna['code']):
        return False
    if nacionalidades_incompatibles(criterio_fila['code'], criterio_columna['code']):
        return False
    if not check_team_with_team_or_era(session, criterio_fila['code'], criterio_columna['code']):
        return False
    return True



def obtener_criterio_valido(session, usados, criterios_existentes):
    while True:
        tipo = random.choice(CRITERIOS)

        if tipo == 'nationality':
            result = session.execute(text("""
                SELECT nationality FROM drivers
                WHERE nationality IS NOT NULL
                GROUP BY nationality
                HAVING COUNT(DISTINCT driverId) >= 2
            """)).fetchall()
            if not result:
                continue
            seleccion = random.choice(result)[0]
            code = f'nationality_{seleccion.lower().replace(" ", "_")}'
            desc = f'Piloto {seleccion}'

        elif tipo == 'team':
            result = session.execute(text("""
                SELECT name FROM constructors
                WHERE constructorId IN (
                    SELECT constructorId FROM results r
                    JOIN races ra ON r.raceId = ra.raceId
                    WHERE ra.year >= 1980
                )
                GROUP BY name
                HAVING COUNT(DISTINCT constructorId) >= 1
            """)).fetchall()
            if not result:
                continue
            seleccion = random.choice(result)[0]
            code = f'team_{seleccion.lower().replace(" ", "_")}'
            desc = f'Corrió para {seleccion}'

        elif tipo == 'era':
            inicio = random.randint(1980, 2015)
            fin = inicio + 5
            code = f'era_{inicio}_{fin}'
            desc = f'Piloto activo entre {inicio}-{fin}'

        elif tipo == 'min_wins':
            wins = random.choice([1, 2, 3])
            code = f'min_{wins}_wins'
            desc = f'Piloto con al menos {wins} victorias'

        elif tipo == 'min_podiums':
            podiums = random.choice([3, 5, 7])
            code = f'min_{podiums}_podiums'
            desc = f'Piloto con al menos {podiums} podios'

        else:
            continue

        if code not in usados:
            usados.add(code)
            return {"description": desc, "code": code}


def existen_pilotos_para_fila_columna(session, criterio_fila, criterio_columna):
    if eras_incompatibles(criterio_fila['code'], criterio_columna['code']):
        return False
    if nacionalidades_incompatibles(criterio_fila['code'], criterio_columna['code']):
        return False
    if not check_nationality_and_stats(session, criterio_fila['code'], criterio_columna['code']):
        return False
    if not check_nationality_or_stats_with_team(session, criterio_fila['code'], criterio_columna['code']):
        return False

    if not check_nationality_with_era(session, criterio_fila['code'], criterio_columna['code']):
        return False

    if not check_team_with_stats(session, criterio_fila['code'], criterio_columna['code']):
        return False

    if not check_team_with_team_or_era(session, criterio_fila['code'], criterio_columna['code']):
        return False

    return True


def generar_criterios():
    session = Session()
    try:
        usados = set()

        for intentos_generales in range(5):  # Intentamos hasta 5 veces generar filas+columnas
            filas, columnas = [], []

            # Generar filas
            while len(filas) < NUM_CRITERIOS:
                intentos = 0
                while True:
                    criterio = obtener_criterio_valido(session, usados, filas)
                    intentos += 1
                    if intentos > 100:
                        break
                    if criterio:
                        filas.append(criterio)
                        break

            if len(filas) < NUM_CRITERIOS:
                continue  # Reiniciamos intento general

            # Generar columnas
            while len(columnas) < NUM_CRITERIOS:
                intentos = 0
                while True:
                    criterio = obtener_criterio_valido(session, usados, filas + columnas)
                    intentos += 1
                    if intentos > 100:
                        break
                    if all(existen_pilotos_para_fila_columna(session, fila, criterio) for fila in filas):
                        columnas.append(criterio)
                        break

            if len(columnas) < NUM_CRITERIOS:
                continue  # Reiniciamos intento general

            # Si conseguimos 3 filas y 3 columnas → OK
            print(json.dumps({"rowCriteria": filas, "columnCriteria": columnas}, ensure_ascii=False))
            return

        # Si no conseguimos tras varios intentos
        raise Exception("No se han podido generar suficientes filas y columnas válidas tras varios intentos.")

    finally:
        session.close()






if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('--lang', type=str, default='es')
    args = parser.parse_args()
    generar_criterios()

