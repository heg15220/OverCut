#!/usr/bin/env python3
"""
RF-SIM-09 / RF-SIM-14 / RF-SIM-10: real retirement rates by era, from f1db, for the race
engine's reliability and incident model (data/balance/race-reliability.json, RNF-07).

    python overcut/src/main/resources/scripts/reliability_from_f1db.py [--db PATH] [--out PATH]

Reads the f1db SQLite (default tools/assets/.cache/f1db/f1db.db, f1db v2026.20.0) and writes the
`measured` block of race-reliability.json: per era, starters per race, retirements per car-race
by mechanical component group (engine, gearbox, hydraulics, electrics, suspension, brakes, fuel,
wheel, aero, other), accidents, collisions and punctures split into the opening laps (race_result
laps = 0 or 1, i.e. the car did not complete lap 2) and the rest of the race, the share of races
with an opening-lap incident retirement and those retirements per race.

Every number in the output is a count from f1db; nothing is tuned here. The tuned model values
(hazard shapes, turn-one factors) live next to `measured` in the JSON and are marked NV when
they are not measured.
"""

import argparse
import json
import os
import sqlite3
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", "..", "..", ".."))
DEFAULT_DB = os.path.join(ROOT, "tools", "assets", ".cache", "f1db", "f1db.db")
DEFAULT_OUT = os.path.join(ROOT, "overcut", "frontend", "src", "modules", "overcutManager", "data", "balance", "race-reliability.json")

# Era windows (inclusive) by technical regulation; every playable season falls in one.
ERAS = [
    (1976, 1979), (1980, 1988), (1989, 1993), (1994, 1999), (2000, 2005), (2006, 2013), (2014, 2021), (2022, 2026),
]

# f1db reason_retired spelling -> group. Anything not listed is "other mechanical" unless it is a
# non-racing reason (disqualification-like, illness, withdrawal), which is left out of the rates.
GROUPS = {
    "engine": [
        "Engine", "Turbo", "Turbocharger", "Power unit", "Oil leak", "Oil pressure", "Oil pump", "Oil line", "Overheating",
        "Water leak", "Water pressure", "Water pump", "Water radiator", "Radiator", "Coolant leak", "Cooling system", "Fire",
        "Exhaust", "Ignition", "Distributor", "Injection", "Spark plugs", "Crankshaft", "Power loss", "Throttle",
    ],
    "fuel": ["Fuel system", "Fuel pressure", "Fuel pump", "Fuel leak", "Fuel", "Fuel pipe", "Fuel injection", "Fuel cell"],
    "gearbox": ["Gearbox", "Transmission", "Clutch", "Differential", "Driveshaft", "Driveshaft hub", "Halfshaft", "Drivetrain"],
    "hydraulics": ["Hydraulics", "Pneumatics", "Power steering"],
    "electrics": [
        "Electrical", "Electronics", "Alternator", "Battery", "KERS failure", "Energy storage system failure", "Hybrid system",
        "Safety switch", "Traction control", "Launch control",
    ],
    "suspension": ["Suspension", "Steering", "Track rod", "Handling", "Vibrations", "Chassis", "Undertray", "Broken floor"],
    "brakes": ["Brakes", "Brake bias"],
    "wheel": ["Wheel", "Wheel bearing", "Wheel nut", "Wheel rim", "Wheel hub", "Loose wheel"],
    "aero": ["Rear wing", "Broken wing", "Front wing"],
}
INCIDENTS = {
    "accident": ["Accident", "Spun off", "Spin", "Accident damage"],
    "collision": ["Collision", "Collision damage", "Caused collision with Trulli"],
    "puncture": ["Puncture", "Puncture damage", "Tyre"],
}
STRATEGIC = {"Out of fuel"}
NON_STARTERS = ("DNQ", "DNPQ", "DNS", "DNP")
# Retired for something that is not a racing failure (left out of every rate).
NON_RACING_HINTS = ("Illegal", "Ignored", "Withdrew", "Injury", "Physical", "Unwell", "Illness", "Unfit", "Safety concerns", "Disqualified",
                    "Excluded", "Technical infringements", "Car underweight", "Push start", "Received outside assistance", "Missed weight check",
                    "Car seized", "Car raced by", "Misled", "Rejoined", "Fatal", "Failed", "Overtaking on formation", "Reversed in pits",
                    "Incorrect", "Accident in practice", "Accident in qualifying", "Accident in warm-up", "Injury in practice", "Tyre dispute",
                    "Tyre shortage", "Wrong tyres", "Fuel sample", "Car not ready", "Fuel rig", "Pit fire", "Illegal pit stop", "Safety belt")

GROUP_OF = {reason: group for group, reasons in GROUPS.items() for reason in reasons}
INCIDENT_OF = {reason: kind for kind, reasons in INCIDENTS.items() for reason in reasons}


def classify(reason):
    if reason in INCIDENT_OF:
        return ("incident", INCIDENT_OF[reason])
    if reason in STRATEGIC:
        return ("strategic", "fuel")
    if any(reason.startswith(hint) for hint in NON_RACING_HINTS):
        return ("other", None)
    return ("mechanical", GROUP_OF.get(reason, "other"))


def r4(value):
    return round(value, 4)


def measure(con, lo, hi):
    races = con.execute("select id, laps from race where year between ? and ?", (lo, hi)).fetchall()
    race_ids = [race_id for race_id, _ in races]
    if not race_ids:
        return None
    rows = con.execute(
        f"select r.race_id, r.position_text, r.laps, r.reason_retired from race_result r join race on race.id = r.race_id "
        f"where race.year between ? and ? and r.position_text not in ({','.join('?' * len(NON_STARTERS))})",
        (lo, hi, *NON_STARTERS),
    ).fetchall()
    starts = len(rows)
    mech = {group: 0 for group in [*GROUPS.keys(), "other"]}
    inc = {kind: {"opening": 0, "later": 0} for kind in INCIDENTS}
    opening_mech = 0
    races_with_opening = set()
    races_with_lap1 = set()
    lap1_only = 0
    for race_id, position, laps, reason in rows:
        if position != "DNF" or not reason:
            continue
        kind, group = classify(reason)
        opening = laps is not None and laps <= 1
        if kind == "mechanical":
            mech[group] += 1
            if opening:
                opening_mech += 1
        elif kind == "incident":
            inc[group]["opening" if opening else "later"] += 1
            if opening:
                races_with_opening.add(race_id)
            if laps == 0:
                races_with_lap1.add(race_id)
                lap1_only += 1
    n = len(race_ids)
    opening_total = sum(row["opening"] for row in inc.values())
    return {
        "years": [lo, hi],
        "races": n,
        "starts": starts,
        "startersPerRace": r4(starts / n),
        "meanLaps": r4(sum(laps for _, laps in races) / n),
        "mechanicalPerCarRace": r4(sum(mech.values()) / starts),
        "mechanicalByGroup": {group: r4(count / starts) for group, count in mech.items()},
        "mechanicalOpeningPerCarRace": r4(opening_mech / starts),
        "incidentsPerCarRace": {kind: {"opening": r4(row["opening"] / starts), "later": r4(row["later"] / starts)} for kind, row in inc.items()},
        "openingIncidentRetirementsPerRace": r4(opening_total / n),
        "racesWithOpeningIncidentRetirement": r4(len(races_with_opening) / n),
        "lap1IncidentRetirementsPerRace": r4(lap1_only / n),
        "racesWithLap1IncidentRetirement": r4(len(races_with_lap1) / n),
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--db", default=DEFAULT_DB)
    parser.add_argument("--out", default=DEFAULT_OUT)
    parser.add_argument("--print", action="store_true", help="print the measured block only")
    args = parser.parse_args()
    if not os.path.exists(args.db):
        sys.exit(f"f1db not found at {args.db}")
    con = sqlite3.connect(args.db)
    measured = [measure(con, lo, hi) for lo, hi in ERAS]
    if args.print or not os.path.exists(args.out):
        print(json.dumps(measured, indent=1))
        if args.print:
            return
    with open(args.out, encoding="utf-8") as fh:
        data = json.load(fh)
    data["measured"] = {"$comment": data.get("measured", {}).get("$comment", ""), "eras": measured}
    with open(args.out, "w", encoding="utf-8", newline="\n") as fh:
        json.dump(data, fh, ensure_ascii=False, indent=2)
        fh.write("\n")
    print(f"wrote measured block for {len(measured)} eras to {args.out}")


if __name__ == "__main__":
    main()
