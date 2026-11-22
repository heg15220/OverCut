/**
 * Car & R&D (DESIGN.md §6.4, "Detail screen"): the team's real car on its stage,
 * where it stands against the field, what it is made of, and what the factory
 * builds next - for this season's car or for next year's (SRS 5.5 RF-DEV-01..08,
 * RF-SIM-14; RF-3D-01/05/06 for the stage).
 *
 *   stage          the real GLB of the team and season (or its era's procedural car), with author and licence
 *   performance    the four areas the race reads, with the field's best as a tick
 *   loadout        every part on each car, its spec and condition; picks the part below
 *   part           the chosen part: stats against the field, its designs and units, swaps, a new design at a pace
 *   factory        designs, projects and builds on a timeline of the coming rounds
 *   units          power-unit/gearbox usage per driver against the era's allocation
 *   supply & aero  engine supplier, wind tunnel/CFD allocation (2021+), next rule change
 *   expertise      what the design office knows, per part and stat
 *   grid           every car on pace
 */

import React, { useMemo, useState } from "react";
import { AREAS, carRatingOf, fieldBestOf, fieldMeanOf, isRegulationReset, reliabilityOf, slotsFor, biasesOf } from "../engine/car";
import { PHASES, eraOf } from "../engine/career";
import { costCapFor } from "../engine/economy";
import { teamsByPace } from "../engine/world";
import {
  aeroResourcesOf, designQuote, developmentCapLeft, engineSupplyOf, fitNewUnitNow, fitPart, loadoutOf, manufactureParts, pendingPenaltyOf, regulationChangeFor, sparesOf,
  startDesign, unitsOfDriver,
} from "../engine/development";
import { PACES, canFitNow, designRounds, designScore, latestDesign, unitCost, unitsOfDesign } from "../engine/development/design";
import { DEV, isBodyPart } from "../engine/development/parts";
import { partOfComponent } from "../engine/development/units";
import { testingBanned } from "../engine/development/aero";
import { carAssetFor } from "../three/assets/manifest";
import { useManager } from "./context";
import { Badge, Bar, EmptyState, Livery, Meter, PageHeader, Panel, Rating, Segmented, TeamBadge, TeamStripe } from "./atoms";
import { AREA, AREA_HINT, CONDITION, PACE, PART, SIZE, STAT, UNIT_COMPONENT, money, ordinal, raceName, t } from "./texts";
import "./styles/car.css";

const CONDITION_TONE = { perfect: "pos", light: "warn", heavy: "neg", destroyed: "neg" };

const signed = (value, digits = 1) => `${value >= 0 ? "+" : "−"}${Math.abs(value).toFixed(digits)}`;

const gainText = (areas = {}) =>
  Object.entries(areas)
    .filter(([, gain]) => Math.abs(gain) >= 0.005)
    .map(([area, gain]) => `${AREA[area]()} ${signed(gain, 2)}`)
    .join(" · ") || "—";

const isWinterOf = (career) => career.phase === PHASES.OFFSEASON || career.phase === PHASES.REVIEW;

/** For every part and stat: the best (and worst) current design on the grid, and who has it. */
const fieldOfParts = (teams, list) => {
  const out = {};
  list.forEach((part) => {
    const stats = {};
    let bestScore = { value: -Infinity, team: null };
    teams.forEach((team) => {
      const design = team.parts ? latestDesign(team.parts, part) : null;
      if (!design) return;
      const score = designScore(design);
      if (score > bestScore.value) bestScore = { value: score, team };
      Object.entries(design.stats).forEach(([stat, value]) => {
        const entry = stats[stat] || { best: -Infinity, min: Infinity, team: null };
        if (value > entry.best) Object.assign(entry, { best: value, team });
        entry.min = Math.min(entry.min, value);
        stats[stat] = entry;
      });
    });
    out[part] = { stats, bestScore };
  });
  return out;
};

export default function Car() {
  const { career } = useManager();
  const team = career.world.teams[career.teamId];
  const teams = Object.values(career.world.teams);
  const ranked = teamsByPace(career.world);
  const rank = ranked.findIndex((entry) => entry.id === team.id) + 1;
  const chassis = team.chassis?.[0] || null;
  const parts = team.parts;
  const [part, setPart] = useState(() => (parts?.list.includes("floor") ? "floor" : parts?.list[0]));
  const field = useMemo(() => (parts ? fieldOfParts(teams, parts.list) : {}), [teams, parts]);

  return (
    <div className="mn-carx">
      <PageHeader
        title={t("Coche e I+D", "Car & R&D")}
        meta={t(`${chassis ? `${chassis} · ` : ""}Temporada ${career.year} · ${ordinal(rank)} de ${teams.length} en ritmo`, `${chassis ? `${chassis} · ` : ""}${career.year} season · ${ordinal(rank)} of ${teams.length} on pace`)}
      />
      <div className="mn-carx__grid">
        <Stage team={team} chassis={chassis} rank={rank} count={teams.length} />
        <Performance team={team} teams={teams} />
        {parts ? (
          <>
            <Loadout part={part} onPick={setPart} field={field} />
            <PartDetail key={part} part={part} field={field[part]} />
            <Factory />
            <Units />
            <SupplyAndAero />
            <Expertise part={part} onPick={setPart} />
          </>
        ) : (
          <Panel className="mn-carx__wide">
            <EmptyState title={t("Este coche aún no tiene piezas", "This car has no parts yet")} />
          </Panel>
        )}
        <PaceGrid ranked={ranked} own={team.id} />
      </div>
    </div>
  );
}

// ------------------------------------------------------------- stage

/** The one 3D scene of the screen (RNF-02): the real car when the manifest has it (RF-3D-01), with its credit (RF-3D-06). */
function Stage({ team, chassis, rank, count }) {
  const { career } = useManager();
  const asset = team.custom ? null : carAssetFor(career.year, team.id);
  const { powerBias } = biasesOf(team.car);
  const character =
    powerBias > 0.62
      ? t("Coche de rectas: brilla en Monza, Spa o Bakú", "A straight-line car: it shines at Monza, Spa and Baku")
      : powerBias < 0.48
        ? t("Coche de curvas: brilla en Mónaco, Hungría o Singapur", "A cornering car: it shines at Monaco, Hungary and Singapore")
        : t("Coche equilibrado: sin circuito que le castigue", "A balanced car: no circuit punishes it");
  return (
    <section className="mn-carx-stage" style={{ "--stage-team": team.color }} aria-label={t("El coche", "The car")}>
      <header className="mn-carx-stage__head">
        <div>
          <span className="mn-carx-stage__kicker">
            <TeamStripe color={team.color} height={14} /> {team.name} · {career.year}
          </span>
          <h2>{chassis || t(`Coche de ${career.year}`, `${career.year} car`)}</h2>
          <p>{character}</p>
        </div>
        <div className="mn-carx-stage__rating">
          <Rating value={carRatingOf(team.car)} size="lg" />
          <span>{t(`${ordinal(rank)} de ${count}`, `${ordinal(rank)} of ${count}`)}</span>
        </div>
      </header>
      <div className="mn-carx-stage__floor">
        <Livery color={team.color} color2={team.color2} width={720} height="100%" year={career.year} name={team.name} teamRef={team.custom ? null : team.id} />
      </div>
      {!asset && (
        <p className="mn-carx-stage__note">{t(`Modelo procedural de la era ${career.year}: no hay modelo 3D de este equipo`, `Procedural model of the ${career.year} era: there is no 3D model of this team`)}</p>
      )}
    </section>
  );
}

// ------------------------------------------------------- performance

function Performance({ team, teams }) {
  const { career } = useManager();
  const best = fieldBestOf(teams);
  const mean = fieldMeanOf(teams);
  const parts = team.parts;
  const drivers = team.drivers.map((id) => career.world.drivers[id]);
  return (
    <Panel className="mn-carx-perf" title={t("Rendimiento", "Performance")} meta={t("frente a la parrilla", "against the field")}>
      <ul className="mn-carx-areas">
        {AREAS.map((area) => {
          const rank = [...teams].sort((a, b) => b.car[area] - a.car[area]).findIndex((entry) => entry.id === team.id) + 1;
          const leader = [...teams].sort((a, b) => b.car[area] - a.car[area])[0];
          const gap = team.car[area] - best[area];
          const reliability = area === "reliability";
          return (
            <li key={area}>
              <div className="mn-carx-areas__head">
                <span>{AREA[area]()}</span>
                <small>{ordinal(rank)}</small>
                <b>{reliability ? `${Math.round(reliabilityOf(team.car, eraOf(career)) * 100)}%` : team.car[area].toFixed(1)}</b>
              </div>
              <Bar value={team.car[area]} marker={best[area]} min={Math.min(...teams.map((entry) => entry.car[area])) - 5} max={best[area] + 3} tone={reliability ? "green" : "gold"} />
              <p>
                {gap >= -0.05 ? t("El mejor de la parrilla", "Best on the grid") : t(`${signed(gap)} vs. ${leader.name}`, `${signed(gap)} vs ${leader.name}`)}
                <span> · {t("media", "average")} {mean[area].toFixed(1)}</span>
              </p>
              <span className="mn-sr">{AREA_HINT[area]()}</span>
            </li>
          );
        })}
      </ul>
      {parts?.cars && (
        <div className="mn-carx-split">
          {[0, 1].map((car) => (
            <div key={car}>
              <small>{drivers[car]?.name || t(`Coche ${car + 1}`, `Car ${car + 1}`)}</small>
              <b>{carRatingOf(parts.cars[car] || team.car).toFixed(1)}</b>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

// ----------------------------------------------------------- loadout

function Loadout({ part: picked, onPick, field }) {
  const { career } = useManager();
  const team = career.world.teams[career.teamId];
  const parts = team.parts;
  const drivers = team.drivers.map((id) => career.world.drivers[id]);
  const cars = [loadoutOf(career, 0), loadoutOf(career, 1)];
  const open = canFitNow(career);
  const damaged = cars.flat().filter((row) => row.condition !== "perfect").length;
  const short = (name) => (name ? name.split(" ").slice(-1)[0] : "");

  return (
    <Panel
      className="mn-carx-loadout"
      flush
      title={t("Montaje por coche", "Car loadout")}
      meta={damaged ? t(`${damaged} dañadas`, `${damaged} damaged`) : t(`${parts.list.length} piezas`, `${parts.list.length} parts`)}
      action={!open ? <Badge tone="neg" dot>{t("Parque cerrado", "Parc fermé")}</Badge> : null}
    >
      <div className="mn-carx-loadout__cols" aria-hidden="true">
        <span>{t("Pieza", "Part")}</span>
        <span>{short(drivers[0]?.name) || t("Coche 1", "Car 1")}</span>
        <span>{short(drivers[1]?.name) || t("Coche 2", "Car 2")}</span>
        <span>{t("vs. mejor", "vs best")}</span>
      </div>
      <div className="mn-carx-loadout__list" role="radiogroup" aria-label={t("Pieza", "Part")}>
        {parts.list.map((part, row) => {
          const mine = cars[0][row].design;
          const best = field[part]?.bestScore;
          const delta = mine && best?.team && best.team.id !== team.id ? designScore(mine) - best.value : 0;
          return (
            <button type="button" key={part} role="radio" aria-checked={picked === part} className={picked === part ? "is-active" : ""} onClick={() => onPick(part)}>
              <span className="mn-carx-loadout__part">{PART[part]()}</span>
              {[0, 1].map((car) => {
                const entry = cars[car][row];
                return (
                  <span key={car} className="mn-carx-loadout__car">
                    <b>v{entry.design?.version ?? "—"}</b>
                    {isBodyPart(part) ? (
                      <i className={`mn-carx-dot is-${CONDITION_TONE[entry.condition]}`} title={CONDITION[entry.condition]()} aria-label={CONDITION[entry.condition]()} />
                    ) : null}
                    {entry.pending && entry.pending !== entry.design?.id && <small>{t("nueva", "new")}</small>}
                  </span>
                );
              })}
              <span className={`mn-carx-loadout__delta${delta < -0.05 ? " is-neg" : " is-pos"}`}>{delta < -0.05 ? signed(delta) : t("mejor", "best")}</span>
            </button>
          );
        })}
      </div>
      {damaged > 0 && (
        <p className="mn-carx-note">{t(`Cada pieza dañada resta rendimiento hasta que montes un repuesto.`, `Each damaged part costs pace until you fit a spare.`)}</p>
      )}
    </Panel>
  );
}

// --------------------------------------------------------- the part

function PartDetail({ part, field }) {
  const { career, act } = useManager();
  const team = career.world.teams[career.teamId];
  const parts = team.parts;
  const winter = isWinterOf(career);
  const [error, setError] = useState(null);
  const row = parts.list.indexOf(part);
  const cars = [loadoutOf(career, 0)[row], loadoutOf(career, 1)[row]];
  const fitted = cars[0]?.design;
  const designs = Object.values(parts.designs)
    .filter((design) => design.part === part)
    .sort((a, b) => b.version - a.version);
  const body = isBodyPart(part);
  const max = DEV.parts[part].maxUnits;
  const expertise = parts.expertise?.[part] || {};
  const drivers = team.drivers.map((id) => career.world.drivers[id]);
  const open = canFitNow(career);

  const build = (designId, count, fit) => {
    const result = act((c) => manufactureParts(c, { designId, count, fit }));
    setError(result?.ok ? null : result?.error);
  };
  const swap = (itemId, car) => {
    const result = act((c) => fitPart(c, { itemId, car }));
    setError(result?.ok ? null : result?.error);
  };
  const errors = {
    units: t("No se pueden fabricar más unidades de este diseño.", "No more units of this design can be built."),
    money: t("No hay dinero en caja.", "Not enough money."),
    cap: t("Superarías el límite presupuestario.", "You would break the cost cap."),
    winter: t("En invierno se trabaja en el coche nuevo.", "In the winter the factory works on the new car."),
    "parc-ferme": t("Con el coche en parque cerrado no se cambian piezas.", "No part changes under parc fermé."),
  };

  return (
    <Panel className="mn-carx-part" title={PART[part]()} meta={fitted ? t(`v${fitted.version} montada · ${designs.length} ${designs.length === 1 ? "diseño" : "diseños"}`, `v${fitted.version} fitted · ${designs.length} ${designs.length === 1 ? "design" : "designs"}`) : undefined}>
      <div className="mn-carx-part__body">
        <div className="mn-carx-part__stats">
          <h4>{t("Estadísticas frente a la parrilla", "Stats against the field")}</h4>
          <ul className="mn-carx-stats">
            {fitted &&
              Object.entries(fitted.stats).map(([stat, value]) => {
                const entry = field?.stats?.[stat];
                const gap = entry ? value - entry.best : 0;
                return (
                  <li key={stat}>
                    <div className="mn-carx-stats__head">
                      <span>{STAT[stat]()}</span>
                      <b>{value.toFixed(1)}</b>
                    </div>
                    <Bar value={value} marker={entry?.best} min={(entry?.min ?? value) - 4} max={(entry?.best ?? value) + 2} tone={gap >= -0.05 ? "gold" : "steel"} />
                    <p>
                      {gap >= -0.05 ? (
                        <span className="is-pos">{t("Mejor de la parrilla", "Best on the grid")}</span>
                      ) : (
                        <>
                          <em className="is-neg">{signed(gap)}</em> {t(`vs. ${entry.team?.name}`, `vs ${entry.team?.name}`)}
                        </>
                      )}
                      {expertise[stat] !== undefined && <span> · {t("expertise", "expertise")} {expertise[stat].toFixed(0)}</span>}
                    </p>
                  </li>
                );
              })}
          </ul>
          <p className="mn-carx-legend">
            <i aria-hidden="true" /> {t("Marca: el mejor diseño de la parrilla", "Tick: the best design on the grid")}
          </p>
        </div>

        <div className="mn-carx-part__side">
          <h4>{t("Diseños y fabricación", "Designs and manufacturing")}</h4>
          <ul className="mn-carx-designs" data-testid={`design-${part}`}>
            {designs.map((design) => {
              const units = body ? unitsOfDesign(parts, career.rd.built, design.id) : null;
              const delta = fitted && design.id !== fitted.id ? designScore(design) - designScore(fitted) : null;
              return (
                <li key={design.id} className={fitted?.id === design.id ? "is-fitted" : ""}>
                  <div className="mn-carx-designs__head">
                    <b>v{design.version}</b>
                    <span>{designScore(design).toFixed(1)}</span>
                    {delta !== null && <small className={delta >= 0 ? "is-pos" : "is-neg"}>{signed(delta)}</small>}
                    {fitted?.id === design.id && <Badge tone="accent">{t("Montada", "Fitted")}</Badge>}
                    {design.failed && <Badge tone="neg">{t("Fallido", "Failed")}</Badge>}
                  </div>
                  {body && (
                    <div className="mn-carx-designs__units">
                      <span className="mn-carx-pips" aria-label={t(`${units} de ${max} unidades`, `${units} of ${max} units`)}>
                        {Array.from({ length: max }, (_, index) => (
                          <i key={index} className={index < units ? "is-on" : ""} />
                        ))}
                      </span>
                      <small>
                        {units}/{max} {t("unidades", "units")}
                      </small>
                    </div>
                  )}
                  {body && !winter && units < max && (
                    <div className="mn-carx-designs__actions">
                      <button type="button" className="mn-btn mn-btn--sm" onClick={() => build(design.id, 1, null)}>
                        {t("Fabricar 1", "Build 1")} · {money(unitCost(part, career.year))}
                      </button>
                      {units + 2 <= max && (
                        <button type="button" className="mn-btn mn-btn--sm" onClick={() => build(design.id, 2, "both")}>
                          {t("Fabricar 2 y montar", "Build 2 and fit")}
                        </button>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          {body && (
            <>
              <h4>{t("En cada coche", "On each car")}</h4>
              <ul className="mn-carx-fitted">
                {[0, 1].map((car) => {
                  const entry = cars[car];
                  const other = parts.loadout[1 - car][part];
                  const options = [...sparesOf(parts, part), ...(other ? [parts.items.find((item) => item.id === other)].filter(Boolean) : [])];
                  return (
                    <li key={car}>
                      <span>{drivers[car]?.name || t(`Coche ${car + 1}`, `Car ${car + 1}`)}</span>
                      <Badge tone={CONDITION_TONE[entry.condition]} dot>
                        v{entry.design?.version ?? "—"} · {CONDITION[entry.condition]()}
                      </Badge>
                      {options.length > 0 && open && (
                        <select
                          className="mn-carx-select"
                          aria-label={t(`Cambiar ${PART[part]()} del coche ${car + 1}`, `Swap car ${car + 1} ${PART[part]()}`)}
                          value=""
                          onChange={(event) => event.target.value && swap(event.target.value, car)}
                        >
                          <option value="">{t("Cambiar…", "Swap…")}</option>
                          {options.map((item) => (
                            <option key={item.id} value={item.id}>
                              {`v${parts.designs[item.design]?.version ?? "?"} · ${CONDITION[item.condition]()}`}
                            </option>
                          ))}
                        </select>
                      )}
                    </li>
                  );
                })}
              </ul>
            </>
          )}
          {error && <p className="mn-error">{errors[error] || error}</p>}
        </div>
      </div>
      <NewDesign part={part} />
    </Panel>
  );
}

function NewDesign({ part }) {
  const { career, act } = useManager();
  const team = career.world.teams[career.teamId];
  const winter = isWinterOf(career);
  const [pace, setPace] = useState("normal");
  const [target, setTarget] = useState(winter ? "next" : "now");
  const [focus, setFocus] = useState("");
  const [error, setError] = useState(null);
  const effectiveTarget = winter ? "next" : target;
  const quote = designQuote(career, { part, pace, target: effectiveTarget, focus: focus || null });
  const capLeft = developmentCapLeft(career);
  const cap = costCapFor(winter ? career.year + 1 : career.year);
  const reset = isRegulationReset(career.year + 1);

  const launch = () => {
    const result = act((c) => startDesign(c, { part, pace, target: effectiveTarget, focus: focus || null }));
    setError(result?.ok ? null : result?.error);
  };
  const errors = {
    slots: t("La oficina técnica no admite más diseños a la vez.", "The design office cannot run more designs at once."),
    money: t("No hay dinero en caja.", "Not enough money."),
    cap: t("Superarías el límite presupuestario.", "You would break the cost cap."),
    late: t("No da tiempo a terminarlo esta temporada.", "There is no time to finish it this season."),
    customer: t("Equipo cliente: esta pieza la desarrolla tu proveedor de motor.", "Customer team: your engine supplier develops this part."),
    aero: t("No quedan horas de túnel de viento o CFD en este periodo.", "No wind tunnel or CFD time left in this period."),
    ended: t("La partida ha terminado.", "The career is over."),
    invalid: t("Petición no válida.", "Invalid request."),
  };
  const roundsText = (n) => `${n} ${n === 1 ? t("carrera", "race") : t("carreras", "races")}`;

  return (
    <div className="mn-carx-new">
      <h4>{t(`Nuevo diseño · ${PART[part]()}`, `New design · ${PART[part]()}`)}</h4>
      <div className="mn-carx-paces" role="radiogroup" aria-label={t("Ritmo", "Pace")}>
        {PACES.map((value) => (
          <button type="button" key={value} role="radio" aria-checked={pace === value} className={pace === value ? "is-active" : ""} onClick={() => setPace(value)}>
            <b>{PACE[value]()}</b>
            <span>
              ×{DEV.paces[value].cost} · {roundsText(designRounds(part, value))}
            </span>
          </button>
        ))}
      </div>
      <div className="mn-carx-new__row">
        <Segmented
          label={t("Para", "For")}
          value={effectiveTarget}
          onChange={setTarget}
          options={[
            { value: "now", label: t(`Coche ${career.year}`, `${career.year} car`), disabled: winter },
            { value: "next", label: t(`Coche ${career.year + 1}`, `${career.year + 1} car`) },
          ]}
        />
        <label className="mn-carx-field">
          <span>{t("Enfoque", "Focus")}</span>
          <select className="mn-carx-select" value={focus} onChange={(event) => setFocus(event.target.value)}>
            <option value="">{t("Equilibrado", "Balanced")}</option>
            {Object.keys(DEV.parts[part].stats).map((stat) => (
              <option key={stat} value={stat}>
                {STAT[stat]()}
              </option>
            ))}
          </select>
        </label>
      </div>
      {!quote.error && (
        <dl className="mn-carx-quote">
          <div>
            <dt>{t("Coste", "Cost")}</dt>
            <dd>{money(quote.cost)}</dd>
          </div>
          <div>
            <dt>{t("Plazo", "Lead time")}</dt>
            <dd>{winter ? t("Antes de la 1.ª carrera", "Before round 1") : roundsText(quote.rounds)}</dd>
          </div>
          <div>
            <dt>{t("Riesgo de fallo", "Failure risk")}</dt>
            <dd>{Math.round(quote.failure * 100)}%</dd>
          </div>
          {quote.aeroCost && (
            <div>
              <dt>{t("Túnel / CFD", "Tunnel / CFD")}</dt>
              <dd>
                {quote.aeroCost.windTunnelRuns} / {quote.aeroCost.cfdItems}
              </dd>
            </div>
          )}
          <div className="is-wide">
            <dt>{t("Ganancia esperada", "Expected gain")}</dt>
            <dd>{gainText(quote.expected.areas)}</dd>
          </div>
        </dl>
      )}
      {cap !== null && (
        <Bar label={t("Límite presupuestario de I+D", "Development cost cap")} value={cap - (capLeft ?? 0)} max={cap} caption={`${money(capLeft)} ${t("libres", "left")}`} tone={capLeft < cap * 0.15 ? "red" : "steel"} />
      )}
      {pace === "intense" && <p className="mn-carx-note">{t("Intenso: cuesta el triple, pero la oficina aprende un 50 % más (expertise).", "Intense: three times the cost, but the office learns 50% more (expertise).")}</p>}
      {effectiveTarget === "next" && (
        <p className="mn-carx-note">
          {reset
            ? t("Cambio de reglamento: el trabajo en el coche nuevo rinde un 50 % más, pero casi nada del coche actual sobrevive.", "Regulation change: work on the new car pays 50% more, but almost nothing of the current car survives.")
            : t("El trabajo en el coche del año que viene rinde un 25 % más, pero compite por la fábrica y el presupuesto con el actual.", "Work on next year's car pays 25% more, but competes with this car for the factory and the budget.")}
        </p>
      )}
      {quote.blocked?.length > 0 && <p className="mn-error">{errors[quote.blocked[0]]}</p>}
      <div className="mn-carx-new__go">
        <button type="button" className="mn-btn mn-btn--primary" onClick={launch} disabled={Boolean(quote.error) || quote.blocked?.length > 0}>
          {t("Encargar diseño", "Commission design")}
        </button>
        <small>{t(`Fábrica nivel ${team.facility}/5`, `Factory level ${team.facility}/5`)}</small>
      </div>
      {error && <p className="mn-error">{errors[error] || error}</p>}
    </div>
  );
}

// ----------------------------------------------------------- factory

function Factory() {
  const { career } = useManager();
  const team = career.world.teams[career.teamId];
  const winter = isWinterOf(career);
  const slots = slotsFor(team.facility);
  const busy = career.rd.designs.length + career.rd.projects.length;
  const races = career.world.races;
  const items = [
    ...career.rd.designs.map((entry) => ({ id: entry.id, kind: "design", label: PART[entry.part](), meta: `${PACE[entry.pace]()} · ${entry.season}`, gain: gainText(entry.expected.areas), rounds: entry.roundsLeft })),
    ...career.rd.projects.map((project) => ({ id: project.id, kind: "project", label: AREA[project.area](), meta: `${SIZE[project.size]()} · ${project.target === "next" ? career.year + 1 : career.year}`, gain: `+${project.expected.toFixed(1)}`, rounds: project.roundsLeft })),
    ...career.rd.built.map((entry, index) => ({
      id: `b${index}`,
      kind: "build",
      label: PART[entry.part](),
      meta: t("Fabricación", "Manufacturing"),
      gain: entry.fit === null ? t("al almacén", "to stores") : entry.fit === "both" ? t("ambos coches", "both cars") : t(`coche ${Number(entry.fit) + 1}`, `car ${Number(entry.fit) + 1}`),
      rounds: entry.roundsLeft,
    })),
  ];
  const left = Math.max(1, races.length - career.round);
  const span = winter ? 1 : Math.min(left, Math.max(4, ...items.map((item) => item.rounds || 1)));
  const ticks = winter
    ? [{ key: "w", label: t("Invierno", "Winter"), title: t("Antes de la 1.ª carrera", "Before round 1") }]
    : Array.from({ length: span }, (_, k) => {
        const race = races[career.round + k];
        return { key: k, label: `R${career.round + k + 1}`, title: race ? raceName(race.name) : "" };
      });
  const KIND = { design: t("Diseño", "Design"), project: t("Proyecto", "Project"), build: t("Fabricación", "Build") };

  return (
    <Panel className="mn-carx-factory" title={t("En la fábrica", "In the factory")} meta={t(`${busy}/${slots} diseños a la vez`, `${busy}/${slots} designs at once`)}>
      {items.length ? (
        <div className="mn-carx-timeline" style={{ "--span": span }}>
          <div className="mn-carx-timeline__axis" aria-hidden="true">
            <span />
            <div>
              {ticks.map((tick) => (
                <span key={tick.key} title={tick.title}>
                  {tick.label}
                </span>
              ))}
            </div>
          </div>
          <ul>
            {items.map((item) => {
              const length = winter ? 1 : Math.max(1, Math.min(span, item.rounds || 1));
              return (
                <li key={item.id}>
                  <div className="mn-carx-timeline__label">
                    <b>{item.label}</b>
                    <span>
                      {KIND[item.kind]} · {item.meta}
                    </span>
                  </div>
                  <div className="mn-carx-timeline__track">
                    <i className={`is-${item.kind}`} style={{ gridColumn: `1 / span ${length}` }}>
                      <span>{winter ? t("antes de la R1", "before R1") : `${item.rounds} ${t("carr.", "races")}`}</span>
                    </i>
                  </div>
                  <small className="mn-carx-timeline__gain">{item.gain}</small>
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        <EmptyState compact title={t("No hay diseños en marcha", "No designs running")} body={t("Tus rivales sí desarrollan. Elige una pieza y encarga un diseño.", "Your rivals are developing. Pick a part and commission a design.")} />
      )}
      {career.rd.done.length > 0 && (
        <>
          <h4>{t("Últimos resultados", "Latest results")}</h4>
          <ul className="mn-carx-done">
            {career.rd.done.slice(0, 6).map((entry) => (
              <li key={entry.id} className={entry.failed ? "is-failed" : ""}>
                <b>{entry.part ? PART[entry.part]() : AREA[entry.area]()}</b>
                <span>
                  {entry.year} · R{entry.round}
                </span>
                {entry.failed ? <Badge tone="neg">{t("Fallido", "Failed")}</Badge> : <em>{entry.areas ? gainText(entry.areas) : signed(entry.gain)}</em>}
              </li>
            ))}
          </ul>
        </>
      )}
    </Panel>
  );
}

// ------------------------------------------------------------- units

function Units() {
  const { career, act } = useManager();
  const team = career.world.teams[career.teamId];
  const parts = team.parts;
  const components = career.units?.components || [];
  const open = canFitNow(career);
  if (!components.length) {
    return (
      <Panel className="mn-carx-units" title={t("Unidades por piloto", "Units per driver")}>
        <EmptyState compact title={t("Esta era no limita motores ni cajas", "This era does not limit engines or gearboxes")} />
      </Panel>
    );
  }
  return (
    <Panel className="mn-carx-units" title={t("Unidades por piloto", "Units per driver")} meta={t("usadas / cupo de la era", "used / era allocation")}>
      {team.drivers.map((driverId) => {
        const driver = career.world.drivers[driverId];
        const rows = unitsOfDriver(career, driverId);
        const penalty = pendingPenaltyOf(career, driverId);
        return (
          <div key={driverId} className="mn-carx-unitset">
            <h4>
              {driver?.name} {penalty?.places > 0 && <Badge tone="neg">{t(`−${penalty.places} puestos en parrilla`, `−${penalty.places} grid places`)}</Badge>}
            </h4>
            <ul>
              {rows.map((row) => {
                const part = partOfComponent(row.id);
                const pending = part && parts.pending?.[part];
                const over = row.used > row.limit;
                const wear = Math.min(1, row.wear);
                return (
                  <li key={row.id} className={over ? "is-over" : ""}>
                    <span className="mn-carx-unitset__name">{UNIT_COMPONENT[row.id]?.() || row.id}</span>
                    <span className="mn-carx-pips" aria-hidden="true">
                      {Array.from({ length: Math.max(row.limit, row.used) }, (_, index) => (
                        <i key={index} className={index < row.used ? (index >= row.limit ? "is-over" : "is-on") : ""} />
                      ))}
                    </span>
                    <b>
                      {row.used}/{row.limit}
                    </b>
                    <span className="mn-carx-unitset__wear">
                      <Meter value={wear * 100} tone={wear > 0.8 ? "neg" : wear > 0.6 ? "warn" : "pos"} label={t("Desgaste de la unidad", "Unit wear")} />
                      <small>{Math.round(wear * 100)}%</small>
                    </span>
                    {row.mode === "weekend" && <small className="mn-carx-unitset__mode">{t(`${row.limit} carr. seguidas`, `${row.limit} races each`)}</small>}
                    {pending && open && (
                      <button type="button" className="mn-btn mn-btn--sm mn-btn--ghost" onClick={() => act((c) => fitNewUnitNow(c, { driverId, comp: row.id }))}>
                        {t("Unidad nueva ya", "Fresh unit now")}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
      <p className="mn-carx-note">{t("Pasar del cupo cuesta puestos en la parrilla de la carrera siguiente. La barra es el desgaste de la unidad montada.", "Going past the allocation costs places on the next race's grid. The bar is the wear of the fitted unit.")}</p>
    </Panel>
  );
}

// ---------------------------------------------------- supply and aero

function SupplyAndAero() {
  const { career } = useManager();
  const supply = engineSupplyOf(career);
  const aero = aeroResourcesOf(career);
  const change = regulationChangeFor(career.year + 1);
  const banned = testingBanned(career.year);

  return (
    <Panel className="mn-carx-supply" title={t("Motor y recursos", "Engine and resources")}>
      <dl className="mn-carx-facts">
        <div>
          <dt>{t("Proveedor de motor", "Engine supplier")}</dt>
          <dd>{supply.name || supply.manufacturer || t("Proveedor cliente", "Customer supplier")}</dd>
        </div>
        <div>
          <dt>{t("Relación", "Deal")}</dt>
          <dd>{supply.works ? t("Equipo oficial: desarrolla su motor", "Works team: develops its engine") : t("Cliente: no desarrolla el motor", "Customer: cannot develop the engine")}</dd>
        </div>
        {!supply.works && (
          <div>
            <dt>{t("Cuota anual", "Annual fee")}</dt>
            <dd>{money(supply.annualFee)}</dd>
          </div>
        )}
      </dl>
      <h4>{t("Túnel de viento y CFD", "Wind tunnel and CFD")}</h4>
      {aero.active ? (
        <>
          <p className="mn-carx-note">
            {t(
              `Reparto por posición (${aero.position}.º): ${aero.percent} % de la base. Periodo ${aero.period === "W" ? "de invierno" : Number(aero.period) + 1}.`,
              `Allocation by position (P${aero.position}): ${aero.percent}% of the base. Period ${aero.period === "W" ? "winter" : Number(aero.period) + 1}.`,
            )}
          </p>
          <Bar label={t("Runs de túnel", "Wind tunnel runs")} value={aero.used.windTunnelRuns} max={aero.allowance.windTunnelRuns} caption={`${aero.left.windTunnelRuns} ${t("libres", "left")}`} tone="steel" />
          <Bar label={t("Piezas de CFD", "CFD items")} value={aero.used.cfdItems} max={aero.allowance.cfdItems} caption={`${aero.left.cfdItems} ${t("libres", "left")}`} tone="steel" />
        </>
      ) : (
        <p className="mn-carx-note">
          {t("Sin reparto por posición en esta era: el límite es el dinero.", "No allocation by position in this era: money is the limit.")}{" "}
          {banned ? t("Sin test en temporada: los diseños fallan algo más.", "No in-season testing: designs fail a little more often.") : ""}
        </p>
      )}
      {change && (
        <>
          <h4>{t(`Reglamento ${career.year + 1}`, `${career.year + 1} rules`)}</h4>
          <ul className="mn-carx-rules">
            {change.changes.map((entry, index) => (
              <li key={index}>
                <span>{entry.stats.map((stat) => STAT[stat]()).join(", ")}</span>
                <b>
                  {entry.headline ? `${entry.headline > 0 ? "+" : "−"}${Math.abs(Math.round(entry.headline * 100))} % · ` : ""}
                  {t(`−${Math.round(entry.edgeCut * 100)} % de ventaja`, `−${Math.round(entry.edgeCut * 100)}% of the edge`)}
                </b>
              </li>
            ))}
          </ul>
        </>
      )}
    </Panel>
  );
}

// ---------------------------------------------------------- expertise

function Expertise({ part: picked, onPick }) {
  const { career } = useManager();
  const parts = career.world.teams[career.teamId].parts;
  const table = parts.expertise || {};
  return (
    <Panel className="mn-carx-expertise" title={t("Expertise de la oficina técnica", "Design office expertise")} meta={`0–${DEV.expertise.max}`}>
      <ul className="mn-carx-exp">
        {parts.list.map((part) => {
          const values = Object.values(table[part] || {});
          const mean = values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
          return (
            <li key={part} className={picked === part ? "is-active" : ""}>
              <button type="button" onClick={() => onPick(part)} aria-pressed={picked === part}>
                <span>{PART[part]()}</span>
                <Meter value={(mean / DEV.expertise.max) * 100} tone={picked === part ? "accent" : "pos"} label={PART[part]()} />
                <b>{mean.toFixed(0)}</b>
              </button>
            </li>
          );
        })}
      </ul>
      <p className="mn-carx-note">{t("Cada diseño enseña algo: con más expertise, los siguientes son mejores y más ambiciosos.", "Every design teaches something: more expertise, better and bolder designs next.")}</p>
    </Panel>
  );
}

// --------------------------------------------------------------- grid

function PaceGrid({ ranked, own }) {
  const low = carRatingOf(ranked[ranked.length - 1].car) - 3;
  const high = carRatingOf(ranked[0].car) + 1;
  return (
    <Panel className="mn-carx-grid" title={t("La parrilla, por ritmo", "The grid, on pace")}>
      <ol className="mn-carx-pace">
        {ranked.map((entry, index) => (
          <li key={entry.id} className={entry.id === own ? "is-own" : ""}>
            <small>{index + 1}</small>
            <TeamBadge team={entry} size={20} />
            <span>{entry.name}</span>
            <Bar value={carRatingOf(entry.car)} min={low} max={high} tone={entry.id === own ? "gold" : "steel"} />
            <b>{carRatingOf(entry.car).toFixed(1)}</b>
          </li>
        ))}
      </ol>
    </Panel>
  );
}
