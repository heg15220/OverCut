"""
Amarillas en libres y clasificación reales para calibrar las amarillas de las sesiones jugables del Manager
(paquete SES-3 de docs/manager/F1M24-GAMEPLAY.md §2.12.1 `flag-header-sectors`, §1.7 evento `yellow`;
RF-SIM-10, RF-WKD-02, RNF-07).

Fuente: OpenF1 (https://openf1.org, API pública e histórica; `race_control` desde 2023). Ningún dato personal en
las peticiones: solo año, tipo de sesión y claves de sesión.

Para cada sesión de libres y de clasificación de los años pedidos:
  - un episodio es un mensaje `flag` YELLOW o DOUBLE YELLOW con `scope` Sector (sector de comisarios de OpenF1, no
    el sector de cronometraje) hasta el primer CLEAR del mismo sector (o la bandera roja, la a cuadros o el final);
  - los episodios que empiezan con el sector ya en amarilla no se cuentan dos veces (DOUBLE sobre YELLOW sube la
    bandera, no abre otro);
  - los episodios de menos de MIN_SEC segundos se cuentan aparte (`flicker`): son la bandera que se pone y quita en
    el mismo segundo, sin incidente que mostrar;
  - las amarillas de toda la pista (`scope` Track) y las que caen bajo bandera roja no cuentan: no son locales.

Escribe en la salida estándar (o en --out) un JSON con, por tipo de sesión: sesiones, horas, episodios por hora,
parte de dobles y mediana, p10 y p90 de la duración (la cifra que copia data/balance/sessions.json
`yellow.measured`). Sin dependencias fuera de la biblioteca estándar.

    python overcut/src/main/resources/scripts/session_yellows_from_openf1.py [--years 2023,2024] [--cache DIR] [--out FICHERO]
"""

import datetime as dt
import hashlib
import json
import os
import statistics
import sys
import time
import urllib.parse
import urllib.error
import urllib.request

API = "https://api.openf1.org/v1"
KINDS = {"Practice": "practice", "Qualifying": "qualifying"}
MIN_SEC = 5
CACHE = None


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


def when(text):
    return dt.datetime.fromisoformat(text.replace("Z", "+00:00"))


def episodes_of(session, messages):
    start = when(session["date_start"])
    end = when(session["date_end"])
    open_ = {}
    out = []
    red = False
    for row in sorted(messages, key=lambda r: r["date"]):
        at = when(row["date"])
        flag = row.get("flag")
        if flag == "RED":
            red = True
            for sector, ep in open_.items():
                ep["end"] = at
                out.append(ep)
            open_ = {}
            continue
        if flag == "GREEN" and row.get("scope") == "Track":
            red = False
        if flag == "CHEQUERED":
            for ep in open_.values():
                ep["end"] = at
                out.append(ep)
            open_ = {}
            continue
        if row.get("scope") != "Sector" or row.get("sector") is None:
            continue
        sector = row["sector"]
        if flag in ("YELLOW", "DOUBLE YELLOW"):
            if red:
                continue
            if sector in open_:
                if flag == "DOUBLE YELLOW":
                    open_[sector]["double"] = True
                continue
            open_[sector] = {"sector": sector, "start": at, "double": flag == "DOUBLE YELLOW"}
        elif flag == "CLEAR" and sector in open_:
            ep = open_.pop(sector)
            ep["end"] = at
            out.append(ep)
    for ep in open_.values():
        ep["end"] = end
        out.append(ep)
    # Episodes that overlap (one incident, several marshal sectors) count once, the longest.
    out.sort(key=lambda ep: ep["start"])
    merged = []
    for ep in out:
        if merged and ep["start"] <= merged[-1]["end"]:
            last = merged[-1]
            last["end"] = max(last["end"], ep["end"])
            last["double"] = last["double"] or ep["double"]
            last["sectors"] += 1
            continue
        merged.append({**ep, "sectors": 1})
    hours = (end - start).total_seconds() / 3600
    return merged, hours


def quantile(values, q):
    if not values:
        return None
    ordered = sorted(values)
    pos = (len(ordered) - 1) * q
    lo = int(pos)
    hi = min(lo + 1, len(ordered) - 1)
    return round(ordered[lo] + (ordered[hi] - ordered[lo]) * (pos - lo), 1)


def spread(values):
    return {"n": len(values), "p10": quantile(values, 0.1), "median": quantile(values, 0.5), "p90": quantile(values, 0.9), "max": quantile(values, 1.0)}


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
                if "Sprint" in name:
                    continue
                messages = get("/race_control?" + urllib.parse.urlencode({"session_key": session["session_key"]}))
                eps, hours = episodes_of(session, messages)
                row = stats.setdefault(kind, {"sessions": 0, "hours": 0.0, "episodes": [], "flicker": 0})
                row["sessions"] += 1
                row["hours"] += hours
                for ep in eps:
                    sec = (ep["end"] - ep["start"]).total_seconds()
                    if sec < MIN_SEC:
                        row["flicker"] += 1
                        continue
                    row["episodes"].append({"sec": sec, "double": ep["double"], "sectors": ep["sectors"]})
    result = {"source": "OpenF1 race_control (api.openf1.org)", "years": years, "minSec": MIN_SEC, "kinds": {}}
    for kind, row in stats.items():
        secs = [ep["sec"] for ep in row["episodes"]]
        n = len(secs)
        result["kinds"][kind] = {
            "sessions": row["sessions"],
            "hours": round(row["hours"], 1),
            "episodes": n,
            "perHour": round(n / row["hours"], 2) if row["hours"] else None,
            "perSession": round(n / row["sessions"], 2) if row["sessions"] else None,
            "doubleShare": round(sum(1 for ep in row["episodes"] if ep["double"]) / n, 3) if n else None,
            "median": quantile(secs, 0.5),
            "p10": quantile(secs, 0.1),
            "p90": quantile(secs, 0.9),
            "single": spread([ep["sec"] for ep in row["episodes"] if not ep["double"]]),
            "double": spread([ep["sec"] for ep in row["episodes"] if ep["double"]]),
            "flicker": row["flicker"],
        }
    every = [ep for row in stats.values() for ep in row["episodes"]]
    result["all"] = {
        "episodes": len(every),
        "single": spread([ep["sec"] for ep in every if not ep["double"]]),
        "double": spread([ep["sec"] for ep in every if ep["double"]]),
    }
    text = json.dumps(result, indent=2, ensure_ascii=False)
    if out_path:
        with open(out_path, "w", encoding="utf-8") as handle:
            handle.write(text + "\n")
    else:
        print(text)


if __name__ == "__main__":
    main(sys.argv[1:])
