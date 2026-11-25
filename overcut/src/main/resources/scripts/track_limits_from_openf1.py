"""
Límites de pista reales en carrera para calibrar los del Manager (paquete SIM-7 de docs/manager/F1M24-GAMEPLAY.md
§2.10 `errores-visibles`, ofensa `trackLimits`; RF-SIM-09, RF-SIM-10, RNF-07).

Fuente: OpenF1 (https://openf1.org, API pública e histórica; `race_control` desde 2023). Ningún dato personal en las
peticiones: solo año, nombre de sesión y claves de sesión.

Cuenta, en cada carrera (session_name = "Race") de los años pedidos:
  - infracciones: los mensajes «CAR n (XXX) TIME m:ss.sss DELETED - TRACK LIMITS AT TURN t LAP l» y
    «CAR n (XXX) LAP DELETED - TRACK LIMITS ...»; los «(NEXT LAP)» no cuentan como infracción nueva (son la vuelta
    siguiente borrada por la misma);
  - vueltas-coche: 20 coches × la última vuelta que nombra un mensaje (aproximación: la vuelta de formación y los
    abandonos la mueven poco);
  - la infracción a la que llega cada bandera blanca y negra y cada sanción por límites de pista («FIA STEWARDS: 5
    SECOND TIME PENALTY ... TRACK LIMITS»), contando las infracciones de ese coche hasta ese mensaje.

Escribe un JSON con `perCarLap` (todas juntas), `circuits` (id de f1db → infracciones por vuelta-coche; el bloque que
copia data/balance/race-eras.json `trackLimits`), las carreras y la lista de escalones observados. Sin dependencias
fuera de la biblioteca estándar.

    python overcut/src/main/resources/scripts/track_limits_from_openf1.py [--years 2023,2024] [--cache DIR] [--out FICHERO]
"""

import json
import os
import re
import sys
import time
import urllib.request

API = "https://api.openf1.org/v1"
CACHE = None
CARS = 20

# OpenF1 circuit_short_name -> f1db circuit id (the pack's calendar[].circuitId).
CIRCUITS = {
    "Austin": "austin", "Baku": "baku", "Catalunya": "catalunya", "Hungaroring": "hungaroring", "Imola": "imola",
    "Interlagos": "interlagos", "Jeddah": "jeddah", "Las Vegas": "las-vegas", "Lusail": "lusail", "Melbourne": "melbourne",
    "Mexico City": "mexico-city", "Miami": "miami", "Monte Carlo": "monaco", "Montreal": "montreal", "Monza": "monza",
    "Sakhir": "bahrain", "Shanghai": "shanghai", "Silverstone": "silverstone", "Singapore": "marina-bay",
    "Spa-Francorchamps": "spa-francorchamps", "Spielberg": "spielberg", "Suzuka": "suzuka", "Yas Marina Circuit": "yas-marina",
    "Zandvoort": "zandvoort",
}

OFFENCE = re.compile(r"^CAR (\d+) .*DELETED - TRACK LIMITS")
BLACK_WHITE = re.compile(r"^BLACK AND WHITE FLAG FOR CAR (\d+).*TRACK LIMITS")
PENALTY = re.compile(r"^FIA STEWARDS: (\d+) SECOND TIME PENALTY FOR CAR (\d+).*TRACK LIMITS")


def get(path):
    """GET a JSON list from OpenF1, cached on disk when --cache is given."""
    cached = None
    if CACHE:
        os.makedirs(CACHE, exist_ok=True)
        cached = os.path.join(CACHE, re.sub(r"[^A-Za-z0-9_.-]", "_", path) + ".json")
        if os.path.exists(cached):
            with open(cached, encoding="utf-8") as fh:
                return json.load(fh)
    for attempt in range(4):
        try:
            request = urllib.request.Request(f"{API}/{path}", headers={"User-Agent": "overcut-calibration"})
            with urllib.request.urlopen(request, timeout=60) as response:
                data = json.load(response)
            break
        except Exception:  # noqa: BLE001 - retry on any network error, then give up
            if attempt == 3:
                raise
            time.sleep(3 * (attempt + 1))
    if cached:
        with open(cached, "w", encoding="utf-8") as fh:
            json.dump(data, fh)
    else:
        time.sleep(0.6)
    return data


def race_of(session, messages):
    laps = max([row.get("lap_number") or 0 for row in messages] or [0])
    count = {}
    offences = 0
    ladder = []
    for row in messages:
        text = row.get("message") or ""
        hit = OFFENCE.match(text)
        if hit and "(NEXT LAP" not in text:
            count[hit.group(1)] = count.get(hit.group(1), 0) + 1
            offences += 1
            continue
        flag = BLACK_WHITE.match(text)
        if flag:
            ladder.append({"step": "blackWhite", "atOffence": count.get(flag.group(1), 0)})
            continue
        penalty = PENALTY.match(text)
        if penalty:
            ladder.append({"step": f"time{penalty.group(1)}", "atOffence": count.get(penalty.group(2), 0)})
    return {"year": session["year"], "circuit": session["circuit_short_name"], "laps": laps, "offences": offences, "ladder": ladder}


def main(argv):
    global CACHE
    years = [2023, 2024]
    out_path = None
    i = 0
    while i < len(argv):
        if argv[i] == "--years":
            years = [int(y) for y in argv[i + 1].split(",")]
            i += 2
        elif argv[i] == "--cache":
            CACHE = argv[i + 1]
            i += 2
        elif argv[i] == "--out":
            out_path = argv[i + 1]
            i += 2
        else:
            raise SystemExit(f"unknown argument {argv[i]}")
    races = []
    for year in years:
        for session in get(f"sessions?year={year}&session_name=Race"):
            if session.get("is_cancelled"):
                continue
            races.append(race_of(session, get(f"race_control?session_key={session['session_key']}")))
    races = [race for race in races if race["laps"] > 0]
    total = sum(race["offences"] for race in races)
    car_laps = sum(CARS * race["laps"] for race in races)
    by_circuit = {}
    for race in races:
        by_circuit.setdefault(CIRCUITS.get(race["circuit"], race["circuit"]), []).append(race["offences"] / (CARS * race["laps"]))
    out = {
        "source": "https://api.openf1.org/v1/race_control",
        "years": years,
        "races": len(races),
        "offences": total,
        "carLaps": car_laps,
        "perCarLap": round(total / car_laps, 5),
        "circuits": {key: round(sum(values) / len(values), 5) for key, values in sorted(by_circuit.items())},
        "ladder": [step for race in races for step in race["ladder"]],
    }
    text = json.dumps(out, ensure_ascii=False, indent=1)
    if out_path:
        with open(out_path, "w", encoding="utf-8") as fh:
            fh.write(text)
    else:
        print(text)


if __name__ == "__main__":
    main(sys.argv[1:])
