"""
Estorbos (impeding) en libres y clasificación reales para calibrar el tráfico de las sesiones jugables del Manager
(paquete SES-8 de docs/manager/F1M24-GAMEPLAY.md §2.12.3 `trafico-sesion`; RF-WKD-02, RF-SIM-06, RNF-07).

Fuente: OpenF1 (https://openf1.org, API pública e histórica; `race_control` desde 2023). Ningún dato personal en las
peticiones: solo año, tipo de sesión y claves de sesión. La salida solo lleva recuentos, nunca nombres ni dorsales.

Para cada sesión de libres, clasificación y clasificación sprint de los años pedidos:
  - un incidente es un par de coches en un mensaje de race_control que acaba en «- IMPEDING» («INCIDENT INVOLVING
    CARS 11 (PER) AND 27 (HUL) NOTED - IMPEDING»); los mensajes siguientes del mismo par en la misma sesión
    (investigación, revisado sin más, sanción) son el mismo incidente;
  - desenlace: «REVIEWED NO FURTHER» (revisado), «WILL BE INVESTIGATED» / «UNDER INVESTIGATION» (investigado), y la
    decisión «N PLACE GRID PENALTY» o «REPRIMAND» cuando el mensaje de la sanción llega en la misma sesión (si llega
    después, en otra sesión o por documento, no está en el recuento: OpenF1 no lo trae).

Escribe en la salida estándar (o en --out) un JSON con, por tipo de sesión: sesiones, incidentes, incidentes por
sesión, parte investigada y sanciones vistas (la cifra que copia data/balance/sessions.json `traffic.impeding.measured`).
Sin dependencias fuera de la biblioteca estándar.

    python overcut/src/main/resources/scripts/session_impeding_from_openf1.py [--years 2023,2024] [--cache DIR] [--out FICHERO]
"""

import hashlib
import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

API = "https://api.openf1.org/v1"
KINDS = {"Practice": "practice", "Qualifying": "qualifying"}
CACHE = None
PAIR = re.compile(r"CARS? (\d+) \([A-Z]{3}\)(?: AND (\d+) \([A-Z]{3}\))?")
GRID = re.compile(r"(\d+) PLACE GRID PENALTY")


def get(path):
    key = hashlib.sha1(path.encode()).hexdigest()
    if CACHE:
        cached = os.path.join(CACHE, key + ".json")
        if os.path.exists(cached):
            with open(cached, encoding="utf-8") as handle:
                return json.load(handle)
    request = urllib.request.Request(API + path, headers={"User-Agent": "overcut-calibration"})
    data = None
    for attempt in range(8):
        try:
            with urllib.request.urlopen(request, timeout=120) as response:
                data = json.loads(response.read().decode())
            break
        except urllib.error.HTTPError as error:
            if error.code == 404:  # OpenF1: "No results found." (sesión sin mensajes)
                data = []
                break
            time.sleep(5 + attempt * 5)
        except Exception:  # noqa: BLE001 - reintento simple ante límites de la API
            time.sleep(5 + attempt * 5)
    if data is None:
        raise RuntimeError("OpenF1 sin respuesta: " + path)
    if CACHE:
        os.makedirs(CACHE, exist_ok=True)
        with open(os.path.join(CACHE, key + ".json"), "w", encoding="utf-8") as handle:
            json.dump(data, handle)
    time.sleep(1.0)
    return data


def incidents_of(messages):
    """The impeding incidents of one session: {pair: {"investigated": bool, "reviewed": bool, "grid": n|None, "reprimand": bool}}."""
    out = {}
    for row in sorted(messages, key=lambda r: r.get("date") or ""):
        text = (row.get("message") or "").upper()
        if "IMPEDING" not in text:
            continue
        match = PAIR.search(text)
        if not match:
            continue
        cars = tuple(sorted(n for n in match.groups() if n))
        if len(cars) == 1:
            # A decision names one car: it belongs to the open incident that has it.
            known = [pair for pair in out if cars[0] in pair]
            pair = known[-1] if known else cars
        else:
            pair = cars
        item = out.setdefault(pair, {"investigated": False, "reviewed": False, "grid": None, "reprimand": False})
        if "WILL BE INVESTIGATED" in text or "UNDER INVESTIGATION" in text:
            item["investigated"] = True
        if "REVIEWED NO FURTHER" in text or "NO FURTHER ACTION" in text or "NO FURTHER INVESTIGATION" in text:
            item["reviewed"] = True
        grid = GRID.search(text)
        if grid:
            item["grid"] = int(grid.group(1))
        if "REPRIMAND" in text:
            item["reprimand"] = True
    return out


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
            i += 1
    stats = {}
    for year in years:
        for openf1_type, kind in KINDS.items():
            sessions = get("/sessions?" + urllib.parse.urlencode({"year": year, "session_type": openf1_type}))
            for session in sessions:
                name = session.get("session_name", "")
                key = "shootout" if "Sprint" in name else kind
                messages = get("/race_control?" + urllib.parse.urlencode({"session_key": session["session_key"]}))
                found = incidents_of(messages)
                row = stats.setdefault(key, {"sessions": 0, "incidents": [], "withAny": 0})
                row["sessions"] += 1
                row["withAny"] += 1 if found else 0
                row["incidents"].extend(found.values())
    result = {"source": "OpenF1 race_control (api.openf1.org), mensajes «- IMPEDING»", "years": years, "kinds": {}}
    for key, row in stats.items():
        items = row["incidents"]
        n = len(items)
        grids = sorted({item["grid"] for item in items if item["grid"]})
        result["kinds"][key] = {
            "sessions": row["sessions"],
            "incidents": n,
            "perSession": round(n / row["sessions"], 3) if row["sessions"] else None,
            "sessionsWithAny": row["withAny"],
            "investigatedShare": round(sum(1 for item in items if item["investigated"]) / n, 3) if n else None,
            "gridPenalties": sum(1 for item in items if item["grid"]),
            "gridPlaces": grids,
            "reprimands": sum(1 for item in items if item["reprimand"]),
        }
    text = json.dumps(result, indent=2, ensure_ascii=False)
    if out_path:
        with open(out_path, "w", encoding="utf-8") as handle:
            handle.write(text + "\n")
    else:
        print(text)


if __name__ == "__main__":
    main(sys.argv[1:])
