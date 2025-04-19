#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import random
import pickle
from pathlib import Path
from itertools import combinations
from collections import defaultdict

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# ——————— Configuración ———————
DB_URL = 'mysql+pymysql://root:root@localhost/f1db'
engine = create_engine(DB_URL, pool_size=25, max_overflow=20, future=True)
Session = sessionmaker(bind=engine)

HERE = Path(__file__).resolve().parent
PROJECT_ROOT = HERE.parents[3]
STATIC_LOGO_DIR = PROJECT_ROOT / "frontend" / "src" / "assets" / "images" / "tictactoe"

print("DEBUG: PROJECT_ROOT   =", PROJECT_ROOT)
print("DEBUG: STATIC_LOGO_DIR=", STATIC_LOGO_DIR)

# ¡ojo! cache v3 para forzar regenerar tras cambiar la lógica
CACHE_FILE = PROJECT_ROOT / "configs_cache_v3.pkl"

ISO_MAPPING = {
    "british": "gb", "german": "de", "italian": "it", "french": "fr", "spanish": "es",
    "dutch": "nl", "finnish": "fi", "brazilian": "br", "argentinean": "ar", "mexican": "mx",
    "canadian": "ca", "austrian": "at", "australian": "au", "swiss": "ch", "belgian": "be",
    "swedish": "se", "portuguese": "pt", "chilean": "cl", "american": "us",
    "new zealander": "nz", "irish": "ie", "south african": "za", "japanese": "jp",
    "russian": "ru", "polish": "pl", "venezuelan": "ve", "colombian": "co",
    "czech": "cz", "hungarian": "hu", "monegasque": "mc", "monacan": "mc",
    "thai": "th", "chinese": "cn", "indian": "in", "malaysian": "my",
    "indonesian": "id", "dane": "dk", "danish": "dk", "estonian": "ee",
    "latvian": "lv", "uruguayan": "uy"
}

# ——————— Estructuras globales ———————
VALORES_VALIDOS   = defaultdict(set)
team_logo_cache   = {}
criteria_list     = []
row_combos        = []
team_to_nats      = defaultdict(set)
team_to_debuts    = defaultdict(set)
nat_to_teams      = defaultdict(set)
nat_to_debuts     = defaultdict(set)
TEAM_PAIRS        = set()
VALID_CONFIGS     = []

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET"],
    allow_headers=["*"],
)

# ——————— Lógica de precarga ———————
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
            debut = int(debut)
            nat_to_debuts[nat].add(debut)
            if not teams_concat:
                continue
            for team in teams_concat.split(','):
                VALORES_VALIDOS['team'].add(team)
                VALORES_VALIDOS['nationality'].add(nat)
                VALORES_VALIDOS['debut'].add(debut)
                team_to_nats[team].add(nat)
                team_to_debuts[team].add(debut)
                nat_to_teams[nat].add(team)

        pairs = session.execute(text("""
            SELECT DISTINCT c1.name, c2.name
            FROM results r1
            JOIN constructors c1 ON r1.constructorId = c1.constructorId
            JOIN races ra1 ON r1.raceId = ra1.raceId
            JOIN results r2 ON r1.driverId = r2.driverId
            JOIN constructors c2 ON r2.constructorId = c2.constructorId
            JOIN races ra2 ON r2.raceId = ra2.raceId
            WHERE ra1.year >= 2000
              AND ra2.year >= 2000
              AND c1.name <> c2.name
        """)).fetchall()
        for t1, t2 in pairs:
            TEAM_PAIRS.add((t1, t2))
            TEAM_PAIRS.add((t2, t1))


def index_logos():
    if not STATIC_LOGO_DIR.is_dir():
        print(f"[WARNING] STATIC_LOGO_DIR «{STATIC_LOGO_DIR}» no existe")
        return
    for img in STATIC_LOGO_DIR.iterdir():
        if img.suffix.lower() in {".png", ".jpg", ".svg"}:
            key = img.stem.replace("_", " ")
            team_logo_cache[key] = f"/assets/images/tictactoe/{img.name}"


def get_logo_url(tipo, value):
    if tipo == 'team':
        return team_logo_cache.get(value, "/assets/images/tictactoe/default_team.png")
    if tipo == 'nationality':
        iso = ISO_MAPPING.get(value.lower())
        return f"https://flagcdn.com/w320/{iso}.png" if iso else ""
    if tipo == 'debut':
        return "/assets/images/tictactoe/calendar.png"
    return ""


def build_criteria_list():
    global criteria_list
    criteria_list = []
    for team in VALORES_VALIDOS['team']:
        criteria_list.append(dict(
            type='team', value=team,
            code=f"team_{team.lower().replace(' ', '_')}",
            description=f"Corrió para {team}",
            imageUrl=get_logo_url('team', team)
        ))
    for nat in VALORES_VALIDOS['nationality']:
        criteria_list.append(dict(
            type='nationality', value=nat,
            code=f"nationality_{nat.lower().replace(' ', '_')}",
            description=f"Piloto {nat}",
            imageUrl=get_logo_url('nationality', nat)
        ))
    for debut in VALORES_VALIDOS['debut']:
        criteria_list.append(dict(
            type='debut', value=debut,
            code=f"debut_{debut}",
            description=f"Debut en {debut}",
            imageUrl=get_logo_url('debut', debut)
        ))


def build_row_combos():
    global row_combos
    teams = [c for c in criteria_list if c['type']=='team']
    nats  = [c for c in criteria_list if c['type']=='nationality']
    row_combos.clear()
    for t in teams:
        valid_nats = [n for n in nats if n['value'] in team_to_nats[t['value']]]
        for n1, n2 in combinations(valid_nats, 2):
            row_combos.append([t, n1, n2])


def valid_pair(a, b):
    if a['type']=='team' and b['type']=='nationality':
        return b['value'] in team_to_nats[a['value']]
    if a['type']=='nationality' and b['type']=='team':
        return b['value'] in nat_to_teams[a['value']]

    if a['type']=='team' and b['type']=='debut':
        return b['value'] in team_to_debuts[a['value']]
    if a['type']=='debut' and b['type']=='team':
        return b['value'] in team_to_debuts[a['value']]

    if a['type']=='nationality' and b['type']=='debut':
        return b['value'] in nat_to_debuts[a['value']]
    if a['type']=='debut' and b['type']=='nationality':
        return a['value'] in nat_to_debuts[b['value']]

    if a['type']=='team' and b['type']=='team':
        return (a['value'], b['value']) in TEAM_PAIRS

    if a['type']==b['type'] and a['type'] in ['nationality','debut']:
        return a['value']==b['value']

    return True


def valid_combo(row, col):
    for r in row:
        for c in col:
            if not valid_pair(r, c) or not valid_pair(c, r):
                return False
    return True


def precargar_configuraciones(target=500):
    # si existe caché, la usamos
    if CACHE_FILE.exists():
        return pickle.loads(CACHE_FILE.read_bytes())

    configs = []
    seen = set()

    all_cols = list(combinations(criteria_list, 3))
    random.shuffle(all_cols)

    for row in row_combos:
        if len(configs) >= target:
            break
        row_codes = {c['code'] for c in row}

        # recorremos TODO el espacio de columnas en orden aleatorio
        for col in all_cols:
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

    # volcamos caché
    CACHE_FILE.write_bytes(pickle.dumps(configs))
    return configs


def init():
    precargar_datos()
    index_logos()
    build_criteria_list()
    build_row_combos()
    global VALID_CONFIGS
    VALID_CONFIGS = precargar_configuraciones()


# ——————— FastAPI ———————
@app.on_event("startup")
async def on_startup():
    init()

@app.get("/generate")
async def generate():
    if not VALID_CONFIGS:
        return {"error": "No hay configuraciones válidas (revisa tus datos)"}
    return random.choice(VALID_CONFIGS)

if __name__ == "__main__":
    uvicorn.run("generate_criteria_server:app", host="127.0.0.1", port=8000, log_level="info")
