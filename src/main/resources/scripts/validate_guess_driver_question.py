import os
import json
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

LANG = os.getenv("LANG", "es")

DB_URI = os.getenv("DB_URI", "mysql+pymysql://root:root@localhost:3306/f1db")

engine = create_engine(DB_URI)
Session = sessionmaker(bind=engine)

def pregunta_actual(session, driver_id):
    result = session.execute(text("""
        SELECT COUNT(*) FROM results r
        JOIN races ra ON r.raceId = ra.raceId
        WHERE r.driverId = :driver_id AND ra.year = 2025
    """), {"driver_id": driver_id}).scalar()
    return result > 0

def pregunta_retirado(session, driver_id):
    result = session.execute(text("""
        SELECT MAX(ra.year) FROM results r
        JOIN races ra ON r.raceId = ra.raceId
        WHERE r.driverId = :driver_id
    """), {"driver_id": driver_id}).scalar()
    return result is not None and result < 2023

def pregunta_equipo(session, driver_id, constructor_name):
    result = session.execute(text("""
        SELECT COUNT(*) FROM results r
        JOIN constructors c ON r.constructorId = c.constructorId
        WHERE r.driverId = :driver_id AND c.name = :team
    """), {"driver_id": driver_id, "team": constructor_name}).scalar()
    return result > 0

def pregunta_nacionalidad(session, driver_id, nationality):
    result = session.execute(text("""
        SELECT nationality FROM drivers WHERE driverId = :driver_id
    """), {"driver_id": driver_id}).scalar()
    return result.strip().lower() == nationality.strip().lower()

def pregunta_circuito(session, driver_id, circuit_name):
    result = session.execute(text("""
        SELECT COUNT(*) FROM results r
        JOIN races ra ON r.raceId = ra.raceId
        JOIN circuits c ON ra.circuitId = c.circuitId
        WHERE r.driverId = :driver_id AND c.circuitRef = :circuit
    """), {"driver_id": driver_id, "circuit": circuit_name}).scalar()
    return result > 0

def pregunta_campeon(session, driver_id):
    result = session.execute(text("""
        SELECT COUNT(*) FROM driverstandings
        WHERE driverId = :driver_id AND positionOrder = 1
    """), {"driver_id": driver_id}).scalar()
    return result > 0

def generar_pregunta(category, value):
    if LANG == "es":
        preguntas = {
            "current": "¿Está compitiendo actualmente?",
            "retired": "¿Está retirado?",
            "team": f"¿Corrió para el equipo {value}?",
            "nationality": f"¿Es de nacionalidad {value}?",
            "circuit": f"¿Corrió en el circuito de {value}?",
            "champion": "¿Ganó algún campeonato del mundo?"
        }
    else:
        preguntas = {
            "current": "Is he currently competing?",
            "retired": "Is he retired?",
            "team": f"Did he race for {value}?",
            "nationality": f"Is he {value}?",
            "circuit": f"Did he race at {value}?",
            "champion": "Has he won a world championship?"
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
