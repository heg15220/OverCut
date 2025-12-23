#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Generador de cachés de configuraciones para TikiTaka (OverCut).

✅ Incluye:
- Caché NORMAL: configs_cache_{since}_{end|plus}.pkl
- Caché TEAMS-ONLY: configs_cache_{since}_{end|plus}_teamsOnly.pkl

✅ Cambios recientes (marcados como [NEW]/[CHANGED]):
- Flag CLI: --teams-only
  -> Si se activa, SOLO se regenera el caché TEAMS-ONLY (omite el NORMAL).
- Regla dura: NO permitir nationality en ambos ejes (filas y columnas) en ninguna partida.
  -> Puede haber nationality en filas O en columnas, pero no en ambas.

Uso:
  python3 generate_tikitaka_configs.py
  python3 generate_tikitaka_configs.py --teams-only
"""

import argparse  # [NEW]
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
OVERCUT_ROOT    = Path(__file__).resolve().parents[4]
STATIC_LOGO_DIR = OVERCUT_ROOT / "frontend" / "src" / "assets" / "images" / "tictactoe"

DB_URL          = 'mysql+pymysql://root:root@localhost/f1db'
engine          = create_engine(DB_URL, pool_size=25, max_overflow=20, future=True)
SessionLocal    = sessionmaker(bind=engine)

# RANGOS y objetivo de configuraciones
RANGES = [
    (2000, None, 600),
    (1980, None, 600),
    (1980, 1999, 600),
]

ISO_MAPPING = {
    "british": "gb", "german": "de", "italian": "it", "french": "fr", "spanish": "es", "dutch": "nl",
    "finnish": "fi", "brazilian": "br", "argentinean": "ar", "argentine": "ar", "mexican": "mx", "canadian": "ca",
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
    s = normalize('NFKD', name).encode('ascii', 'ignore').decode()
    s = s.lower().replace('-', ' ').replace('/', ' ')
    return '_'.join(s.split())

def index_logos():
    if not STATIC_LOGO_DIR.is_dir():
        print(f"[WARN] STATIC_LOGO_DIR «{STATIC_LOGO_DIR}» no existe")
        return
    for img in STATIC_LOGO_DIR.iterdir():
        if img.suffix.lower() in {".png", ".jpg", ".svg"}:
            key = img.stem.lower()
            pretty = key.replace('_', ' ')
            team_logo_cache[pretty] = f"/assets/images/tictactoe/{img.name}"
            team_logo_cache[key]    = f"/assets/images/tictactoe/{img.name}"
    print(f"[DEBUG] Encontrados {len(team_logo_cache)} logos en {STATIC_LOGO_DIR}")

index_logos()

def get_logo_url(tipo: str, value: str) -> str:
    if tipo == "team":
        norm = _normalize_team(value)
        if norm in team_logo_cache:
            return team_logo_cache[norm]
        pretty = norm.replace('_', ' ')
        return team_logo_cache.get(pretty, "/assets/images/tictactactoe/default_team.png") \
            if False else team_logo_cache.get(pretty, "/assets/images/tictactoe/default_team.png")

    if tipo == "nationality":
        iso = ISO_MAPPING.get(value.lower()) if value else None
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
    cond_year = f"ra.year >= {min_year}" + (f" AND ra.year <= {max_year}" if max_year else "")
    cond_joins = cond_year.replace("ra.year", "ra1.year"), cond_year.replace("ra.year", "ra2.year")

    with SessionLocal() as ses:
        rows = ses.execute(text(f"""
            SELECT d.driverId, d.nationality, ra.year AS year, c.name AS team
            FROM results r
            JOIN races ra ON r.raceId = ra.raceId
            JOIN drivers d ON r.driverId = d.driverId
            JOIN constructors c ON r.constructorId = c.constructorId
            WHERE {cond_year}
        """)).fetchall()

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
        """)).fetchall()

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

        circuits = set(c for _, c, _ in win_circ) | set(c for _, c, _ in pod_circ)

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
    from concurrent.futures import ThreadPoolExecutor
    import random

    # ==========================================================
    # [CHANGED] args puede traer teams_only al final
    # ==========================================================
    if len(args) == 3:
        since, end, target = args
        teams_only = False
    else:
        since, end, target, teams_only = args
    # ==========================================================

    (rows, pairs,
     nat_to_wins, nat_to_podiums,
     nat_circ_to_wins, nat_circ_to_podiums,
     circuits, champs) = load_all_data(min_year=since, max_year=end)

    rows_by_team    = defaultdict(list)
    team_to_drivers = defaultdict(set)
    rows_by_nat     = defaultdict(list)

    for driver_id, nat, year, team in rows:
        rows_by_team[team].append((driver_id, nat, year, team))
        team_to_drivers[team].add(driver_id)
        rows_by_nat[nat].append((driver_id, nat, year, team))

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
        if end:
            params["end"] = end
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

    valid_team_min_wins = set()
    valid_team_min_podiums = set()
    for team, drivers in team_to_drivers.items():
        for wins_threshold in (1, 2, 3):
            if any(driver_to_wins.get(drv, 0) >= wins_threshold for drv in drivers):
                valid_team_min_wins.add((team, wins_threshold))
        for pods_threshold in (3, 5, 7):
            if any(driver_to_pods.get(drv, 0) >= pods_threshold for drv in drivers):
                valid_team_min_podiums.add((team, pods_threshold))

    sess = SessionLocal()
    try:
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

    circuit_win_drivers = defaultdict(set)
    circuit_podium_drivers = defaultdict(set)
    for (drv, circ), w in driver_win_circ.items():
        if w >= 1:
            circuit_win_drivers[circ].add(drv)
    for (drv, circ), p in driver_pod_circ.items():
        if p >= 1:
            circuit_podium_drivers[circ].add(drv)

    valid_team_circuit_win = set()
    valid_team_circuit_podium = set()
    for team, drivers in team_to_drivers.items():
        for circ, winners in circuit_win_drivers.items():
            if drivers & winners:
                valid_team_circuit_win.add((team, circ))
        for circ, podiers in circuit_podium_drivers.items():
            if drivers & podiers:
                valid_team_circuit_podium.add((team, circ))

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

    # ==========================================================
    # [NEW] Helper: regla “nationality solo en un eje”
    # ==========================================================
    def has_type(group, tipo: str) -> bool:
        return any(c.get("type") == tipo for c in group)

    def violates_nationality_axis_rule(row_group, col_group) -> bool:
        """
        Regla:
        - Puede haber 'nationality' en filas O en columnas, pero NO en ambas.
        """
        return has_type(row_group, "nationality") and has_type(col_group, "nationality")
    # ==========================================================

    # 4) Generar criteria_list
    criteria = []

    for t in valores['team']:
        criteria.append({
            'type': 'team', 'value': t,
            'code': f"team_{t}", 'description': f"{t}",
            'imageUrl': get_logo_url('team', t)
        })

    for n in valores['nationality']:
        criteria.append({
            'type': 'nationality', 'value': n,
            'code': f"nationality_{n}", 'description': f"",
            'imageUrl': get_logo_url('nationality', n)
        })

    for d in sorted({yr for yrs in nat_to_deb.values() for yr in yrs}):
        criteria.append({
            'type': 'debut', 'value': d,
            'code': f"debut_{d}", 'description': f"Debut in {d}",
            'imageUrl': get_logo_url('debut', d)
        })

    for wins in [1, 2, 3]:
        criteria.append({
            'type': 'min_wins', 'value': wins,
            'code': f"min_{wins}_wins", 'description': f"Driver with at least {wins} wins",
            'imageUrl': get_logo_url('min_wins', None)
        })

    for pods in [3, 5, 7]:
        criteria.append({
            'type': 'min_podiums', 'value': pods,
            'code': f"min_{pods}_podiums", 'description': f"Driver with at least {pods} podiums",
            'imageUrl': get_logo_url('min_podiums', None)
        })

    for circ in sorted(circuits):
        slug = _normalize_team(circ)
        criteria.append({
            'type': 'circuit_wins', 'value': 1, 'circuit': circ,
            'code': f"circuit_wins_{slug}", 'description': f"Driver with at least 1 win at {circ}",
            'imageUrl': get_logo_url('circuit_wins', None)
        })

    for circ in sorted(circuits):
        slug = _normalize_team(circ)
        criteria.append({
            'type': 'circuit_podiums', 'value': 1, 'circuit': circ,
            'code': f"circuit_podiums_{slug}", 'description': f"Driver with at least 1 podium at {circ}",
            'imageUrl': get_logo_url('circuit_podiums', None)
        })

    unique_champs = {}
    for c_id, c_name, c_nat in champs:
        if c_id not in unique_champs:
            unique_champs[c_id] = (c_name, c_nat)

    champ_to_teams = {name: set() for _, (name, _) in unique_champs.items()}
    for drv_id, _, _, team in rows:
        if drv_id in unique_champs:
            name, _ = unique_champs[drv_id]
            champ_to_teams[name].add(team)

    for drv_id, (c_name, c_nat) in unique_champs.items():
        slug = _normalize_team(c_name)
        criteria.append({
            'type': 'teammate', 'value': c_name, 'code': f"teammate_{slug}",
            'description': f"Teammate of {c_name}",
            'imageUrl': "", 'driverId': drv_id, 'nationality': c_nat
        })

    # --- combos para filas (NORMAL): 1 team + 2 nats válidas ---
    row_combos = []
    teams = [c for c in criteria if c['type'] == 'team']
    nats  = [c for c in criteria if c['type'] == 'nationality']
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
        if a['type'] == 'team' and b['type'] == 'min_wins':
            return (a['value'], b['value']) in valid_team_min_wins
        if a['type'] == 'min_wins' and b['type'] == 'team':
            return (b['value'], a['value']) in valid_team_min_wins
        if a['type'] == 'team' and b['type'] == 'min_podiums':
            return (a['value'], b['value']) in valid_team_min_podiums
        if a['type'] == 'min_podiums' and b['type'] == 'team':
            return (b['value'], a['value']) in valid_team_min_podiums
        return True

    def internal_valid(group):
        for a, b in combinations(group, 2):
            if not (valid_pair(a, b) and valid_pair(b, a)):
                return False
        return True

    def valid_combo(r, c):
        # ==========================================================
        # [NEW] Regla dura: NO permitir nationality en ambos ejes
        # ==========================================================
        if violates_nationality_axis_rule(r, c):
            return False
        # ==========================================================

        for x in r:
            for y in c:
                if not (valid_pair(x, y) and valid_pair(y, x)):
                    return False
        return True

    suffix = f"{since}_{end or 'plus'}"

    # ==========================================================
    # [CHANGED] NORMAL: se omite si --teams-only
    # ==========================================================
    if not teams_only:
        all_cols = list(combinations(criteria, 3))
        configs = []
        seen = set()
        random.shuffle(all_cols)

        def generate_configs_for_row(row):
            r_codes = {c['code'] for c in row}
            local_configs = []
            for col in all_cols:
                # [NEW] atajo: evita nationality en ambos ejes
                if violates_nationality_axis_rule(row, col):
                    continue

                c_codes = {c['code'] for c in col}
                if r_codes & c_codes:
                    continue
                if not valid_combo(row, col):
                    continue
                if not internal_valid(col):
                    continue
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

        out = PROJECT_ROOT / f"configs_cache_{suffix}.pkl"
        out.write_bytes(pickle.dumps(configs))
        print(f"  → {len(configs)} configs NORMAL para {suffix}")
    else:
        print(f"  → (SKIP) NORMAL para {suffix} (teams_only=True)")
    # ==========================================================

    # ==========================================================
    # TEAMS-ONLY: generar caché solo con team/nationality
    # ==========================================================

    criteria_restricted = [c for c in criteria if c["type"] in ("team", "nationality")]
    all_triples = list(combinations(criteria_restricted, 3))
    random.shuffle(all_triples)

    def valid_pair_restricted(a, b):
        if a["type"] == "team" and b["type"] == "nationality":
            return b["value"] in team_to_nat[a["value"]]
        if a["type"] == "nationality" and b["type"] == "team":
            return b["value"] in nat_to_team[a["value"]]
        if a["type"] == "team" and b["type"] == "team":
            return (a["value"], b["value"]) in team_pairs
        if a["type"] == "nationality" and b["type"] == "nationality":
            return True
        return False

    def internal_valid_restricted(group):
        for a, b in combinations(group, 2):
            if not (valid_pair_restricted(a, b) and valid_pair_restricted(b, a)):
                return False
        return True

    # Filtramos tríos con al menos 1 team para evitar tableros “solo banderas”
    row_triples = [
        t for t in all_triples
        if any(x["type"] == "team" for x in t) and internal_valid_restricted(t)
    ]
    col_triples = [
        t for t in all_triples
        if any(x["type"] == "team" for x in t) and internal_valid_restricted(t)
    ]
    random.shuffle(col_triples)

    configs_teams_only = []
    seen2 = set()

    for row in row_triples:
        if len(configs_teams_only) >= target:
            break

        r_codes = {c["code"] for c in row}

        for col in col_triples:
            # ==========================================================
            # [NEW] Regla dura también en TEAMS-ONLY:
            #      nationality en filas XOR columns (no ambas)
            # ==========================================================
            if violates_nationality_axis_rule(row, col):
                continue
            # ==========================================================

            c_codes = {c["code"] for c in col}
            if r_codes & c_codes:
                continue

            ok = True
            for x in row:
                for y in col:
                    if not (valid_pair_restricted(x, y) and valid_pair_restricted(y, x)):
                        ok = False
                        break
                if not ok:
                    break

            if not ok:
                continue

            key = tuple(sorted(r_codes | c_codes))
            if key in seen2:
                continue
            seen2.add(key)

            configs_teams_only.append({
                "rowCriteria": list(row),
                "columnCriteria": list(col)
            })
            break

    out2 = PROJECT_ROOT / f"configs_cache_{suffix}_teamsOnly.pkl"
    out2.write_bytes(pickle.dumps(configs_teams_only))
    print(f"  → {len(configs_teams_only)} configs TEAMS-ONLY para {suffix}")

    return True


def main():
    # ==========================================================
    # [NEW] CLI flag --teams-only
    # ==========================================================
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--teams-only",
        action="store_true",
        help="Genera SOLO configs_cache_*_teamsOnly.pkl (omite NORMAL)"
    )
    args = parser.parse_args()
    # ==========================================================

    # [CHANGED] metemos el flag en cada job
    jobs = [(s, e, t, args.teams_only) for (s, e, t) in RANGES]

    with Pool(min(len(jobs), cpu_count())) as pool:
        pool.map(build_for_range, jobs)

    if args.teams_only:
        print("✓ Cachés TEAMS-ONLY generados en paralelo.")
    else:
        print("✓ Cachés generados en paralelo (NORMAL + TEAMS-ONLY).")


if __name__ == "__main__":
    main()
