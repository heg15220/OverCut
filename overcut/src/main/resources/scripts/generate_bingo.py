# generate_bingo.py
# -*- coding: utf-8 -*-

import random
from sqlalchemy import text

# ✅ Reutiliza engine común (como haces en otros scripts)
from generate_order_drivers import engine

# ✅ Reutiliza cachés + helpers del generador de DriversConnections
from generate_drivers_connections import (
    TEAM_CACHE,
    COUNTRY_CACHE,
    CIRCUIT_CACHE,
    TEAMMATE_DRIVER_CACHE,
    translations,
    NATIONALITY_TRANSLATIONS,
    translate,
    translate_team,
    translate_country,
    get_champions_category,
    get_race_winner_category,
    get_experienced_category,
    get_decade_categories,
)


DRIVER_POOL = []

def load_driver_pool():
    """
    Pool de pilotos para rellenos (evita ORDER BY RAND()).
    """
    global DRIVER_POOL
    with engine.connect() as conn:
        rows = conn.execute(text("""
            SELECT d.driverId, CONCAT(d.forename,' ', d.surname)
            FROM drivers d
            WHERE d.driverId IS NOT NULL
        """)).fetchall()

    DRIVER_POOL = [{"driverId": r[0], "driverName": r[1]} for r in rows]
    random.shuffle(DRIVER_POOL)
    print("[startup] Bingo DRIVER_POOL:", len(DRIVER_POOL))


# ----------------------------
# Helpers
# ----------------------------

def normalize_code(s: str) -> str:
    return s.lower().replace(" ", "_").replace("-", "_")

def get_all_drivers_matching_query(conn, query, params):
    rows = conn.execute(text(query), params or {}).fetchall()
    return [{"driverId": row[0], "driverName": row[1]} for row in rows]

# ----------------------------
# Image mapping (tictactoe assets)
# ----------------------------

# ✅ filenames EXACTOS según tu carpeta:
TEAM_IMAGE_MAP = {
    # Modern / common
    "Ferrari": "Ferrari.svg",
    "McLaren": "McLaren.png",
    "Williams": "Williams.png",
    "Mercedes": "Mercedes.svg",
    "Red Bull": "Red_Bull.svg",
    "Renault": "Renault.png",
    "Alfa Romeo": "Alfa_Romeo.png",
    "AlphaTauri": "AlphaTauri.svg",
    "Toro Rosso": "Toro_Rosso.svg",
    "Haas": "Haas_F1_Team.png",
    "Aston Martin": "Aston_Martin.png",
    "Alpine F1 Team": "Alpine_F1_Team.svg",
    "Racing Point": "Racing_Point.svg",
    "Force India": "Force_India.png",
    "Sauber": "Sauber.png",
    "BMW Sauber": "BMW_Sauber.png",
    "Toyota": "Toyota.svg",
    "Honda": "Honda.svg",
    "Jaguar": "Jaguar.svg",
    "Jordan": "Jordan.png",
    "Benetton": "Benetton.svg",
    "Brawn": "Brawn.svg",
    "BAR": "BAR.png",

    # Older/historic constructors you listed
    "Arrows": "Arrows.png",
    "ATS": "ATS.svg",
    "Andrea Moda": "Andrea_Moda.png",
    "Coloni": "Coloni.svg",
    "Dallara": "Dallara.svg",
    "Ensign": "Ensign.jpg",
    "Fondmetal": "Fondmetal.png",
    "Footwork": "Footwork.png",
    "HRT": "HRT.svg",
    "Leyton House": "Leyton_House.png",
    "Life": "Life.png",
    "Lola": "Lola.png",
    "Lotus": "Lotus.jpg",          # o "Lotus_F1.jpg" si prefieres
    "Manor Marussia": "Manor_Marussia.png",
    "Minardi": "Minardi.svg",
    "Osella": "Osella.svg",
    "Pacific": "Pacific.svg",
    "Prost": "Prost.png",
    "Rial": "Rial.svg",
    "Simtek": "Simtek.png",
    "Spyker": "Spyker.jpg",
    "Stewart": "Stewart.png",
    "Super Aguri": "Super_Aguri.svg",
    "Virgin": "Virgin.svg",
    "MF1": "MF1.svg",
    "Lambo": "Lambo.png",
    "AGS": "AGS.png",
    "Tyrrell": "Tyrrell.png",
}

# Algunos nombres en BD pueden variar un pelín -> alias
TEAM_IMAGE_ALIASES = {
    "BMW-Sauber": "BMW Sauber",
    "Alpine": "Alpine F1 Team",
    "Haas F1 Team": "Haas",
    "Alfa Romeo Racing": "Alfa Romeo",
    "RB": "AlphaTauri",
}

def team_image(team_name: str):
    if not team_name:
        return None
    canonical = TEAM_IMAGE_ALIASES.get(team_name, team_name)
    return TEAM_IMAGE_MAP.get(canonical)

# ----------------------------
# Category builders for Bingo
# ----------------------------

def build_team_cell(conn, used_codes: set, used_team_names: set, lang: str):
    teams = list(TEAM_CACHE)
    random.shuffle(teams)

    for constructor_id, team_name in teams:
        code = f"team_{normalize_code(team_name)}"
        if code in used_codes or team_name in used_team_names:
            continue

        used_codes.add(code)
        used_team_names.add(team_name)

        return {
            "code": code,
            "description": translate_team(lang, team_name),
            "image": team_image(team_name),
            "query": """
                SELECT DISTINCT d.driverId, CONCAT(d.forename, ' ', d.surname)
                FROM drivers d
                JOIN results r ON d.driverId = r.driverId
                WHERE r.constructorId = :constructorId
            """,
            "params": {"constructorId": constructor_id}
        }

    return None


def build_country_cell(conn, used_codes: set, used_countries: set, lang: str):
    countries = list(COUNTRY_CACHE)
    random.shuffle(countries)

    for nationality in countries:
        code = f"country_{normalize_code(nationality)}"
        if code in used_codes or nationality in used_countries:
            continue

        used_codes.add(code)
        used_countries.add(nationality)

        nat_trans = NATIONALITY_TRANSLATIONS.get(nationality, {"es": nationality, "en": nationality})[lang]

        return {
            "code": code,
            "description": translate_country(lang, nat_trans),
            "image": None,

            # ✅ NUEVO
            "meta": {"nationality": nationality},

            "query": """
                SELECT d.driverId, CONCAT(d.forename, ' ', d.surname)
                FROM drivers d
                WHERE d.nationality = :nationality
            """,
            "params": {"nationality": nationality}
        }

    return None



def build_circuit_cell(conn, used_codes: set, used_circuits: set, lang: str):
    circuits = list(CIRCUIT_CACHE)
    random.shuffle(circuits)

    for circuit_ref in circuits:
        code = f"circuit_{normalize_code(circuit_ref)}"
        if code in used_codes or circuit_ref in used_circuits:
            continue

        used_codes.add(code)
        used_circuits.add(circuit_ref)

        description = (
            f"Pilotos que han ganado en {circuit_ref}"
            if lang == "es" else
            f"Drivers who won at {circuit_ref}"
        )

        return {
            "code": code,
            "description": description,
            "image": None,
            "query": """
                SELECT DISTINCT d.driverId, CONCAT(d.forename, ' ', d.surname)
                FROM drivers d
                JOIN results r ON d.driverId = r.driverId
                JOIN races ra ON r.raceId = ra.raceId
                JOIN circuits ci ON ra.circuitId = ci.circuitId
                WHERE r.positionOrder = 1
                  AND ci.circuitRef = :circuitRef
            """,
            "params": {"circuitRef": circuit_ref}
        }

    return None


def build_teammates_cell(conn, used_codes: set, lang: str):
    candidates = list(TEAMMATE_DRIVER_CACHE)
    random.shuffle(candidates)

    for driver_id, full_name in candidates[:30]:
        code = f"teammates_{driver_id}"
        if code in used_codes:
            continue
        used_codes.add(code)

        description = (
            f"Compañeros de equipo de {full_name}"
            if lang == "es" else
            f"Teammates of {full_name}"
        )

        return {
            "code": code,
            "description": description,
            "image": "driverTeammate.png",
            "query": """
                SELECT DISTINCT d2.driverId, CONCAT(d2.forename, ' ', d2.surname)
                FROM results r1
                JOIN results r2
                  ON r1.raceId = r2.raceId
                 AND r1.constructorId = r2.constructorId
                JOIN drivers d2 ON r2.driverId = d2.driverId
                WHERE r1.driverId = :driverId
                  AND r2.driverId != :driverId
            """,
            "params": {"driverId": driver_id}
        }

    return None


# ----------------------------
# Required methods
# ----------------------------

def build_9_bingo_cells(lang: str, conn):
    """
    Devuelve una lista de dicts:
      [{code, description, image?, query, params?}, ...]  (idealmente 9 items)
    """
    used_codes = set()
    used_team_names = set()
    used_countries = set()
    used_circuits = set()

    cells = []

    # ✅ 3 core (estables y con muchos pilotos)
    core = [
        get_champions_category(lang),
        get_race_winner_category(lang),
        get_experienced_category(lang),
    ]
    for c in core:
        if c["code"] not in used_codes:
            used_codes.add(c["code"])
            cells.append({**c, "image": "champions" if c["code"] == "champions" else None})

    # ✅ 2 décadas (random)
    decades = get_decade_categories(lang)
    random.shuffle(decades)
    for dec in decades[:2]:
        if dec["code"] not in used_codes:
            used_codes.add(dec["code"])
            cells.append({**dec, "image": None})

    # ✅ 2 teams
    for _ in range(2):
        t = build_team_cell(conn, used_codes, used_team_names, lang)
        if t:
            cells.append(t)

    # ✅ 1 country
    c1 = build_country_cell(conn, used_codes, used_countries, lang)
    if c1:
        cells.append(c1)

    # ✅ 1 circuit winner
    cir = build_circuit_cell(conn, used_codes, used_circuits, lang)
    if cir:
        # si quieres, usa image genérica ya existente
        cir["image"] = "image_circuit_win.png"
        cells.append(cir)

    return cells


def pick_extra_cell(lang: str, conn, used_codes: set):
    used_team_names = set()
    used_countries = set()
    used_circuits = set()

    decade_pool = get_decade_categories(lang)
    random.shuffle(decade_pool)

    builders = [
        lambda: build_team_cell(conn, used_codes, used_team_names, lang),
        lambda: build_country_cell(conn, used_codes, used_countries, lang),
        lambda: build_circuit_cell(conn, used_codes, used_circuits, lang),
        lambda: build_teammates_cell(conn, used_codes, lang),
        lambda: next(
            ({**d, "image": None} for d in decade_pool if d["code"] not in used_codes),
            None
        ),
    ]

    for _ in range(80):
        cell = random.choice(builders)()
        if cell:
            return cell

    return {
        "code": "race_winners",
        "description": translate("race_winners", lang),
        "image": None,
        "query": """
            SELECT d.driverId, CONCAT(d.forename, ' ', d.surname)
            FROM drivers d
            JOIN results r ON d.driverId = r.driverId
            WHERE r.positionOrder = 1
            GROUP BY d.driverId
            HAVING COUNT(*) >= 1
        """,
        "params": {}
    }


def generate_bingo_game(lang: str = "es"):
    """
    Genera:
      {
        "cells": [{code, description, image, validPilots:[...]} x9],
        "driversQueue": [{driverId, driverName} x60]
      }
    """
    with engine.connect() as conn:
        # 1) categorías base
        cells = build_9_bingo_cells(lang, conn)

        enriched_cells = []
        union_ids = set()
        union_list = []

        # 2) ejecutar queries por casilla
        for c in cells:
            params = c.get("params", {})
            pilots = get_all_drivers_matching_query(conn, c["query"], params)

            # filtra categorías pequeñas
            if len(pilots) < 15:
                continue

            for p in pilots:
                if p["driverId"] not in union_ids:
                    union_ids.add(p["driverId"])
                    union_list.append(p)

            enriched_cells.append({
                "code": c["code"],
                "description": c["description"],
                "image": c.get("image"),
                "meta": c.get("meta"),
                "validPilots": pilots
            })

        # 2b) completar hasta 9 casillas con extras
        while len(enriched_cells) < 9:
            extra = pick_extra_cell(lang, conn, used_codes={x["code"] for x in enriched_cells})
            pilots = get_all_drivers_matching_query(conn, extra["query"], extra.get("params", {}))
            if len(pilots) < 15:
                continue

            enriched_cells.append({
                "code": extra["code"],
                "description": extra["description"],
                "image": extra.get("image"),
                "meta": extra.get("meta"),
                "validPilots": pilots
            })

            for p in pilots:
                if p["driverId"] not in union_ids:
                    union_ids.add(p["driverId"])
                    union_list.append(p)

        # 3) cola de 60 pilotos: sale de la unión de válidos
        random.shuffle(union_list)
        drivers_queue = union_list[:60]

        # fallback si faltan
        # fallback si faltan
        if len(drivers_queue) < 60:
            missing = 60 - len(drivers_queue)

            # ✅ usa pool precargado
            if len(DRIVER_POOL) >= missing:
                drivers_queue += random.sample(DRIVER_POOL, missing)
            else:
                # ultra-fallback: por si el pool está vacío (no debería)
                drivers_queue += union_list[:missing]


        return {
            "cells": enriched_cells[:9],
            "driversQueue": drivers_queue
        }
