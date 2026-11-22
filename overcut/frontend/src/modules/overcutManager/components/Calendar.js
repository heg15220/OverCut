/** The season's Grands Prix, the ones run and the ones to come. */

import React, { useState } from "react";
import { LuCloudRain } from "react-icons/lu";
import { useManager } from "./context";
import { Flag, Panel, Sheet, TeamBadge } from "./atoms";
import { gapText, ordinal, raceName, shortDate, t } from "./texts";

export function Classification({ career, summary }) {
  return (
    <table className="mn-table">
      <thead>
        <tr>
          <th>#</th>
          <th>{t("Piloto", "Driver")}</th>
          <th>{t("Sal.", "Grid")}</th>
          <th>{t("Paradas", "Stops")}</th>
          <th>{t("Diferencia", "Gap")}</th>
          <th>{t("Pts", "Pts")}</th>
        </tr>
      </thead>
      <tbody>
        {summary.rows.map((row) => (
          <tr key={row.driverId} className={row.teamId === career.teamId ? "is-own" : ""}>
            <td>{row.status === "finished" ? row.position : "—"}</td>
            <td className="mn-table__name">
              <TeamBadge team={career.world.teams[row.teamId]} size={16} /> {row.name}
              {row.driverId === summary.fastestLap && <small className="mn-tag mn-tag--purple">{t("VR", "FL")}</small>}
            </td>
            <td>{row.grid}</td>
            <td>{row.stops}</td>
            <td>{row.position === 1 && row.status === "finished" ? t("Ganador", "Winner") : gapText(row)}{row.penalty ? ` (+${row.penalty}s)` : ""}</td>
            <td>{row.points || ""}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function Calendar() {
  const { career } = useManager();
  const [open, setOpen] = useState(null);
  const results = career.season.results;
  const summary = open !== null ? results[open] : null;
  return (
    <Panel title={t(`Calendario ${career.year}`, `${career.year} calendar`)}>
      <ol className="mn-calendar">
        {career.world.races.map((race, index) => {
          const result = results[index];
          const own = result ? result.rows.filter((row) => row.teamId === career.teamId) : [];
          const best = own.filter((row) => row.status === "finished").sort((a, b) => a.position - b.position)[0];
          const state = result ? "done" : index === career.round ? "now" : "next";
          return (
            <li key={race.name + index} className={`is-${state}`}>
              <button type="button" disabled={!result} onClick={() => setOpen(index)}>
                <span className="mn-calendar__round">{index + 1}</span>
                <Flag code={race.country} width={22} />
                <span className="mn-calendar__name">
                  <strong>{raceName(race.name)}</strong>
                  <small>
                    {shortDate(race.date)} · {race.laps} {t("vueltas", "laps")}
                  </small>
                </span>
                {result ? (
                  <span className="mn-calendar__result">
                    {result.weather !== "dry" && <LuCloudRain aria-hidden="true" />}
                    <small>{result.rows[0]?.name}</small>
                    <b>{best ? ordinal(best.position) : t("Abandono", "DNF")}</b>
                  </span>
                ) : (
                  <span className="mn-calendar__result mn-muted">{state === "now" ? t("Siguiente", "Next") : ""}</span>
                )}
              </button>
            </li>
          );
        })}
      </ol>
      <Sheet open={Boolean(summary)} onClose={() => setOpen(null)} title={summary ? raceName(summary.name) : ""} wide>
        {summary && <Classification career={career} summary={summary} />}
      </Sheet>
    </Panel>
  );
}
