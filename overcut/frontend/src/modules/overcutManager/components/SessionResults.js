/**
 * One results screen for every session of the weekend (session-results-unified,
 * docs/manager/F1M24-GAMEPLAY.md §2.12.2; RF-WKD-07, RNF-09): the session's leader, then the
 * classification on DataTable, a page at a time (weekend-ui.json results.pageSize), your rows
 * highlighted and the best time in purple. By kind:
 *   practice   best lap, its compound and laps run (a simulated practice has no timing);
 *   qualifying Q1/Q2/Q3 (or the single time), the segment each car dropped out in marked;
 *   shootout   the same, for the sprint grid;
 *   sprint     position, gap and points;
 *   race       grid, places gained, stops, gap and penalty, sprint points and points.
 * `sessionResultTable` is pure: it reads the weekend the engine left and draws nothing.
 * After practice, `summary` (practiceSummaryOf) adds "what the session left" (WKD-2).
 */

import React, { useState } from "react";
import balance from "../data/balance/weekend-ui.json";
import driverBalance from "../data/balance/driver-attributes.json";
import { Badge, DataTable, Meter, Panel, TeamBadge, TeamStripe } from "./atoms";
import { IconArrowDown, IconArrowUp, IconChevronLeft, IconChevronRight } from "./icons";
import { COMPOUND, PROGRAM, gapText, lapTime, t } from "./texts";
import "./styles/session-flow.css";

export const RESULT_KINDS = ["practice", "qualifying", "shootout", "sprint", "race"];

/**
 * practice-goals-summary (WKD-2, F1M24-GAMEPLAY §2.12.2; RF-WKD-03, RF-WKD-07): the six confidence
 * levels of data/balance/weekend-ui.json practiceSummary.confidence, lowest first, and the one a
 * confidence (0..1) falls in. Presentation only: the engine keeps the continuous value.
 */
export const confidenceLevelOf = (confidence, levels = balance.practiceSummary?.confidence?.levels || []) => {
  if (!Number.isFinite(confidence) || !levels.length) return null;
  let index = 0;
  levels.forEach((level, at) => {
    if (confidence >= level.from) index = at;
  });
  return { id: levels[index].id, index, count: levels.length };
};

const CONFIDENCE_LEVEL = {
  lost: () => t("Perdido", "Lost"),
  low: () => t("Baja", "Low"),
  unsure: () => t("Dudosa", "Unsure"),
  settled: () => t("Asentada", "Settled"),
  high: () => t("Alta", "High"),
  peak: () => t("Plena", "Peak"),
};

/**
 * What practice left each of the player's drivers, read from the weekend the engine wrote
 * (career.weekend: practice[id].confidence and .setup from runPractice, feedback[id], runs[id]
 * from the setup bench). Pure: reads, never writes, so no roll moves (RNF-05). Per driver:
 *   confidence       0..1 and its level (one of six); confidenceDelta against the neutral the
 *                    race assumes without practice; controlDelta, the points it adds to Sunday's
 *                    control (driver-attributes.json effects.confidence.controlPerShare);
 *   setup            satisfaction % of the setup run, and its change since the first bench run
 *                    (null when the engineers' setup ran untouched); runs and knowledge % of the
 *                    ideal window; lapSec, seconds a lap the setup is worth (negative is quicker).
 * Missing data (a weekend without practice, an older save) gives an empty list.
 */
export const practiceSummaryOf = ({ weekend, drivers = [], settings = balance.practiceSummary, controlPerShare = driverBalance.effects?.confidence?.controlPerShare }) => {
  const practice = weekend?.practice;
  if (!practice || !settings?.confidence) return [];
  const { neutral, levels } = settings.confidence;
  return drivers
    .filter((driver) => practice[driver.id])
    .map((driver) => {
      const entry = practice[driver.id];
      const feedback = weekend.feedback?.[driver.id] || null;
      const runs = weekend.runs?.[driver.id] || null;
      const confidence = finite(entry.confidence);
      const delta = confidence === null ? null : confidence - neutral;
      const history = Array.isArray(runs?.history) ? runs.history.filter(Number.isFinite) : [];
      const satisfaction = Number.isFinite(feedback?.score) ? feedback.score : confidence === null ? null : Math.round(confidence * 100);
      return {
        id: driver.id,
        name: driver.name || driver.driverName || driver.id,
        program: entry.program || feedback?.program || null,
        confidence,
        level: confidenceLevelOf(confidence, levels),
        confidenceDelta: delta,
        controlDelta: delta === null || !Number.isFinite(controlPerShare) ? null : delta * controlPerShare,
        satisfaction,
        satisfactionDelta: history.length && satisfaction !== null ? satisfaction - history[0] : null,
        runs: runs?.count || 0,
        knowledge: Number.isFinite(runs?.knowledge) ? Math.round(runs.knowledge * 100) : null,
        lapSec: finite(entry.setup),
        balance: feedback?.balance || null,
      };
    });
};

const signed = (value, digits = 0) => `${value > 0 ? "+" : value < 0 ? "−" : "±"}${Math.abs(value).toFixed(digits)}`;

/** The panel "what the session left" for the practice results (practice-goals-summary). */
export function PracticeSummary({ summary = [] }) {
  if (!summary.length) return null;
  return (
    <Panel title={t("Lo que dejó la sesión", "What the session left")} className="wk-res__summary">
      {summary.map((row) => (
        <section key={row.id} className="wk-sum" aria-label={row.name}>
          <header className="wk-sum__head">
            <strong>{row.name}</strong>
            {row.program && PROGRAM[row.program] && <span className="mn-muted">{PROGRAM[row.program]()}</span>}
          </header>
          <dl className="wk-sum__facts">
            {row.level && (
              <div>
                <dt>{t("Confianza", "Confidence")}</dt>
                <dd>
                  <b>{CONFIDENCE_LEVEL[row.level.id] ? CONFIDENCE_LEVEL[row.level.id]() : row.level.id}</b>
                  <span className="mn-muted"> {t(`nivel ${row.level.index + 1} de ${row.level.count}`, `level ${row.level.index + 1} of ${row.level.count}`)}</span>
                  <Meter value={Math.round(row.confidence * 100)} width={72} label={t("Confianza", "Confidence")} />
                  {row.confidenceDelta !== null && (
                    <small>
                      {t(`${signed(row.confidenceDelta * 100)} pts frente a sin libres`, `${signed(row.confidenceDelta * 100)} pts against no practice`)}
                      {row.controlDelta !== null && ` · ${t(`${signed(row.controlDelta, 1)} de control el domingo`, `${signed(row.controlDelta, 1)} control on Sunday`)}`}
                    </small>
                  )}
                </dd>
              </div>
            )}
            {row.satisfaction !== null && (
              <div>
                <dt>{t("Reglaje", "Setup")}</dt>
                <dd>
                  <b>{row.satisfaction}%</b>
                  {row.satisfactionDelta !== null ? (
                    <small>{t(`${signed(row.satisfactionDelta)} pts desde la primera tanda`, `${signed(row.satisfactionDelta)} pts since the first run`)}</small>
                  ) : (
                    <small>{t("El de los ingenieros, sin tandas de reglaje", "The engineers' own, no setup runs")}</small>
                  )}
                  {row.lapSec !== null && <small>{t(`${signed(row.lapSec, 2)} s por vuelta`, `${signed(row.lapSec, 2)} s a lap`)}</small>}
                </dd>
              </div>
            )}
            {row.knowledge !== null && (
              <div>
                <dt>{t("Ventana del ideal", "Ideal window")}</dt>
                <dd>
                  <b>{row.knowledge}%</b>
                  <small>{t(`conocida tras ${row.runs} tandas`, `known after ${row.runs} runs`)}</small>
                </dd>
              </div>
            )}
          </dl>
        </section>
      ))}
    </Panel>
  );
}

const finite = (value) => (Number.isFinite(value) ? value : null);

const minOf = (values) => {
  const list = values.filter((value) => value !== null);
  return list.length ? Math.min(...list) : null;
};

/**
 * The rows of a session's results from the weekend object (career.weekend) and the entrants
 * ({id, driverName, teamId}, entrantsFor's), plus what the table marks: the best time overall and
 * in each segment, the leader and whether the session had timing at all.
 */
export const sessionResultTable = ({ kind, weekend, entrants = [], teamId = null, segmentNames = [] }) => {
  const byId = Object.fromEntries(entrants.map((entrant) => [entrant.id, entrant]));
  const nameOf = (id) => byId[id]?.driverName || id;
  const teamOf = (id, fallback) => fallback ?? byId[id]?.teamId ?? weekend?.qualifying?.teams?.[id] ?? null;
  const base = (id, index, extra = {}) => {
    const team = teamOf(id, extra.teamId);
    return { id, position: index + 1, name: extra.name || nameOf(id), teamId: team, own: Boolean(teamId) && team === teamId, ...extra, ...(team ? { teamId: team } : {}) };
  };
  const empty = { kind, rows: [], segments: [], best: null, segmentBest: [], leader: null, timed: false };
  if (!weekend) return empty;

  if (kind === "practice") {
    const times = weekend.practiceTimes;
    if (!times?.order?.length) return empty;
    const rows = times.order.map((id, index) => {
      const entry = times.best[id] || {};
      return base(id, index, { time: finite(entry.time), compound: entry.compound || null, laps: entry.laps || 0 });
    });
    const best = minOf(rows.map((row) => row.time));
    return { kind, rows, segments: [], best, segmentBest: [], leader: rows[0], timed: best !== null };
  }

  if (kind === "qualifying" || kind === "shootout") {
    const session = kind === "shootout" ? weekend.shootout : weekend.qualifying;
    if (!session?.order?.length) return empty;
    const parts = Array.isArray(session.sessions) && session.sessions.length > 1 ? session.sessions : null;
    const names = parts ? parts.map((_, index) => segmentNames[index] || `Q${index + 1}`) : [];
    const segmentBest = parts ? parts.map((rows) => minOf(rows.map((row) => finite(row.time)))) : [];
    const rows = session.order.map((id, index) => {
      const segments = parts ? parts.map((list) => finite(list.find((row) => row.id === id)?.time)) : [];
      let reached = -1;
      segments.forEach((time, segment) => {
        if (time !== null || (parts && parts[segment].some((row) => row.id === id))) reached = segment;
      });
      const out = parts && reached < parts.length - 1 ? Math.max(0, reached) : null;
      return base(id, index, { time: finite(session.times?.[id]), segments, out });
    });
    const best = minOf(rows.map((row) => row.time));
    return { kind, rows, segments: names, best, segmentBest, leader: rows[0], timed: best !== null };
  }

  const source = kind === "sprint" ? weekend.sprint : kind === "race" ? weekend.result : null;
  if (!source?.rows?.length) return empty;
  const rows = source.rows.map((row, index) => base(row.driverId, index, { ...row, id: row.driverId, position: row.position ?? index + 1, fastest: kind === "race" && row.driverId === source.fastestLap }));
  return { kind, rows, segments: [], best: null, segmentBest: [], leader: rows[0], timed: true };
};

/** Places gained or lost, with the arrow (the race result screens use it too). */
export const Move = ({ value }) => (
  <span className={`wk-delta${value > 0 ? " is-up" : value < 0 ? " is-down" : ""}`} aria-label={value > 0 ? t(`sube ${value}`, `up ${value}`) : value < 0 ? t(`baja ${-value}`, `down ${-value}`) : t("igual", "same")}>
    {value > 0 ? <IconArrowUp size={12} /> : value < 0 ? <IconArrowDown size={12} /> : null}
    {value ? Math.abs(value) : "–"}
  </span>
);

const TimeCell = ({ time, best, leader }) => {
  if (time === null || time === undefined) return "—";
  const text = leader === null || leader === undefined || time === leader ? lapTime(time) : `+${(time - leader).toFixed(3)}`;
  return <span className={best !== null && time === best ? "wk-res__best" : undefined}>{text}</span>;
};

const SESSION_TITLE = {
  practice: () => t("Resultados de los libres", "Practice results"),
  qualifying: () => t("Resultados de la clasificación", "Qualifying results"),
  shootout: () => t("Resultados del shootout", "Shootout results"),
  sprint: () => t("Resultados del sprint", "Sprint results"),
  race: () => t("Clasificación", "Classification"),
};

const LEADER_TEXT = {
  practice: () => t("Más rápido", "Fastest"),
  qualifying: () => t("Pole", "Pole"),
  shootout: () => t("Pole del sprint", "Sprint pole"),
  sprint: () => t("Ganador", "Winner"),
  race: () => t("Ganador", "Winner"),
};

/** The table's columns for one kind of session. */
const columnsFor = (table, teams) => {
  const driver = {
    key: "driver",
    label: t("Piloto", "Driver"),
    render: (row) => (
      <span className="wk-driver">
        <TeamStripe color={teams[row.teamId]?.color} />
        <span>{row.name}</span>
        {row.fastest && <span className="wk-best" title={t("Vuelta rápida", "Fastest lap")}>{t("VR", "FL")}</span>}
        {row.out !== null && row.out !== undefined && <span className="wk-res__out">{t(`fuera en ${table.segments[row.out]}`, `out in ${table.segments[row.out]}`)}</span>}
      </span>
    ),
  };
  const pos = { key: "pos", label: t("Pos", "Pos"), width: 44, mono: true, render: (row) => (row.status && row.status !== "finished" ? "—" : row.position) };
  const team = { key: "team", label: t("Equipo", "Team"), className: "wk-hide-sm", render: (row) => <span className="mn-muted">{teams[row.teamId]?.name}</span> };
  const leaderTime = table.leader?.time ?? null;
  if (table.kind === "practice") {
    return [
      pos, driver, team,
      { key: "tyre", label: t("Neum.", "Tyre"), width: 72, className: "wk-hide-sm", render: (row) => (row.compound && COMPOUND[row.compound] ? COMPOUND[row.compound]() : "—") },
      { key: "laps", label: t("Vueltas", "Laps"), align: "right", mono: true, width: 60, render: (row) => row.laps },
      { key: "time", label: t("Mejor vuelta", "Best lap"), align: "right", mono: true, render: (row) => <TimeCell time={row.time} best={table.best} leader={leaderTime} /> },
    ];
  }
  if (table.kind === "qualifying" || table.kind === "shootout") {
    if (table.segments.length) {
      return [
        pos, driver, team,
        ...table.segments.map((name, segment) => ({
          key: `seg${segment}`,
          label: name,
          align: "right",
          mono: true,
          className: segment < table.segments.length - 1 ? "wk-hide-sm" : undefined,
          render: (row) => <TimeCell time={row.segments[segment]} best={table.segmentBest[segment]} leader={null} />,
        })),
      ];
    }
    return [pos, driver, team, { key: "time", label: t("Tiempo", "Time"), align: "right", mono: true, render: (row) => <TimeCell time={row.time} best={table.best} leader={leaderTime} /> }];
  }
  const gap = { key: "gap", label: t("Diferencia", "Gap"), align: "right", mono: true, render: (row) => `${row.position === 1 && row.status === "finished" ? t("Ganador", "Winner") : gapText(row)}${row.penalty ? ` (+${row.penalty} s)` : ""}` };
  const points = { key: "pts", label: t("Pts", "Pts"), align: "right", width: 48, render: (row) => (row.points ? <b>{row.points}</b> : "") };
  if (table.kind === "sprint") return [pos, driver, team, { key: "grid", label: t("Sal.", "Grid"), align: "right", mono: true, width: 52, className: "wk-hide-sm", render: (row) => row.grid }, gap, points];
  return [
    pos, driver, team,
    { key: "grid", label: t("Sal.", "Grid"), align: "right", mono: true, width: 52, className: "wk-hide-sm", render: (row) => row.grid },
    { key: "gain", label: "±", align: "right", width: 48, render: (row) => (row.status === "finished" ? <Move value={row.grid - row.position} /> : "") },
    { key: "stops", label: t("Par.", "Stops"), align: "right", mono: true, width: 52, className: "wk-hide-sm", render: (row) => row.stops },
    gap,
    table.rows.some((row) => row.sprintPoints !== undefined) && { key: "spr", label: t("Sprint", "Sprint"), align: "right", width: 56, mono: true, className: "wk-hide-sm", render: (row) => (row.sprintPoints ? `+${row.sprintPoints}` : "") },
    points,
  ].filter(Boolean);
};

/** The classification table, paged. */
export function SessionTable({ table, teams, caption, pageSize = balance.results.pageSize }) {
  const [page, setPage] = useState(0);
  const pages = Math.max(1, Math.ceil(table.rows.length / pageSize));
  const current = Math.min(page, pages - 1);
  const rows = table.rows.slice(current * pageSize, (current + 1) * pageSize);
  return (
    <>
      <DataTable dense caption={caption} rows={rows} rowKey={(row) => row.id} highlight={(row) => row.own} columns={columnsFor(table, teams)} empty={t("Sin tiempos", "No times")} />
      {pages > 1 && (
        <nav className="wk-res__pager" aria-label={t("Páginas de resultados", "Result pages")}>
          <button type="button" className="mn-icon-btn" onClick={() => setPage(current - 1)} disabled={current === 0} aria-label={t("Página anterior", "Previous page")}>
            <IconChevronLeft size={16} />
          </button>
          <span>
            {current + 1}/{pages}
          </span>
          <button type="button" className="mn-icon-btn" onClick={() => setPage(current + 1)} disabled={current >= pages - 1} aria-label={t("Página siguiente", "Next page")}>
            <IconChevronRight size={16} />
          </button>
        </nav>
      )}
    </>
  );
}

/**
 * The results screen of one session: the leader, the table, the player's own notes (`children`,
 * e.g. what the drivers reported after practice) and the way on.
 */
export default function SessionResults({ table, teams = {}, meta, onContinue, continueLabel, summary, children }) {
  const leader = table.leader;
  const title = SESSION_TITLE[table.kind] ? SESSION_TITLE[table.kind]() : t("Resultados", "Results");
  return (
    <div className="wk-page">
      <div className="wk-c7">
        <Panel flush title={title} meta={meta}>
          {table.rows.length ? (
            <SessionTable table={table} teams={teams} caption={title} />
          ) : (
            <p className="wk-note wk-pad">{t("Sesión simulada: los ingenieros no traen cronometraje, solo lo que han aprendido del coche.", "Simulated session: the engineers bring no timing, only what they learnt about the car.")}</p>
          )}
        </Panel>
      </div>
      <div className="wk-c5 wk-stack">
        {leader && (
          <Panel title={LEADER_TEXT[table.kind]()} className="wk-res__leader">
            <div className="wk-winner">
              <TeamBadge team={teams[leader.teamId]} size={48} />
              <div>
                <small>{LEADER_TEXT[table.kind]()}</small>
                <strong>{leader.name}</strong>
                <span>{teams[leader.teamId]?.name}</span>
              </div>
              {leader.own && <Badge tone="pos">{t("Tu equipo", "Your team")}</Badge>}
            </div>
          </Panel>
        )}
        {table.kind === "practice" && <PracticeSummary summary={summary} />}
        {children}
        {onContinue && (
          <div className="wk-actions">
            <button type="button" className="mn-btn mn-btn--primary mn-btn--xl" onClick={onContinue}>
              {continueLabel || t("Continuar", "Continue")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
