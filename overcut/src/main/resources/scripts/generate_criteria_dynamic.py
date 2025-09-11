import random
import json
import os
import time
import pickle
from itertools import combinations
from collections import defaultdict
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# DB setup
DB_URL = os.getenv("DB_URI", "mysql+pymysql://root:root@localhost:3306/f1db")
engine = create_engine(DB_URL, pool_size=25, max_overflow=20, future=True)
Session = sessionmaker(bind=engine)

# Paths and cache
STATIC_LOGO_DIR = "frontend/src/assets/images/tictactoe"
CACHE_FILE = "frontend/src/assets/images/tictactoe/configs_cache.pkl"

# ISO map
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

# Globals
COMBINACIONES_PILOTO = set()
VALORES_VALIDOS = defaultdict(set)
team_logo_cache = {}
criteria_list = []
row_combos = []
team_to_nats = defaultdict(set)
team_to_debuts = defaultdict(set)
nat_to_teams = defaultdict(set)
VALID_CONFIGS = []

# Preload driver data
def precargar_datos():
    with Session() as session:
        rows = session.execute(text("""
            SELECT d.driverId, d.nationality, MIN(ra.year) AS debutYear,
                   GROUP_CONCAT(DISTINCT c.name) AS teams
            FROM drivers d
            JOIN results r ON d.driverId = r.driverId
            JOIN races ra ON r.raceId = ra.raceId
            JOIN constructors c ON r.constructorId = c.constructorId
            WHERE ra.year >= 2000
            GROUP BY d.driverId
            HAVING debutYear >= 2000
        """)).fetchall()
    for _, nat, debut, teams_concat in rows:
        if not teams_concat:
            continue
        debut = int(debut)
        for team in teams_concat.split(','):
            COMBINACIONES_PILOTO.add((team, nat, debut))
            VALORES_VALIDOS['team'].add(team)
            VALORES_VALIDOS['nationality'].add(nat)
            VALORES_VALIDOS['debut'].add(debut)
            team_to_nats[team].add(nat)
            team_to_debuts[team].add(debut)
            nat_to_teams[nat].add(team)

# Index logos once
def index_logos():
    for fname in os.listdir(STATIC_LOGO_DIR):
        base, ext = os.path.splitext(fname)
        team = base.replace('_', ' ')
        team_logo_cache[team] = f"/assets/images/tictactoe/{fname}"

# Logo URL helper
def get_logo_url(tipo, value):
    if tipo == 'team':
        return team_logo_cache.get(value, "/assets/images/tictactoe/default_team.png")
    if tipo == 'nationality':
        iso = ISO_MAPPING.get(value.lower())
        return f"https://flagcdn.com/w320/{iso}.png" if iso else "https://overcut.com/static/images/no_flag.png"
    if tipo == 'debut':
        return "/assets/images/tictactoe/calendar.png"
    return ""

# Build criteria list
def build_criteria_list():
    global criteria_list
    criteria_list = []
    for team in VALORES_VALIDOS['team']:
        criteria_list.append({
            'type': 'team', 'value': team,
            'code': f"team_{team.lower().replace(' ', '_')}",
            'description': f"Corrió para {team}",
            'imageUrl': get_logo_url('team', team)
        })
    for nat in VALORES_VALIDOS['nationality']:
        criteria_list.append({
            'type': 'nationality', 'value': nat,
            'code': f"nationality_{nat.lower().replace(' ', '_')}",
            'description': f"Piloto {nat}",
            'imageUrl': get_logo_url('nationality', nat)
        })
    for debut in VALORES_VALIDOS['debut']:
        criteria_list.append({
            'type': 'debut', 'value': debut,
            'code': f"debut_{debut}",
            'description': f"Debut en {debut}",
            'imageUrl': get_logo_url('debut', debut)
        })

# Precompute row triples: 1 team + 2 nationalities
def build_row_combos():
    global row_combos
    teams = [c for c in criteria_list if c['type']=='team']
    nats  = [c for c in criteria_list if c['type']=='nationality']
    row_combos = []
    for t in teams:
        for n1, n2 in combinations(nats, 2):
            row_combos.append([t, n1, n2])

# Quick pair validity
def valid_pair(a, b):
    if a['type']=='team' and b['type']=='nationality':
        return b['value'] in team_to_nats[a['value']]
    if a['type']=='team' and b['type']=='debut':
        return b['value'] in team_to_debuts[a['value']]
    if a['type']=='nationality' and b['type']=='team':
        return b['value'] in nat_to_teams[a['value']]
    if b['type']=='nationality' and a['type']=='debut':
        return a['value'] in team_to_debuts.get(b['value'], set())
    return True

def valid_combo(row, col):
    for r in row:
        for c in col:
            if r['type']==c['type'] and r['value']!=c['value'] and r['type'] in ['nationality','debut']:
                return False
            if not valid_pair(r, c) or not valid_pair(c, r):
                return False
    return True

# Load or generate configurations with caching
def precargar_configuraciones(target=500, max_attempts=30):
    if os.path.exists(CACHE_FILE):
        with open(CACHE_FILE, 'rb') as f:
            return pickle.load(f)

    configs, seen = [], set()
    for row in row_combos:
        if len(configs) >= target:
            break
        row_codes = {c['code'] for c in row}
        for _ in range(max_attempts):
            col = random.sample(criteria_list, 3)
            col_codes = {c['code'] for c in col}
            if row_codes & col_codes:
                continue
            if not valid_combo(row, col):
                continue
            key = tuple(sorted(row_codes | col_codes))
            if key in seen:
                continue
            seen.add(key)
            configs.append({'rowCriteria': row, 'columnCriteria': col})
            break
    with open(CACHE_FILE, 'wb') as f:
        pickle.dump(configs, f)
    return configs

# Initialize everything
def init():
    t0 = time.perf_counter()
    precargar_datos()
    index_logos()
    build_criteria_list()
    build_row_combos()
    global VALID_CONFIGS
    VALID_CONFIGS = precargar_configuraciones()
    elapsed = time.perf_counter() - t0
    print(f"Init completo en {elapsed:.2f}s con {len(VALID_CONFIGS)} configs")

# Generate one board in O(1)
def generar_partida():
    return random.choice(VALID_CONFIGS)

if __name__ == '__main__':
    init()
    partida = generar_partida()
    print(json.dumps(partida, ensure_ascii=False, indent=2))
