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
from sqlalchemy import text


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
    (2000, None, 100),
    (1980, None, 100),
    (1980, 1999, 100),
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
        norm = _normalize_team(value)
        if norm in team_logo_cache:
            return team_logo_cache[norm]
        pretty = norm.replace('_',' ')
        return team_logo_cache.get(pretty, "/assets/images/tictactoe/default_team.png")
    if tipo == "nationality":
        iso = ISO_MAPPING.get(value.lower())
        return f"https://flagcdn.com/w320/{iso}.png" if iso else ""
    if tipo == "debut":
        return "/assets/images/tictactoe/calendar.png"
    if tipo == "min_wins":
        return "/assets/images/tictactoe/trophy_1.png"
    if tipo == "min_podiums":
        return "/assets/images/tictactoe/podium_plain.png"
    if tipo == "circuit_wins":
        return "/assets/images/tictactoe/image_circuit_win.png"
    if tipo == "circuit_podiums":
        return "/assets/images/tictactoe/circuit_podium_image.png"
    if tipo == "teammate":
        return "assets/images/tictactoe/driverTeammate.png"
    return ""

def load_all_data(min_year=0, max_year=None):
    """Carga de golpe todas las filas y estadísticas que vamos a necesitar."""
    # Condición general para ra.year
    cond_year = f"ra.year >= {min_year}" + (f" AND ra.year <= {max_year}" if max_year else "")
    cond_joins = cond_year.replace("ra.year", "ra1.year"), cond_year.replace("ra.year", "ra2.year")

    with SessionLocal() as ses:
        # 1) Todas las filas de resultados
        rows = ses.execute(text(f"""
            SELECT d.driverId, d.nationality, ra.year AS year, c.name AS team
            FROM results r
            JOIN races ra ON r.raceId = ra.raceId
            JOIN drivers d ON r.driverId = d.driverId
            JOIN constructors c ON r.constructorId = c.constructorId
            WHERE {cond_year}
        """
        )).fetchall()

        # Pares de equipos por piloto en el rango (no requiere misma carrera)
        pairs = ses.execute(text(f"""
            SELECT DISTINCT c1.name, c2.name, ra1.year
            FROM results r1
            JOIN constructors c1 ON r1.constructorId = c1.constructorId
            JOIN races ra1 ON r1.raceId = ra1.raceId
            JOIN results r2 ON r1.driverId = r2.driverId
            JOIN constructors c2 ON r2.constructorId = c2.constructorId
            JOIN races ra2 ON r2.raceId = ra2.raceId
            WHERE {cond_joins[0]}
              AND {cond_joins[1]}
              AND c1.name <> c2.name
        """
        )).fetchall()

        # 3) Conteo de wins / podiums por nacionalidad
        win_rows = ses.execute(text(f"""
            SELECT d.nationality, COUNT(*) AS wins
              FROM results r
              JOIN races    ra ON r.raceId    = ra.raceId
              JOIN drivers  d  ON r.driverId  = d.driverId
             WHERE r.positionOrder = 1
               AND ra.year         >= {min_year}
               {f"AND ra.year <= {max_year}" if max_year else ""}
             GROUP BY d.nationality
        """)).fetchall()
        nat_to_wins = {nat: w for nat, w in win_rows}

        podium_rows = ses.execute(text(f"""
            SELECT d.nationality, COUNT(*) AS podiums
              FROM results r
              JOIN races    ra ON r.raceId    = ra.raceId
              JOIN drivers  d  ON r.driverId  = d.driverId
             WHERE r.positionOrder <= 3
               AND ra.year         >= {min_year}
               {f"AND ra.year <= {max_year}" if max_year else ""}
             GROUP BY d.nationality
        """)).fetchall()
        nat_to_podiums = {nat: p for nat, p in podium_rows}

        # 4) Conteo de wins / podiums por nacionalidad y circuito
        win_circ = ses.execute(text(f"""
            SELECT d.nationality, ra.name AS circuit, COUNT(*) AS wins
              FROM results r
              JOIN races    ra ON r.raceId    = ra.raceId
              JOIN drivers  d  ON r.driverId  = d.driverId
             WHERE r.positionOrder = 1
               AND ra.year         >= {min_year}
               {f"AND ra.year <= {max_year}" if max_year else ""}
             GROUP BY d.nationality, ra.name
        """)).fetchall()
        nat_circ_to_wins = {(nat, circ): w for nat, circ, w in win_circ}

        pod_circ = ses.execute(text(f"""
            SELECT d.nationality, ra.name AS circuit, COUNT(*) AS podiums
              FROM results r
              JOIN races    ra ON r.raceId    = ra.raceId
              JOIN drivers  d  ON r.driverId  = d.driverId
             WHERE r.positionOrder <= 3
               AND ra.year         >= {min_year}
               {f"AND ra.year <= {max_year}" if max_year else ""}
             GROUP BY d.nationality, ra.name
        """)).fetchall()
        nat_circ_to_podiums = {(nat, circ): p for nat, circ, p in pod_circ}

        # 5) Lista de circuitos encontrados
        circuits = set(c for _, c, _ in win_circ) | set(c for _, c, _ in pod_circ)

        # 6) Campeones del mundo en el rango (con JOIN a races)
        champs = ses.execute(text(f"""
            SELECT ds.driverId,
                   CONCAT(d.forename, ' ', d.surname) AS name,
                   d.nationality
              FROM driverStandings ds
              JOIN drivers d ON ds.driverId = d.driverId
              JOIN races ra ON ds.raceId = ra.raceId
             WHERE ds.position = 1
               AND ra.year >= {min_year}
               {f"AND ra.year <= {max_year}" if max_year else ""}
        """)).fetchall()


    return rows, pairs, nat_to_wins, nat_to_podiums, nat_circ_to_wins, nat_circ_to_podiums, circuits, champs


def build_for_range(args):
    """Genera el cache para un solo rango. Es llamado en paralelo."""
    from collections import defaultdict
    from itertools import combinations
    import random
    from concurrent.futures import ThreadPoolExecutor

    since, end, target = args

    # ——— 0) cargo **solo** la data de este rango ———
    (rows, pairs,
     nat_to_wins, nat_to_podiums,
     nat_circ_to_wins, nat_circ_to_podiums,
     circuits, champs) = load_all_data(min_year=since, max_year=end)

    # Índices optimizados necesarios para luego filtrar por equipos
    rows_by_team    = defaultdict(list)
    team_to_drivers = defaultdict(set)
    rows_by_nat     = defaultdict(list)

    for driver_id, nat, year, team in rows:
        rows_by_team[team].append((driver_id, nat, year, team))
        team_to_drivers[team].add(driver_id)
        rows_by_nat[nat].append((driver_id, nat, year, team))


  # ———> Aquí insertas tu nuevo bloque:
    # ——— wins totales y podiums totales por piloto ———
    sess = SessionLocal()
    try:
        sql_dw = text(f"""
            SELECT r.driverId, COUNT(*) AS wins
              FROM results r
              JOIN races ra ON r.raceId = ra.raceId
             WHERE r.positionOrder = 1
               AND ra.year >= :since
               { "AND ra.year <= :end" if end else "" }
             GROUP BY r.driverId
        """)
        params = {"since": since}
        if end: params["end"] = end
        driver_to_wins = {drv: w for drv, w in sess.execute(sql_dw, params).fetchall()}

        sql_dp = text(f"""
            SELECT r.driverId, COUNT(*) AS podiums
              FROM results r
              JOIN races ra ON r.raceId = ra.raceId
             WHERE r.positionOrder <= 3
               AND ra.year >= :since
               { "AND ra.year <= :end" if end else "" }
             GROUP BY r.driverId
        """)
        driver_to_pods = {drv: p for drv, p in sess.execute(sql_dp, params).fetchall()}

    finally:
        sess.close()

    # ——— validaciones equipo vs umbral victorias/podios ———
    valid_team_min_wins = set()
    valid_team_min_podiums = set()
    for team, drivers in team_to_drivers.items():
        for wins_threshold in (1, 2, 3):
            if any(driver_to_wins.get(drv, 0) >= wins_threshold for drv in drivers):
                valid_team_min_wins.add((team, wins_threshold))
        for pods_threshold in (3, 5, 7):
            if any(driver_to_pods.get(drv, 0) >= pods_threshold for drv in drivers):
                valid_team_min_podiums.add((team, pods_threshold))

    # ——— bloque nuevo ———
    sess = SessionLocal()
    try:
        # wins por piloto y circuito
        sql_w = text(f"""
            SELECT r.driverId, ra.name AS circuit, COUNT(*) AS wins
              FROM results r
              JOIN races ra ON r.raceId = ra.raceId
             WHERE r.positionOrder = 1
               AND ra.year >= :since
               { "AND ra.year <= :end" if end else "" }
             GROUP BY r.driverId, ra.name
        """)
        params = {"since": since}
        if end:
            params["end"] = end

        driver_win_circ = {
            (drv, circ): w
            for drv, circ, w in sess.execute(sql_w, params).fetchall()
        }

        # podiums por piloto y circuito
        sql_p = text(f"""
            SELECT r.driverId, ra.name AS circuit, COUNT(*) AS podiums
              FROM results r
              JOIN races ra ON r.raceId = ra.raceId
             WHERE r.positionOrder <= 3
               AND ra.year >= :since
               { "AND ra.year <= :end" if end else "" }
             GROUP BY r.driverId, ra.name
        """)
        driver_pod_circ = {
            (drv, circ): p
            for drv, circ, p in sess.execute(sql_p, params).fetchall()
        }

    finally:
        sess.close()
    # ——— fin bloque nuevo ———

    circuit_win_drivers = defaultdict(set)
    circuit_podium_drivers = defaultdict(set)
    for (drv, circ), w in driver_win_circ.items():
        if w >= 1:
            circuit_win_drivers[circ].add(drv)
    for (drv, circ), p in driver_pod_circ.items():
        if p >= 1:
            circuit_podium_drivers[circ].add(drv)

    # … resto del build_for_range …


    valid_team_circuit_win = set()
    valid_team_circuit_podium = set()
    for team, drivers in team_to_drivers.items():
        for circ, winners in circuit_win_drivers.items():
            if drivers & winners:
                valid_team_circuit_win.add((team, circ))
        for circ, podiers in circuit_podium_drivers.items():
            if drivers & podiers:
                valid_team_circuit_podium.add((team, circ))

    # ——— 1) resto del código igual que antes, usando las estructuras ya filtradas ———
    valores     = defaultdict(set)
    nat_to_deb  = defaultdict(set)
    team_to_nat = defaultdict(set)
    team_to_deb = defaultdict(set)
    nat_to_team = defaultdict(set)
    team_pairs  = set()

    for _, nat, year, team in rows:
        valores['nationality'].add(nat)
        valores['team'].add(team)
        nat_to_team[nat].add(team)
        team_to_nat[team].add(nat)
        nat_to_deb[nat].add(year)
        team_to_deb[team].add(year)

    for t1, t2, year in pairs:
        team_pairs.add((t1, t2))
        team_pairs.add((t2, t1))

    # 4) Generar criteria_list y row_combos
    criteria = []
    for t in valores['team']:
        criteria.append({
          'type': 'team', 'value': t,
          'code': f"team_{t}", 'description': f"Corrió para {t}",
          'imageUrl': get_logo_url('team', t)
        })
    for n in valores['nationality']:
        criteria.append({
          'type': 'nationality', 'value': n,
          'code': f"nationality_{n}", 'description': f"Piloto {n}",
          'imageUrl': get_logo_url('nationality', n)
        })
    for d in sorted({yr for yrs in nat_to_deb.values() for yr in yrs}):
        criteria.append({
          'type': 'debut', 'value': d,
          'code': f"debut_{d}", 'description': f"Debut en {d}",
          'imageUrl': get_logo_url('debut', d)
        })
    for wins in [1, 2, 3]:
        criteria.append({
            'type': 'min_wins', 'value': wins,
            'code': f"min_{wins}_wins", 'description': f"Piloto con al menos {wins} victorias",
            'imageUrl': get_logo_url('min_wins', None)
        })
    for pods in [3, 5, 7]:
        criteria.append({
            'type': 'min_podiums', 'value': pods,
            'code': f"min_{pods}_podiums", 'description': f"Piloto con al menos {pods} podios",
            'imageUrl': get_logo_url('min_podiums', None)
        })
    for circ in sorted(circuits):
        slug = _normalize_team(circ)
        criteria.append({
            'type': 'circuit_wins', 'value': 1, 'circuit': circ,
            'code': f"circuit_wins_{slug}", 'description': f"Piloto con al menos 1 victoria en {circ}",
            'imageUrl': get_logo_url('circuit_wins', None)
        })
    for circ in sorted(circuits):
        slug = _normalize_team(circ)
        criteria.append({
            'type': 'circuit_podiums', 'value': 1, 'circuit': circ,
            'code': f"circuit_podiums_{slug}", 'description': f"Piloto con al menos 1 podio en {circ}",
            'imageUrl': get_logo_url('circuit_podiums', None)
        })

    unique_champs = {}
    for c_id, c_name, c_nat in champs:
        if c_id not in unique_champs:
            unique_champs[c_id] = (c_name, c_nat)

    champ_to_teams = { name: set() for _, (name, _) in unique_champs.items() }
    for drv_id, _, _, team in rows:
        if drv_id in unique_champs:
            name, _ = unique_champs[drv_id]
            champ_to_teams[name].add(team)

    for drv_id, (c_name, c_nat) in unique_champs.items():
        slug = _normalize_team(c_name)
        criteria.append({
            'type': 'teammate', 'value': c_name, 'code': f"teammate_{slug}",
            'description': f"Compañero de equipo de {c_name}",
            'imageUrl': "", 'driverId': drv_id, 'nationality': c_nat
        })

    row_combos = []
    teams = [c for c in criteria if c['type'] == 'team']
    nats = [c for c in criteria if c['type'] == 'nationality']
    for t in teams:
        valid_n = [n for n in nats if n['value'] in team_to_nat[t['value']]]
        for a, b in combinations(valid_n, 2):
            row_combos.append([t, a, b])

    def valid_pair(a, b):
        if a['type'] == 'team' and b['type'] == 'circuit_wins':
            return (a['value'], b['circuit']) in valid_team_circuit_win
        if a['type'] == 'circuit_wins' and b['type'] == 'team':
            return (b['value'], a['circuit']) in valid_team_circuit_win
        if a['type'] == 'team' and b['type'] == 'circuit_podiums':
            return (a['value'], b['circuit']) in valid_team_circuit_podium
        if a['type'] == 'circuit_podiums' and b['type'] == 'team':
            return (b['value'], a['circuit']) in valid_team_circuit_podium

        if a['type'] == 'team' and b['type'] == 'nationality':
            return b['value'] in team_to_nat[a['value']]
        if a['type'] == 'nationality' and b['type'] == 'team':
            return b['value'] in nat_to_team[a['value']]
        if a['type'] == 'team' and b['type'] == 'debut':
            return b['value'] in team_to_deb[a['value']]
        if a['type'] == 'debut' and b['type'] == 'team':
            return b['value'] in team_to_deb[a['value']]
        if a['type'] == 'nationality' and b['type'] == 'debut':
            return b['value'] in nat_to_deb[a['value']]
        if a['type'] == 'debut' and b['type'] == 'nationality':
            return a['value'] in nat_to_deb[b['value']]
        if a['type'] == 'team' and b['type'] == 'team':
            return (a['value'], b['value']) in team_pairs
        if a['type'] == b['type'] and a['type'] in ('nationality', 'debut'):
            return a['value'] == b['value']
        if a['type'] == 'nationality' and b['type'] == 'min_wins':
            return nat_to_wins.get(a['value'], 0) >= b['value']
        if a['type'] == 'min_wins' and b['type'] == 'nationality':
            return nat_to_wins.get(b['value'], 0) >= a['value']
        if a['type'] == 'nationality' and b['type'] == 'min_podiums':
            return nat_to_podiums.get(a['value'], 0) >= b['value']
        if a['type'] == 'min_podiums' and b['type'] == 'nationality':
            return nat_to_podiums.get(b['value'], 0) >= a['value']
        if a['type'] == 'nationality' and b['type'] == 'circuit_wins':
            return nat_circ_to_wins.get((a['value'], b['circuit']), 0) >= b['value']
        if a['type'] == 'circuit_wins' and b['type'] == 'nationality':
            return nat_circ_to_wins.get((b['value'], a['circuit']), 0) >= a['value']
        if a['type'] == 'nationality' and b['type'] == 'circuit_podiums':
            return nat_circ_to_podiums.get((a['value'], b['circuit']), 0) >= b['value']
        if a['type'] == 'circuit_podiums' and b['type'] == 'nationality':
            return nat_circ_to_podiums.get((b['value'], a['circuit']), 0) >= a['value']
        if a['type'] == 'teammate' and b['type'] == 'nationality':
            return a['nationality'] == b['value']
        if a['type'] == 'nationality' and b['type'] == 'teammate':
            return b['nationality'] == a['value']
        if a['type'] == 'teammate' and b['type'] == 'team':
            return b['value'] in champ_to_teams[a['value']]
        if a['type'] == 'team' and b['type'] == 'teammate':
            return a['value'] in champ_to_teams[b['value']]
        # Equipo vs mín. victorias
        if a['type']=='team' and b['type']=='min_wins':
            return (a['value'], b['value']) in valid_team_min_wins
        if a['type']=='min_wins' and b['type']=='team':
            return (b['value'], a['value']) in valid_team_min_wins

        # Equipo vs mín. podios
        if a['type']=='team' and b['type']=='min_podiums':
            return (a['value'], b['value']) in valid_team_min_podiums
        if a['type']=='min_podiums' and b['type']=='team':
            return (b['value'], a['value']) in valid_team_min_podiums

        return True

    def valid_combo(r, c):
        for x in r:
            for y in c:
                if not (valid_pair(x, y) and valid_pair(y, x)):
                    return False
        return True

    def internal_valid(group):
        # Comprueba compatibilidad interna dentro de un mismo grupo
        for a, b in combinations(group, 2):
            if not (valid_pair(a, b) and valid_pair(b, a)):
                return False
        return True

    all_cols = list(combinations(criteria, 3))
    configs = []
    seen = set()
    random.shuffle(all_cols)

    def generate_configs_for_row(row):
        r_codes = {c['code'] for c in row}
        local_configs = []
        for col in all_cols:
            c_codes = {c['code'] for c in col}
            # No mezclar criterios repetidos
            if r_codes & c_codes:
                continue
            # Filtrar incompatibilidades row vs column
            if not valid_combo(row, col):
                continue
            # Filtrar incompatibilidades internas en column
            if not internal_valid(col):
                continue
            # Evitar duplicados
            key = tuple(sorted(r_codes | c_codes))
            if key in seen:
                continue
            seen.add(key)
            local_configs.append({'rowCriteria': row, 'columnCriteria': col})
            break
        return local_configs

    with ThreadPoolExecutor(max_workers=cpu_count()) as executor:
        for row_configs in executor.map(generate_configs_for_row, row_combos):
            if len(configs) >= target:
                break
            configs.extend(row_configs)
            if len(configs) % 50 == 0:
                print(f"  → Progreso: {len(configs)} configuraciones generadas...")

    suffix = f"{since}_{end or 'plus'}"
    out = PROJECT_ROOT / f"configs_cache_{suffix}.pkl"
    out.write_bytes(pickle.dumps(configs))
    print(f"  → {len(configs)} configs para {suffix}")
    return True


def main():
    # Sólo pasamos (since, end, target) por trabajo
    jobs = [(s, e, t) for (s, e, t) in RANGES]
    with Pool(min(len(jobs), cpu_count())) as pool:
        pool.map(build_for_range, jobs)
    print("✓ Cachés generados en paralelo.")

if __name__=="__main__":
    main()
