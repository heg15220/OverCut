"""
Qué hace una amarilla local con las vueltas lanzadas de los demás en clasificación real, para calibrar la vuelta
anulada o estropeada de las sesiones jugables del Manager (paquete SES-4 de docs/manager/F1M24-GAMEPLAY.md §2.10
`amarilla-sector`, §1.7 evento `yellow`; RF-SIM-10, RF-WKD-02, RNF-07).

Fuente: OpenF1 (https://openf1.org, API pública; `race_control` y `laps` desde 2023). Ninguna petición lleva datos
personales: solo año, tipo de sesión y claves de sesión. Se agregan vueltas; no se guarda nada por piloto.

Método, por sesión de clasificación (sin las de sprint):
  - episodios por sector de comisarios: YELLOW o DOUBLE YELLOW con `scope` Sector hasta el CLEAR de ese sector (o
    la bandera roja o la a cuadros), con el instante en que sube a doble si lo hace;
  - el sector de comisarios se pasa a fracción de la vuelta como (sector - 0,5) / número de sectores del circuito
    (el mayor visto en los mensajes de la sesión): aproximación, OpenF1 no da su posición;
  - una vuelta es lanzada si no sale del pit y su primer sector está a <= PUSH_S1 de su mejor primer sector de la
    sesión; solo cuentan las amarillas que caen después del primer sector (así el primer sector dice si iba lanzado);
  - la vuelta pasa por la amarilla si el instante estimado de paso (inicio + fracción x duración) cae dentro del
    episodio; la bandera que ve es la que hay en ese instante;
  - desenlace: abandonada si no tiene tiempo o pasa de ABANDON x su mejor vuelta; si no, conservada, con su exceso
    sobre la mejor del piloto. Control: las vueltas lanzadas que no pasan por ninguna amarilla.
  - además se cuentan los mensajes de dirección de carrera que borran un tiempo por amarilla.

Escribe un JSON (salida estándar o --out) con, para sencilla y doble: vueltas, parte abandonada y mediana del exceso
de las conservadas menos la del control (la pérdida, p25/mediana/p75), y los tiempos borrados por doble amarilla
por año. Lo copia data/balance/sessions.json `yellow.laps.measured`.
Sin dependencias fuera de la biblioteca estándar.

    python overcut/src/main/resources/scripts/session_yellow_laps_from_openf1.py [--years 2023,2024] [--cache DIR] [--out FICHERO]
"""

import json
import statistics
import sys
import urllib.parse

import session_yellows_from_openf1 as base

PUSH_S1 = 1.015
ABANDON = 1.07


def quantile(values, q):
    if not values:
        return None
    ordered = sorted(values)
    pos = (len(ordered) - 1) * q
    lo = int(pos)
    hi = min(lo + 1, len(ordered) - 1)
    return round(ordered[lo] + (ordered[hi] - ordered[lo]) * (pos - lo), 3)


def sector_episodes(session, messages):
    """Per marshal sector: {sector, start, end, doubleAt} (no merging), plus the highest sector number."""
    end_of_session = base.when(session["date_end"])
    open_ = {}
    out = []
    top = 0
    red = False
    for row in sorted(messages, key=lambda r: r["date"]):
        at = base.when(row["date"])
        flag = row.get("flag")
        if row.get("scope") == "Sector" and row.get("sector") is not None:
            top = max(top, int(row["sector"]))
        if flag in ("RED", "CHEQUERED"):
            red = flag == "RED"
            for ep in open_.values():
                ep["end"] = at
                out.append(ep)
            open_ = {}
            continue
        if flag == "GREEN" and row.get("scope") == "Track":
            red = False
        if row.get("scope") != "Sector" or row.get("sector") is None:
            continue
        sector = int(row["sector"])
        if flag in ("YELLOW", "DOUBLE YELLOW"):
            if red:
                continue
            if sector in open_:
                if flag == "DOUBLE YELLOW" and open_[sector]["doubleAt"] is None:
                    open_[sector]["doubleAt"] = at
                continue
            open_[sector] = {"sector": sector, "start": at, "doubleAt": at if flag == "DOUBLE YELLOW" else None}
        elif flag == "CLEAR" and sector in open_:
            ep = open_.pop(sector)
            ep["end"] = at
            out.append(ep)
    for ep in open_.values():
        ep["end"] = end_of_session
        out.append(ep)
    return [ep for ep in out if (ep["end"] - ep["start"]).total_seconds() >= base.MIN_SEC], top


def deletion_reasons(messages):
    counts = {"doubleYellow": 0, "yellow": 0, "trackLimits": 0, "other": 0}
    for row in messages:
        text = (row.get("message") or "").upper()
        if "DELETED" not in text:
            continue
        if "DOUBLE YELLOW" in text:
            counts["doubleYellow"] += 1
        elif "YELLOW" in text:
            counts["yellow"] += 1
        elif "TRACK LIMITS" in text:
            counts["trackLimits"] += 1
        else:
            counts["other"] += 1
    return counts


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
    rows = {"single": [], "double": []}
    control = []
    sessions_used = 0
    deletions = {"doubleYellow": 0, "yellow": 0, "trackLimits": 0, "other": 0}
    by_year = {}
    for year in years:
        for session in base.get("/sessions?" + urllib.parse.urlencode({"year": year, "session_type": "Qualifying"})):
            if "Sprint" in session.get("session_name", "") or session.get("is_cancelled"):
                continue
            key = session["session_key"]
            messages = base.get("/race_control?" + urllib.parse.urlencode({"session_key": key}))
            laps = base.get("/laps?" + urllib.parse.urlencode({"session_key": key}))
            if not laps:
                continue
            sessions_used += 1
            for reason, n in deletion_reasons(messages).items():
                deletions[reason] += n
                by_year.setdefault(str(year), {"sessions": 0, "doubleYellow": 0})
                if reason == "doubleYellow":
                    by_year[str(year)]["doubleYellow"] += n
            by_year[str(year)]["sessions"] += 1
            episodes, top = sector_episodes(session, messages)
            by_driver = {}
            for lap in laps:
                by_driver.setdefault(lap["driver_number"], []).append(lap)
            for driver_laps in by_driver.values():
                timed = [lap["lap_duration"] for lap in driver_laps if lap.get("lap_duration")]
                s1s = [lap["duration_sector_1"] for lap in driver_laps if lap.get("duration_sector_1")]
                if not timed or not s1s:
                    continue
                best = min(timed)
                best_s1 = min(s1s)
                s1_share = best_s1 / best
                for lap in driver_laps:
                    if lap.get("is_pit_out_lap") or not lap.get("date_start") or not lap.get("duration_sector_1"):
                        continue
                    if lap["duration_sector_1"] > best_s1 * PUSH_S1:
                        continue
                    start = base.when(lap["date_start"])
                    duration = lap.get("lap_duration") or best
                    seen = None
                    for ep in episodes:
                        if not top:
                            break
                        share = (ep["sector"] - 0.5) / top
                        if share <= s1_share:
                            continue
                        at = start.timestamp() + share * duration
                        if ep["start"].timestamp() <= at < ep["end"].timestamp():
                            double = ep["doubleAt"] is not None and ep["doubleAt"].timestamp() <= at
                            if seen != "double":
                                seen = "double" if double else "single"
                    lap_time = lap.get("lap_duration")
                    abandoned = not lap_time or lap_time > best * ABANDON
                    excess = None if abandoned else lap_time - best
                    if seen:
                        rows[seen].append({"abandoned": abandoned, "excess": excess})
                    elif excess is not None:
                        control.append(excess)
    control_median = statistics.median(control) if control else None
    result = {
        "source": "OpenF1 race_control + laps (api.openf1.org), clasificación sin sprints",
        "years": years,
        "sessions": sessions_used,
        "pushS1": PUSH_S1,
        "abandonFactor": ABANDON,
        "control": {"laps": len(control), "medianExcess": round(control_median, 3) if control_median is not None else None},
        "deletions": deletions,
        "deletionsByYear": by_year,
    }
    for kind, items in rows.items():
        kept = [item["excess"] for item in items if not item["abandoned"]]
        losses = [value - control_median for value in kept] if control_median is not None else []
        result[kind] = {
            "laps": len(items),
            "abandonShare": round(sum(1 for item in items if item["abandoned"]) / len(items), 3) if items else None,
            "kept": len(kept),
            "lossSec": {"p25": quantile(losses, 0.25), "median": quantile(losses, 0.5), "p75": quantile(losses, 0.75)} if losses else None,
        }
    text = json.dumps(result, indent=2, ensure_ascii=False)
    if out_path:
        with open(out_path, "w", encoding="utf-8") as handle:
            handle.write(text + "\n")
    else:
        print(text)


if __name__ == "__main__":
    main(sys.argv[1:])
