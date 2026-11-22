/**
 * The factory: where the car is against the field, what it is made of, and what
 * you build next - for this season's car or for next year's (SRS 5.5
 * RF-DEV-01..08, RF-SIM-14).
 *
 *   the car        the four areas the race reads, against the field
 *   development    design a part (pace, target season, focus stat)
 *   loadout        what each car carries, its condition, and swapping spares
 *   designs        every design, its stats, and building units of it
 *   expertise      what the design office knows, per part and stat
 *   supply & aero  engine supplier, wind tunnel/CFD allocation, next rule change
 *   units          power-unit/gearbox usage per driver against the era's limit
 */

import React, { useState } from "react";
import { AREAS, carRatingOf, fieldBestOf, fieldMeanOf, isRegulationReset, reliabilityOf, slotsFor, biasesOf } from "../engine/car";
import { PHASES, eraOf } from "../engine/career";
import { costCapFor } from "../engine/economy";
import { teamsByPace } from "../engine/world";
import {
  aeroResourcesOf, designQuote, developmentCapLeft, engineSupplyOf, fitNewUnitNow, fitPart, loadoutOf, manufactureParts, pendingPenaltyOf, regulationChangeFor, sparesOf,
  startDesign, unitsOfDriver,
} from "../engine/development";
import { PACES, canFitNow, designScore, unitCost, unitsOfDesign } from "../engine/development/design";
import { DEV, isBodyPart } from "../engine/development/parts";
import { partOfComponent } from "../engine/development/units";
import { testingBanned } from "../engine/development/aero";
import { useManager } from "./context";
import { Bar, Empty, Livery, Panel, Pill, Rating, Segmented, TeamBadge } from "./atoms";
import { AREA, AREA_HINT, CONDITION, PACE, PART, SIZE, STAT, UNIT_COMPONENT, money, t } from "./texts";

const CONDITION_TONE = { perfect: "green", light: "gold", heavy: "red", destroyed: "red" };

const gainText = (areas = {}) =>
  Object.entries(areas)
    .filter(([, gain]) => Math.abs(gain) >= 0.005)
    .map(([area, gain]) => `${AREA[area]()} ${gain >= 0 ? "+" : ""}${gain.toFixed(2)}`)
    .join(" · ") || "—";

export default function Car() {
  const { career } = useManager();
  const team = career.world.teams[career.teamId];
  const teams = Object.values(career.world.teams);
  const best = fieldBestOf(teams);
  const mean = fieldMeanOf(teams);
  const ranked = teamsByPace(career.world);
  const { powerBias } = biasesOf(team.car);
  const character = powerBias > 0.62 ? t("Un coche de rectas: brilla en Monza, Spa o Bakú.", "A straight-line car: it shines at Monza, Spa and Baku.") : powerBias < 0.48 ? t("Un coche de curvas: brilla en Mónaco, Hungría o Singapur.", "A cornering car: it shines at Monaco, Hungary and Singapore.") : t("Un coche equilibrado.", "A balanced car.");
  const areaRank = (area) => [...teams].sort((a, b) => b.car[area] - a.car[area]).findIndex((entry) => entry.id === team.id) + 1;

  return (
    <div className="mn-grid mn-grid--car">
      <Panel title={t(`El coche de ${career.year}`, `The ${career.year} car`)}>
        <div className="mn-car-hero">
          <Livery color={team.color} color2={team.color2} width={560} height={300} year={career.year} name={team.name} teamRef={team.custom ? null : team.id} />
        </div>
        <div className="mn-car-head">
          <Rating value={carRatingOf(team.car)} size="lg" />
          <div>
            <strong>{t(`${ranked.findIndex((entry) => entry.id === team.id) + 1}.º de ${teams.length} en ritmo`, `${ranked.findIndex((entry) => entry.id === team.id) + 1} of ${teams.length} on pace`)}</strong>
            <span>{character}</span>
          </div>
        </div>
        {AREAS.map((area) => (
          <div key={area} className="mn-area">
            <Bar
              label={`${AREA[area]()} · ${t(`${areaRank(area)}.º`, `P${areaRank(area)}`)}`}
              value={team.car[area]}
              marker={best[area]}
              min={Math.min(...teams.map((entry) => entry.car[area])) - 5}
              max={best[area] + 3}
              caption={area === "reliability" ? `${Math.round(reliabilityOf(team.car, eraOf(career)) * 100)}%` : team.car[area].toFixed(1)}
              tone={area === "reliability" ? "green" : "gold"}
            />
            <small>
              {AREA_HINT[area]()} {t("Media", "Average")} {mean[area].toFixed(1)} · {t("mejor", "best")} {best[area].toFixed(1)}
            </small>
          </div>
        ))}
      </Panel>
      {team.parts ? <Design /> : <Empty>{t("Este coche aún no tiene piezas.", "This car has no parts yet.")}</Empty>}
      {team.parts && <Loadout />}
      {team.parts && <Designs />}
      {team.parts && <SupplyAndAero />}
      {team.parts && <Units />}
      {team.parts && <Expertise />}
      <Panel title={t("La parrilla, por ritmo", "The grid, on pace")}>
        <ol className="mn-pace-list">
          {ranked.map((entry) => (
            <li key={entry.id} className={entry.id === team.id ? "is-own" : ""}>
              <TeamBadge team={entry} size={20} />
              <span>{entry.name}</span>
              <Bar value={carRatingOf(entry.car)} min={carRatingOf(ranked[ranked.length - 1].car) - 3} max={carRatingOf(ranked[0].car) + 1} tone={entry.id === team.id ? "gold" : "steel"} />
              <b>{carRatingOf(entry.car).toFixed(1)}</b>
            </li>
          ))}
        </ol>
      </Panel>
    </div>
  );
}

// ------------------------------------------------------------- design

function Design() {
  const { career, act } = useManager();
  const team = career.world.teams[career.teamId];
  const parts = team.parts;
  const winter = career.phase === PHASES.OFFSEASON || career.phase === PHASES.REVIEW;
  const [part, setPart] = useState(parts.list.includes("floor") ? "floor" : parts.list[0]);
  const [pace, setPace] = useState("normal");
  const [target, setTarget] = useState(winter ? "next" : "now");
  const [focus, setFocus] = useState("");
  const [error, setError] = useState(null);
  const effectiveTarget = winter ? "next" : target;
  const quote = designQuote(career, { part, pace, target: effectiveTarget, focus: focus || null });
  const slots = slotsFor(team.facility);
  const capLeft = developmentCapLeft(career);
  const cap = costCapFor(winter ? career.year + 1 : career.year);
  const reset = isRegulationReset(career.year + 1);
  const busy = career.rd.designs.length + career.rd.projects.length;

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

  return (
    <Panel title={t("Desarrollo", "Development")} action={<Pill tone="muted">{t(`Fábrica ${team.facility}/5 · ${busy}/${slots} diseños`, `Factory ${team.facility}/5 · ${busy}/${slots} designs`)}</Pill>}>
      {cap !== null && (
        <Bar label={t("Límite presupuestario de I+D", "Development cost cap")} value={cap - (capLeft ?? 0)} max={cap} caption={`${money(capLeft)} ${t("libres", "left")}`} tone={capLeft < cap * 0.15 ? "red" : "steel"} />
      )}
      <div className="mn-project-form">
        <div className="mn-area-pick mn-area-pick--parts" role="radiogroup" aria-label={t("Pieza", "Part")}>
          {parts.list.map((entry) => (
            <button type="button" key={entry} role="radio" aria-checked={part === entry} className={part === entry ? "is-active" : ""} onClick={() => { setPart(entry); setFocus(""); }}>
              {PART[entry]()}
            </button>
          ))}
        </div>
        <Segmented label={t("Ritmo", "Pace")} value={pace} onChange={setPace} options={PACES.map((value) => ({ value, label: `${PACE[value]()} ×${DEV.paces[value].cost}` }))} />
        <Segmented
          label={t("Para", "For")}
          value={effectiveTarget}
          onChange={setTarget}
          options={[
            { value: "now", label: t(`Coche ${career.year}`, `${career.year} car`), disabled: winter },
            { value: "next", label: t(`Coche ${career.year + 1}`, `${career.year + 1} car`) },
          ]}
        />
        <label className="mn-select">
          {t("Enfoque", "Focus")}
          <select value={focus} onChange={(event) => setFocus(event.target.value)}>
            <option value="">{t("Equilibrado", "Balanced")}</option>
            {Object.keys(DEV.parts[part].stats).map((stat) => (
              <option key={stat} value={stat}>
                {STAT[stat]()}
              </option>
            ))}
          </select>
        </label>
        {!quote.error && (
          <dl className="mn-facts mn-facts--tight">
            <div>
              <dt>{t("Coste", "Cost")}</dt>
              <dd>{money(quote.cost)}</dd>
            </div>
            <div>
              <dt>{t("Ganancia esperada", "Expected gain")}</dt>
              <dd>{gainText(quote.expected.areas)}</dd>
            </div>
            <div>
              <dt>{t("Riesgo de fallo", "Failure risk")}</dt>
              <dd>{Math.round(quote.failure * 100)}%</dd>
            </div>
            <div>
              <dt>{t("Plazo", "Lead time")}</dt>
              <dd>{winter ? t("Antes de la 1.ª carrera", "Before round 1") : `${quote.rounds} ${quote.rounds === 1 ? t("carrera", "race") : t("carreras", "races")}`}</dd>
            </div>
            {quote.aeroCost && (
              <div>
                <dt>{t("Túnel / CFD", "Tunnel / CFD")}</dt>
                <dd>
                  {quote.aeroCost.windTunnelRuns} / {quote.aeroCost.cfdItems}
                </dd>
              </div>
            )}
          </dl>
        )}
        {pace === "intense" && <p className="mn-hint">{t("Intenso: cuesta el triple pero la oficina aprende un 50% más (expertise).", "Intense: three times the cost, but the office learns 50% more (expertise).")}</p>}
        {effectiveTarget === "next" && (
          <p className="mn-hint">
            {reset
              ? t("Cambio de reglamento: el trabajo en el coche nuevo rinde un 50% más, pero casi nada del coche actual sobrevive.", "Regulation change: work on the new car pays 50% more, but almost nothing of the current car survives.")
              : t("El trabajo en el coche del año que viene rinde un 25% más, pero compite por la fábrica y el presupuesto con el actual.", "Work on next year's car pays 25% more, but competes with this car for the factory and the budget.")}
          </p>
        )}
        {quote.blocked?.length > 0 && <p className="mn-error">{errors[quote.blocked[0]]}</p>}
        <button type="button" className="mn-btn mn-btn--primary" onClick={launch} disabled={Boolean(quote.error) || quote.blocked?.length > 0}>
          {t("Encargar diseño", "Commission design")}
        </button>
        {error && <p className="mn-error">{errors[error] || error}</p>}
      </div>
      <h4>{t("En la fábrica", "In the factory")}</h4>
      {busy || career.rd.built.length ? (
        <ul className="mn-projects">
          {career.rd.designs.map((entry) => (
            <li key={entry.id}>
              <strong>{PART[entry.part]()}</strong>
              <span>
                {PACE[entry.pace]()} · {entry.season}
              </span>
              <em>{gainText(entry.expected.areas)}</em>
              <Pill tone="steel">{winter ? t("Invierno", "Winter") : `${entry.roundsLeft} ${t("carr.", "races")}`}</Pill>
            </li>
          ))}
          {career.rd.projects.map((project) => (
            <li key={project.id}>
              <strong>{AREA[project.area]()}</strong>
              <span>
                {SIZE[project.size]()} · {project.target === "next" ? career.year + 1 : career.year}
              </span>
              <em>+{project.expected.toFixed(1)}</em>
              <Pill tone="steel">{`${project.roundsLeft} ${t("carr.", "races")}`}</Pill>
            </li>
          ))}
          {career.rd.built.map((entry, index) => (
            <li key={`b${index}`}>
              <strong>{PART[entry.part]()}</strong>
              <span>{t("Fabricando", "Building")}</span>
              <em>{entry.fit === null ? t("al almacén", "to stores") : t(`coche ${entry.fit + 1}`, `car ${entry.fit + 1}`)}</em>
              <Pill tone="steel">{`${entry.roundsLeft} ${t("carr.", "races")}`}</Pill>
            </li>
          ))}
        </ul>
      ) : (
        <Empty>{t("No hay diseños en marcha. Tus rivales sí desarrollan.", "No designs running. Your rivals are developing.")}</Empty>
      )}
      {career.rd.done.length > 0 && (
        <>
          <h4>{t("Últimos resultados", "Latest results")}</h4>
          <ul className="mn-projects mn-projects--done">
            {career.rd.done.slice(0, 6).map((entry) => (
              <li key={entry.id} className={entry.failed ? "is-failed" : ""}>
                <strong>{entry.part ? PART[entry.part]() : AREA[entry.area]()}</strong>
                <span>
                  {entry.year} · R{entry.round}
                </span>
                <em>{entry.areas ? gainText(entry.areas) : `${entry.gain >= 0 ? "+" : ""}${entry.gain.toFixed(1)}`}</em>
              </li>
            ))}
          </ul>
        </>
      )}
    </Panel>
  );
}

// ------------------------------------------------------------ loadout

function Loadout() {
  const { career, act } = useManager();
  const team = career.world.teams[career.teamId];
  const parts = team.parts;
  const drivers = team.drivers.map((id) => career.world.drivers[id]);
  const cars = [loadoutOf(career, 0), loadoutOf(career, 1)];
  const open = canFitNow(career);
  const [error, setError] = useState(null);
  const fit = (itemId, car) => {
    const result = act((c) => fitPart(c, { itemId, car }));
    setError(result?.ok ? null : result?.error);
  };
  const damaged = cars.flat().filter((row) => row.condition !== "perfect");

  return (
    <Panel title={t("Montaje por coche", "Car loadout")} action={!open ? <Pill tone="red">{t("Parque cerrado", "Parc fermé")}</Pill> : null}>
      <div className="mn-table-scroll">
        <table className="mn-table mn-table--mini mn-loadout">
          <thead>
            <tr>
              <th>{t("Pieza", "Part")}</th>
              {[0, 1].map((car) => (
                <th key={car}>{drivers[car]?.name || t(`Coche ${car + 1}`, `Car ${car + 1}`)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {parts.list.map((part, row) => (
              <tr key={part}>
                <td>{PART[part]()}</td>
                {[0, 1].map((car) => {
                  const entry = cars[car][row];
                  const options = isBodyPart(part) ? [...sparesOf(parts, part), ...(parts.loadout[1 - car][part] ? [parts.items.find((item) => item.id === parts.loadout[1 - car][part])].filter(Boolean) : [])] : [];
                  return (
                    <td key={car}>
                      <span className="mn-loadout__spec">v{entry.design?.version ?? "—"}</span>{" "}
                      {isBodyPart(part) && <Pill tone={CONDITION_TONE[entry.condition]}>{CONDITION[entry.condition]()}</Pill>}
                      {entry.pending && entry.pending !== entry.design?.id && <Pill tone="steel">{t("nueva espec. con la próxima unidad", "new spec with next unit")}</Pill>}
                      {options.length > 0 && open && (
                        <select
                          className="mn-loadout__swap"
                          aria-label={t(`Cambiar ${PART[part]()} del coche ${car + 1}`, `Swap car ${car + 1} ${PART[part]()}`)}
                          value=""
                          onChange={(event) => event.target.value && fit(event.target.value, car)}
                        >
                          <option value="">{t("Cambiar…", "Swap…")}</option>
                          {options.map((item) => (
                            <option key={item.id} value={item.id}>
                              {`v${parts.designs[item.design]?.version ?? "?"} · ${CONDITION[item.condition]()}`}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {damaged.length > 0 && (
        <p className="mn-hint">{t(`Piezas dañadas montadas: ${damaged.length}. Cada una resta rendimiento hasta que montes un repuesto.`, `Damaged parts fitted: ${damaged.length}. Each costs pace until you fit a spare.`)}</p>
      )}
      {error && <p className="mn-error">{error === "parc-ferme" ? t("Con el coche en parque cerrado no se cambian piezas.", "No part changes under parc fermé.") : error}</p>}
      <div className="mn-car-split">
        {[0, 1].map((car) => (
          <div key={car}>
            <small>{drivers[car]?.name || t(`Coche ${car + 1}`, `Car ${car + 1}`)}</small>
            <b>{carRatingOf(parts.cars?.[car] || team.car).toFixed(1)}</b>
          </div>
        ))}
      </div>
    </Panel>
  );
}

// ------------------------------------------------------------ designs

function Designs() {
  const { career, act } = useManager();
  const team = career.world.teams[career.teamId];
  const parts = team.parts;
  const winter = career.phase === PHASES.OFFSEASON || career.phase === PHASES.REVIEW;
  const [error, setError] = useState(null);
  const build = (designId, count, fit) => {
    const result = act((c) => manufactureParts(c, { designId, count, fit }));
    setError(result?.ok ? null : result?.error);
  };
  const errors = {
    units: t("No se pueden fabricar más unidades de este diseño.", "No more units of this design can be built."),
    money: t("No hay dinero en caja.", "Not enough money."),
    cap: t("Superarías el límite presupuestario.", "You would break the cost cap."),
    winter: t("En invierno se trabaja en el coche nuevo.", "In the winter the factory works on the new car."),
  };

  return (
    <Panel title={t("Diseños y fabricación", "Designs and manufacturing")}>
      {parts.list.map((part) => {
        const designs = Object.values(parts.designs)
          .filter((design) => design.part === part)
          .sort((a, b) => b.version - a.version);
        return (
          <details key={part} className="mn-design" data-testid={`design-${part}`}>
            <summary>
              <strong>{PART[part]()}</strong>
              <span>
                v{designs[0]?.version} · {designs.length} {designs.length === 1 ? t("diseño", "design") : t("diseños", "designs")}
              </span>
            </summary>
            {designs.map((design) => {
              const units = isBodyPart(part) ? unitsOfDesign(parts, career.rd.built, design.id) : null;
              const max = DEV.parts[part].maxUnits;
              return (
                <div key={design.id} className="mn-design__row">
                  <div className="mn-design__head">
                    <b>v{design.version}</b>
                    <span>{designScore(design).toFixed(1)}</span>
                    {design.failed && <Pill tone="red">{t("Fallido", "Failed")}</Pill>}
                    {isBodyPart(part) && (
                      <span>
                        {t("Unidades", "Units")} {units}/{max}
                      </span>
                    )}
                  </div>
                  <ul className="mn-design__stats">
                    {Object.entries(design.stats).map(([stat, value]) => (
                      <li key={stat}>
                        <span>{STAT[stat]()}</span>
                        <b>{value.toFixed(1)}</b>
                      </li>
                    ))}
                  </ul>
                  {isBodyPart(part) && !winter && units < max && (
                    <div className="mn-design__actions">
                      <button type="button" className="mn-btn" onClick={() => build(design.id, 1, null)}>
                        {t("Fabricar 1", "Build 1")} ({money(unitCost(part, career.year))})
                      </button>
                      {units + 2 <= max && (
                        <button type="button" className="mn-btn mn-btn--primary" onClick={() => build(design.id, 2, "both")}>
                          {t("Fabricar 2 y montar", "Build 2 and fit")}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </details>
        );
      })}
      {error && <p className="mn-error">{errors[error] || error}</p>}
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
    <Panel title={t("Motor y recursos", "Engine and resources")}>
      <dl className="mn-facts mn-facts--tight">
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
          <p className="mn-hint">
            {t(
              `Reparto por posición (${aero.position}.º): ${aero.percent}% de la base. Periodo ${aero.period === "W" ? "de invierno" : Number(aero.period) + 1}.`,
              `Allocation by position (P${aero.position}): ${aero.percent}% of the base. Period ${aero.period === "W" ? "winter" : Number(aero.period) + 1}.`,
            )}
          </p>
          <Bar label={t("Runs de túnel", "Wind tunnel runs")} value={aero.used.windTunnelRuns} max={aero.allowance.windTunnelRuns} caption={`${aero.left.windTunnelRuns} ${t("libres", "left")}`} tone="steel" />
          <Bar label={t("Piezas de CFD", "CFD items")} value={aero.used.cfdItems} max={aero.allowance.cfdItems} caption={`${aero.left.cfdItems} ${t("libres", "left")}`} tone="steel" />
        </>
      ) : (
        <p className="mn-hint">
          {t("Sin reparto por posición en esta era: el límite es el dinero.", "No allocation by position in this era: money is the limit.")}{" "}
          {banned ? t("Sin test en temporada: los diseños fallan algo más.", "No in-season testing: designs fail a little more often.") : ""}
        </p>
      )}
      {change && (
        <>
          <h4>{t(`Reglamento ${career.year + 1}`, `${career.year + 1} rules`)}</h4>
          <ul className="mn-design__stats">
            {change.changes.map((entry, index) => (
              <li key={index}>
                <span>{entry.stats.map((stat) => STAT[stat]()).join(", ")}</span>
                <b>
                  {entry.headline ? `${entry.headline > 0 ? "+" : ""}${Math.round(entry.headline * 100)}% · ` : ""}
                  {t(`−${Math.round(entry.edgeCut * 100)}% de ventaja`, `−${Math.round(entry.edgeCut * 100)}% of the edge`)}
                </b>
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
      <Panel title={t("Unidades por piloto", "Units per driver")}>
        <Empty>{t("Esta era no limita motores ni cajas.", "This era does not limit engines or gearboxes.")}</Empty>
      </Panel>
    );
  }
  return (
    <Panel title={t("Unidades por piloto", "Units per driver")}>
      {team.drivers.map((driverId) => {
        const driver = career.world.drivers[driverId];
        const rows = unitsOfDriver(career, driverId);
        const penalty = pendingPenaltyOf(career, driverId);
        return (
          <div key={driverId} className="mn-units">
            <h4>
              {driver?.name} {penalty?.places > 0 && <Pill tone="red">{t(`−${penalty.places} puestos en parrilla`, `−${penalty.places} grid places`)}</Pill>}
            </h4>
            <table className="mn-table mn-table--mini">
              <tbody>
                {rows.map((row) => {
                  const part = partOfComponent(row.id);
                  const pending = part && parts.pending?.[part];
                  return (
                    <tr key={row.id}>
                      <td>{UNIT_COMPONENT[row.id]?.() || row.id}</td>
                      <td>
                        {row.used}/{row.limit}
                        {row.mode === "weekend" ? t(` · ${row.limit} carr. seguidas`, ` · ${row.limit} races each`) : ""}
                      </td>
                      <td className="mn-units__wear">
                        <Bar value={Math.min(1, row.wear)} max={1} tone={row.used > row.limit ? "red" : row.wear > 0.8 ? "gold" : "green"} />
                      </td>
                      <td>
                        {pending && open && (
                          <button type="button" className="mn-btn" onClick={() => act((c) => fitNewUnitNow(c, { driverId, comp: row.id }))}>
                            {t("Unidad nueva ya", "Fresh unit now")}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      })}
      <p className="mn-hint">{t("Pasar del cupo de la era cuesta puestos en la parrilla de la carrera siguiente.", "Going past the era's allocation costs places on the next race's grid.")}</p>
    </Panel>
  );
}

// ---------------------------------------------------------- expertise

function Expertise() {
  const { career } = useManager();
  const parts = career.world.teams[career.teamId].parts;
  const table = parts.expertise || {};
  return (
    <Panel title={t("Expertise de la oficina técnica", "Design office expertise")}>
      {parts.list.map((part) => {
        const stats = table[part] || {};
        const values = Object.values(stats);
        const mean = values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
        return (
          <details key={part} className="mn-design">
            <summary>
              <Bar label={PART[part]()} value={mean} max={DEV.expertise.max} caption={mean.toFixed(0)} tone="gold" />
            </summary>
            <ul className="mn-design__stats">
              {Object.entries(stats).map(([stat, value]) => (
                <li key={stat}>
                  <span>{STAT[stat]()}</span>
                  <b>{value.toFixed(0)}</b>
                </li>
              ))}
            </ul>
          </details>
        );
      })}
      <p className="mn-hint">{t("Cada diseño enseña algo: más expertise, mejores y más ambiciosos los siguientes.", "Every design teaches something: more expertise, better and bolder designs next.")}</p>
    </Panel>
  );
}
