import os, json
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

LANG = os.getenv("LANG", "es")
DB_URL = os.getenv("DB_URI", "mysql+pymysql://root:root@localhost:3306/f1db")

engine = create_engine(DB_URL)
Session = sessionmaker(bind=engine)

def pick_session(year: int) -> str:
    return "Q3" if year >= 2006 else "AUTO"  # AUTO => Q2 si existe, si no Q1

def get_random_race_and_top10quali():
    session = Session()
    try:
        # 1) Selecciona carreras candidatas (años razonables para tener quali en tu BD)
        race = session.execute(text("""
            SELECT r.raceId, r.year, r.name
            FROM races r
            WHERE r.year >= 1985
            ORDER BY RAND()
            LIMIT 1
        """)).fetchone()

        if not race:
            return None

        race_id, year, race_name = race

        # 2) Decide sesión
        session_used = "Q3" if year >= 2006 else None

        if year < 2006:
            # comprueba si Q2 está disponible para el top10
            q2_count = session.execute(text("""
                SELECT COUNT(*)
                FROM qualifying q
                WHERE q.raceId = :race_id
                  AND q.position BETWEEN 1 AND 10
                  AND q.q2 IS NOT NULL AND q.q2 <> ''
            """), {"race_id": race_id}).scalar() or 0

            session_used = "Q2" if q2_count == 10 else "Q1"

        col = {"Q1": "q1", "Q2": "q2", "Q3": "q3"}[session_used]

        # 3) Trae top10 por posición y tiempo de la sesión elegida
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

        if len(rows) < 10:
            # si esta carrera no sirve, reintenta recursivo simple
            return get_random_race_and_top10quali()

        top10 = [{"name": r[1], "nationality": r[2], "time": r[3]} for r in rows]

        return {
            "seasonYear": year,
            "raceId": race_id,
            "raceName": race_name,
            "sessionUsed": session_used,
            "top10": top10
        }

    finally:
        session.close()

if __name__ == "__main__":
    print(json.dumps(get_random_race_and_top10quali(), ensure_ascii=False))
