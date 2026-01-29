# src/main/resources/scripts/generate_seven_clues_cache.py
# -*- coding: utf-8 -*-

import os
import json
import gzip
import random
from pathlib import Path
from datetime import datetime
from sqlalchemy import text

from generate_order_drivers import engine  # reutilizas tu engine mysql+pymysql

HERE = Path(__file__).resolve().parent
CACHE_DIR = HERE / "cache"
CACHE_DIR.mkdir(parents=True, exist_ok=True)

# --- Helpers ---
def _safe_int(x, default=0):
    try:
        return int(x)
    except:
        return default

def _full_name(forename, surname):
    fn = (forename or "").strip()
    sn = (surname or "").strip()
    return (fn + " " + sn).strip()

def _write_json_gz(path_no_gz: Path, payload: dict, gzip_enabled=True):
    raw = json.dumps(payload, ensure_ascii=False)
    path_no_gz.write_text(raw, encoding="utf-8")
    if gzip_enabled:
        gz_path = Path(str(path_no_gz) + ".gz")
        gz_path.write_bytes(gzip.compress(raw.encode("utf-8")))

def _pick_driver_pool(conn, min_year=1980, min_races=25, limit=8000):
    """
    Pool grande y barato (sin RAND).
    Selecciona pilotos con suficiente historial.
    """
    rows = conn.execute(text("""
        SELECT d.driverId, d.forename, d.surname
        FROM drivers d
        JOIN results r ON r.driverId = d.driverId
        JOIN races ra ON ra.raceId = r.raceId
        WHERE ra.year >= :minYear
        GROUP BY d.driverId, d.forename, d.surname
        HAVING COUNT(*) >= :minRaces
        ORDER BY d.driverId DESC
        LIMIT :lim
    """), {"minYear": min_year, "minRaces": min_races, "lim": limit}).fetchall()

    pool = [{"driverId": int(r[0]), "name": _full_name(r[1], r[2])} for r in rows]
    return pool

def _driver_facts(conn, driver_id: int):
    """
    Devuelve un set de “hechos” que luego convertimos en 7 pistas.
    Todo en SQL simple, sin joins gigantes repetidos.
    """
    # Nacionalidad + nacimiento
    base = conn.execute(text("""
        SELECT d.nationality, d.dob
        FROM drivers d
        WHERE d.driverId = :driverId
    """), {"driverId": driver_id}).fetchone()

    nationality = base[0] if base else None
    dob = str(base[1]) if base and base[1] is not None else None

    # Años carrera (primero y último)
    yrs = conn.execute(text("""
        SELECT MIN(ra.year) AS firstYear, MAX(ra.year) AS lastYear, COUNT(*) AS races
        FROM results r
        JOIN races ra ON ra.raceId = r.raceId
        WHERE r.driverId = :driverId
    """), {"driverId": driver_id}).fetchone()

    first_year = _safe_int(yrs[0], 0)
    last_year = _safe_int(yrs[1], 0)
    races = _safe_int(yrs[2], 0)

    # Victorias / podios / poles / campeonatos (aprox: WDC si posición final 1)
    wins = conn.execute(text("""
        SELECT COUNT(*) FROM results WHERE driverId = :driverId AND positionOrder = 1
    """), {"driverId": driver_id}).scalar() or 0

    podiums = conn.execute(text("""
        SELECT COUNT(*) FROM results WHERE driverId = :driverId AND positionOrder BETWEEN 1 AND 3
    """), {"driverId": driver_id}).scalar() or 0

    poles = conn.execute(text("""
        SELECT COUNT(*) FROM qualifying WHERE driverId = :driverId AND position = 1
    """), {"driverId": driver_id}).scalar() or 0

    wdc = conn.execute(text("""
        SELECT COUNT(DISTINCT r.year)
        FROM driverStandings ds
        JOIN races r ON r.raceId = ds.raceId
        WHERE ds.driverId = :driverId
          AND ds.position = 1
          AND r.round = (SELECT MAX(r2.round) FROM races r2 WHERE r2.year = r.year)
    """), {"driverId": driver_id}).scalar() or 0

    # Equipo más “frecuente”
    team = conn.execute(text("""
        SELECT c.name, COUNT(*) AS cnt
        FROM results r
        JOIN constructors c ON c.constructorId = r.constructorId
        WHERE r.driverId = :driverId
        GROUP BY c.name
        ORDER BY cnt DESC
        LIMIT 1
    """), {"driverId": driver_id}).fetchone()
    main_team = team[0] if team else None

    # Circuito más “fuerte” (más podios)
    best_circuit = conn.execute(text("""
        SELECT ci.name, COUNT(*) AS cnt
        FROM results r
        JOIN races ra ON ra.raceId = r.raceId
        JOIN circuits ci ON ci.circuitId = ra.circuitId
        WHERE r.driverId = :driverId
          AND r.positionOrder BETWEEN 1 AND 3
        GROUP BY ci.name
        ORDER BY cnt DESC
        LIMIT 1
    """), {"driverId": driver_id}).fetchone()
    best_circuit_name = best_circuit[0] if best_circuit else None

    return {
        "nationality": nationality,
        "dob": dob,
        "firstYear": first_year,
        "lastYear": last_year,
        "races": races,
        "wins": int(wins),
        "podiums": int(podiums),
        "poles": int(poles),
        "wdc": int(wdc),
        "mainTeam": main_team,
        "bestCircuit": best_circuit_name
    }

def _build_clues_es(driver_name: str, facts: dict):
    """
    7 pistas en español. No revelan el nombre.
    """
    clues = []

    if facts.get("nationality"):
        clues.append(f"Nacionalidad: {facts['nationality']}")
    if facts.get("dob"):
        clues.append(f"Fecha de nacimiento: {facts['dob']}")
    if facts.get("firstYear") and facts.get("lastYear"):
        clues.append(f"Carrera entre {facts['firstYear']} y {facts['lastYear']}")
    if facts.get("races"):
        clues.append(f"Carreras disputadas (aprox.): {facts['races']}")
    clues.append(f"Victorias: {facts.get('wins', 0)}")
    clues.append(f"Podios: {facts.get('podiums', 0)}")

    if facts.get("wdc", 0) > 0:
        clues.append(f"Campeonatos del mundo: {facts['wdc']}")
    else:
        # pista alternativa si no es campeón
        if facts.get("poles") is not None:
            clues.append(f"Pole positions: {facts.get('poles', 0)}")

    # completar hasta 7 con equipo/circuito
    if len(clues) < 7 and facts.get("mainTeam"):
        clues.append(f"Equipo más habitual: {facts['mainTeam']}")
    if len(clues) < 7 and facts.get("bestCircuit"):
        clues.append(f"Circuito con más podios: {facts['bestCircuit']}")

    # si aún faltan, relleno neutro
    while len(clues) < 7:
        clues.append("Pista adicional: piloto con presencia histórica en F1")

    return clues[:7]

def _build_clues_en(driver_name: str, facts: dict):
    clues = []

    if facts.get("nationality"):
        clues.append(f"Nationality: {facts['nationality']}")
    if facts.get("dob"):
        clues.append(f"Date of birth: {facts['dob']}")
    if facts.get("firstYear") and facts.get("lastYear"):
        clues.append(f"Career span: {facts['firstYear']}–{facts['lastYear']}")
    if facts.get("races"):
        clues.append(f"Races (approx.): {facts['races']}")
    clues.append(f"Wins: {facts.get('wins', 0)}")
    clues.append(f"Podiums: {facts.get('podiums', 0)}")

    if facts.get("wdc", 0) > 0:
        clues.append(f"World championships: {facts['wdc']}")
    else:
        if facts.get("poles") is not None:
            clues.append(f"Pole positions: {facts.get('poles', 0)}")

    if len(clues) < 7 and facts.get("mainTeam"):
        clues.append(f"Most common team: {facts['mainTeam']}")
    if len(clues) < 7 and facts.get("bestCircuit"):
        clues.append(f"Track with most podiums: {facts['bestCircuit']}")

    while len(clues) < 7:
        clues.append("Extra clue: a historically relevant F1 driver")

    return clues[:7]

def build_cache(lang: str, count: int = 2500, seed: int = 42):
    random.seed(seed)
    with engine.connect() as conn:
        pool = _pick_driver_pool(conn)
        if not pool:
            raise RuntimeError("Driver pool vacío; revisa DB.")

        games = []
        used = set()

        # iteramos sin RAND: cogemos muestras del pool
        attempts = 0
        while len(games) < count and attempts < count * 10:
            attempts += 1
            d = random.choice(pool)
            did = d["driverId"]
            if did in used:
                continue

            facts = _driver_facts(conn, did)

            # filtro: si tiene poquísimos datos, skip
            if facts.get("races", 0) < 25:
                continue

            used.add(did)
            if lang == "es":
                clues = _build_clues_es(d["name"], facts)
            else:
                clues = _build_clues_en(d["name"], facts)

            games.append({
                "driverId": did,
                "driverName": d["name"],
                "clues": clues
            })

        return {
            "version": 1,
            "generatedAt": datetime.utcnow().isoformat() + "Z",
            "count": len(games),
            "games": games
        }

def main():
    for lang in ["es", "en"]:
        payload = build_cache(lang=lang, count=2500, seed=42 if lang == "es" else 99)
        out = CACHE_DIR / f"seven_clues_cache_{lang}.json"
        _write_json_gz(out, payload, gzip_enabled=True)
        print(f"[OK] {lang}: {payload['count']} -> {out} (+.gz)")

if __name__ == "__main__":
    main()
