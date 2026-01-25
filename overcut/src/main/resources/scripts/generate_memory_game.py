# -*- coding: utf-8 -*-
import random
from sqlalchemy import text

from generate_order_drivers import engine  # mysql+pymysql://root:root@localhost:3306/f1db

# Reutiliza traducciones si quieres ampliar luego; por ahora lo mantenemos simple.
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
    if lang == "es":
        return NAT_ES.get(nat, nat)
    return nat

def _pick_driver_team_pairs(n: int):
    # driver + constructor que hayan coincidido en results (histórico)
    q = text("""
        SELECT DISTINCT d.driverId AS driverId,
               CONCAT(d.forename, ' ', d.surname) AS driverName,
               c.constructorId AS constructorId,
               c.name AS teamName
        FROM results r
        JOIN drivers d ON d.driverId = r.driverId
        JOIN constructors c ON c.constructorId = r.constructorId
        WHERE r.position IS NOT NULL
        ORDER BY RAND()
        LIMIT :n
    """)
    with engine.connect() as conn:
        rows = conn.execute(q, {"n": n}).mappings().all()
    return rows

def _pick_driver_nationality_pairs(n: int):
    q = text("""
        SELECT d.driverId AS driverId,
               CONCAT(d.forename, ' ', d.surname) AS driverName,
               d.nationality AS nationality
        FROM drivers d
        WHERE d.nationality IS NOT NULL AND d.nationality <> ''
        ORDER BY RAND()
        LIMIT :n
    """)
    with engine.connect() as conn:
        rows = conn.execute(q, {"n": n}).mappings().all()
    return rows

def generate_memory_game(lang: str = "es", rows: int = 4, cols: int = 4, mode: str = "classic"):
    total = rows * cols
    if total % 2 != 0:
        raise ValueError("rows*cols must be even")

    pairs_needed = total // 2

    # Mezcla de tipos (puedes tunear proporciones)
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

    # Baraja y asigna posiciones
    random.shuffle(cards)
    for i, c in enumerate(cards):
        c["positionIndex"] = i
        c["id"] = i + 1  # ID solo interno FastAPI (la BD pondrá el real)

    return {
        "rows": rows,
        "cols": cols,
        "mode": mode,
        "attemptsLeft": 30,
        "cards": cards
    }
