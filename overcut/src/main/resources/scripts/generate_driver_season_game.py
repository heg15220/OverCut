import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

DB_URL = os.getenv("DB_URI", "mysql+pymysql://root:root@localhost:3306/f1db")

engine = create_engine(DB_URL)
Session = sessionmaker(bind=engine)

# Reutiliza/Amplía el diccionario que ya tienes
GRAND_PRIX_TRANSLATIONS = {
    "Spanish Grand Prix": "Gran Premio de España",
    "British Grand Prix": "Gran Premio de Gran Bretaña",
    "Belgian Grand Prix": "Gran Premio de Bélgica",
    "Monaco Grand Prix": "Gran Premio de Mónaco",
    "Hungarian Grand Prix": "Gran Premio de Hungría",
    "Italian Grand Prix": "Gran Premio de Italia",
    "Japanese Grand Prix": "Gran Premio de Japón",
    "Brazilian Grand Prix": "Gran Premio de Brasil",
    "São Paulo Grand Prix": "Gran Premio de São Paulo",
    "Abu Dhabi Grand Prix": "Gran Premio de Abu Dabi",
    "Bahrain Grand Prix": "Gran Premio de Baréin",
    "Saudi Arabian Grand Prix": "Gran Premio de Arabia Saudita",
    "Qatar Grand Prix": "Gran Premio de Catar",
    "United States Grand Prix": "Gran Premio de Estados Unidos",
    "Mexican Grand Prix": "Gran Premio de México",
    "Mexico City Grand Prix": "Gran Premio de Ciudad de México",
    "Australian Grand Prix": "Gran Premio de Australia",
    "Canadian Grand Prix": "Gran Premio de Canadá",
    "French Grand Prix": "Gran Premio de Francia",
    "German Grand Prix": "Gran Premio de Alemania",
    "Dutch Grand Prix": "Gran Premio de los Países Bajos",
    "Austrian Grand Prix": "Gran Premio de Austria",
    "Singapore Grand Prix": "Gran Premio de Singapur",
    "Azerbaijan Grand Prix": "Gran Premio de Azerbaiyán",
    "Turkish Grand Prix": "Gran Premio de Turquía",
    "Russian Grand Prix": "Gran Premio de Rusia",
    "Chinese Grand Prix": "Gran Premio de China",
    "Miami Grand Prix": "Gran Premio de Miami",
    "Las Vegas Grand Prix": "Gran Premio de Las Vegas",
}

def translate_gp_name(en_name: str) -> str:
    if not en_name:
        return en_name
    en_name = en_name.strip()
    return GRAND_PRIX_TRANSLATIONS.get(en_name, en_name)

def _pick_driver_with_2_podiums(session) -> int:
    driver_id = session.execute(text("""
        SELECT res.driverId
        FROM results res
        WHERE res.positionOrder <= 3
        GROUP BY res.driverId
        HAVING COUNT(*) >= 2
        ORDER BY RAND()
        LIMIT 1
    """)).scalar()
    return int(driver_id)

def _get_driver_name(session, driver_id: int) -> str:
    row = session.execute(text("""
        SELECT CONCAT(d.forename, ' ', d.surname) AS full_name
        FROM drivers d
        WHERE d.driverId = :driver_id
        LIMIT 1
    """), {"driver_id": driver_id}).fetchone()
    return (row[0] if row and row[0] else "").strip()

def _pick_random_season_for_driver(session, driver_id: int) -> int:
    year = session.execute(text("""
        SELECT DISTINCT r.year
        FROM results res
        JOIN races r ON r.raceId = res.raceId
        WHERE res.driverId = :driver_id
          AND res.positionOrder IS NOT NULL
          AND res.positionText REGEXP '^[0-9]+$'
        ORDER BY RAND()
        LIMIT 1
    """), {"driver_id": driver_id}).scalar()
    return int(year)

def _max_position_for_season(session, year: int) -> int:
    max_pos = session.execute(text("""
        SELECT MAX(res.positionOrder)
        FROM results res
        JOIN races r ON r.raceId = res.raceId
        WHERE r.year = :year
          AND res.positionOrder IS NOT NULL
          AND res.positionText REGEXP '^[0-9]+$'
    """), {"year": year}).scalar() or 20
    return int(max_pos)

def get_driver_season_game():
    session = Session()
    try:
        driver_id = _pick_driver_with_2_podiums(session)
        driver_name = _get_driver_name(session, driver_id)
        year = _pick_random_season_for_driver(session, driver_id)

        rows = session.execute(text("""
            SELECT
              r.raceId,
              r.round,
              r.name AS race_name_en,
              c.country AS country,
              res.positionOrder AS finishing_position
            FROM results res
            JOIN races r ON r.raceId = res.raceId
            JOIN circuits c ON c.circuitId = r.circuitId
            WHERE res.driverId = :driver_id
              AND r.year = :year
              AND res.positionOrder IS NOT NULL
              AND res.positionText REGEXP '^[0-9]+$'
            ORDER BY r.round ASC
        """), {"driver_id": driver_id, "year": year}).fetchall()

        if not rows or len(rows) < 3:
            return get_driver_season_game()

        max_pos = _max_position_for_season(session, year)

        rounds = []
        for race_id, round_num, race_name_en, country, finishing_pos in rows:
            race_name_en = (race_name_en or "").strip()
            race_name_es = translate_gp_name(race_name_en)

            rounds.append({
                "raceId": int(race_id),
                "roundNumber": int(round_num),
                "country": (country or "").strip(),
                "raceNameEn": race_name_en,
                "raceNameEs": race_name_es,
                "finishingPosition": int(finishing_pos)
            })

        # ✅ SIEMPRE devolvemos ambos nombres (EN/ES) y driverName
        return {
            "driverId": int(driver_id),
            "driverName": driver_name,   # ✅ NUEVO (para que Java no necesite DriverDao)
            "seasonYear": int(year),
            "maxPosition": int(max_pos),
            "rounds": rounds
        }

    finally:
        session.close()

if __name__ == "__main__":
    import json
    print(json.dumps(get_driver_season_game(), ensure_ascii=False))
