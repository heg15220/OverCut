"""
Telemetría real para validar la transmisión del Manager (RF-SIM-01, RF-SIM-02, RF-DEV-01;
docs/manager/SIM-FISICA.md §7, bloque "Unidad de potencia, marchas e inercia").

Fuente: OpenF1 (https://openf1.org, API pública e histórica, `car_data` a ~3,7 Hz desde 2023). FastF1 3.9
exige ya una cuenta de F1 para la telemetría, así que no se usa.

Saca, para cada sesión pedida:
  - la vuelta más rápida del poleman en clasificación: tiempo, velocidad (km/h), rpm, marcha, acelerador y
    freno contra el tiempo desde el inicio de la vuelta (la distancia se integra en el test);
  - la salida de la carrera del mismo GP: las primeras muestras desde la última parada en la parrilla.

Escribe overcut/frontend/src/modules/overcutManager/engine/sim/__fixtures__/openf1-powertrain.json, que lee
engine/sim/powertrain.test.js. Sin dependencias fuera de la biblioteca estándar.

    python overcut/src/main/resources/scripts/powertrain_from_openf1.py
"""

import datetime as dt
import json
import os
import sys
import time
import urllib.error
import urllib.request

API = "https://api.openf1.org/v1"
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.normpath(os.path.join(HERE, "..", "..", "..", "..", "frontend", "src", "modules", "overcutManager",
                                    "engine", "sim", "__fixtures__", "openf1-powertrain.json"))

# (año, circuit_short_name de OpenF1, circuito del Manager, poleman, quien se mira en la salida)
SESSIONS = [
    (2024, "Monza", "monza", 4, 4),
    (2024, "Sakhir", "bahrain", 1, 1),
]


def get(path, tries=6):
    # OpenF1 limita las peticiones por segundo: pausa entre llamadas y reintento con espera creciente ante 429.
    for attempt in range(tries):
        time.sleep(1.0 + 3.0 * attempt)
        try:
            with urllib.request.urlopen(f"{API}/{path}", timeout=90) as response:
                return json.load(response)
        except urllib.error.HTTPError as error:
            if error.code != 429 or attempt == tries - 1:
                raise
    raise RuntimeError(path)


def iso(value):
    return value.isoformat().replace("+00:00", "")


def session_key(year, circuit, name):
    found = get(f"sessions?year={year}&session_name={name}&circuit_short_name={circuit}")
    if not found:
        raise SystemExit(f"OpenF1 no tiene {name} {year} {circuit}")
    return found[0]


def pole_lap(year, circuit, driver):
    session = session_key(year, circuit, "Qualifying")
    laps = [lap for lap in get(f"laps?session_key={session['session_key']}&driver_number={driver}") if lap.get("lap_duration")]
    best = min(laps, key=lambda lap: lap["lap_duration"])
    start = dt.datetime.fromisoformat(best["date_start"])
    end = start + dt.timedelta(seconds=best["lap_duration"])
    rows = get(f"car_data?session_key={session['session_key']}&driver_number={driver}"
               f"&date>={iso(start - dt.timedelta(seconds=1))}&date<={iso(end + dt.timedelta(seconds=1))}")
    samples = []
    for row in rows:
        t = (dt.datetime.fromisoformat(row["date"]) - start).total_seconds()
        if 0 <= t <= best["lap_duration"]:
            samples.append([round(t, 3), row["speed"], row["rpm"], row["n_gear"], row["throttle"], row["brake"]])
    return {"sessionKey": session["session_key"], "driver": driver, "lapTime": best["lap_duration"], "samples": samples}


def race_start(year, circuit, driver):
    session = session_key(year, circuit, "Race")
    t0 = dt.datetime.fromisoformat(session["date_start"])
    rows = get(f"car_data?session_key={session['session_key']}&driver_number={driver}"
               f"&date>={iso(t0)}&date<={iso(t0 + dt.timedelta(minutes=12))}")
    rows = [((dt.datetime.fromisoformat(r["date"]) - t0).total_seconds(), r["speed"], r["rpm"], r["n_gear"], r["throttle"]) for r in rows]
    # La salida: la última muestra parada seguida de 40 en movimiento (después de la vuelta de formación).
    stops = [i for i, r in enumerate(rows) if r[1] == 0 and i + 40 < len(rows) and all(x[1] > 0 for x in rows[i + 1:i + 41])]
    if not stops:
        raise SystemExit(f"sin salida en {year} {circuit}")
    first = stops[-1]
    zero = rows[first][0]
    samples = [[round(r[0] - zero, 3), r[1], r[2], r[3], r[4]] for r in rows[first:first + 40]]
    return {"sessionKey": session["session_key"], "driver": driver, "samples": samples}


def main():
    out = {
        "$comment": "Telemetría real de OpenF1 (https://openf1.org, car_data ~3,7 Hz) para engine/sim/powertrain.test.js. "
                    "Generado por overcut/src/main/resources/scripts/powertrain_from_openf1.py; no editar a mano. "
                    "lap.samples: [t s, km/h, rpm, marcha, acelerador %, freno 0/100]; start.samples: [t s desde la última muestra parada, km/h, rpm, marcha, acelerador %].",
        "source": "OpenF1 API v1 (sessions, laps, car_data)",
        "sessions": [],
    }
    for year, circuit, ref, pole, starter in SESSIONS:
        print(f"{year} {circuit}…", file=sys.stderr)
        out["sessions"].append({"year": year, "circuit": ref, "openf1": circuit,
                                "lap": pole_lap(year, circuit, pole), "start": race_start(year, circuit, starter)})
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as handle:
        json.dump(out, handle, separators=(",", ":"))
    print(OUT)


if __name__ == "__main__":
    main()
