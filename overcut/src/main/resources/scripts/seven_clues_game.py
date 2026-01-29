# src/main/resources/scripts/seven_clues_game.py
# -*- coding: utf-8 -*-

import json
import gzip
import random
from pathlib import Path
from sqlalchemy import text

from generate_order_drivers import engine  # tu engine común

SEVEN_CLUES_CACHE = {"es": [], "en": []}
SEVEN_CLUES_META = {"es": None, "en": None}


def load_seven_clues_cache_files(cache_dir: Path):
    """
    cache_dir esperado:
      .../src/main/resources/scripts/cache
    """
    global SEVEN_CLUES_CACHE, SEVEN_CLUES_META

    for lang in ["es", "en"]:
        base = cache_dir / f"seven_clues_cache_{lang}.json"
        gz = Path(str(base) + ".gz")
        path = gz if gz.exists() else base

        if not path.exists():
            print(f"[WARN] No se encontró seven clues cache {lang}: {base}(.gz)")
            SEVEN_CLUES_CACHE[lang] = []
            SEVEN_CLUES_META[lang] = None
            continue

        try:
            if path.suffix == ".gz":
                raw = gzip.decompress(path.read_bytes()).decode("utf-8")
                payload = json.loads(raw)
            else:
                payload = json.loads(path.read_text(encoding="utf-8"))

            games = payload.get("games", []) or []
            SEVEN_CLUES_CACHE[lang] = games
            SEVEN_CLUES_META[lang] = {
                "count": payload.get("count", len(games)),
                "generatedAt": payload.get("generatedAt"),
                "version": payload.get("version"),
                "path": str(path)
            }
            print(f"[startup] SevenClues cache {lang.upper()} cargado: {len(games)}")
        except Exception as e:
            print(f"[ERROR] cargando SevenClues cache {lang}: {e}")
            SEVEN_CLUES_CACHE[lang] = []
            SEVEN_CLUES_META[lang] = None


def generate_seven_clues_round(lang: str = "es") -> dict:
    lang = "en" if (lang or "").lower().startswith("en") else "es"
    games = SEVEN_CLUES_CACHE.get(lang) or []
    if games:
        return random.choice(games)

    # fallback live (por si no hay cache)
    return _generate_live(lang)


def _generate_live(lang: str) -> dict:
    # fallback mínimo: driver random con algunos datos (sin cache)
    with engine.connect() as conn:
        row = conn.execute(text("""
            SELECT d.driverId, CONCAT(d.forename,' ',d.surname) AS name, d.nationality, d.dob
            FROM drivers d
            JOIN results r ON r.driverId = d.driverId
            JOIN races ra ON ra.raceId = r.raceId
            WHERE ra.year >= 1980
            GROUP BY d.driverId, name, d.nationality, d.dob
            HAVING COUNT(*) >= 25
            ORDER BY d.driverId DESC
            LIMIT 1
        """)).fetchone()

    if not row:
        return {"driverId": 0, "driverName": "Unknown", "clues": ["No data"] * 7}

    driverId = int(row[0])
    name = str(row[1])
    nat = str(row[2]) if row[2] else None
    dob = str(row[3]) if row[3] else None

    if lang == "es":
        clues = [
            f"Nacionalidad: {nat}" if nat else "Nacionalidad: -",
            f"Fecha de nacimiento: {dob}" if dob else "Fecha de nacimiento: -",
            "Pista 3",
            "Pista 4",
            "Pista 5",
            "Pista 6",
            "Pista 7",
        ]
    else:
        clues = [
            f"Nationality: {nat}" if nat else "Nationality: -",
            f"Date of birth: {dob}" if dob else "Date of birth: -",
            "Clue 3",
            "Clue 4",
            "Clue 5",
            "Clue 6",
            "Clue 7",
        ]

    return {"driverId": driverId, "driverName": name, "clues": clues}


def validate_seven_clues_guess(payload: dict) -> dict:
    """
    Payload:
      { "answerDriverId": int, "guessDriverId": int, "guessDriverName": str }
    """
    answer_id = int(payload.get("answerDriverId") or 0)
    guess_id = int(payload.get("guessDriverId") or 0)
    guess_name = (payload.get("guessDriverName") or "").strip()

    if answer_id <= 0:
        return {"valid": False}

    if guess_id > 0:
        return {"valid": (guess_id == answer_id)}

    # fallback por nombre: resolver driverId por name
    if not guess_name:
        return {"valid": False}

    with engine.connect() as conn:
        row = conn.execute(text("""
            SELECT driverId
            FROM drivers
            WHERE CONCAT(forename,' ',surname) = :n
            LIMIT 1
        """), {"n": guess_name}).fetchone()

        if not row:
            # fallback LIKE
            row = conn.execute(text("""
                SELECT driverId
                FROM drivers
                WHERE CONCAT(forename,' ',surname) LIKE :p
                ORDER BY driverId DESC
                LIMIT 1
            """), {"p": f"%{guess_name}%"}).fetchone()

    gid = int(row[0]) if row else 0
    return {"valid": (gid == answer_id)}


def autocomplete_driver(partial: str, limit: int = 12) -> list[str]:
    partial = (partial or "").strip()
    if len(partial) < 2:
        return []

    with engine.connect() as conn:
        rows = conn.execute(text("""
            SELECT CONCAT(forename,' ',surname) AS name
            FROM drivers
            WHERE CONCAT(forename,' ',surname) LIKE :p
            ORDER BY surname ASC
            LIMIT :lim
        """), {"p": f"{partial}%", "lim": int(limit)}).fetchall()

    return [str(r[0]) for r in rows]
