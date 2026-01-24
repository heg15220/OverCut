# generate_timeline_game.py
import random
from sqlalchemy import text
from generate_order_drivers import engine

TRANSLATIONS = {
    "first_win": {"es": "Primera victoria de {name}", "en": "{name}'s first win"},
    "last_win": {"es": "Última victoria de {name}", "en": "{name}'s last win"},
    "first_title": {"es": "Primer título mundial de {name}", "en": "{name}'s first world title"},
    "last_title": {"es": "Último título mundial de {name}", "en": "{name}'s last world title"},
    "debut": {"es": "Debut de {name} en F1", "en": "{name}'s F1 debut"},
    "last_race": {"es": "Última carrera de {name} en F1", "en": "{name}'s last F1 race"},
    "first_podium": {"es": "Primer podio de {name}", "en": "{name}'s first podium"},
    "last_podium": {"es": "Último podio de {name}", "en": "{name}'s last podium"},
    "first_pole": {"es": "Primera pole de {name}", "en": "{name}'s first pole"},
    "last_pole": {"es": "Última pole de {name}", "en": "{name}'s last pole"},

    "first_team_win": {"es": "Primera victoria de {team}", "en": "{team}'s first win"},
    "last_team_win": {"es": "Última victoria de {team}", "en": "{team}'s last win"},
    "first_team_title": {"es": "Primer título de constructores de {team}", "en": "{team}'s first Constructors' title"},
    "last_team_title": {"es": "Último título de constructores de {team}", "en": "{team}'s last Constructors' title"},
    "first_team_double": {"es": "Primer doblete (1º-2º) de {team}", "en": "{team}'s first 1–2 finish"},
        "last_team_double":  {"es": "Último doblete (1º-2º) de {team}", "en": "{team}'s latest 1–2 finish"},  # ✅ NUEVO
}

# -------------------------
# Pickers (para variedad)
# -------------------------

def _pick_random_winner(conn):
    row = conn.execute(text("""
        SELECT d.driverId, CONCAT(d.forename,' ',d.surname) AS name
        FROM drivers d
        JOIN results r ON r.driverId = d.driverId
        WHERE r.positionOrder = 1
        GROUP BY d.driverId
        HAVING COUNT(*) >= 2
        ORDER BY RAND()
        LIMIT 1
    """)).fetchone()
    return row[0], row[1]

def _pick_random_podium_driver(conn):
    row = conn.execute(text("""
        SELECT d.driverId, CONCAT(d.forename,' ',d.surname) AS name
        FROM drivers d
        JOIN results r ON r.driverId = d.driverId
        WHERE r.positionOrder BETWEEN 1 AND 3
        GROUP BY d.driverId
        HAVING COUNT(*) >= 3
        ORDER BY RAND()
        LIMIT 1
    """)).fetchone()
    return row[0], row[1]

def _pick_random_driver_with_races(conn, min_races=30):
    row = conn.execute(text("""
        SELECT d.driverId, CONCAT(d.forename,' ',d.surname) AS name
        FROM drivers d
        JOIN results r ON r.driverId = d.driverId
        GROUP BY d.driverId
        HAVING COUNT(*) >= :minRaces
        ORDER BY RAND()
        LIMIT 1
    """), {"minRaces": min_races}).fetchone()
    return row[0], row[1]

def _pick_random_pole_driver(conn):
    # qualifying.position = 1 (tu schema tipo ergast suele ser así)
    row = conn.execute(text("""
        SELECT d.driverId, CONCAT(d.forename,' ',d.surname) AS name
        FROM drivers d
        JOIN qualifying q ON q.driverId = d.driverId
        WHERE q.position = 1
        GROUP BY d.driverId
        HAVING COUNT(*) >= 2
        ORDER BY RAND()
        LIMIT 1
    """)).fetchone()
    return row[0], row[1]

def _pick_random_champion(conn):
    row = conn.execute(text("""
        SELECT d.driverId, CONCAT(d.forename,' ',d.surname) AS name
        FROM drivers d
        JOIN driverStandings ds ON ds.driverId = d.driverId
        JOIN races r ON r.raceId = ds.raceId
        WHERE ds.position = 1
          AND r.round = (SELECT MAX(r2.round) FROM races r2 WHERE r2.year = r.year)
        GROUP BY d.driverId
        HAVING COUNT(*) >= 1
        ORDER BY RAND()
        LIMIT 1
    """)).fetchone()
    return row[0], row[1]

def _pick_random_constructor_with_wins(conn, min_wins=3):
    row = conn.execute(text("""
        SELECT c.constructorId, c.name
        FROM constructors c
        JOIN results r ON r.constructorId = c.constructorId
        WHERE r.positionOrder = 1
        GROUP BY c.constructorId
        HAVING COUNT(*) >= :minWins
        ORDER BY RAND()
        LIMIT 1
    """), {"minWins": min_wins}).fetchone()
    return row[0], row[1]

def _pick_random_constructor_champion(conn):
    # campeón de constructores al final de temporada
    row = conn.execute(text("""
        SELECT c.constructorId, c.name
        FROM constructors c
        JOIN constructorStandings cs ON cs.constructorId = c.constructorId
        JOIN races r ON r.raceId = cs.raceId
        WHERE cs.position = 1
          AND r.round = (SELECT MAX(r2.round) FROM races r2 WHERE r2.year = r.year)
        GROUP BY c.constructorId
        HAVING COUNT(*) >= 1
        ORDER BY RAND()
        LIMIT 1
    """)).fetchone()
    return row[0], row[1]

# -------------------------
# Event builders
# -------------------------

def _event_first_win(conn, lang):
    d_id, name = _pick_random_winner(conn)
    row = conn.execute(text("""
        SELECT MIN(r.date)
        FROM results res
        JOIN races r ON r.raceId = res.raceId
        WHERE res.driverId = :driverId AND res.positionOrder = 1
    """), {"driverId": d_id}).fetchone()
    if not row or row[0] is None:
        return None
    date = str(row[0])
    return {"code": f"first_win_{d_id}", "text": TRANSLATIONS["first_win"][lang].format(name=name), "date": date, "hintYear": int(date[:4])}

def _event_last_win(conn, lang):
    d_id, name = _pick_random_winner(conn)
    row = conn.execute(text("""
        SELECT MAX(r.date)
        FROM results res
        JOIN races r ON r.raceId = res.raceId
        WHERE res.driverId = :driverId AND res.positionOrder = 1
    """), {"driverId": d_id}).fetchone()
    if not row or row[0] is None:
        return None
    date = str(row[0])
    return {"code": f"last_win_{d_id}", "text": TRANSLATIONS["last_win"][lang].format(name=name), "date": date, "hintYear": int(date[:4])}

def _event_first_podium(conn, lang):
    d_id, name = _pick_random_podium_driver(conn)
    row = conn.execute(text("""
        SELECT MIN(ra.date)
        FROM results r
        JOIN races ra ON ra.raceId = r.raceId
        WHERE r.driverId = :driverId AND r.positionOrder BETWEEN 1 AND 3
    """), {"driverId": d_id}).fetchone()
    if not row or row[0] is None:
        return None
    date = str(row[0])
    return {"code": f"first_podium_{d_id}", "text": TRANSLATIONS["first_podium"][lang].format(name=name), "date": date, "hintYear": int(date[:4])}

def _event_last_podium(conn, lang):
    d_id, name = _pick_random_podium_driver(conn)
    row = conn.execute(text("""
        SELECT MAX(ra.date)
        FROM results r
        JOIN races ra ON ra.raceId = r.raceId
        WHERE r.driverId = :driverId AND r.positionOrder BETWEEN 1 AND 3
    """), {"driverId": d_id}).fetchone()
    if not row or row[0] is None:
        return None
    date = str(row[0])
    return {"code": f"last_podium_{d_id}", "text": TRANSLATIONS["last_podium"][lang].format(name=name), "date": date, "hintYear": int(date[:4])}

def _event_debut(conn, lang):
    d_id, name = _pick_random_driver_with_races(conn, min_races=20)
    row = conn.execute(text("""
        SELECT MIN(ra.date)
        FROM results r
        JOIN races ra ON ra.raceId = r.raceId
        WHERE r.driverId = :driverId
    """), {"driverId": d_id}).fetchone()
    if not row or row[0] is None:
        return None
    date = str(row[0])
    return {"code": f"debut_{d_id}", "text": TRANSLATIONS["debut"][lang].format(name=name), "date": date, "hintYear": int(date[:4])}

def _event_last_race(conn, lang):
    d_id, name = _pick_random_driver_with_races(conn, min_races=30)
    row = conn.execute(text("""
        SELECT MAX(ra.date)
        FROM results r
        JOIN races ra ON ra.raceId = r.raceId
        WHERE r.driverId = :driverId
    """), {"driverId": d_id}).fetchone()
    if not row or row[0] is None:
        return None
    date = str(row[0])
    return {"code": f"last_race_{d_id}", "text": TRANSLATIONS["last_race"][lang].format(name=name), "date": date, "hintYear": int(date[:4])}

def _event_first_title(conn, lang):
    champ_id, champ_name = _pick_random_champion(conn)
    row = conn.execute(text("""
        SELECT MIN(r.date)
        FROM driverStandings ds
        JOIN races r ON r.raceId = ds.raceId
        WHERE ds.driverId = :driverId AND ds.position = 1
          AND r.round = (SELECT MAX(r2.round) FROM races r2 WHERE r2.year = r.year)
    """), {"driverId": champ_id}).fetchone()
    if not row or row[0] is None:
        return None
    date = str(row[0])
    return {"code": f"first_title_{champ_id}", "text": TRANSLATIONS["first_title"][lang].format(name=champ_name), "date": date, "hintYear": int(date[:4])}

def _event_last_title(conn, lang):
    champ_id, champ_name = _pick_random_champion(conn)
    row = conn.execute(text("""
        SELECT MAX(r.date)
        FROM driverStandings ds
        JOIN races r ON r.raceId = ds.raceId
        WHERE ds.driverId = :driverId AND ds.position = 1
          AND r.round = (SELECT MAX(r2.round) FROM races r2 WHERE r2.year = r.year)
    """), {"driverId": champ_id}).fetchone()
    if not row or row[0] is None:
        return None
    date = str(row[0])
    return {"code": f"last_title_{champ_id}", "text": TRANSLATIONS["last_title"][lang].format(name=champ_name), "date": date, "hintYear": int(date[:4])}

def _event_first_pole(conn, lang):
    d_id, name = _pick_random_pole_driver(conn)
    row = conn.execute(text("""
        SELECT MIN(r.date)
        FROM qualifying q
        JOIN races r ON r.raceId = q.raceId
        WHERE q.driverId = :driverId AND q.position = 1
    """), {"driverId": d_id}).fetchone()
    if not row or row[0] is None:
        return None
    date = str(row[0])
    return {"code": f"first_pole_{d_id}", "text": TRANSLATIONS["first_pole"][lang].format(name=name), "date": date, "hintYear": int(date[:4])}

def _event_last_pole(conn, lang):
    d_id, name = _pick_random_pole_driver(conn)
    row = conn.execute(text("""
        SELECT MAX(r.date)
        FROM qualifying q
        JOIN races r ON r.raceId = q.raceId
        WHERE q.driverId = :driverId AND q.position = 1
    """), {"driverId": d_id}).fetchone()
    if not row or row[0] is None:
        return None
    date = str(row[0])
    return {"code": f"last_pole_{d_id}", "text": TRANSLATIONS["last_pole"][lang].format(name=name), "date": date, "hintYear": int(date[:4])}

def _event_first_team_win(conn, lang):
    c_id, team = _pick_random_constructor_with_wins(conn, min_wins=3)
    row = conn.execute(text("""
        SELECT MIN(r.date)
        FROM results res
        JOIN races r ON r.raceId = res.raceId
        WHERE res.constructorId = :cid AND res.positionOrder = 1
    """), {"cid": c_id}).fetchone()
    if not row or row[0] is None:
        return None
    date = str(row[0])
    return {"code": f"first_team_win_{c_id}", "text": TRANSLATIONS["first_team_win"][lang].format(team=team), "date": date, "hintYear": int(date[:4])}

def _event_last_team_win(conn, lang):
    c_id, team = _pick_random_constructor_with_wins(conn, min_wins=5)
    row = conn.execute(text("""
        SELECT MAX(r.date)
        FROM results res
        JOIN races r ON r.raceId = res.raceId
        WHERE res.constructorId = :cid AND res.positionOrder = 1
    """), {"cid": c_id}).fetchone()
    if not row or row[0] is None:
        return None
    date = str(row[0])
    return {"code": f"last_team_win_{c_id}", "text": TRANSLATIONS["last_team_win"][lang].format(team=team), "date": date, "hintYear": int(date[:4])}

def _event_first_team_title(conn, lang):
    c_id, team = _pick_random_constructor_champion(conn)
    row = conn.execute(text("""
        SELECT MIN(r.date)
        FROM constructorStandings cs
        JOIN races r ON r.raceId = cs.raceId
        WHERE cs.constructorId = :cid AND cs.position = 1
          AND r.round = (SELECT MAX(r2.round) FROM races r2 WHERE r2.year = r.year)
    """), {"cid": c_id}).fetchone()
    if not row or row[0] is None:
        return None
    date = str(row[0])
    return {"code": f"first_team_title_{c_id}", "text": TRANSLATIONS["first_team_title"][lang].format(team=team), "date": date, "hintYear": int(date[:4])}

def _event_last_team_title(conn, lang):
    c_id, team = _pick_random_constructor_champion(conn)
    row = conn.execute(text("""
        SELECT MAX(r.date)
        FROM constructorStandings cs
        JOIN races r ON r.raceId = cs.raceId
        WHERE cs.constructorId = :cid AND cs.position = 1
          AND r.round = (SELECT MAX(r2.round) FROM races r2 WHERE r2.year = r.year)
    """), {"cid": c_id}).fetchone()
    if not row or row[0] is None:
        return None
    date = str(row[0])
    return {"code": f"last_team_title_{c_id}", "text": TRANSLATIONS["last_team_title"][lang].format(team=team), "date": date, "hintYear": int(date[:4])}

def _event_first_team_double(conn, lang):
    c_id, team = _pick_random_constructor_with_wins(conn, min_wins=5)
    # primer 1-2: en una carrera hay dos pilotos de ese constructor con pos 1 y 2
    row = conn.execute(text("""
        SELECT MIN(ra.date)
        FROM races ra
        WHERE EXISTS (
            SELECT 1
            FROM results r1
            JOIN results r2 ON r1.raceId = r2.raceId
            WHERE r1.raceId = ra.raceId
              AND r1.constructorId = :cid AND r2.constructorId = :cid
              AND r1.positionOrder = 1 AND r2.positionOrder = 2
              AND r1.driverId <> r2.driverId
        )
    """), {"cid": c_id}).fetchone()
    if not row or row[0] is None:
        return None
    date = str(row[0])
    return {"code": f"first_team_double_{c_id}", "text": TRANSLATIONS["first_team_double"][lang].format(team=team), "date": date, "hintYear": int(date[:4])}


def _event_last_team_double(conn, lang):
    c_id, team = _pick_random_constructor_with_wins(conn, min_wins=5)

    # último 1-2: dos pilotos del mismo constructor terminan 1º y 2º en una carrera
    row = conn.execute(text("""
        SELECT MAX(ra.date)
        FROM races ra
        WHERE EXISTS (
            SELECT 1
            FROM results r1
            JOIN results r2 ON r1.raceId = r2.raceId
            WHERE r1.raceId = ra.raceId
              AND r1.constructorId = :cid AND r2.constructorId = :cid
              AND r1.positionOrder = 1 AND r2.positionOrder = 2
              AND r1.driverId <> r2.driverId
        )
    """), {"cid": c_id}).fetchone()

    if not row or row[0] is None:
        return None

    date = str(row[0])
    return {
        "code": f"last_team_double_{c_id}",
        "text": TRANSLATIONS["last_team_double"][lang].format(team=team),
        "date": date,
        "hintYear": int(date[:4])
    }


# -------------------------
# Main generator
# -------------------------

def generate_timeline_game(lang: str = "es", n: int = 6):
    builders = [
        _event_first_win,
        _event_last_win,
        _event_first_podium,
        _event_last_podium,
        _event_debut,
        _event_last_race,
        _event_first_title,
        _event_last_title,
        _event_first_pole,
        _event_last_pole,
        _event_first_team_win,
        _event_last_team_win,
        _event_first_team_title,
        _event_last_team_title,
        _event_first_team_double,
        _event_last_team_double,
    ]

    with engine.connect() as conn:
        events = []
        used_codes = set()

        # intentos para llenar n con variedad
        attempts = 0
        max_attempts = 80

        while len(events) < n and attempts < max_attempts:
            attempts += 1
            builder = random.choice(builders)
            ev = builder(conn, lang)
            if not ev:
                continue
            if ev["code"] in used_codes:
                continue
            used_codes.add(ev["code"])
            events.append(ev)

        if len(events) < n:
            raise Exception(f"No se pudieron generar {n} eventos válidos (solo {len(events)}).")

        random.shuffle(events)
        return {"events": events}
