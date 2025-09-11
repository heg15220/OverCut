import argparse
import json
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

DB_URL = os.getenv("DB_URI", "mysql+pymysql://root:root@localhost:3306/f1db")
engine = create_engine(DB_URL)
Session = sessionmaker(bind=engine)

def validate_driver(driver_name, team_a, team_b):
    session = Session()
    try:
        query = text("""
            SELECT DISTINCT c.name
            FROM results r
            JOIN races ra ON r.raceId = ra.raceId
            JOIN constructors c ON r.constructorId = c.constructorId
            JOIN drivers d ON r.driverId = d.driverId
            WHERE ra.year >= 1985
              AND LOWER(CONCAT(d.forename, ' ', d.surname)) = :driverName
              AND (c.name = :teamA OR c.name = :teamB)
        """)
        result = session.execute(query, {
            "driverName": driver_name.lower(),
            "teamA": team_a,
            "teamB": team_b
        }).fetchall()

        teams = [row[0] for row in result]
        return len(set(teams)) == 2
    finally:
        session.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--driver", required=True)
    parser.add_argument("--teamA", required=True)
    parser.add_argument("--teamB", required=True)
    args = parser.parse_args()

    validate_driver(args.driver, args.teamA, args.teamB)
