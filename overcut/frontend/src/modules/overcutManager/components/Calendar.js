/**
 * The season's Grands Prix (RF-CAR-02, RF-WKD-07): a timeline of the rounds
 * with each circuit's shape, the table of rounds with your result, and the
 * selected round's circuit and podium at the side, with the rules of the era.
 * Data screen (DESIGN.md §6.3).
 */

import React, { useLayoutEffect, useMemo, useRef, useState } from "react";
import { eraOf } from "../engine/career";
import { rulesFor } from "../engine/rules";
import { circuitFor } from "../engine/venue";
import { pathOf, poseAt } from "../engine/trackGeometry";
import { useManager } from "./context";
import { Badge, DataTable, EmptyState, Flag, PageHeader, Panel, Sheet, TeamStripe } from "./atoms";
import { Facts, revealOnPhone } from "./dataScreen";
import { IconRain } from "./icons";
import { TYRE_SUPPLIER, gapText, ordinal, raceName, shortDate, t } from "./texts";
import "./styles/season.css";

/** A race's classification; also shown on the weekend's result screen. */
export function Classification({ career, summary }) {
  const teamOf = (id) => career.world.teams[id];
  return (
    <DataTable
      caption={raceName(summary.name)}
      rowKey={(row) => row.driverId}
      highlight={(row) => row.teamId === career.teamId}
      columns={[
        { key: "position", label: t("Pos", "Pos"), width: 44, render: (row) => <span className="mn-dt__pos">{row.status === "finished" ? row.position : "—"}</span> },
        {
          key: "name",
          label: t("Piloto", "Driver"),
          render: (row) => (
            <span className="mn-dt__team">
              <TeamStripe color={teamOf(row.teamId)?.color} />
              {row.name}
              {row.driverId === summary.fastestLap && <span className="mn-se-fl">{t("VR", "FL")}</span>}
            </span>
          ),
        },
        { key: "team", label: t("Equipo", "Team"), className: "mn-ds-hide-sm mn-ds-muted", render: (row) => teamOf(row.teamId)?.name },
        { key: "grid", label: t("Sal.", "Grid"), align: "right", width: 52, mono: true },
        { key: "stops", label: t("Paradas", "Stops"), align: "right", width: 64, mono: true, className: "mn-ds-hide-sm" },
        {
          key: "gap",
          label: t("Diferencia", "Gap"),
          align: "right",
          width: 112,
          mono: true,
          render: (row) => `${row.position === 1 && row.status === "finished" ? t("Ganador", "Winner") : gapText(row)}${row.penalty ? ` (+${row.penalty}s)` : ""}`,
        },
        { key: "points", label: t("Pts", "Pts"), align: "right", width: 48, render: (row) => (row.points ? <b>{row.points}</b> : "") },
      ]}
      rows={summary.rows}
    />
  );
}

const circuitOf = (race, year) => {
  try {
    return circuitFor(race, year);
  } catch {
    return null;
  }
};

/** The circuit's shape, drawn from the same centre line the race runs on. */
function CircuitThumb({ circuit, size = 40, detail = false, drs = false, label }) {
  if (!circuit?.points?.length) return <span className="mn-se-thumb is-empty" style={{ width: size, height: size }} aria-hidden="true" />;
  const { box } = circuit;
  const span = Math.max(box.maxX - box.minX, box.maxY - box.minY);
  const pad = span * 0.08;
  const width = span / (detail ? 70 : 22);
  const start = poseAt(circuit, 0);
  const n = circuit.points.length;
  return (
    <svg
      className={`mn-se-thumb${detail ? " is-detail" : ""}`}
      width={detail ? "100%" : size}
      height={detail ? undefined : size}
      viewBox={`${box.minX - pad} ${box.minY - pad} ${box.maxX - box.minX + pad * 2} ${box.maxY - box.minY + pad * 2}`}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : "true"}
    >
      {detail && <path d={pathOf(circuit.points)} className="mn-se-thumb__edge" strokeWidth={width * 2.6} />}
      <path d={pathOf(circuit.points)} className="mn-se-thumb__road" strokeWidth={width} />
      {detail &&
        drs &&
        circuit.drsZones.map((zone, index) => {
          const from = Math.floor(zone.from * n);
          const to = Math.ceil((zone.to < zone.from ? zone.to + 1 : zone.to) * n);
          const points = [];
          for (let k = from; k <= to; k += 1) points.push(circuit.points[((k % n) + n) % n]);
          return <path key={index} d={pathOf(points, false)} className="mn-se-thumb__drs" strokeWidth={width * 1.1} />;
        })}
      {detail && (
        <line
          x1={start.x - Math.sin(start.heading) * width * 2.4}
          y1={start.y + Math.cos(start.heading) * width * 2.4}
          x2={start.x + Math.sin(start.heading) * width * 2.4}
          y2={start.y - Math.cos(start.heading) * width * 2.4}
          className="mn-se-thumb__start"
          strokeWidth={width * 0.9}
        />
      )}
    </svg>
  );
}

/** The player's best car in a result, as a badge with its tone. */
const ownResult = (career, result) => {
  if (!result) return null;
  const own = result.rows.filter((row) => row.teamId === career.teamId);
  const best = own.filter((row) => row.status === "finished").sort((a, b) => a.position - b.position)[0];
  if (!best) return { tone: "neg", text: t("Abandono", "DNF"), key: "dnf" };
  if (best.position === 1) return { tone: "accent", text: ordinal(1), key: "win" };
  if (best.position <= 3) return { tone: "pos", text: ordinal(best.position), key: "podium" };
  return { tone: own.some((row) => row.points > 0) ? "neutral" : "muted", text: ordinal(best.position), key: own.some((row) => row.points > 0) ? "points" : "none" };
};

const OwnBadge = ({ result }) =>
  result ? (
    result.tone === "muted" ? (
      <span className="mn-ds-muted">{result.text}</span>
    ) : (
      <Badge tone={result.tone} dot={result.tone !== "neutral"}>
        {result.text}
      </Badge>
    )
  ) : null;

const ENERGY = { none: () => t("Ninguna", "None"), kers: () => "KERS", ers: () => t("ERS híbrido", "Hybrid ERS"), ers2026: () => t("ERS 2026, modo adelantamiento", "2026 ERS, overtake mode") };

function EraPanel({ career }) {
  const rules = useMemo(() => rulesFor(eraOf(career)), [career]);
  const regs = rules.regulations || {};
  const sprints = career.world.races.filter((race) => race.sprint).length;
  const yes = t("Sí", "Yes");
  const no = t("No", "No");
  const raceControl = [rules.raceControl.safetyCar && "SC", rules.raceControl.vsc && "VSC"].filter(Boolean).join(" · ") || t("Solo banderas", "Flags only");
  return (
    <Panel title={t(`Reglamento ${career.year}`, `${career.year} rules`)} meta={rules.source === "pack" ? t("del pack de temporada", "from the season pack") : t("por era", "by era")}>
      <Facts
        label={t("Reglamento", "Rules")}
        items={[
          [t("Puntos", "Points"), <span className="mn-ds-mono">{(rules.points.race || []).join("-")}</span>],
          rules.points.fastestLap?.point > 0 ? [t("Vuelta rápida", "Fastest lap"), `+${rules.points.fastestLap.point}`] : null,
          regs.engineFormula ? [t("Motor", "Engine"), regs.engineFormula] : null,
          [t("Energía", "Energy"), (ENERGY[rules.energy.system] || ENERGY.none)()],
          [t("Repostaje", "Refuelling"), rules.refuelling ? yes : no],
          [t("Neumáticos", "Tyres"), rules.tyres.suppliers.map((id) => TYRE_SUPPLIER[id] || id).join(", ") || "—"],
          [t("Adelantamiento", "Overtaking aid"), rules.activeAero ? t("Aero activa", "Active aero") : rules.drs.enabled ? "DRS" : "—"],
          [t("Dirección de carrera", "Race control"), raceControl],
          [t("Clasificación", "Qualifying"), rules.qualifying.knockout ? "Q1 · Q2 · Q3" : t("Sesiones cronometradas", "Timed sessions")],
          sprints > 0 ? [t("Sprints", "Sprints"), sprints] : null,
          rules.budgetCap ? [t("Techo de gasto", "Cost cap"), `${rules.budgetCap} M USD`] : null,
        ]}
      />
    </Panel>
  );
}

function RoundDetail({ career, index, circuit, onOpen }) {
  const race = career.world.races[index];
  const result = career.season.results[index];
  if (!race) return null;
  const own = result ? result.rows.filter((row) => row.teamId === career.teamId) : [];
  const state = result ? "done" : index === career.round ? "now" : "next";
  const drs = rulesFor(career.year).drs.enabled;
  return (
    <Panel
      className="mn-se-detail"
      title={
        <span className="mn-se-detail__title">
          <Flag code={race.country} width={20} />
          {raceName(race.name)}
        </span>
      }
      meta={t(`Ronda ${index + 1}`, `Round ${index + 1}`)}
    >
      <div className="mn-se-detail__map">
        <CircuitThumb circuit={circuit} detail drs={drs} label={t(`Trazado de ${raceName(race.name)}`, `${raceName(race.name)} layout`)} />
      </div>
      <Facts
        label={raceName(race.name)}
        items={[
          [t("Fecha", "Date"), `${shortDate(race.date)}${race.location ? ` · ${race.location}` : ""}`],
          [t("Vueltas", "Laps"), race.laps],
          circuit ? [t("Longitud", "Length"), `${(circuit.length / 1000).toFixed(3)} km`] : null,
          circuit ? [t("Distancia", "Distance"), `${((circuit.length * race.laps) / 1000).toFixed(1)} km`] : null,
          circuit ? [t("Curvas", "Corners"), circuit.corners.length] : null,
          race.sprint ? [t("Formato", "Format"), <Badge tone="info">{t("Sprint", "Sprint")}</Badge>] : null,
        ]}
      />
      {result ? (
        <>
          <ol className="mn-se-podium" aria-label={t("Podio", "Podium")}>
            {result.rows.slice(0, 3).map((row) => (
              <li key={row.driverId} className={row.teamId === career.teamId ? "is-own" : ""}>
                <b>{row.position}</b>
                <TeamStripe color={career.world.teams[row.teamId]?.color} />
                <span>{row.name}</span>
                <em>{row.position === 1 ? (result.weather !== "dry" ? <IconRain size={14} title={t("Lluvia", "Rain")} /> : null) : gapText(row)}</em>
              </li>
            ))}
          </ol>
          <div className="mn-se-own">
            {own.map((row) => (
              <div key={row.driverId}>
                <strong>{row.status === "finished" ? ordinal(row.position) : gapText(row)}</strong>
                <span>{row.name}</span>
                <small>
                  {t("Salió", "Grid")} {row.grid} · {row.points} pts
                </small>
              </div>
            ))}
          </div>
          <button type="button" className="mn-btn" onClick={onOpen}>
            {t("Clasificación completa", "Full classification")}
          </button>
        </>
      ) : (
        <EmptyState compact title={state === "now" ? t("Es el próximo Gran Premio", "This is the next Grand Prix") : t("Aún no se ha corrido", "Not run yet")} />
      )}
    </Panel>
  );
}

export default function Calendar() {
  const { career } = useManager();
  const races = career.world.races;
  const results = career.season.results;
  const [selected, setSelected] = useState(() => Math.min(career.round, races.length - 1));
  const [open, setOpen] = useState(false);
  const circuits = useMemo(() => races.map((race) => circuitOf(race, career.year)), [races, career.year]);
  const winnerOf = (result) => result?.rows.find((row) => row.status === "finished" && row.position === 1);
  const sprints = races.filter((race) => race.sprint).length;
  const summary = results[selected];
  const side = useRef(null);
  const strip = useRef(null);
  // Start the timeline scrolled to the current round (it scrolls sideways on narrow screens).
  useLayoutEffect(() => {
    const list = strip.current;
    const item = list?.children?.[Math.min(career.round, races.length - 1)];
    if (list && item && list.scrollWidth > list.clientWidth) list.scrollLeft = Math.max(0, item.offsetLeft - list.clientWidth / 2 + item.clientWidth / 2);
  }, [career.round, races.length]);

  const rows = races.map((race, index) => ({ race, index, result: results[index] }));

  return (
    <div className="mn-ds mn-calendar2">
      <PageHeader
        title={t("Calendario", "Calendar")}
        meta={t(
          `Temporada ${career.year} · ${races.length} Grandes Premios${sprints ? ` · ${sprints} sprints` : ""} · ${results.length} disputados`,
          `${career.year} season · ${races.length} Grands Prix${sprints ? ` · ${sprints} sprints` : ""} · ${results.length} run`,
        )}
      />

      <ol className="mn-se-timeline" aria-label={t("Temporada", "Season")} ref={strip}>
        {rows.map(({ race, index, result }) => {
          const own = ownResult(career, result);
          const state = result ? "done" : index === career.round ? "now" : "next";
          return (
            <li key={race.name + index} className={`is-${state}${selected === index ? " is-selected" : ""}`}>
              <button type="button" onClick={() => setSelected(index)} aria-label={`${index + 1}. ${raceName(race.name)}${own ? ` · ${own.text}` : ""}`} aria-pressed={selected === index}>
                <span className="mn-se-timeline__round">{index + 1}</span>
                <CircuitThumb circuit={circuits[index]} size={32} />
                <Flag code={race.country} width={18} />
                <span className={`mn-se-timeline__mark is-${own ? own.key : state}`}>{own ? own.text : state === "now" ? t("Siguiente", "Next") : shortDate(race.date)}</span>
                {race.sprint && <span className="mn-se-timeline__sprint">S</span>}
              </button>
            </li>
          );
        })}
      </ol>

      <div className="mn-ds__grid">
        <div className="mn-ds__main">
          <Panel flush title={t("Grandes Premios", "Grands Prix")} meta={t("Elige una ronda para ver el detalle", "Pick a round for the detail")}>
            <DataTable
              className="mn-se-rounds"
              caption={t(`Calendario ${career.year}`, `${career.year} calendar`)}
              rowKey={(row) => row.race.name + row.index}
              highlight={(row) => row.index === career.round && !row.result}
              onRowClick={(row) => {
                setSelected(row.index);
                revealOnPhone(side.current);
              }}
              columns={[
                { key: "round", label: t("R", "R"), width: 40, render: (row) => <span className="mn-dt__pos">{row.index + 1}</span> },
                { key: "date", label: t("Fecha", "Date"), width: 72, mono: true, className: "mn-ds-hide-sm", render: (row) => shortDate(row.race.date) },
                {
                  key: "gp",
                  label: t("Gran Premio", "Grand Prix"),
                  render: (row) => (
                    <span className="mn-ds-who">
                      <Flag code={row.race.country} width={18} />
                      <span>
                        <strong>{raceName(row.race.name)}</strong>
                        <small>
                          {row.race.location || ""}
                          {row.race.location ? " · " : ""}
                          {row.race.laps} {t("vueltas", "laps")}
                        </small>
                      </span>
                    </span>
                  ),
                },
                sprints > 0 && { key: "format", label: t("Formato", "Format"), width: 72, className: "mn-ds-hide-sm", render: (row) => (row.race.sprint ? <Badge tone="info">{t("Sprint", "Sprint")}</Badge> : <span className="mn-ds-muted">—</span>) },
                {
                  key: "winner",
                  label: t("Ganador", "Winner"),
                  className: "mn-ds-hide-sm",
                  render: (row) => {
                    const winner = winnerOf(row.result);
                    if (!winner) return <span className="mn-ds-muted">{row.index === career.round ? t("Siguiente", "Next") : ""}</span>;
                    return (
                      <span className="mn-dt__team">
                        <TeamStripe color={career.world.teams[winner.teamId]?.color} />
                        {winner.name}
                        {row.result.weather !== "dry" && <IconRain size={14} title={t("Lluvia", "Rain")} />}
                      </span>
                    );
                  },
                },
                { key: "own", label: t("Tu mejor", "Your best"), align: "right", width: 96, render: (row) => <OwnBadge result={ownResult(career, row.result)} /> },
              ].filter(Boolean)}
              rows={rows}
            />
          </Panel>
        </div>
        <div className="mn-ds__side" ref={side}>
          <RoundDetail career={career} index={selected} circuit={circuits[selected]} onOpen={() => setOpen(true)} />
          <EraPanel career={career} />
        </div>
      </div>

      <Sheet open={open && Boolean(summary)} onClose={() => setOpen(false)} title={summary ? raceName(summary.name) : ""} wide>
        {summary && <Classification career={career} summary={summary} />}
      </Sheet>
    </div>
  );
}
