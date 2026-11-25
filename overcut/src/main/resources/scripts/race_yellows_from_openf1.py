"""
Amarillas locales en carrera reales para calibrar las del modo por pasos del Manager (paquete SIM-4 de
docs/manager/F1M24-GAMEPLAY.md §2.10 `amarilla-sector`, §1.7 evento `yellow`; RF-SIM-10, RNF-07).

Fuente: OpenF1 (https://openf1.org, API pública e histórica; `race_control` desde 2023). Ningún dato personal en
las peticiones: solo año, tipo de sesión y claves de sesión. Reutiliza la lectura de episodios de
session_yellows_from_openf1.py (SES-3): un episodio es un YELLOW o DOUBLE YELLOW de un sector de comisarios hasta su
CLEAR, los solapados como uno, sin los de menos de MIN_SEC segundos.

En carrera, además:
  - no cuentan los episodios que se solapan con un coche de seguridad o un VSC (desde «DEPLOYED» hasta «IN THIS LAP»
    / «ENDING» y la siguiente bandera verde, o la siguiente CLEAR de pista): el modo por pasos solo agita amarillas
    locales con bandera verde (bajo SC la amarilla es de toda la pista);
  - no cuentan los de la vuelta de formación ni los posteriores a la bandera a cuadros (ya los excluye episodes_of).

Escribe un JSON con carreras, episodios por carrera, parte de dobles y p10/mediana/p90 de la duración de sencillas y
dobles (la cifra que copia data/balance/race-sim.json `raceControl.yellow.measured`). Sin dependencias fuera de la
biblioteca estándar.

    python overcut/src/main/resources/scripts/race_yellows_from_openf1.py [--years 2023,2024] [--cache DIR] [--out FICHERO]
"""

import json
import os
import sys
import urllib.parse

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import session_yellows_from_openf1 as base  # noqa: E402


def neutralised_spells(messages, end):
    """Spells of SC or VSC in a race: from the deployment to the next green flag on the whole track (or the end)."""
    spells = []
    open_at = None
    for row in sorted(messages, key=lambda r: r["date"]):
        text = (row.get("message") or "").upper()
        at = base.when(row["date"])
        if row.get("category") == "SafetyCar" and "DEPLOYED" in text and open_at is None:
            open_at = at
        elif open_at is not None and row.get("flag") == "GREEN" and row.get("scope") == "Track":
            spells.append((open_at, at))
            open_at = None
    if open_at is not None:
        spells.append((open_at, end))
    return spells


def main(argv):
    years = [2023, 2024]
    out_path = None
    i = 0
    while i < len(argv):
        if argv[i] == "--years":
            years = [int(y) for y in argv[i + 1].split(",")]
            i += 2
        elif argv[i] == "--cache":
            base.CACHE = argv[i + 1]
            i += 2
        elif argv[i] == "--out":
            out_path = argv[i + 1]
            i += 2
        else:
            i += 1
    races = 0
    episodes = []
    under_sc = 0
    flicker = 0
    for year in years:
        sessions = base.get("/sessions?" + urllib.parse.urlencode({"year": year, "session_type": "Race"}))
        for session in sessions:
            if "Sprint" in session.get("session_name", ""):
                continue
            messages = base.get("/race_control?" + urllib.parse.urlencode({"session_key": session["session_key"]}))
            if not messages:
                continue
            races += 1
            spells = neutralised_spells(messages, base.when(session["date_end"]))
            eps, _hours = base.episodes_of(session, messages)
            for ep in eps:
                sec = (ep["end"] - ep["start"]).total_seconds()
                if sec < base.MIN_SEC:
                    flicker += 1
                    continue
                if any(ep["start"] < to and ep["end"] > fro for fro, to in spells):
                    under_sc += 1
                    continue
                episodes.append({"sec": sec, "double": ep["double"]})
    n = len(episodes)
    result = {
        "source": "OpenF1 race_control (api.openf1.org), carreras sin sprints",
        "years": years,
        "minSec": base.MIN_SEC,
        "races": races,
        "episodes": n,
        "perRace": round(n / races, 2) if races else None,
        "doubleShare": round(sum(1 for ep in episodes if ep["double"]) / n, 3) if n else None,
        "single": base.spread([ep["sec"] for ep in episodes if not ep["double"]]),
        "double": base.spread([ep["sec"] for ep in episodes if ep["double"]]),
        "underNeutralisation": under_sc,
        "flicker": flicker,
    }
    text = json.dumps(result, indent=2, ensure_ascii=False)
    if out_path:
        with open(out_path, "w", encoding="utf-8") as handle:
            handle.write(text + "\n")
    else:
        print(text)


if __name__ == "__main__":
    main(sys.argv[1:])
