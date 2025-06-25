import os
import json
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

DB_URI = os.getenv("DB_URI", "mysql+pymysql://root:root@localhost:3306/f1db")

engine = create_engine(DB_URI)
Session = sessionmaker(bind=engine)

def get_random_driver():
    session = Session()
    try:
        result = session.execute(text("""
            SELECT driverId, forename, surname
            FROM drivers
            ORDER BY RAND()
            LIMIT 1
        """)).fetchone()

        driver_id, forename, surname = result
        full_name = f"{forename} {surname}"

        return {
            "driverId": driver_id,
            "name": full_name
        }
    finally:
        session.close()


if __name__ == "__main__":
    get_random_driver()
