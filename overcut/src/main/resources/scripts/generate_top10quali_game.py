import os
import json
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# DB
DB_URL = os.getenv("DB_URI", "mysql+pymysql://root:root@localhost:3306/f1db")
engine = create_engine(DB_URL)
Session = sessionmaker(bind=engine)

# Traducciones EN -> ES (amplíalo cuando quieras)
GRAND_PRIX_TRANSLATIONS = {
    "70th Anniversary Grand Prix": "Gran Premio del 70º Aniversario",
    "Abu Dhabi Grand Prix": "Gran Premio de Abu Dabi",
    "Argentine Grand Prix": "Gran Premio de Argentina",
    "Australian Grand Prix": "Gran Premio de Australia",
    "Austrian Grand Prix": "Gran Premio de Austria",
    "Azerbaijan Grand Prix": "Gran Premio de Azerbaiyán",
    "Bahrain Grand Prix": "Gran Premioa de Baréin",
    "Belgian Grand Prix": "Gran Premio de Bélgica",
    "Brazilian Grand Prix": "Gran Premio de Brasil",
    "British Grand Prix": "Gran Premio de Gran Bretaña",
    "Caesars Palace Grand Prix": "Gran Premio de Caesars Palace",
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

def translate_gp_to_es(name_en: str) -> str:
    if not name_en:
        return name_en
    name_en = name_en.strip()
    return GRAND_PRIX_TRANSLATIONS.get(name_en, name_en)

def get_random_race_and_top10quali(lang: str = "es"):
    """
    Devuelve SIEMPRE:
      - raceNameEn (nombre original DB)
      - raceNameEs (traducido)
      - raceName (compatibilidad): según lang
    """
    session = Session()
    try:
        race = session.execute(text("""
            SELECT r.raceId, r.year, r.name
            FROM races r
            WHERE r.year >= 1985
            ORDER BY RAND()
            LIMIT 1
        """)).fetchone()

        if not race:
            return None

        race_id, year, race_name_en = race
        race_name_en = (race_name_en or "").strip()
        race_name_es = translate_gp_to_es(race_name_en)

        # Decide sesión:
        # >=2006 -> Q3
        # <2006 -> Q2 si hay 10 tiempos, si no Q1
        if year >= 2006:
            session_used = "Q3"
        else:
            q2_count = session.execute(text("""
                SELECT COUNT(*)
                FROM qualifying q
                WHERE q.raceId = :race_id
                  AND q.position BETWEEN 1 AND 10
                  AND q.q2 IS NOT NULL AND q.q2 <> ''
            """), {"race_id": race_id}).scalar() or 0

            session_used = "Q2" if q2_count == 10 else "Q1"

        col = {"Q1": "q1", "Q2": "q2", "Q3": "q3"}[session_used]

        rows = session.execute(text(f"""
            SELECT
              q.position,
              CONCAT(d.forename, ' ', d.surname) AS full_name,
              d.nationality,
              q.{col} AS session_time
            FROM qualifying q
            JOIN drivers d ON q.driverId = d.driverId
            WHERE q.raceId = :race_id
              AND q.position BETWEEN 1 AND 10
              AND q.{col} IS NOT NULL AND q.{col} <> ''
            ORDER BY q.position ASC
            LIMIT 10
        """), {"race_id": race_id}).fetchall()

        # Si no hay 10, reintenta con otra carrera
        if len(rows) < 10:
            return get_random_race_and_top10quali(lang)

        top10 = [{"name": r[1], "nationality": r[2], "time": r[3]} for r in rows]

        race_name = race_name_es if lang == "es" else race_name_en

        return {
            "seasonYear": year,
            "raceId": race_id,

            # ✅ compatibilidad
            "raceName": race_name,

            # ✅ siempre ambos
            "raceNameEs": race_name_es,
            "raceNameEn": race_name_en,

            "sessionUsed": session_used,
            "top10": top10
        }

    finally:
        session.close()

if __name__ == "__main__":
    # Para pruebas locales:
    # export LANG=en
    lang = os.getenv("LANG", "es")
    print(json.dumps(get_random_race_and_top10quali(lang), ensure_ascii=False))
