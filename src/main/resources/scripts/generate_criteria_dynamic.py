import random
import json
import sys
import argparse
import requests
import urllib.parse
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

# Mapeo ISO para flagcdn
# Mapeo ISO para flagcdn (más nacionalidades de F1)
ISO_MAPPING = {
    "british": "gb",
    "german": "de",
    "italian": "it",
    "french": "fr",
    "spanish": "es",
    "dutch": "nl",
    "finnish": "fi",
    "brazilian": "br",
    "argentine": "ar",
    "mexican": "mx",
    "canadian": "ca",
    "austrian": "at",
    "australian": "au",
    "swiss": "ch",
    "belgian": "be",
    "swedish": "se",
    "portuguese": "pt",
    "chilean": "cl",
    "american": "us",
    "new zealander": "nz",
    "irish": "ie",
    "south african": "za",
    "japanese": "jp",
    "russian": "ru",
    "polish": "pl",
    "venezuelan": "ve",
    "colombian": "co",
    "czech": "cz",
    "hungarian": "hu",
    "monégasque": "mc",
    "monacan": "mc",
    "thai": "th",
    "chinese": "cn",
    "indian": "in",
    "malaysian": "my",
    "indonesian": "id",
    "dane": "dk",
    "danish": "dk",
    "estonian": "ee",
    "latvian": "lv",
    "uruguayan": "uy"
}



headers = {
    "User-Agent": "OverCutBot/1.0 (https://overcut.com)"
}


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

SPORTMONKS_API_TOKEN = '5UhlDsMlTnKg0kCfOtTd6BvmX28RUwInhj5pY9x77TSfVpABspG9Gb4ISbN1'
SPORTMONKS_BASE_URL = 'https://api.sportmonks.com/v1/formula-1/teams'

def get_team_logo_url(team_name):
    try:
        response = requests.get(
            SPORTMONKS_BASE_URL,
            params={'api_token': SPORTMONKS_API_TOKEN}
        )
        if response.status_code == 200:
            data = response.json()['data']
            for team in data:
                if team_name.lower() in team['name'].lower():
                    return team.get('image_path', None)
        return None
    except Exception as e:
        print(f"Error fetching logo from API: {e}")
        return None

def obtener_logo_equipo_local(team_name):
    key = team_name.lower().replace(" ", "_")
    return TEAM_LOGOS_LOCAL.get(key)



def obtener_logo_equipo_wikipedia(team_name):
    try:
        url = "https://commons.wikimedia.org/w/api.php"

        # Si empieza por "Team " → lo eliminamos
        if team_name.startswith("Team "):
            team_name = team_name[5:]  # Quita "Team " (5 caracteres)

        posibles_queries = [
            f"{team_name} Benz AMG Petronas Formula One Team Logo Wheelsology",
            f"{team_name} AMG Petronas F1 Logo",
            f"{team_name} Grand Prix logo",
            f"{team_name} Formula 1 Team logo",
            f"{team_name} F1 team",
            f"{team_name} Formula One Team",
            f"{team_name} F1 Team logo",
            f"{team_name} Grand Prix logo",
            f"{team_name} F1 logo",
            f"{team_name} Racing logo",
            f"Scuderia {team_name} Logo",
            f"Logo of {team_name}",
            f"{team_name} 1 Team logo 2019",
            f"{team_name} Racing logo ita",
            f"{team_name} Team logo"
            f"{team_name} logo F1",
            f"{team_name} logo",
            f"Logo {team_name} F1",
            f"BWT {team_name} logo 2020",
            f"{team_name} Honda 007",
            f"Logo {team_name} F1",
            f"{team_name} F1 Team Stake Logo",
            f"{team_name} Racing Cars logo",
            f"{team_name} Automobili S.p.A. logo",
            f"{team_name}racing",
            f"{team_name} Formula Ltd.",
            f"{team_name} Arrows logo",
            f"{team_name} Logo",
            f"{team_name} Automotive logo",
            f"{team_name} MF1 Racing-Logo",
            f"{team_name}",
            f"{team_name} logo",
            f"Scuderia_Alpha-Tauri",
            f"Mini Free Logo {team_name}"
        ]

        if team_name.upper() == "BAR":
            posibles_queries.insert(0, "British American Racing logo")

        if team_name.upper() == "Midland":
            posibles_queries.insert(0, "MF1")

        if team_name.upper() == "Ferrari":
            posibles_queries.insert(0, "Escuderia Ferrari")

        if team_name.upper() == "Aston Martin":
            posibles_queries.insert(0, "Aston Martin F1 Team")

        if team_name.upper() == "McLaren":
            posibles_queries.insert(0, "McLaren Racing logo")

        if team_name.upper() == "Force India":
            posibles_queries.insert(0, "Mini Free Logo Force India")

        extensiones_validas = ('.svg', '.png', '.jpg', '.jpeg')

        for query in posibles_queries:
            params = {
                "action": "query",
                "format": "json",
                "prop": "imageinfo",
                "iiprop": "url",
                "generator": "search",
                "gsrsearch": query,
                "gsrlimit": 5,
                "gsrnamespace": 6
            }

            response = requests.get(url, params=params, headers=headers, timeout=10)

            if response.status_code != 200:
                continue

            data = response.json()
            pages = data.get("query", {}).get("pages", {})

            for page in pages.values():
                title = page.get("title", "").lower()
                url_image = page["imageinfo"][0]["url"]

                # Condiciones de validación final
                if ("logo" in title or "emblem" in title) and title.endswith(extensiones_validas):
                    return url_image

        return None

    except Exception as e:
        print(f"[LOG] Error buscando logo equipo Wikipedia: {e}", file=sys.stderr)
        return None




def obtener_bandera_nacionalidad_wikipedia(nationality):
    try:
        query = f"Flag of {nationality}"
        url = "https://commons.wikimedia.org/w/api.php"
        params = {
            "action": "query",
            "format": "json",
            "prop": "imageinfo",
            "iiprop": "url",
            "generator": "search",
            "gsrsearch": query,
            "gsrlimit": 1,
            "gsrnamespace": 6  # SOLO IMÁGENES
        }
        response = requests.get(url, params=params, headers=headers, timeout=10)

        data = response.json()

        pages = data.get("query", {}).get("pages", {})
        for page in pages.values():
            return page["imageinfo"][0]["url"]

    except Exception as e:
        print(f"[LOG] Error buscando bandera Wikipedia: {e}", file=sys.stderr)
    return None




def get_logo_url(tipo, value):
    if tipo == 'team':
        logo_url = obtener_logo_equipo_wikipedia(value)
        return logo_url

    if tipo == 'nationality':
        iso_code = ISO_MAPPING.get(value.lower())
        if iso_code:
            return f"https://flagcdn.com/w320/{iso_code}.png"
        bandera_url = obtener_bandera_nacionalidad_wikipedia(value)
        return bandera_url

    if tipo == 'era':
        # Imagen ilustrativa fija para era
        return "https://overcut.com/static/images/era_f1.png"

    return None




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
            image_url = get_logo_url(tipo, seleccion if tipo in ['team', 'nationality'] else None)
            return {"description": desc, "code": code, "imageUrl": image_url}


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
        filas, columnas = [], []

        # Decidir si las nationalities van solo en filas o solo en columnas
        nationality_in_rows = random.choice([True, False])

        tipos_prohibidos_filas = ['nationality'] if not nationality_in_rows else []
        tipos_prohibidos_columnas = ['nationality'] if nationality_in_rows else []

        for intentos_generales in range(5):
            filas, columnas = [], []

            while len(filas) < NUM_CRITERIOS:
                criterio = obtener_criterio_valido(session, usados, filas)
                if criterio and not criterio['code'].startswith(tuple(tipos_prohibidos_filas)):
                    filas.append(criterio)

            while len(columnas) < NUM_CRITERIOS:
                criterio = obtener_criterio_valido(session, usados, filas + columnas)
                if criterio and not criterio['code'].startswith(tuple(tipos_prohibidos_columnas)):
                    if all(existen_pilotos_para_fila_columna(session, fila, criterio) for fila in filas):
                        columnas.append(criterio)

            if len(columnas) == NUM_CRITERIOS:
                print(json.dumps({"rowCriteria": filas, "columnCriteria": columnas}, ensure_ascii=False))
                return

        raise Exception("No se han podido generar suficientes filas y columnas válidas tras varios intentos.")
    finally:
        session.close()



if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('--lang', type=str, default='es')
    args = parser.parse_args()
    generar_criterios()