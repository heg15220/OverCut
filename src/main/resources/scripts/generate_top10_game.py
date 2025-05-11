import random
import json
import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Configuración de entorno
LANG = os.getenv("LANG", "es")
DB_URL = os.getenv("DB_URI", "mysql+pymysql://root:root@localhost:3306/f1db")
engine = create_engine(DB_URL)
Session = sessionmaker(bind=engine)

# Diccionario de traducciones de nombres de Grandes Premios (muy básico, puedes ampliarlo)
GRAND_PRIX_TRANSLATIONS = {
    "70th Anniversary Grand Prix": "Gran Premio del 70º Aniversario",
    "Abu Dhabi Grand Prix": "Gran Premio de Abu Dabi",
    "Argentine Grand Prix": "Gran Premio de Argentina",
    "Australian Grand Prix": "Gran Premio de Australia",
    "Austrian Grand Prix": "Gran Premio de Austria",
    "Azerbaijan Grand Prix": "Gran Premio de Azerbaiyán",
    "Bahrain Grand Prix": "Gran Premio de Baréin",
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
    "United States Grand Prix West": "Gran Premio del Oeste de Estados Unidos"
}


def traducir_nombre_gp(nombre):
    if LANG == "es":
        return GRAND_PRIX_TRANSLATIONS.get(nombre.strip(), nombre)
    return nombre

def get_random_race_and_top10():
    session = Session()
    try:
        race_query = text("""
            SELECT r.raceId, r.year, r.name
            FROM races r
            WHERE r.year >= 1985
            ORDER BY RAND()
            LIMIT 1
        """)
        race = session.execute(race_query).fetchone()
        if not race:
            return None

        race_id, year, race_name = race
        race_name = traducir_nombre_gp(race_name)

        results_query = text("""
            SELECT CONCAT(d.forename, ' ', d.surname) AS full_name, d.nationality
            FROM results res
            JOIN drivers d ON res.driverId = d.driverId
            WHERE res.raceId = :race_id
            ORDER BY res.positionOrder ASC
            LIMIT 10
        """)
        top10 = session.execute(results_query, {"race_id": race_id}).fetchall()
        top10_data = [{"name": row[0], "nationality": row[1]} for row in top10]

        return {
            "seasonYear": year,
            "raceId": race_id,
            "raceName": race_name,
            "top10": top10_data
        }

    finally:
        session.close()

if __name__ == "__main__":
    data = get_random_race_and_top10()
    print(json.dumps(data, ensure_ascii=False))
