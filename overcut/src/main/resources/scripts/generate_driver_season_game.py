import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

DB_URL = os.getenv("DB_URI", "mysql+pymysql://root:root@localhost:3306/f1db")

engine = create_engine(DB_URL)
Session = sessionmaker(bind=engine)

# Reutiliza/Amplía el diccionario que ya tienes
GRAND_PRIX_TRANSLATIONS = {
  "70th Anniversary Grand Prix": "Gran Premio 70.º Aniversario",
     "Abu Dhabi Grand Prix": "Gran Premio de Abu Dabi",
     "Argentine Grand Prix": "Gran Premio de Argentina",
     "Australian Grand Prix": "Gran Premio de Australia",
     "Austrian Grand Prix": "Gran Premio de Austria",
     "Azerbaijan Grand Prix": "Gran Premio de Azerbaiyán",
     "Bahrain Grand Prix": "Gran Premio de Baréin",
     "Belgian Grand Prix": "Gran Premio de Bélgica",
     "Brazilian Grand Prix": "Gran Premio de Brasil",
     "British Grand Prix": "Gran Premio de Gran Bretaña",
     "Caesars Palace Grand Prix": "Gran Premio del Caesars Palace",
     "Canadian Grand Prix": "Gran Premio de Canadá",
     "Chinese Grand Prix": "Gran Premio de China",
     "Dallas Grand Prix": "Gran Premio de Dallas",
     "Detroit Grand Prix": "Gran Premio de Detroit",
     "Dutch Grand Prix": "Gran Premio de los Países Bajos",
     "Eifel Grand Prix": "Gran Premio de Eifel",
     "Emilia Romagna Grand Prix": "Gran Premio de Emilia-Romaña",
     "European Grand Prix": "Gran Premio de Europa",
     "French Grand Prix": "Gran Premio de Francia",
     "German Grand Prix": "Gran Premio de Alemania",
     "Hungarian Grand Prix": "Gran Premio de Hungría",
     "Indian Grand Prix": "Gran Premio de la India",
     "Indianapolis 500": "500 Millas de Indianápolis",
     "Italian Grand Prix": "Gran Premio de Italia",
     "Japanese Grand Prix": "Gran Premio de Japón",
     "Korean Grand Prix": "Gran Premio de Corea",
     "Las Vegas Grand Prix": "Gran Premio de Las Vegas",
     "Luxembourg Grand Prix": "Gran Premio de Luxemburgo",
     "Malaysian Grand Prix": "Gran Premio de Malasia",
     "Mexican Grand Prix": "Gran Premio de México",
     "Mexico City Grand Prix": "Gran Premio de Ciudad de México",
     "Miami Grand Prix": "Gran Premio de Miami",
     "Monaco Grand Prix": "Gran Premio de Mónaco",
     "Moroccan Grand Prix": "Gran Premio de Marruecos",
     "Pacific Grand Prix": "Gran Premio del Pacífico",
     "Pescara Grand Prix": "Gran Premio de Pescara",
     "Portuguese Grand Prix": "Gran Premio de Portugal",
     "Qatar Grand Prix": "Gran Premio de Catar",
     "Russian Grand Prix": "Gran Premio de Rusia",
     "Sakhir Grand Prix": "Gran Premio de Sakhir",
     "San Marino Grand Prix": "Gran Premio de San Marino",
     "São Paulo Grand Prix": "Gran Premio de São Paulo",
     "Saudi Arabian Grand Prix": "Gran Premio de Arabia Saudita",
     "Singapore Grand Prix": "Gran Premio de Singapur",
     "South African Grand Prix": "Gran Premio de Sudáfrica",
     "Spanish Grand Prix": "Gran Premio de España",
     "Styrian Grand Prix": "Gran Premio de Estiria",
     "Swedish Grand Prix": "Gran Premio de Suecia",
     "Swiss Grand Prix": "Gran Premio de Suiza",
     "Turkish Grand Prix": "Gran Premio de Turquía",
     "Tuscan Grand Prix": "Gran Premio de la Toscana",
     "United States Grand Prix": "Gran Premio de Estados Unidos",
     "United States Grand Prix West": "Gran Premio del Oeste de Estados Unidos",
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
