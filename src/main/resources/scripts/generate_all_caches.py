#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import pickle
from pathlib import Path
from itertools import combinations
from collections import defaultdict
from multiprocessing import Pool, cpu_count
from unicodedata import normalize
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# ——— Paths y DB ———

PROJECT_ROOT    = Path(__file__).resolve().parent.parent.parent
# directorio real donde están los PNG
OVERCUT_ROOT    = Path(__file__).resolve().parents[4]
STATIC_LOGO_DIR = OVERCUT_ROOT / "frontend" / "src" / "assets" / "images" / "tictactoe"
DB_URL          = 'mysql+pymysql://root:root@localhost/f1db'
engine          = create_engine(DB_URL, pool_size=25, max_overflow=20, future=True)
SessionLocal    = sessionmaker(bind=engine)

# RANGOS y objetivo de configuraciones
RANGES = [
    (2000, None, 500),
    (1980, None, 500),
    (1980, 1999, 500),
]

ISO_MAPPING = {
    "british": "gb", "german": "de", "italian": "it", "french": "fr", "spanish": "es", "dutch": "nl",
    "finnish": "fi", "brazilian": "br", "argentinean": "ar","argentine": "ar", "mexican": "mx", "canadian": "ca",
    "austrian": "at", "australian": "au", "swiss": "ch", "belgian": "be", "swedish": "se",
    "portuguese": "pt", "chilean": "cl", "american": "us", "new zealander": "nz", "irish": "ie",
    "south african": "za", "japanese": "jp", "russian": "ru", "polish": "pl", "venezuelan": "ve",
    "colombian": "co", "czech": "cz", "hungarian": "hu", "monegasque": "mc", "monacan": "mc",
    "thai": "th", "chinese": "cn", "indian": "in", "malaysian": "my", "indonesian": "id",
    "dane": "dk", "danish": "dk", "estonian": "ee", "latvian": "lv", "uruguayan": "uy"
}


# cache { "alfa romeo": "/assets/images/tictactoe/alfa_romeo.png", ... }
team_logo_cache = {}

def _normalize_team(name: str) -> str:
    # minúsculas, sin acentos, guiones/barras → espacio, quitar resto de puntuación
    s = normalize('NFKD', name).encode('ascii','ignore').decode()
    s = s.lower().replace('-', ' ').replace('/', ' ')
    return '_'.join(s.split())

def index_logos():
    if not STATIC_LOGO_DIR.is_dir():
        print(f"[WARN] STATIC_LOGO_DIR «{STATIC_LOGO_DIR}» no existe")
        return
    for img in STATIC_LOGO_DIR.iterdir():
        if img.suffix.lower() in {".png", ".jpg", ".svg"}:
            key = img.stem.lower()               # e.g. "alfa_romeo"
            pretty = key.replace('_',' ')        # e.g. "alfa romeo"
            team_logo_cache[pretty] = f"/assets/images/tictactoe/{img.name}"
            # También permitimos lookup directo con guiones bajos:
            team_logo_cache[key]    = f"/assets/images/tictactoe/{img.name}"
    print(f"[DEBUG] Encontrados {len(team_logo_cache)} logos en {STATIC_LOGO_DIR}")

# ejecuta el indexado una sola vez
index_logos()


def get_logo_url(tipo: str, value: str) -> str:
    if tipo == "team":
        norm = _normalize_team(value)        # normaliza "AlFa-RoMeO" → "alfa_romeo"
        # comprueba primero la forma normalizada
        if norm in team_logo_cache:
            return team_logo_cache[norm]
        # luego la forma “bonita” con espacios
        pretty = norm.replace('_',' ')
        return team_logo_cache.get(pretty, "/assets/images/tictactoe/default_team.png")
    if tipo == "nationality":
        iso = ISO_MAPPING.get(value.lower())
        return f"https://flagcdn.com/w320/{iso}.png" if iso else ""
    if tipo == "debut":
        return "/assets/images/tictactoe/calendar.png"
    return ""

def load_all_data(min_year=0, max_year=None):
    """Carga de golpe todas las filas que vamos a necesitar."""
    # Condición general para ra.year
    cond = f"ra.year >= {min_year}"
    if max_year is not None:
        cond += f" AND ra.year <= {max_year}"

    # Ahora dos versiones para ra1 y ra2
    cond1 = cond.replace("ra.year", "ra1.year")
    cond2 = cond.replace("ra.year", "ra2.year")

    with SessionLocal() as ses:
        # 1) Todas las filas
        rows = ses.execute(text(f"""
            SELECT d.driverId, d.nationality, ra.year AS year, c.name AS team
              FROM results r
              JOIN races ra   ON r.raceId        = ra.raceId
              JOIN drivers d ON r.driverId     = d.driverId
              JOIN constructors c ON r.constructorId = c.constructorId
             WHERE {cond}
        """)).fetchall()

        # 2) Pares de equipos en el mismo año
        pairs = ses.execute(text(f"""
            SELECT DISTINCT c1.name, c2.name, ra1.year
              FROM results r1
              JOIN constructors c1 ON r1.constructorId = c1.constructorId
              JOIN races      ra1 ON r1.raceId       = ra1.raceId
              JOIN results    r2 ON r1.driverId      = r2.driverId
              JOIN constructors c2 ON r2.constructorId = c2.constructorId
              JOIN races      ra2 ON r2.raceId       = ra2.raceId
             WHERE {cond1}
               AND {cond2}
               AND c1.name <> c2.name
        """)).fetchall()

    return rows, pairs


def build_for_range(args):
    """Genera el cache para un solo rango. Es llamado en paralelo."""
    since, end, target, rows, pairs = args

    # 1) Limpio estructuras
    valores     = defaultdict(set)
    nat_to_deb  = defaultdict(set)
    team_to_nat = defaultdict(set)
    team_to_deb = defaultdict(set)
    nat_to_team = defaultdict(set)
    team_pairs  = set()

    # 2) Filtrar filas por rango y rellenar
    for _, nat, year, team in rows:
        if year < since or (end and year > end):
            continue
        valores['nationality'].add(nat)
        valores['team'].add(team)
        nat_to_team[nat].add(team)
        team_to_nat[team].add(nat)
        # debut year será el mínimo año de aparición
        nat_to_deb[nat].add(year)
        team_to_deb[team].add(year)

    # 3) Filtrar pares
    for t1, t2, year in pairs:
        if year < since or (end and year > end):
            continue
        team_pairs.add((t1, t2))
        team_pairs.add((t2, t1))

    # 4) Generar criteria_list y row_combos
    criteria = []
    for t in valores['team']:
        criteria.append({
          'type':        'team',
          'value':       t,
          'code':        f"team_{t}",
          'description': f"Corrió para {t}",
          'imageUrl':    get_logo_url('team', t)
        })
    for n in valores['nationality']:
        criteria.append({
          'type':        'nationality',
          'value':       n,
          'code':        f"nationality_{n}",
          'description': f"Piloto {n}",
          'imageUrl':    get_logo_url('nationality', n)
        })
    for d in sorted({...}):
        criteria.append({
          'type':        'debut',
          'value':       d,
          'code':        f"debut_{d}",
          'description': f"Debut en {d}",
          'imageUrl':    get_logo_url('debut', d)
        })

    row_combos = []
    teams = [c for c in criteria if c['type']=='team']
    nats  = [c for c in criteria if c['type']=='nationality']
    for t in teams:
        valid_n = [n for n in nats if n['value'] in team_to_nat[t['value']]]
        for a,b in combinations(valid_n,2):
            row_combos.append([t,a,b])

    # 5) Funciones de validez
    def valid_pair(a,b):
        if a['type']=='team'       and b['type']=='nationality': return b['value'] in team_to_nat[a['value']]
        if a['type']=='nationality' and b['type']=='team':        return b['value'] in nat_to_team[a['value']]
        if a['type']=='team'       and b['type']=='debut':       return b['value'] in team_to_deb[a['value']]
        if a['type']=='debut'      and b['type']=='team':        return b['value'] in team_to_deb[a['value']]
        if a['type']=='nationality' and b['type']=='debut':      return b['value'] in nat_to_deb[a['value']]
        if a['type']=='debut'      and b['type']=='nationality': return a['value'] in nat_to_deb[b['value']]
        if a['type']=='team'       and b['type']=='team':        return (a['value'],b['value']) in team_pairs
        if a['type']==b['type'] and a['type'] in ('nationality','debut'): return a['value']==b['value']
        return True

    def valid_combo(r,c):
        for x in r:
            for y in c:
                if not (valid_pair(x,y) and valid_pair(y,x)):
                    return False
        return True

    # 6) Generar columnas y configs
    all_cols = list(combinations(criteria,3))
    configs  = []
    seen     = set()
    import random; random.shuffle(all_cols)

    for row in row_combos:
        if len(configs)>=target: break
        r_codes = {c['code'] for c in row}
        for col in all_cols:
            c_codes = {c['code'] for c in col}
            if r_codes & c_codes: continue
            if not valid_combo(row,col): continue
            key = tuple(sorted(r_codes|c_codes))
            if key in seen: continue
            seen.add(key)
            configs.append({'rowCriteria':row,'columnCriteria':col})
            break

    # 7) Guardar pickle
    suffix = f"{since}_{end or 'plus'}"
    out = PROJECT_ROOT/f"configs_cache_{suffix}.pkl"
    out.write_bytes(pickle.dumps(configs))
    print(f"  → {len(configs)} configs para {suffix}")
    return True

def main():
    # Cargamos TODA la data de una vez (desde 1980 en adelante cubre ambos)
    rows, pairs = load_all_data(min_year=1980, max_year=None)

    # Preparamos argumentos por rango
    jobs = [(s,e,t,rows,pairs) for (s,e,t) in RANGES]

    # Paralelizamos según cores
    with Pool(min(len(jobs), cpu_count())) as pool:
        pool.map(build_for_range, jobs)

    print("✓ Cachés generados en paralelo.")

if __name__=="__main__":
    main()
