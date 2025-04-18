import random
import json
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

DB_URL = 'mysql+pymysql://root:root@localhost/f1db'
engine = create_engine(DB_URL, pool_size=25, max_overflow=20)
Session = sessionmaker(bind=engine)

ISO_MAPPING = {
    "british": "gb", "german": "de", "italian": "it", "french": "fr", "spanish": "es", "dutch": "nl",
    "finnish": "fi", "brazilian": "br", "argentine": "ar", "mexican": "mx", "canadian": "ca",
    "austrian": "at", "australian": "au", "swiss": "ch", "belgian": "be", "swedish": "se",
    "portuguese": "pt", "chilean": "cl", "american": "us", "new zealander": "nz", "irish": "ie",
    "south african": "za", "japanese": "jp", "russian": "ru", "polish": "pl", "venezuelan": "ve",
    "colombian": "co", "czech": "cz", "hungarian": "hu", "monegasque": "mc", "monacan": "mc",
    "thai": "th", "chinese": "cn", "indian": "in", "malaysian": "my", "indonesian": "id",
    "dane": "dk", "danish": "dk", "estonian": "ee", "latvian": "lv", "uruguayan": "uy"
}

TEAMS = []
NATIONALITIES = []

with Session() as session:
    TEAMS = [r[0] for r in session.execute(text("""
        SELECT DISTINCT c.name
        FROM constructors c
        JOIN results r ON c.constructorId = r.constructorId
        JOIN races ra ON r.raceId = ra.raceId
        WHERE ra.year >= 2000
    """)).fetchall()]

    NATIONALITIES = [r[0] for r in session.execute(text("""
        SELECT DISTINCT d.nationality
        FROM drivers d
        JOIN results r ON d.driverId = r.driverId
        JOIN races ra ON r.raceId = ra.raceId
        WHERE ra.year >= 2000
    """)).fetchall()]

import os

STATIC_LOGO_DIR = "frontend/public/assets/images/tictactoe"

def get_logo_url(tipo, value):
    if tipo == 'team':
        # Probar con .svg y .png respetando mayúsculas
        base = value.replace(" ", "_").replace("-", "_")
        for ext in ['.svg', '.png', '.jpg']:
            filename = f"{base}{ext}"
            full_path = os.path.join(STATIC_LOGO_DIR, filename)
            if os.path.exists(full_path):
                return f"/assets/images/tictactoe/{filename}"
        # Si no se encuentra ninguno
        return "/assets/images/tictactoe/default_team.png"
    elif tipo == 'nationality':
        iso = ISO_MAPPING.get(value.lower())
        return f"https://flagcdn.com/w320/{iso}.png" if iso else "https://overcut.com/static/images/no_flag.png"
    elif tipo == 'debut':
        return "/assets/images/tictactoe/calendar.png"
    return ""


def obtener_criterio_valido(usados, tipo):
    with Session() as session:
        if tipo == 'nationality':
            value = random.choice(NATIONALITIES)
            code = f"nationality_{value.lower().replace(' ', '_')}"
            desc = f"Piloto {value}"
        elif tipo == 'team':
            value = random.choice(TEAMS)
            code = f"team_{value.lower().replace(' ', '_')}"
            desc = f"Corrió para {value}"
        elif tipo == 'debut':
            years = session.execute(text("""
                SELECT DISTINCT MIN(ra.year)
                FROM drivers d
                JOIN results r ON d.driverId = r.driverId
                JOIN races ra ON r.raceId = ra.raceId
                GROUP BY d.driverId
                HAVING MIN(ra.year) >= 2000
            """)).fetchall()
            if not years:
                return None
            value = random.choice([r[0] for r in years])
            code = f"debut_{value}"
            desc = f"Debut en {value}"
        else:
            return None

        if code in usados:
            return None

        usados.add(code)
        return {
            "description": desc,
            "code": code,
            "imageUrl": get_logo_url(tipo, value),
            "type": tipo
        }

def criterios_incompatibles(a, b):
    if a['type'] == b['type'] and a['code'] != b['code'] and a['type'] in ['nationality', 'debut']:
        return True
    return False

def existen_pilotos_para_fila_columna(row, col):
    if criterios_incompatibles(row, col):
        return False

    query = """
        SELECT DISTINCT d.driverId
        FROM drivers d
        JOIN results r ON d.driverId = r.driverId
        JOIN races ra ON r.raceId = ra.raceId
        JOIN constructors c ON r.constructorId = c.constructorId
        WHERE ra.year >= 2000
    """
    condiciones = []
    params = {}

    if row['type'] == 'team' or col['type'] == 'team':
        team = row['description'].replace('Corrió para ', '') if row['type'] == 'team' else col['description'].replace('Corrió para ', '')
        condiciones.append("c.name = :team")
        params['team'] = team

    if row['type'] == 'nationality' or col['type'] == 'nationality':
        nat = row['description'].replace('Piloto ', '') if row['type'] == 'nationality' else col['description'].replace('Piloto ', '')
        condiciones.append("d.nationality = :nat")
        params['nat'] = nat

    if row['type'] == 'debut' or col['type'] == 'debut':
        debut = int(row['description'].split()[-1]) if row['type'] == 'debut' else int(col['description'].split()[-1])
        condiciones.append("ra.year = :debut")
        params['debut'] = debut

    if condiciones:
        query += " AND " + " AND ".join(condiciones)

    with Session() as session:
        result = session.execute(text(query), params).fetchall()
        return len(result) >= 1

def generar_criterios():
    usados = set()
    filas, columnas = [], []
    tiene_team = False
    count_nationality = 0

    tipos = ['team', 'nationality', 'debut']
    random.shuffle(tipos)

    while len(filas) < 3:
        tipo = random.choice(tipos)
        criterio = obtener_criterio_valido(usados, tipo)
        if criterio:
            filas.append(criterio)
            if criterio['type'] == 'team': tiene_team = True
            if criterio['type'] == 'nationality': count_nationality += 1

    while len(columnas) < 3:
        tipo = random.choice(tipos)
        criterio = obtener_criterio_valido(usados, tipo)
        if criterio and all(existen_pilotos_para_fila_columna(r, criterio) for r in filas):
            columnas.append(criterio)
            if criterio['type'] == 'team': tiene_team = True
            if criterio['type'] == 'nationality': count_nationality += 1

    if not tiene_team or count_nationality < 2:
        return generar_criterios()

    print(json.dumps({"rowCriteria": filas, "columnCriteria": columnas}, ensure_ascii=False))

if __name__ == "__main__":
    generar_criterios()
