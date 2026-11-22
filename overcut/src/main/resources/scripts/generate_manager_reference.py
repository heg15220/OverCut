"""Build the reference tables for OverCut Mánager.

The manager game reads the same bootstrap as Trayectoria (line-ups, calendars,
constructors' standings) and needs four more facts that the JSON caches do not
carry, all of them straight out of the f1db dump the deploy loads into MySQL:

  drivers       nationality and year of birth, so a driver has a flag and a
                real age instead of one guessed from their debut.
  constructors  the country a team raced under.
  races         the real date, the scheduled number of laps and the winner's
                average lap, which is what the live race view counts down and
                what its lap times are built around.

The dump is parsed directly - no database needed - and the result is written as
a small ES module the frontend imports lazily.

    python src/main/resources/scripts/generate_manager_reference.py

f1db is published under CC BY 4.0; the attribution travels in the module.
"""

import argparse
import json
import os
import re
from collections import defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, "..", "..", "..", "..", ".."))
DEFAULT_DUMP = os.path.join(REPO, "deploy", "mysql", "initdb.d", "zz_f1db.sql")
DEFAULT_OUT = os.path.join(
    REPO, "overcut", "frontend", "src", "modules", "overcutManager", "data", "reference.js"
)

# Demonyms as f1db spells them -> ISO 3166 alpha-2 (the codes flagcdn serves).
NATIONALITY = {
    "American": "us", "American-Italian": "us", "Argentine": "ar", "Argentinian": "ar",
    "Argentine-Italian": "ar", "Australian": "au", "Austrian": "at", "Belgian": "be",
    "Brazilian": "br", "British": "gb", "Canadian": "ca", "Chilean": "cl", "Chinese": "cn",
    "Colombian": "co", "Czech": "cz", "Danish": "dk", "Dutch": "nl", "East German": "de",
    "Finnish": "fi", "French": "fr", "German": "de", "Hong Kong": "hk", "Hungarian": "hu",
    "Indian": "in", "Indonesian": "id", "Irish": "ie", "Italian": "it", "Japanese": "jp",
    "Liechtensteiner": "li", "Malaysian": "my", "Mexican": "mx", "Monegasque": "mc",
    "New Zealander": "nz", "Polish": "pl", "Portuguese": "pt", "Rhodesian": "zw",
    "Russian": "ru", "South African": "za", "Spanish": "es", "Swedish": "se", "Swiss": "ch",
    "Thai": "th", "Uruguayan": "uy", "Venezuelan": "ve", "Moroccan": "ma",
}


def parse_values(blob):
    """Split the body of one `INSERT ... VALUES (...),(...);` into Python tuples."""
    rows, row, field, i, quoted, n = [], [], [], 0, False, len(blob)
    depth = 0
    while i < n:
        ch = blob[i]
        if quoted:
            if ch == "\\" and i + 1 < n:
                field.append(blob[i + 1])
                i += 2
                continue
            if ch == "'":
                quoted = False
            else:
                field.append(ch)
        elif ch == "'":
            quoted = True
        elif ch == "(":
            depth += 1
            row, field = [], []
        elif ch == ")":
            depth -= 1
            row.append(convert("".join(field)))
            rows.append(row)
            field = []
        elif ch == "," and depth > 0:
            row.append(convert("".join(field)))
            field = []
        elif depth > 0:
            field.append(ch)
        i += 1
    return rows


def convert(text):
    if text == "NULL":
        return None
    return text


def read_tables(path, wanted):
    tables = defaultdict(list)
    pattern = re.compile(r"^INSERT INTO `(\w+)` VALUES (.*);\s*$")
    with open(path, encoding="utf-8", errors="replace") as handle:
        for line in handle:
            if not line.startswith("INSERT INTO"):
                continue
            match = pattern.match(line)
            if not match or match.group(1) not in wanted:
                continue
            tables[match.group(1)].extend(parse_values(match.group(2)))
    return tables


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dump", default=DEFAULT_DUMP)
    parser.add_argument("--out", default=DEFAULT_OUT)
    args = parser.parse_args()

    tables = read_tables(args.dump, {"drivers", "constructors", "races", "circuits", "results"})

    unknown = set()
    drivers = {}
    for row in tables["drivers"]:
        # driverId, driverRef, number, code, forename, surname, dob, nationality, url
        name = f"{row[4]} {row[5]}".strip()
        nat = NATIONALITY.get((row[7] or "").strip())
        if row[7] and not nat:
            unknown.add(row[7])
        born = int(row[6][:4]) if row[6] and row[6][:4].isdigit() and row[6][:4] != "0000" else None
        drivers[name] = [nat, born]

    constructors = {}
    for row in tables["constructors"]:
        nat = NATIONALITY.get((row[3] or "").strip())
        if row[3] and not nat:
            unknown.add(row[3])
        constructors.setdefault(row[2], nat)

    circuits = {row[0]: {"ref": row[1], "location": row[3]} for row in tables["circuits"]}

    # The winner's line knows the race distance and how long it took.
    winners = {}
    for row in tables["results"]:
        # resultId, raceId, driverId, constructorId, number, grid, position, positionText,
        # positionOrder, points, laps, time, milliseconds, ...
        if row[8] == "1":
            laps = int(row[10] or 0)
            millis = int(row[12]) if row[12] and row[12].isdigit() else None
            winners[row[1]] = (laps, millis)

    races = defaultdict(list)
    for row in tables["races"]:
        # raceId, year, round, circuitId, name, date, ...
        year = row[1]
        laps, millis = winners.get(row[0], (0, None))
        average = round(millis / laps / 1000, 2) if millis and laps else None
        circuit = circuits.get(row[3], {})
        races[year].append([int(row[2]), row[4], row[5][5:], laps, average, circuit.get("ref"), circuit.get("location")])
    for year in races:
        races[year].sort(key=lambda race: race[0])
        races[year] = [race[1:] for race in races[year]]

    if unknown:
        print("unmapped nationalities:", sorted(unknown))

    payload = {
        "source": "f1db (CC BY 4.0) -> generate_manager_reference.py",
        "drivers": drivers,
        "constructors": constructors,
        "races": dict(sorted(races.items())),
    }

    os.makedirs(os.path.dirname(args.out), exist_ok=True)
    with open(args.out, "w", encoding="utf-8", newline="\n") as handle:
        handle.write("/**\n")
        handle.write(" * Reference tables for OverCut Mánager.\n *\n")
        handle.write(" * GENERATED FILE - do not edit by hand. Rebuild with:\n")
        handle.write(" *   python src/main/resources/scripts/generate_manager_reference.py\n *\n")
        handle.write(" * Data: f1db, CC BY 4.0. drivers: name -> [nationality, birth year];\n")
        handle.write(" * constructors: name -> nationality; races: year -> [name, MM-DD, laps,\n")
        handle.write(" * winner's average lap in seconds, circuit ref, location].\n */\n\n")
        handle.write("export const reference = ")
        handle.write(json.dumps(payload, ensure_ascii=False, separators=(",", ":")))
        handle.write(";\n\nexport default reference;\n")
    print(f"wrote {args.out}: {len(drivers)} drivers, {len(constructors)} constructors, "
          f"{sum(len(v) for v in races.values())} races")


if __name__ == "__main__":
    main()
