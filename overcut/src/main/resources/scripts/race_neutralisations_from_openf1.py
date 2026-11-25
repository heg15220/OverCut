"""
Coches de seguridad y VSC reales para calibrar las neutralizaciones del Manager (paquete SIM-5 de
docs/manager/F1M24-GAMEPLAY.md §2.11 `sc-fisico`, `vsc-delta`, `duracion-neutralizacion`; RF-SIM-10, RNF-07).

Fuente: OpenF1 (https://openf1.org, API pública e histórica; `race_control` y `laps` desde 2023). Ningún dato
personal en las peticiones: solo año, tipo de sesión y claves de sesión. Reutiliza get/when/quantile de
session_yellows_from_openf1.py.

Por carrera (sin sprints) lee los mensajes de dirección de carrera:
  - SC:  «SAFETY CAR DEPLOYED» → («LAPPED CARS MAY OVERTAKE») → «SAFETY CAR IN THIS LAP» → reanudación (primera
         vuelta que empieza tras la vuelta del líder en que se anunció «IN THIS LAP», tabla `laps`). Un SC que acaba
         en bandera roja no cuenta para las duraciones.
  - VSC: «VIRTUAL SAFETY CAR DEPLOYED» → «VIRTUAL SAFETY CAR ENDING» → bandera verde o «TRACK CLEAR» de pista.
y de `laps` las vueltas completas dentro de cada periodo (sin vuelta de salida de boxes) frente a la mediana de las
vueltas en verde de esa carrera (sin la 1.ª, sin salidas de boxes, sin las que tocan un periodo neutralizado y sin las
de más de 1,15 veces la mejor).

Escribe un JSON con:
  - por circuito (id de f1db): carreras, carreras con al menos un SC, SC, VSC y rojas, y `scRate` = parte de carreras
    con SC, encogida hacia la media de todas (peso PRIOR_RACES carreras) para no dar 0 o 1 con dos o tres carreras;
  - `scRateReference`: la media sin encoger (la que el motor toma como 1);
  - duraciones (p10/mediana/p90, s): SC del despliegue a «lapped cars» o a «in this lap» (`cleanupSc`, lo que espera
    dirección de carrera a que limpien y se agrupe el tren), de «lapped cars» a «in this lap» (`unlappingSec`), de
    «in this lap» a la reanudación (`inThisLapSec`), VSC del despliegue a «ending» (`cleanupVsc`) y de «ending» a la
    verde (`vscEndingWarnSec`);
  - ritmo: vuelta bajo SC y bajo VSC / vuelta en verde (mediana por carrera y su mediana, `scLapFactor`,
    `vscLapFactor`).

Sin dependencias fuera de la biblioteca estándar.

    python overcut/src/main/resources/scripts/race_neutralisations_from_openf1.py [--years 2023,2024,2025] [--cache DIR] [--out FICHERO]
"""

import json
import os
import statistics
import sys
import urllib.parse

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import session_yellows_from_openf1 as base  # noqa: E402

# OpenF1 circuit_short_name -> f1db circuit id (the packs' calendar[].circuitId).
CIRCUITS = {
    "Sakhir": "bahrain", "Jeddah": "jeddah", "Melbourne": "melbourne", "Suzuka": "suzuka", "Shanghai": "shanghai",
    "Miami": "miami", "Imola": "imola", "Monte Carlo": "monaco", "Montreal": "montreal", "Catalunya": "catalunya",
    "Spielberg": "spielberg", "Silverstone": "silverstone", "Hungaroring": "hungaroring",
    "Spa-Francorchamps": "spa-francorchamps", "Zandvoort": "zandvoort", "Monza": "monza", "Baku": "baku",
    "Singapore": "marina-bay", "Austin": "austin", "Mexico City": "mexico-city", "Interlagos": "interlagos",
    "Las Vegas": "las-vegas", "Lusail": "lusail", "Yas Marina Circuit": "yas-marina",
}
# Weight of the all-circuit mean in each circuit's rate (races' worth): Laplace-style shrinkage.
PRIOR_RACES = 2
# A green lap slower than this share over the race's best is traffic, a mistake or a problem: out.
GREEN_MAX_SHARE = 1.15


def text_of(row):
    return (row.get("message") or "").upper()


def spells_of(messages):
    """SC and VSC spells of one race, in order, with the times of their messages."""
    out = []
    sc = None
    vsc = None
    for row in sorted(messages, key=lambda r: r["date"]):
        text = text_of(row)
        at = base.when(row["date"])
        lap = row.get("lap_number")
        flag = row.get("flag")
        if "VIRTUAL SAFETY CAR DEPLOYED" in text and vsc is None:
            vsc = {"kind": "vsc", "deployed": at, "lap": lap}
        elif "VIRTUAL SAFETY CAR ENDING" in text and vsc is not None:
            vsc["ending"] = at
        elif vsc is not None and flag in ("GREEN", "CLEAR") and row.get("scope") == "Track" and "ending" in vsc:
            vsc["green"] = at
            out.append(vsc)
            vsc = None
        elif "SAFETY CAR DEPLOYED" in text and "VIRTUAL" not in text and sc is None:
            if vsc is not None:  # a VSC turned into an SC
                vsc["toSc"] = True
                out.append(vsc)
                vsc = None
            sc = {"kind": "sc", "deployed": at, "lap": lap}
        elif sc is not None and "LAPPED CARS MAY" in text and "NOT" not in text:
            sc.setdefault("lapped", at)
        elif sc is not None and "SAFETY CAR IN THIS LAP" in text:
            sc["inThisLap"] = at
            sc["inLap"] = lap
            out.append(sc)
            sc = None
        if flag == "RED":
            for spell in (sc, vsc):
                if spell is not None:
                    spell["red"] = True
                    out.append(spell)
            sc = None
            vsc = None
    for spell in (sc, vsc):
        if spell is not None:
            spell["open"] = True
            out.append(spell)
    return out


def lap_rows(session_key):
    rows = base.get("/laps?" + urllib.parse.urlencode({"session_key": session_key}))
    out = []
    for row in rows:
        if not row.get("date_start") or not row.get("lap_duration"):
            continue
        start = base.when(row["date_start"])
        out.append({"lap": row["lap_number"], "start": start, "sec": float(row["lap_duration"]), "pitOut": bool(row.get("is_pit_out_lap")),
                    "driver": row.get("driver_number")})
    return out


def restart_of(spell, laps):
    """The first lap start after the leader's lap in which «in this lap» was shown."""
    if "inLap" not in spell or spell["inLap"] is None:
        return None
    starts = [row["start"] for row in laps if row["lap"] == spell["inLap"] + 1]
    return min(starts) if starts else None


def window_of(spell):
    """The neutralised window of a spell: deployment to restart (SC) or to the green (VSC)."""
    end = spell.get("restart") if spell["kind"] == "sc" else spell.get("green") or spell.get("ending")
    return (spell["deployed"], end) if end else None


def pace_factor(spell, laps, green_median):
    win = window_of(spell)
    if not win or not green_median:
        return None
    lo, hi = win
    inside = [row["sec"] for row in laps if not row["pitOut"] and row["start"] >= lo and row["start"].timestamp() + row["sec"] <= hi.timestamp()]
    if len(inside) < 3:
        return None
    return statistics.median(inside) / green_median


def green_median(laps, spells):
    windows = [w for w in (window_of(s) for s in spells) if w]
    best = min((row["sec"] for row in laps), default=None)
    if best is None:
        return None
    keep = []
    for row in laps:
        if row["lap"] <= 1 or row["pitOut"] or row["sec"] > best * GREEN_MAX_SHARE:
            continue
        end = row["start"].timestamp() + row["sec"]
        if any(row["start"].timestamp() < hi.timestamp() and end > lo.timestamp() for lo, hi in windows):
            continue
        keep.append(row["sec"])
    return statistics.median(keep) if keep else None


def q3(values, q):
    if not values:
        return None
    ordered = sorted(values)
    pos = (len(ordered) - 1) * q
    lo = int(pos)
    hi = min(lo + 1, len(ordered) - 1)
    return round(ordered[lo] + (ordered[hi] - ordered[lo]) * (pos - lo), 3)


def secs(a, b):
    return (b - a).total_seconds() if a and b else None


def main(argv):
    years = [2023, 2024, 2025]
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
    circuits = {}
    durations = {"cleanupSc": [], "unlappingSec": [], "inThisLapSec": [], "cleanupVsc": [], "vscEndingWarnSec": []}
    factors = {"sc": [], "vsc": []}
    races = 0
    unknown = set()
    for year in years:
        sessions = base.get("/sessions?" + urllib.parse.urlencode({"year": year, "session_type": "Race"}))
        for session in sessions:
            if "Sprint" in session.get("session_name", "") or session.get("is_cancelled"):
                continue
            messages = base.get("/race_control?" + urllib.parse.urlencode({"session_key": session["session_key"]}))
            if not messages:
                continue
            circuit = CIRCUITS.get(session.get("circuit_short_name"))
            if circuit is None:
                unknown.add(session.get("circuit_short_name"))
                continue
            races += 1
            spells = spells_of(messages)
            laps = lap_rows(session["session_key"])
            for spell in spells:
                if spell["kind"] == "sc" and not spell.get("red"):
                    spell["restart"] = restart_of(spell, laps)
            gm = green_median(laps, spells)
            row = circuits.setdefault(circuit, {"races": 0, "racesWithSc": 0, "sc": 0, "vsc": 0, "red": 0, "years": []})
            row["races"] += 1
            row["years"].append(year)
            n_sc = sum(1 for s in spells if s["kind"] == "sc")
            row["sc"] += n_sc
            row["vsc"] += sum(1 for s in spells if s["kind"] == "vsc")
            row["red"] += sum(1 for m in messages if m.get("flag") == "RED")
            if n_sc:
                row["racesWithSc"] += 1
            for spell in spells:
                if spell.get("red") or spell.get("open"):
                    continue
                if spell["kind"] == "sc":
                    held = spell.get("lapped") or spell.get("inThisLap")
                    durations["cleanupSc"].append(secs(spell["deployed"], held))
                    if spell.get("lapped"):
                        durations["unlappingSec"].append(secs(spell["lapped"], spell["inThisLap"]))
                    if spell.get("restart"):
                        durations["inThisLapSec"].append(secs(spell["inThisLap"], spell["restart"]))
                    f = pace_factor(spell, laps, gm)
                    if f:
                        factors["sc"].append(f)
                elif not spell.get("toSc"):
                    durations["cleanupVsc"].append(secs(spell["deployed"], spell.get("ending")))
                    durations["vscEndingWarnSec"].append(secs(spell.get("ending"), spell.get("green")))
                    f = pace_factor(spell, laps, gm)
                    if f:
                        factors["vsc"].append(f)
    total_races = sum(r["races"] for r in circuits.values())
    reference = sum(r["racesWithSc"] for r in circuits.values()) / total_races if total_races else None
    for row in circuits.values():
        row["scRate"] = round((row["racesWithSc"] + PRIOR_RACES * reference) / (row["races"] + PRIOR_RACES), 3)
    result = {
        "source": "OpenF1 race_control + laps (api.openf1.org), carreras sin sprints",
        "script": "overcut/src/main/resources/scripts/race_neutralisations_from_openf1.py",
        "years": years,
        "races": races,
        "priorRaces": PRIOR_RACES,
        "scRateReference": round(reference, 3) if reference is not None else None,
        "scPerRace": round(sum(r["sc"] for r in circuits.values()) / total_races, 3) if total_races else None,
        "vscPerRace": round(sum(r["vsc"] for r in circuits.values()) / total_races, 3) if total_races else None,
        "durations": {k: base.spread([v for v in vals if v is not None and v >= 0]) for k, vals in durations.items()},
        "scLapFactor": {"n": len(factors["sc"]), "median": round(statistics.median(factors["sc"]), 3) if factors["sc"] else None,
                        "p10": q3(factors["sc"], 0.1), "p90": q3(factors["sc"], 0.9)},
        "vscLapFactor": {"n": len(factors["vsc"]), "median": round(statistics.median(factors["vsc"]), 3) if factors["vsc"] else None,
                         "p10": q3(factors["vsc"], 0.1), "p90": q3(factors["vsc"], 0.9)},
        "circuits": dict(sorted(circuits.items())),
        "unmappedCircuits": sorted(x for x in unknown if x),
    }
    text = json.dumps(result, indent=1, ensure_ascii=False)
    if out_path:
        with open(out_path, "w", encoding="utf-8", newline="\n") as handle:
            handle.write(text + "\n")
    else:
        print(text)


if __name__ == "__main__":
    main(sys.argv[1:])
