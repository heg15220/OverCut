"""
Salida del garaje en sesiones reales para calibrar el garaje físico del Manager (paquete SES-2 de
docs/manager/F1M24-GAMEPLAY.md §2.2 `salida-boxes-sesion`; RF-WKD-02, RF-SIM-12, RNF-07).

Fuente: OpenF1 (https://openf1.org, API pública e histórica; `car_data` a ~3,7 Hz desde 2023). Ningún dato
personal en las peticiones: solo claves de sesión y dorsales.

Para cada sesión pedida (libres y clasificación de un GP) y cada piloto:
  - una salida del garaje es el primer movimiento (speed > 0) tras una parada de al menos STAND_SEC segundos con
    el motor apagado en algún momento (rpm < ENGINE_OFF_RPM): así no cuentan las paradas de práctica en el box ni
    la espera con el motor en marcha en el semáforo de salida;
  - el coche está «en pista» cuando pasa de OUT_KMH (por encima del límite de 80 km/h de 2024 con margen: el
    final de la zona limitada);
  - las salidas en los primeros OPENING_SEC segundos de la sesión se guardan aparte (`opening`): son la cola del
    semáforo cuando se abre el pit lane.

Escribe en la salida estándar (o en --out) un JSON con, por sesión y en total: n, mediana, p10 y p90 en
segundos de garaje → pista (`practice`: solo libres, la cifra que copia data/balance/sessions.json
`garage.exit.measured`). Sin dependencias fuera
de la biblioteca estándar.

    python overcut/src/main/resources/scripts/garage_exit_from_openf1.py [--cache DIR] [--out FICHERO]
"""

import datetime as dt
import hashlib
import json
import os
import statistics
import sys
import time
import urllib.request

API = "https://api.openf1.org/v1"
SESSIONS = [
    # (año, circuit_short_name de OpenF1, nombres de sesión)
    (2024, "Sakhir", ["Practice 1", "Practice 2", "Practice 3", "Qualifying"]),
]
STAND_SEC = 30
ENGINE_OFF_RPM = 2500
OUT_KMH = 90
OPENING_SEC = 120
MAX_EXIT_SEC = 120
CACHE = None


def get(path):
    key = hashlib.sha1(path.encode()).hexdigest()
    if CACHE:
        cached = os.path.join(CACHE, key + ".json")
        if os.path.exists(cached):
            with open(cached, encoding="utf-8") as handle:
                return json.load(handle)
    request = urllib.request.Request(API + path, headers={"User-Agent": "overcut-calibration"})
    for attempt in range(5):
        try:
            with urllib.request.urlopen(request, timeout=120) as response:
                data = json.loads(response.read().decode())
            break
        except Exception:  # noqa: BLE001 - reintento simple ante límites de la API
            time.sleep(5 * (attempt + 1))
    else:
        raise RuntimeError("OpenF1 no responde: " + path)
    if CACHE:
        os.makedirs(CACHE, exist_ok=True)
        with open(os.path.join(CACHE, key + ".json"), "w", encoding="utf-8") as handle:
            json.dump(data, handle)
    else:
        time.sleep(1.5)
    return data


def when(text):
    return dt.datetime.fromisoformat(text.replace("Z", "+00:00")).timestamp()


def exits_of(samples, session_start):
    """Las salidas del garaje de un piloto: [(segundos garaje → pista, es de la apertura)]."""
    rows = sorted(((when(s["date"]), s["speed"] or 0, s["rpm"] or 0) for s in samples), key=lambda r: r[0])
    out = []
    i = 0
    n = len(rows)
    while i < n:
        if rows[i][1] != 0:
            i += 1
            continue
        j = i
        low_rpm = rows[i][2] < ENGINE_OFF_RPM
        while j + 1 < n and rows[j + 1][1] == 0:
            j += 1
            low_rpm = low_rpm or rows[j][2] < ENGINE_OFF_RPM
        stand = rows[j][0] - rows[i][0]
        if j + 1 < n and stand >= STAND_SEC and low_rpm:
            move = rows[j + 1][0]
            k = j + 1
            while k < n and rows[k][1] <= OUT_KMH and rows[k][0] - move <= MAX_EXIT_SEC:
                k += 1
            if k < n and rows[k][1] > OUT_KMH:
                # Medio intervalo de muestreo antes de la primera muestra por encima del umbral.
                t_out = rows[k][0] - (rows[k][0] - rows[k - 1][0]) / 2
                out.append((round(t_out - move, 2), move - session_start < OPENING_SEC))
        i = j + 1
    return out


def summary(values):
    values = sorted(values)
    if not values:
        return {"n": 0}
    q = statistics.quantiles(values, n=10) if len(values) >= 10 else [values[0]] * 9
    return {"n": len(values), "median": round(statistics.median(values), 2), "p10": round(q[0], 2), "p90": round(q[-1], 2),
            "min": values[0], "max": values[-1]}


def main():
    global CACHE
    args = sys.argv[1:]
    out_path = None
    if "--cache" in args:
        CACHE = args[args.index("--cache") + 1]
    if "--out" in args:
        out_path = args[args.index("--out") + 1]
    result = {"source": "OpenF1 car_data (api.openf1.org)", "rule": {
        "standSec": STAND_SEC, "engineOffRpm": ENGINE_OFF_RPM, "outKmh": OUT_KMH, "openingSec": OPENING_SEC}, "sessions": []}
    free_all, opening_all, practice_all = [], [], []
    for year, circuit, names in SESSIONS:
        sessions = get(f"/sessions?year={year}&circuit_short_name={circuit}")
        for name in names:
            session = next((s for s in sessions if s["session_name"] == name), None)
            if not session:
                continue
            key = session["session_key"]
            start = when(session["date_start"])
            drivers = sorted({d["driver_number"] for d in get(f"/drivers?session_key={key}")})
            free, opening = [], []
            for number in drivers:
                for seconds, at_opening in exits_of(get(f"/car_data?session_key={key}&driver_number={number}"), start):
                    (opening if at_opening else free).append(seconds)
            free_all += free
            if name.startswith("Practice"):
                practice_all += free
            opening_all += opening
            result["sessions"].append({"year": year, "circuit": circuit, "session": name, "sessionKey": key,
                                       "free": summary(free), "opening": summary(opening)})
    # Libres por separado: en clasificación los coches esperan en el semáforo al final del carril antes de cada
    # segmento (la espera cuenta como salida), así que no sirven para medir el recorrido.
    result["practice"] = summary(practice_all)
    result["free"] = summary(free_all)
    result["opening"] = summary(opening_all)
    text = json.dumps(result, indent=2, ensure_ascii=False)
    if out_path:
        with open(out_path, "w", encoding="utf-8") as handle:
            handle.write(text + "\n")
    print(text)


if __name__ == "__main__":
    main()
