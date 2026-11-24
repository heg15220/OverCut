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

Con --shifts (F1M24-GAMEPLAY §2.4 `tren-por-pu`, paquete PT-1) solo rehace la clave `shifts` del mismo fichero
con carreras enteras de 2023-2025 (todos los pilotos), y escribe las cifras agrupadas por fabricante que copia
data/balance/race-powertrain.json (`eras[].manufacturers`, `eras[].pitLimiter`, `shift.underSc`):
  - punto de cambio por equipo: cada cambio ascendente a fondo de 3.ª a 7.ª, visto como la caída de rpm (el canal
    n_gear llega una muestra tarde); el punto es la última muestra antes de la caída más medio intervalo a la
    pendiente de rpm que llevaba (a 3,7 Hz la última muestra se queda ~150 rpm corta);
  - km/h por 1000 rpm por marcha y equipo, a fondo y por encima de 8000 rpm (forma de la caja);
  - marcha y rpm con el limitador: muestras a 76-81 km/h dentro del pit lane (`pit`: `date` es la salida y
    `lane_duration` el tiempo en el carril);
  - cambio bajo coche de seguridad: mediana de todos los cambios ascendentes entre SAFETY CAR DEPLOYED y SAFETY
    CAR IN THIS LAP (`race_control`, desde 30 s después del despliegue) frente a los de bandera verde.

    python overcut/src/main/resources/scripts/powertrain_from_openf1.py --shifts [--cache DIR]
"""

import collections
import datetime as dt
import hashlib
import json
import statistics
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


# --cache DIR: guarda cada respuesta en DIR (nombre = sha1 de la ruta) y la reutiliza; las tiradas largas de
# --shifts (car_data de carreras enteras, 20 pilotos) no se vuelven a descargar.
CACHE = None


def get(path, tries=6, missing_ok=False):
    # OpenF1 limita las peticiones por segundo: pausa entre llamadas y reintento con espera creciente ante 429.
    # OpenF1 responde 404 cuando no hay filas (p. ej. `pit` de Baréin 2023): con missing_ok vale como lista vacía.
    cached = os.path.join(CACHE, hashlib.sha1(path.encode()).hexdigest() + ".json") if CACHE else None
    if cached and os.path.exists(cached):
        with open(cached, encoding="utf-8") as handle:
            return json.load(handle)
    for attempt in range(tries):
        time.sleep(1.0 + 3.0 * attempt)
        try:
            with urllib.request.urlopen(f"{API}/{path}", timeout=120) as response:
                data = json.load(response)
            break
        except urllib.error.HTTPError as error:
            if error.code == 404 and missing_ok:
                data = []
                break
            if error.code not in (429, 502, 503) or attempt == tries - 1:
                raise
    else:
        raise RuntimeError(path)
    if cached:
        with open(cached, "w", encoding="utf-8") as handle:
            json.dump(data, handle)
    return data


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


# --shifts: carreras enteras (año, circuit_short_name). Baréin 2023-2025 sin coche de seguridad; Yeda y Lusail
# 2024 con él (uno y tres despliegues).
SHIFT_SESSIONS = [
    (2023, "Sakhir"),
    (2024, "Sakhir"),
    (2024, "Jeddah"),
    (2024, "Lusail"),
    (2025, "Sakhir"),
]

# team_name de OpenF1 -> fabricante del motor tal como lo nombra el pack (teams[].engines[].manufacturer).
ENGINE_OF_TEAM = {
    "Red Bull Racing": "honda-rbpt", "AlphaTauri": "honda-rbpt", "RB": "honda-rbpt", "Racing Bulls": "honda-rbpt",
    "Ferrari": "ferrari", "Haas F1 Team": "ferrari", "Alfa Romeo": "ferrari", "Kick Sauber": "ferrari",
    "Mercedes": "mercedes", "McLaren": "mercedes", "Aston Martin": "mercedes", "Williams": "mercedes",
    "Alpine": "renault",
}

GEARS = 8
LIMITER_KMH = (76, 81)


def ts(row):
    return dt.datetime.fromisoformat(row["date"]).timestamp()


def neutralised(session_key):
    """Spells under the safety car: SAFETY CAR DEPLOYED .. SAFETY CAR IN THIS LAP (race_control)."""
    spells, opened = [], None
    for message in get(f"race_control?session_key={session_key}", missing_ok=True):
        text = message.get("message") or ""
        if text.startswith("SAFETY CAR DEPLOYED"):
            opened = dt.datetime.fromisoformat(message["date"]).timestamp()
        elif text.startswith("SAFETY CAR IN THIS LAP") and opened is not None:
            spells.append((opened, dt.datetime.fromisoformat(message["date"]).timestamp()))
            opened = None
    return spells


def shift_session(year, circuit):
    session = session_key(year, circuit, "Race")
    key = session["session_key"]
    spells = neutralised(key)
    pits = get(f"pit?session_key={key}", missing_ok=True)
    teams = collections.defaultdict(lambda: {"shifts": [], "ratios": collections.defaultdict(list)})
    limiter_gears, limiter_rpm = collections.Counter(), collections.defaultdict(list)
    green_up, sc_up = [], []
    for driver in get(f"drivers?session_key={key}"):
        number, team = driver["driver_number"], driver["team_name"]
        rows = get(f"car_data?session_key={key}&driver_number={number}")
        if not rows:
            continue
        t = [ts(row) for row in rows]
        lanes = []
        for stop in pits:
            if stop["driver_number"] == number and (stop.get("lane_duration") or stop.get("pit_duration")):
                end = dt.datetime.fromisoformat(stop["date"]).timestamp()
                lanes.append((end - (stop.get("lane_duration") or stop.get("pit_duration")), end))
        in_lane = lambda when: any(lo <= when <= hi for lo, hi in lanes)
        wide_lane = lambda when: any(lo - 5 <= when <= hi + 3 for lo, hi in lanes)
        under_sc = lambda when: any(lo + 30 <= when <= hi for lo, hi in spells)
        stats = teams[team]
        for k in range(2, len(rows) - 1):
            z, a, b = rows[k - 2], rows[k - 1], rows[k]
            if in_lane(t[k]) and LIMITER_KMH[0] <= b["speed"] <= LIMITER_KMH[1] and b["n_gear"] > 0:
                limiter_gears[b["n_gear"]] += 1
                limiter_rpm[b["n_gear"]].append(b["rpm"])
            if wide_lane(t[k - 1]):
                continue
            # Every upshift (gear channel), green against the safety car: the highest of the last two rpm in the old gear.
            if b["n_gear"] == a["n_gear"] + 1 and a["n_gear"] >= 1 and t[k] - t[k - 1] <= 0.45:
                before = [r["rpm"] for r in rows[k - 2:k] if r["n_gear"] == a["n_gear"]]
                (sc_up if under_sc(t[k - 1]) else green_up).append(max(before))
            if under_sc(t[k - 1]):
                continue
            if b["rpm"] > 8000 and b["throttle"] >= 95 and b["speed"] > 30 and 1 <= b["n_gear"] <= GEARS:
                stats["ratios"][b["n_gear"]].append(b["speed"] / b["rpm"] * 1000)
            # Full-throttle upshift 3rd..7th seen as the rpm drop; the gear channel follows within two samples.
            if not (3 <= z["n_gear"] <= 7 and b["rpm"] < a["rpm"] - 700 and a["rpm"] > z["rpm"]):
                continue
            if not (b["speed"] >= a["speed"] >= z["speed"]) or max(rows[k + 1]["n_gear"], b["n_gear"]) <= z["n_gear"]:
                continue
            if min(z["throttle"], a["throttle"], b["throttle"]) < 95:
                continue
            gap, lead = t[k] - t[k - 1], t[k - 1] - t[k - 2]
            if gap > 0.45 or not (0 < lead <= 0.45):
                continue
            rate = (a["rpm"] - z["rpm"]) / lead
            stats["shifts"].append(a["rpm"] + min(rate * gap / 2, 1500))
    out_teams = []
    for team in sorted(teams):
        stats = teams[team]
        if len(stats["shifts"]) < 50:
            continue
        ratios = [round(statistics.median(stats["ratios"][g]), 3) if len(stats["ratios"][g]) >= 20 else None
                  for g in range(1, GEARS + 1)]
        out_teams.append({"team": team, "manufacturer": ENGINE_OF_TEAM.get(team), "shifts": len(stats["shifts"]),
                          "shiftRpm": round(statistics.median(stats["shifts"])), "kmhPerKrpm": ratios})
    gear = limiter_gears.most_common(1)[0][0] if limiter_gears else None
    return {
        "year": year, "openf1": circuit, "sessionKey": key,
        "teams": out_teams,
        "pitLimiter": {"kmh": list(LIMITER_KMH), "gears": {str(g): n for g, n in sorted(limiter_gears.items())},
                       "gear": gear, "rpm": round(statistics.median(limiter_rpm[gear])) if gear else None},
        "underSc": {"spells": len(spells), "upshifts": len(sc_up),
                    "share": round(statistics.median(sc_up) / statistics.median(green_up), 3) if sc_up else None},
    }


def pooled(sessions):
    """By manufacturer over every session: median shift rpm of the teams' shifts, and the gear shape."""
    by = collections.defaultdict(lambda: {"shift": [], "ratio": collections.defaultdict(list)})
    for session in sessions:
        for team in session["teams"]:
            entry = by[team["manufacturer"]]
            entry["shift"].append(team["shiftRpm"])
            for g, value in enumerate(team["kmhPerKrpm"]):
                if value is not None:
                    entry["ratio"][g].append(value)
    out = {}
    for name, entry in sorted(by.items()):
        top = statistics.median(entry["ratio"][GEARS - 1])
        out[name] = {
            "shiftRpm": round(statistics.median(entry["shift"]) / 10) * 10,
            # Gears 1-2 rarely run flat out above 8000 rpm in a race: left to the measured field shape (null).
            "gearShares": [round(statistics.median(entry["ratio"][g]) / top, 3) if g >= 2 and len(entry["ratio"][g]) >= 3 else None
                           for g in range(GEARS)],
        }
        out[name]["gearShares"][GEARS - 1] = 1
    return out


def shifts_main():
    with open(OUT, encoding="utf-8") as handle:
        fixture = json.load(handle)
    sessions = []
    for year, circuit in SHIFT_SESSIONS:
        print(f"{year} {circuit} (carrera)…", file=sys.stderr)
        sessions.append(shift_session(year, circuit))
    fixture["shifts"] = {
        "$comment": "Generado por powertrain_from_openf1.py --shifts (F1M24-GAMEPLAY §2.4, PT-1). teams[].shiftRpm: "
                    "mediana del punto de cambio a fondo de 3.ª a 7.ª (caída de rpm + medio intervalo a la pendiente); "
                    "kmhPerKrpm: km/h por 1000 rpm por marcha (null: < 20 muestras); pitLimiter: marchas a 76-81 km/h "
                    "dentro del carril y rpm de la más usada; underSc.share: mediana de los cambios ascendentes bajo SC "
                    "entre la de bandera verde. pooled: lo que copia race-powertrain.json eras[2022-2025].manufacturers.",
        "sessions": sessions,
        "pooled": pooled(sessions),
    }
    with open(OUT, "w", encoding="utf-8") as handle:
        json.dump(fixture, handle, separators=(",", ":"))
    print(json.dumps(fixture["shifts"]["pooled"], indent=1))
    for session in sessions:
        print(session["year"], session["openf1"], session["pitLimiter"], session["underSc"])
    print(OUT)


if __name__ == "__main__":
    if "--cache" in sys.argv:
        CACHE = sys.argv[sys.argv.index("--cache") + 1]
        os.makedirs(CACHE, exist_ok=True)
    if "--shifts" in sys.argv:
        shifts_main()
    else:
        main()
