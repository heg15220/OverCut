/**
 * Both championships, round by round, under the rules of the year (RF-WKD-07).
 * Data screen (DESIGN.md §6.3): the standings table, the points by round as a
 * line chart with the player's line in the team colour, and the results matrix.
 */

import React, { useMemo, useState } from "react";
import { countingRoundsFor } from "../../overcutTrayectoria/engine/eras";
import { constructorStandings, driverStandings } from "../engine/career";
import { constructorsTitleAwarded } from "../engine/standings";
import { useManager } from "./context";
import { DataTable, EmptyState, Flag, PageHeader, Panel, StatTile, Tabs, TeamStripe, readableOn } from "./atoms";
import LineChart from "./lineChart";
import "./dataScreen";
import { ordinal, raceName, t } from "./texts";
import "./styles/season.css";

const DATA = "#8a9cbc"; // --mn-data: the "everyone else" series (DESIGN.md 2.1)
const cumulative = (values, length) => {
  let sum = 0;
  return Array.from({ length }, (_, index) => {
    sum += values[index] || 0;
    return sum;
  });
};

export default function Standings() {
  const { career } = useManager();
  const [tab, setTab] = useState("drivers");
  const races = career.world.races;
  const results = career.season.results;
  const raced = results.length;
  const counting = countingRoundsFor(career.year, races.length);
  const drivers = driverStandings(career);
  const constructors = constructorStandings(career);
  const teamOf = (id) => career.world.teams[id];
  const ownTeam = teamOf(career.teamId);
  const ownColor = readableOn(ownTeam?.color);
  const isDrivers = tab === "drivers";
  const rows = isDrivers ? drivers : constructors;
  const leader = rows[0];
  const own = isDrivers ? drivers.find((row) => row.teamId === career.teamId) : constructors.find((row) => row.teamId === career.teamId);

  const series = useMemo(() => {
    if (!raced) return [];
    if (isDrivers) {
      const shown = drivers.filter((row, index) => index < 8 || row.teamId === career.teamId);
      return shown.map((row) => ({
        id: row.driverId,
        label: row.name,
        color: row.teamId === career.teamId ? ownColor : DATA,
        emphasis: row.teamId === career.teamId,
        values: cumulative(career.season.drivers[row.driverId]?.points || [], raced),
      }));
    }
    return constructors.map((row) => ({
      id: row.teamId,
      label: teamOf(row.teamId)?.name || row.teamId,
      color: row.teamId === career.teamId ? ownColor : DATA,
      emphasis: row.teamId === career.teamId,
      values: cumulative(results.map((summary) => summary.teamPoints?.[row.teamId] || 0), raced),
    }));
  }, [isDrivers, drivers, constructors, raced, results, career, ownColor]); // eslint-disable-line react-hooks/exhaustive-deps

  const notes = [
    counting < races.length && t(`En ${career.year} solo cuentan los ${counting} mejores resultados de cada piloto.`, `In ${career.year} only each driver's best ${counting} results count.`),
    career.year < 1979 && t("En constructores solo puntúa el coche mejor clasificado de cada equipo.", "In the constructors' only each team's best-placed car scores."),
    !constructorsTitleAwarded(career.year) && t("El título de constructores no existía todavía: la tabla es oficiosa.", "The constructors' title did not exist yet: the table is unofficial."),
  ].filter(Boolean);

  const gap = (row) => (leader && row.total < leader.total ? <span className="mn-ds-amount is-zero">{`−${leader.total - row.total}`}</span> : <span className="mn-ds-muted">—</span>);

  const driverColumns = [
    { key: "position", label: t("Pos", "Pos"), width: 44, render: (row) => <span className="mn-dt__pos">{row.position}</span> },
    {
      key: "name",
      label: t("Piloto", "Driver"),
      render: (row) => (
        <span className="mn-dt__team">
          <TeamStripe color={teamOf(row.teamId)?.color} />
          {row.name}
        </span>
      ),
    },
    { key: "team", label: t("Equipo", "Team"), className: "mn-ds-hide-sm mn-ds-muted", render: (row) => teamOf(row.teamId)?.name },
    { key: "wins", label: t("Vic.", "Wins"), align: "right", width: 52, render: (row) => row.wins || 0 },
    { key: "podiums", label: t("Pod.", "Pod."), align: "right", width: 52, className: "mn-ds-hide-sm", render: (row) => row.podiums || 0 },
    { key: "gap", label: t("Dif.", "Gap"), align: "right", width: 60, className: "mn-ds-hide-sm", render: gap },
    {
      key: "total",
      label: t("Pts", "Pts"),
      align: "right",
      width: 72,
      render: (row) => (
        <>
          <b>{row.total}</b>
          {row.dropped > 0 && <small className="mn-se-gross"> ({row.gross})</small>}
        </>
      ),
    },
  ];
  const constructorColumns = [
    { key: "position", label: t("Pos", "Pos"), width: 44, render: (row) => <span className="mn-dt__pos">{row.position}</span> },
    {
      key: "team",
      label: t("Equipo", "Team"),
      render: (row) => (
        <span className="mn-dt__team">
          <TeamStripe color={teamOf(row.teamId)?.color} />
          {teamOf(row.teamId)?.name}
          {teamOf(row.teamId)?.custom && <span className="mn-ds-muted">{t("tuyo", "yours")}</span>}
        </span>
      ),
    },
    { key: "wins", label: t("Vic.", "Wins"), align: "right", width: 52, render: (row) => row.wins || 0 },
    { key: "podiums", label: t("Pod.", "Pod."), align: "right", width: 52, render: (row) => row.podiums || 0 },
    { key: "best", label: t("Mejor", "Best"), align: "right", width: 56, className: "mn-ds-hide-sm", render: (row) => (row.best ? ordinal(row.best) : "—") },
    { key: "gap", label: t("Dif.", "Gap"), align: "right", width: 60, className: "mn-ds-hide-sm", render: gap },
    { key: "total", label: t("Pts", "Pts"), align: "right", width: 64, render: (row) => <b>{row.total}</b> },
  ];

  const cellFor = (summary, row) => {
    if (!summary) return { text: "", tone: "none" };
    if (!isDrivers) {
      const points = summary.teamPoints?.[row.teamId] || 0;
      return { text: points || "", tone: points ? "points" : "none" };
    }
    const entry = summary.rows.find((item) => item.driverId === row.driverId);
    if (!entry) return { text: "", tone: "none" };
    if (entry.status !== "finished") return { text: t("Ab", "Ret"), tone: "dnf" };
    return { text: entry.position, tone: entry.position === 1 ? "win" : entry.position <= 3 ? "podium" : entry.points > 0 ? "points" : "none" };
  };

  return (
    <div className="mn-ds mn-standings2">
      <PageHeader
        title={t("Mundial", "Standings")}
        meta={raced ? t(`Temporada ${career.year} · tras ${raced} de ${races.length} carreras`, `${career.year} season · after ${raced} of ${races.length} races`) : t(`Temporada ${career.year} · ${races.length} carreras por delante`, `${career.year} season · ${races.length} races ahead`)}
      />
      <Tabs
        label={t("Campeonato", "Championship")}
        value={tab}
        onChange={setTab}
        options={[
          { value: "drivers", label: t("Pilotos", "Drivers") },
          { value: "constructors", label: t("Constructores", "Constructors") },
        ]}
      />
      {notes.length > 0 && <p className="mn-ds-note">{notes.join(" ")}</p>}

      <div className="mn-ds__grid">
        <div className="mn-ds__main">
          <Panel flush title={isDrivers ? t("Pilotos", "Drivers") : t("Constructores", "Constructors")} meta={t(`${rows.length} en la tabla`, `${rows.length} listed`)}>
            {rows.length ? (
              <DataTable
                caption={isDrivers ? t("Mundial de pilotos", "Drivers' championship") : t("Mundial de constructores", "Constructors' championship")}
                rowKey={(row) => (isDrivers ? row.driverId : row.teamId)}
                highlight={(row) => row.teamId === career.teamId}
                columns={isDrivers ? driverColumns : constructorColumns}
                rows={rows}
              />
            ) : (
              <div className="mn-se-pad">
                <EmptyState compact title={t("Aún no se ha corrido ninguna carrera", "No race has been run yet")} body={t("La clasificación de pilotos aparece tras el primer Gran Premio.", "The drivers' standings appear after the first Grand Prix.")} />
              </div>
            )}
          </Panel>
        </div>

        <div className="mn-ds__side">
          <Panel title={t("Puntos por ronda", "Points by round")} meta={isDrivers ? t("Los 8 primeros y los tuyos", "Top 8 and yours") : undefined}>
            {series.length && raced > 1 ? (
              <>
                <LineChart
                  ariaLabel={t(`Puntos acumulados por ronda, ${raced} carreras`, `Cumulative points by round, ${raced} races`)}
                  series={series}
                  xLabels={results.map((_, index) => String(index + 1))}
                  xTitle={(index) => `${index + 1}. ${raceName(results[index].name)}`}
                  height={240}
                  labelWidth={96}
                />
                <ul className="mn-lc-legend">
                  <li>
                    <i style={{ background: ownColor }} aria-hidden="true" />
                    {isDrivers ? t("Tus pilotos", "Your drivers") : ownTeam?.name}
                  </li>
                  <li>
                    <i style={{ background: DATA, opacity: 0.6 }} aria-hidden="true" />
                    {t("Resto", "Others")}
                  </li>
                </ul>
                {counting < races.length && isDrivers && <p className="mn-ds-note">{t("Puntos brutos, antes de descartar resultados.", "Gross points, before dropped scores.")}</p>}
              </>
            ) : (
              <EmptyState compact title={raced ? t("Hace falta una segunda carrera", "A second race is needed") : t("Sin carreras todavía", "No races yet")} body={t("La gráfica se dibuja a partir de dos Grandes Premios.", "The chart is drawn from two Grands Prix on.")} />
            )}
          </Panel>
          <div className="mn-ds__stack mn-se-tiles">
            <StatTile label={t("Líder", "Leader")} value={raced && leader ? `${leader.total}` : "—"} unit={raced && leader ? "pts" : undefined} hint={raced && leader ? (isDrivers ? leader.name : teamOf(leader.teamId)?.name) : t("Sin carreras todavía", "No races yet")} />
            <StatTile
              label={isDrivers ? t("Tu mejor piloto", "Your best driver") : t("Tu equipo", "Your team")}
              value={raced && own ? ordinal(own.position) : "—"}
              unit={raced && own ? `${own.total} pts` : undefined}
              hint={raced && own ? (own.position === 1 ? t("Líder", "Leading") : t(`a ${leader.total - own.total} pts del líder`, `${leader.total - own.total} pts behind the leader`)) : undefined}
              accent={Boolean(raced && own?.position === 1)}
            />
          </div>
        </div>

        {raced > 0 && rows.length > 0 && (
          <div className="mn-ds__full">
            <Panel flush title={t("Resultados por carrera", "Results by race")} meta={isDrivers ? t("Posición en meta", "Finishing position") : t("Puntos por carrera", "Points per race")}>
              <div className="mn-dt-wrap">
                <table className="mn-dt mn-dt--dense mn-se-matrix">
                  <caption className="mn-sr">{t("Resultados por carrera", "Results by race")}</caption>
                  <thead>
                    <tr>
                      <th scope="col" className="is-left mn-se-matrix__name">
                        {isDrivers ? t("Piloto", "Driver") : t("Equipo", "Team")}
                      </th>
                      {races.map((race, index) => (
                        <th key={race.name + index} scope="col" className="is-center" title={raceName(race.name)}>
                          <Flag code={race.country} width={16} title={raceName(race.name)} />
                        </th>
                      ))}
                      <th scope="col" className="is-right">
                        {t("Pts", "Pts")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={isDrivers ? row.driverId : row.teamId} className={row.teamId === career.teamId ? "is-own" : undefined}>
                        <th scope="row" className="is-left mn-se-matrix__name">
                          <span className="mn-dt__team">
                            <TeamStripe color={teamOf(row.teamId)?.color} />
                            {isDrivers ? row.name : teamOf(row.teamId)?.name}
                          </span>
                        </th>
                        {races.map((race, index) => {
                          const cell = cellFor(results[index], row);
                          return (
                            <td key={race.name + index} className={`is-center mn-se-cell is-${cell.tone}`}>
                              {cell.text}
                            </td>
                          );
                        })}
                        <td className="is-right">
                          <b>{row.total}</b>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          </div>
        )}
      </div>
    </div>
  );
}
