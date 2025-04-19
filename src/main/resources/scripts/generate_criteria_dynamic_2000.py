import random
import json
import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from collections import defaultdict

# Configuración DB y logos
DB_URL = 'mysql+pymysql://root:root@localhost/f1db'
engine = create_engine(DB_URL, pool_size=25, max_overflow=20)
Session = sessionmaker(bind=engine)
STATIC_LOGO_DIR = "frontend/src/assets/images/tictactoe"

ISO_MAPPING = {
    "british": "gb", "german": "de", "italian": "it", "french": "fr", "spanish": "es", "dutch": "nl",
    "finnish": "fi", "brazilian": "br", "argentinean": "ar", "mexican": "mx", "canadian": "ca",
    "austrian": "at", "australian": "au", "swiss": "ch", "belgian": "be", "swedish": "se",
    "portuguese": "pt", "chilean": "cl", "american": "us", "new zealander": "nz", "irish": "ie",
    "south african": "za", "japanese": "jp", "russian": "ru", "polish": "pl", "venezuelan": "ve",
    "colombian": "co", "czech": "cz", "hungarian": "hu", "monegasque": "mc", "monacan": "mc",
    "thai": "th", "chinese": "cn", "indian": "in", "malaysian": "my", "indonesian": "id",
    "dane": "dk", "danish": "dk", "estonian": "ee", "latvian": "lv", "uruguayan": "uy"
}

# Precarga de listas
with Session() as session:
    TEAMS = [r[0] for r in session.execute(text("""
        SELECT DISTINCT c.name FROM constructors c
        JOIN results r ON c.constructorId = r.constructorId
        JOIN races ra ON r.raceId = ra.raceId
        WHERE ra.year >= 2000
    """)).fetchall()]

    NATIONALITIES = [r[0] for r in session.execute(text("""
        SELECT DISTINCT d.nationality FROM drivers d
        JOIN results r ON d.driverId = r.driverId
        JOIN races ra ON r.raceId = ra.raceId
        WHERE ra.year >= 2000
    """)).fetchall()]

    DEBUT_YEARS = [r[0] for r in session.execute(text("""
        SELECT DISTINCT MIN(ra.year)
        FROM drivers d
        JOIN results r ON d.driverId = r.driverId
        JOIN races ra ON r.raceId = ra.raceId
        GROUP BY d.driverId
        HAVING MIN(ra.year) >= 2000
    """)).fetchall()]

    PILOTO_DATA = session.execute(text("""
        SELECT d.driverId, d.nationality, MIN(ra.year) AS debutYear
        FROM drivers d
        JOIN results r ON d.driverId = r.driverId
        JOIN races ra ON r.raceId = ra.raceId
        GROUP BY d.driverId
        HAVING debutYear >= 2000
    """)).fetchall()

    PILOTOS = [{
        'id': d[0],
        'nationality': d[1],
        'debut': d[2]
    } for d in PILOTO_DATA]

    # team + team válidos
    TEAM_PAIRS = set()
    raw_pairs = session.execute(text("""
        SELECT DISTINCT c1.name, c2.name
        FROM results r1
        JOIN constructors c1 ON r1.constructorId = c1.constructorId
        JOIN races ra1 ON r1.raceId = ra1.raceId
        JOIN results r2 ON r1.driverId = r2.driverId
        JOIN constructors c2 ON r2.constructorId = c2.constructorId
        JOIN races ra2 ON r2.raceId = ra2.raceId
        WHERE ra1.year >= 2000 AND ra2.year >= 2000 AND c1.name <> c2.name
    """)).fetchall()
    for team1, team2 in raw_pairs:
        TEAM_PAIRS.add((team1, team2))
        TEAM_PAIRS.add((team2, team1))

    # team + nationality válidos
    TEAM_NATIONALITY_MAP = set([
        (r[0], r[1])
        for r in session.execute(text("""
            SELECT DISTINCT c.name, d.nationality
            FROM results r
            JOIN constructors c ON r.constructorId = c.constructorId
            JOIN races ra ON r.raceId = ra.raceId
            JOIN drivers d ON r.driverId = d.driverId
            WHERE ra.year >= 2000
        """)).fetchall()
    ])

    # team → driverId set
    TEAM_DRIVER_IDS = defaultdict(set)
    rows = session.execute(text("""
        SELECT DISTINCT c.name, r.driverId
        FROM results r
        JOIN constructors c ON r.constructorId = c.constructorId
        JOIN races ra ON r.raceId = ra.raceId
        WHERE ra.year >= 2000
    """)).fetchall()
    for team, driver_id in rows:
        TEAM_DRIVER_IDS[team].add(driver_id)

# Imagen por tipo
def get_logo_url(tipo, value):
    if tipo == 'team':
        base = value.replace(" ", "_").replace("-", "_")
        for ext in ['.svg', '.png', '.jpg']:
            filename = f"{base}{ext}"
            if os.path.exists(os.path.join(STATIC_LOGO_DIR, filename)):
                return f"/assets/images/tictactoe/{filename}"
        return "/assets/images/tictactoe/default_team.png"
    elif tipo == 'nationality':
        iso = ISO_MAPPING.get(value.lower())
        return f"https://flagcdn.com/w320/{iso}.png" if iso else "https://overcut.com/static/images/no_flag.png"
    elif tipo == 'debut':
        return "/assets/images/tictactoe/calendar.png"
    return ""

def obtener_criterio_valido(usados, tipo):
    if tipo == 'nationality':
        value = random.choice(NATIONALITIES)
        code = f"nationality_{value.lower().replace(' ', '_')}"
        desc = f"Piloto {value}"
    elif tipo == 'team':
        value = random.choice(TEAMS)
        code = f"team_{value.lower().replace(' ', '_')}"
        desc = f"Corrió para {value}"
    elif tipo == 'debut':
        value = random.choice(DEBUT_YEARS)
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
    return a['type'] == b['type'] and a['code'] != b['code'] and a['type'] in ['nationality', 'debut']

def existen_pilotos_para_fila_columna(row, col):
    if criterios_incompatibles(row, col):
        return False

    # 1. Validación en memoria: team + team
    if row['type'] == 'team' and col['type'] == 'team':
        team1 = row['description'].replace('Corrió para ', '')
        team2 = col['description'].replace('Corrió para ', '')
        return (team1, team2) in TEAM_PAIRS

    # 2. Filtrado por nacionalidad o debut
    def cumple(piloto, crit):
        if crit['type'] == 'nationality':
            return piloto['nationality'].lower() == crit['description'].replace('Piloto ', '').lower()
        if crit['type'] == 'debut':
            return piloto['debut'] == int(crit['description'].split()[-1])
        return True

    pilotos_filtrados = [p for p in PILOTOS if cumple(p, row) and cumple(p, col)]
    if not pilotos_filtrados:
        return False

    # 3. Validación team + nationality o team solo
    if row['type'] == 'team' or col['type'] == 'team':
        team = (row if row['type'] == 'team' else col)['description'].replace('Corrió para ', '')
        nationality = (row if row['type'] == 'nationality' else col)['description'].replace('Piloto ', '') \
                      if row['type'] == 'nationality' or col['type'] == 'nationality' else None

        if nationality:
            return (team, nationality) in TEAM_NATIONALITY_MAP
        else:
            piloto_ids = set(p['id'] for p in pilotos_filtrados)
            drivers_in_team = TEAM_DRIVER_IDS.get(team, set())
            return len(piloto_ids & drivers_in_team) > 0

    # 4. Si no hay equipos, basta el filtrado previo
    return True

def generar_criterios():
    usados = set()
    filas, columnas = [], []
    tiene_team = False
    count_nationality = 0
    tipos = ['team', 'nationality', 'debut']
    random.shuffle(tipos)

    while len(filas) < 3:
        tipo = random.choice(tipos)
        crit = obtener_criterio_valido(usados, tipo)
        if crit:
            filas.append(crit)
            if crit['type'] == 'team': tiene_team = True
            if crit['type'] == 'nationality': count_nationality += 1

    intentos = 0
    while len(columnas) < 3 and intentos < 50:
        tipo = random.choice(tipos)
        crit = obtener_criterio_valido(usados, tipo)
        intentos += 1
        if crit and all(existen_pilotos_para_fila_columna(f, crit) for f in filas):
            columnas.append(crit)
            if crit['type'] == 'team': tiene_team = True
            if crit['type'] == 'nationality': count_nationality += 1

    if not tiene_team or count_nationality < 2 or len(columnas) < 3:
        return generar_criterios()

    return {"rowCriteria": filas, "columnCriteria": columnas}

if __name__ == "__main__":
    criterios = generar_criterios()
    print(json.dumps(criterios, ensure_ascii=False))
