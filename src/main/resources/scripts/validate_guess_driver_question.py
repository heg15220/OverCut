import os
import json
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

LANG = os.getenv("LANG", "es")
DB_URI = os.getenv("DB_URI", "mysql+pymysql://root:root@localhost:3306/f1db")

engine = create_engine(DB_URI)
Session = sessionmaker(bind=engine)

# Traducción de nacionalidades al español
NATIONALITY_TRANSLATIONS = {
    "American": "Estadounidense",
    "American-Italian": "Estadounidense-Italiano",
    "Argentine": "Argentino",
    "Argentine-Italian": "Argentino-Italiano",
    "Argentinian": "Argentino",
    "Australian": "Australiano",
    "Austrian": "Austriaco",
    "Belgian": "Belga",
    "Brazilian": "Brasileño",
    "British": "Británico",
    "Canadian": "Canadiense",
    "Chilean": "Chileno",
    "Chinese": "Chino",
    "Colombian": "Colombiano",
    "Czech": "Checo",
    "Danish": "Danés",
    "Dutch": "Neerlandés",
    "East German": "Alemán Oriental",
    "Finnish": "Finlandés",
    "French": "Francés",
    "German": "Alemán",
    "Hungarian": "Húngaro",
    "Indian": "Indio",
    "Indonesian": "Indonesio",
    "Irish": "Irlandés",
    "Italian": "Italiano",
    "Japanese": "Japonés",
    "Liechtensteiner": "Liechtensteiniano",
    "Malaysian": "Malasio",
    "Mexican": "Mexicano",
    "Monegasque": "Monegasco",
    "New Zealander": "Neozelandés",
    "Polish": "Polaco",
    "Portuguese": "Portugués",
    "Rhodesian": "Rodesiano",
    "Russian": "Ruso",
    "South African": "Sudafricano",
    "Spanish": "Español",
    "Swedish": "Sueco",
    "Swiss": "Suizo",
    "Thai": "Tailandés",
    "Uruguayan": "Uruguayo",
    "Venezuelan": "Venezolano"
}

def traducir_nacionalidad(nacionalidad):
    nacionalidad = nacionalidad.strip()
    if LANG == "es":
        return NATIONALITY_TRANSLATIONS.get(nacionalidad, nacionalidad)
    return nacionalidad

def pregunta_actual(session, driver_id):
    return session.execute(text("""
        SELECT COUNT(*) FROM results r
        JOIN races ra ON r.raceId = ra.raceId
        WHERE r.driverId = :driver_id AND ra.year = 2025
    """), {"driver_id": driver_id}).scalar() > 0

def pregunta_retirado(session, driver_id):
    max_year = session.execute(text("""
        SELECT MAX(ra.year) FROM results r
        JOIN races ra ON r.raceId = ra.raceId
        WHERE r.driverId = :driver_id
    """), {"driver_id": driver_id}).scalar()
    return max_year is not None and max_year < 2023

def pregunta_equipo(session, driver_id, constructor_name):
    return session.execute(text("""
        SELECT COUNT(*) FROM results r
        JOIN constructors c ON r.constructorId = c.constructorId
        WHERE r.driverId = :driver_id AND c.name = :team
    """), {"driver_id": driver_id, "team": constructor_name}).scalar() > 0

def pregunta_nacionalidad(session, driver_id, nationality_input):
    result = session.execute(text("""
        SELECT nationality FROM drivers WHERE driverId = :driver_id
    """), {"driver_id": driver_id}).scalar()

    base_value = result.strip().lower()

    # Comparamos traducido si el idioma es español
    if LANG == "es":
        translated = NATIONALITY_TRANSLATIONS.get(result.strip(), result.strip())
        return translated.strip().lower() == nationality_input.strip().lower()
    else:
        return base_value == nationality_input.strip().lower()

def pregunta_circuito(session, driver_id, circuit_name):
    return session.execute(text("""
        SELECT COUNT(*) FROM results r
        JOIN races ra ON r.raceId = ra.raceId
        JOIN circuits c ON ra.circuitId = c.circuitId
        WHERE r.driverId = :driver_id AND c.circuitRef = :circuit
    """), {"driver_id": driver_id, "circuit": circuit_name}).scalar() > 0

def pregunta_campeon(session, driver_id):
    return session.execute(text("""
        SELECT COUNT(*) FROM driverstandings
        WHERE driverId = :driver_id AND positionOrder = 1
    """), {"driver_id": driver_id}).scalar() > 0

def pregunta_ganador_gp(session, driver_id):
    return session.execute(text("""
        SELECT COUNT(*) FROM results
        WHERE driverId = :driver_id AND positionOrder = 1
    """), {"driver_id": driver_id}).scalar() > 0

def pregunta_mas_de_x_gp(session, driver_id, limite):
    total = session.execute(text("""
        SELECT COUNT(*) FROM results WHERE driverId = :driver_id
    """), {"driver_id": driver_id}).scalar()
    return total > limite

def pregunta_decada(session, driver_id, decade):
    start = int(decade[:4])
    end = start + 9
    result = session.execute(text("""
        SELECT COUNT(*) FROM results r
        JOIN races ra ON r.raceId = ra.raceId
        WHERE r.driverId = :driver_id AND ra.year BETWEEN :start AND :end
    """), {"driver_id": driver_id, "start": start, "end": end}).scalar()
    return result > 0

def generar_pregunta(category, value):
    if LANG == "es":
        preguntas = {
            "current": "¿Está compitiendo actualmente?",
            "retired": "¿Está retirado?",
            "team": f"¿Corrió para el equipo {value}?",
            "nationality": f"¿Es de nacionalidad {NATIONALITY_TRANSLATIONS.get(value, value)}?",
            "circuit": f"¿Corrió en el circuito de {value}?",
            "champion": "¿Ganó algún campeonato del mundo?",
            "gpwinner": "¿Ganó alguna carrera de F1?",
            "over50gps": "¿Disputó más de 50 Grandes Premios?",
            "over150gps": "¿Disputó más de 150 Grandes Premios?",
            "decade": f"¿Compitió en la década de {value}?"
        }
    else:
        preguntas = {
            "current": "Is he currently competing?",
            "retired": "Is he retired?",
            "team": f"Did he race for {value}?",
            "nationality": f"Is he {value}?",
            "circuit": f"Did he race at {value}?",
            "champion": "Has he won a world championship?",
            "gpwinner": "Did he win a Formula 1 race?",
            "over50gps": "Did he race more than 50 Grands Prix?",
            "over150gps": "Did he race more than 150 Grands Prix?",
            "decade": f"Did he compete in the {value}?"
        }
    return preguntas.get(category, "")

def main():
    driver_id = int(sys.argv[1])
    category = sys.argv[2]
    value = sys.argv[3] if len(sys.argv) > 3 else None

    session = Session()
    try:
        if category == "current":
            result = pregunta_actual(session, driver_id)
        elif category == "retired":
            result = pregunta_retirado(session, driver_id)
        elif category == "team":
            result = pregunta_equipo(session, driver_id, value)
        elif category == "nationality":
            result = pregunta_nacionalidad(session, driver_id, value)
        elif category == "circuit":
            result = pregunta_circuito(session, driver_id, value)
        elif category == "champion":
            result = pregunta_campeon(session, driver_id)
        elif category == "gpwinner":
            result = pregunta_ganador_gp(session, driver_id)
        elif category == "over50gps":
            result = pregunta_mas_de_x_gp(session, driver_id, 50)
        elif category == "over150gps":
            result = pregunta_mas_de_x_gp(session, driver_id, 150)
        elif category == "decade":
            result = pregunta_decada(session, driver_id, value)
        else:
            raise Exception("Categoría no válida")

        pregunta = generar_pregunta(category, value)

        print(json.dumps({
            "question": pregunta,
            "isCorrect": result
        }))
    finally:
        session.close()

if __name__ == "__main__":
    main()
