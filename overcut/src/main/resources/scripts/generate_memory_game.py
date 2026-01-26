# generate_memory_game.py
# -*- coding: utf-8 -*-
import random
import time
from threading import Lock
from sqlalchemy import text

from generate_order_drivers import engine  # tu engine global

NAT_ES = {
    "British": "Británica",
    "Spanish": "Española",
    "German": "Alemana",
    "French": "Francesa",
    "Italian": "Italiana",
    "Brazilian": "Brasileña",
    "Finnish": "Finlandesa",
    "Dutch": "Neerlandesa",
    "Mexican": "Mexicana",
    "Australian": "Australiana",
    "Canadian": "Canadiense",
    "Argentine": "Argentina",
    "American": "Estadounidense",
    "Austrian": "Austriaca",
    "Belgian": "Belga",
    "Swiss": "Suiza",
    "Swedish": "Sueca",
    "Japanese": "Japonesa",
    "Danish": "Danesa",
    "New Zealander": "Neozelandesa",
}

def tr_nat(nat: str, lang: str) -> str:
    return NAT_ES.get(nat, nat) if lang == "es" else nat

# -------------------------
# CACHÉS EN MEMORIA
# -------------------------
_LOCK = Lock()
LAST_WARMUP_TS = 0
WARMUP_TTL_SECONDS = 6 * 60 * 60  # 6h (ajusta si quieres)

# Pools listos para samplear (listas de dicts)
MEM_TEAM_PAIRS = []   # [{"driverId":..,"driverName":..,"constructorId":..,"teamName":..}, ...]
MEM_NAT_PAIRS = []    # [{"driverId":..,"driverName":..,"nationality":..}, ...]

def warmup_memory_caches(force: bool = False):
    """
    Precarga:
      - driver↔team (histórico) pero SIN RAND en runtime
      - driver↔nationality
    """
    global LAST_WARMUP_TS, MEM_TEAM_PAIRS, MEM_NAT_PAIRS

    now = int(time.time())
    if not force and LAST_WARMUP_TS and now - LAST_WARMUP_TS < WARMUP_TTL_SECONDS:
        return

    with _LOCK:
        now = int(time.time())
        if not force and LAST_WARMUP_TS and now - LAST_WARMUP_TS < WARMUP_TTL_SECONDS:
            return

        with engine.connect() as conn:
            # 1) DRIVER ↔ TEAM (evita DISTINCT sobre results + RAND)
            #    Lo hacemos con un GROUP BY mínimo y filtramos por "actividad" para evitar pairs raros.
            team_rows = conn.execute(text("""
                SELECT
                    r.driverId AS driverId,
                    CONCAT(d.forename, ' ', d.surname) AS driverName,
                    r.constructorId AS constructorId,
                    c.name AS teamName,
                    COUNT(*) AS nResults
                FROM results r
                JOIN drivers d ON d.driverId = r.driverId
                JOIN constructors c ON c.constructorId = r.constructorId
                WHERE r.position IS NOT NULL
                GROUP BY r.driverId, r.constructorId
                HAVING COUNT(*) >= 5
                ORDER BY r.driverId, r.constructorId
            """)).mappings().all()

            MEM_TEAM_PAIRS = [
                {
                    "driverId": int(r["driverId"]),
                    "driverName": r["driverName"],
                    "constructorId": int(r["constructorId"]),
                    "teamName": r["teamName"],
                }
                for r in team_rows
                if r["driverName"] and r["teamName"]
            ]

            # 2) DRIVER ↔ NATIONALITY (esta ya era barata, pero igual la cacheamos)
            nat_rows = conn.execute(text("""
                SELECT
                    d.driverId AS driverId,
                    CONCAT(d.forename, ' ', d.surname) AS driverName,
                    d.nationality AS nationality
                FROM drivers d
                WHERE d.nationality IS NOT NULL AND d.nationality <> ''
                ORDER BY d.driverId
            """)).mappings().all()

            MEM_NAT_PAIRS = [
                {
                    "driverId": int(r["driverId"]),
                    "driverName": r["driverName"],
                    "nationality": r["nationality"],
                }
                for r in nat_rows
                if r["driverName"] and r["nationality"]
            ]

        LAST_WARMUP_TS = now
        print(f"[startup] Memory warmup: teamPairs={len(MEM_TEAM_PAIRS)} natPairs={len(MEM_NAT_PAIRS)}")

def _pick_driver_team_pairs(n: int):
    warmup_memory_caches(force=False)
    if len(MEM_TEAM_PAIRS) < n:
        return random.sample(MEM_TEAM_PAIRS, k=len(MEM_TEAM_PAIRS))
    return random.sample(MEM_TEAM_PAIRS, k=n)

def _pick_driver_nationality_pairs(n: int):
    warmup_memory_caches(force=False)
    if len(MEM_NAT_PAIRS) < n:
        return random.sample(MEM_NAT_PAIRS, k=len(MEM_NAT_PAIRS))
    return random.sample(MEM_NAT_PAIRS, k=n)

def generate_memory_game(lang: str = "es", rows: int = 4, cols: int = 4, mode: str = "classic"):
    lang = "es" if str(lang).lower().startswith("es") else "en"

    total = rows * cols
    if total % 2 != 0:
        raise ValueError("rows*cols must be even")

    pairs_needed = total // 2

    # mezcla de tipos
    team_pairs = pairs_needed // 2
    nat_pairs = pairs_needed - team_pairs

    driver_team = _pick_driver_team_pairs(team_pairs)
    driver_nat = _pick_driver_nationality_pairs(nat_pairs)

    cards = []
    pair_index = 1

    def add_pair(card_a: dict, card_b: dict):
        nonlocal pair_index
        key = f"P{pair_index}"
        pair_index += 1
        card_a["pairKey"] = key
        card_b["pairKey"] = key
        cards.append(card_a)
        cards.append(card_b)

    # DRIVER ↔ TEAM
    for r in driver_team:
        add_pair(
            {
                "cardType": "DRIVER",
                "label": r["driverName"],
                "driverId": int(r["driverId"]),
                "constructorId": None,
            },
            {
                "cardType": "TEAM",
                "label": r["teamName"],
                "driverId": None,
                "constructorId": int(r["constructorId"]),
            }
        )

    # DRIVER ↔ NATIONALITY
    for r in driver_nat:
        add_pair(
            {
                "cardType": "DRIVER",
                "label": r["driverName"],
                "driverId": int(r["driverId"]),
                "constructorId": None,
            },
            {
                "cardType": "NATIONALITY",
                "label": tr_nat(r["nationality"], lang),
                "driverId": None,
                "constructorId": None,
            }
        )

    random.shuffle(cards)
    for i, c in enumerate(cards):
        c["positionIndex"] = i
        c["id"] = i + 1

    return {
        "rows": rows,
        "cols": cols,
        "mode": mode,
        "attemptsLeft": 30,
        "cards": cards
    }
