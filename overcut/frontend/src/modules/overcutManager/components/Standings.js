/** Both championships, round by round, under the rules of the year. */

import React, { useState } from "react";
import { countingRoundsFor } from "../../overcutTrayectoria/engine/eras";
import { constructorStandings, driverStandings } from "../engine/career";
import { constructorsTitleAwarded } from "../engine/standings";
import { useManager } from "./context";
import { Flag, Panel, Segmented, TeamBadge } from "./atoms";
import { raceName, t } from "./texts";

export default function Standings() {
  const { career } = useManager();
  const [tab, setTab] = useState("drivers");
  const races = career.world.races;
  const results = career.season.results;
  const counting = countingRoundsFor(career.year, races.length);
  const drivers = driverStandings(career);
  const constructors = constructorStandings(career);

  const cellFor = (summary, driverId) => {
    const row = summary?.rows.find((entry) => entry.driverId === driverId);
    if (!row) return { text: "", tone: "none" };
    if (row.status !== "finished") return { text: t("Ab", "Ret"), tone: "dnf" };
    return { text: row.position, tone: row.position === 1 ? "win" : row.position <= 3 ? "podium" : row.points > 0 ? "points" : "none" };
  };

  return (
    <Panel
      title={t(`Mundial ${career.year}`, `${career.year} World Championship`)}
      action={<Segmented label={t("Campeonato", "Championship")} value={tab} onChange={setTab} options={[{ value: "drivers", label: t("Pilotos", "Drivers") }, { value: "constructors", label: t("Constructores", "Constructors") }]} />}
      className="mn-standings"
    >
      <p className="mn-hint">
        {counting < races.length && t(`En ${career.year} solo cuentan los ${counting} mejores resultados de cada piloto. `, `In ${career.year} only each driver's best ${counting} results count. `)}
        {career.year < 1979 && t("En constructores solo puntúa el coche mejor clasificado de cada equipo. ", "In the constructors' only each team's best-placed car scores. ")}
        {!constructorsTitleAwarded(career.year) && t("El título de constructores no existía todavía: la tabla es oficiosa.", "The constructors' title did not exist yet: the table is unofficial.")}
      </p>
      <div className="mn-table-scroll">
        {tab === "drivers" ? (
          <table className="mn-table mn-table--standings">
            <thead>
              <tr>
                <th>#</th>
                <th>{t("Piloto", "Driver")}</th>
                {races.map((race, index) => (
                  <th key={race.name + index} title={raceName(race.name)}>
                    <Flag code={race.country} width={14} />
                  </th>
                ))}
                <th>{t("Pts", "Pts")}</th>
              </tr>
            </thead>
            <tbody>
              {drivers.map((row) => (
                <tr key={row.driverId} className={row.teamId === career.teamId ? "is-own" : ""}>
                  <td>{row.position}</td>
                  <td className="mn-table__name">
                    <TeamBadge team={career.world.teams[row.teamId]} size={16} /> {row.name}
                  </td>
                  {races.map((race, index) => {
                    const cell = cellFor(results[index], row.driverId);
                    return (
                      <td key={race.name + index} className={`mn-cell is-${cell.tone}`}>
                        {cell.text}
                      </td>
                    );
                  })}
                  <td>
                    <b>{row.total}</b>
                    {row.dropped > 0 && <small> ({row.gross})</small>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="mn-table mn-table--standings">
            <thead>
              <tr>
                <th>#</th>
                <th>{t("Equipo", "Team")}</th>
                <th>{t("Victorias", "Wins")}</th>
                <th>{t("Podios", "Podiums")}</th>
                <th>{t("Mejor", "Best")}</th>
                <th>{t("Pts", "Pts")}</th>
              </tr>
            </thead>
            <tbody>
              {constructors.map((row) => {
                const team = career.world.teams[row.teamId];
                return (
                  <tr key={row.teamId} className={row.teamId === career.teamId ? "is-own" : ""}>
                    <td>{row.position}</td>
                    <td className="mn-table__name">
                      <TeamBadge team={team} size={18} /> {team?.name}
                      {team?.custom && <small className="mn-tag">{t("tuyo", "yours")}</small>}
                    </td>
                    <td>{row.wins}</td>
                    <td>{row.podiums}</td>
                    <td>{row.best ?? "—"}</td>
                    <td>
                      <b>{row.total}</b>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </Panel>
  );
}
