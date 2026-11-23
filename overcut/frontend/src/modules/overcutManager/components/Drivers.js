/**
 * Your drivers (DESIGN.md §6.4, "Detail screen"; SRS RF-STF-02/04/05): what
 * each one is made of against the best on the grid, how he feels, what he costs
 * and what you can do about his contract.
 */

import React, { useMemo, useState } from "react";
import { ATTRIBUTE_KEYS } from "../../overcutTrayectoria/engine/attributes";
import { PHASES } from "../engine/career";
import { SKILL_KEYS } from "../engine/drivers/skills";
import { ROLES, releaseCompensation, releaseOwnDriver, setRole, swapWithReserve, userTeam } from "../engine/market";
import { driversOf } from "../engine/world";
import { useManager } from "./context";
import { Badge, Bar, EmptyState, Flag, Meter, PageHeader, Panel, Rating, Segmented } from "./atoms";
import { ROLE, money, t } from "./texts";
import Negotiation from "./Negotiation";
import "./styles/people.css";

/** RF-STF-02: the twelve attributes derived from f1db (engine/drivers/skills.js), on the era's scale. */
export const SKILL_LABEL = {
  cornering: () => t("Paso por curva", "Cornering"),
  braking: () => t("Frenada", "Braking"),
  control: () => t("Control", "Control"),
  smoothness: () => t("Suavidad", "Smoothness"),
  adaptability: () => t("Adaptabilidad", "Adaptability"),
  overtaking: () => t("Adelantamiento", "Overtaking"),
  defending: () => t("Defensa", "Defending"),
  starts: () => t("Salida", "Starts"),
  accuracy: () => t("Precisión", "Accuracy"),
  aggression: () => t("Agresividad", "Aggression"),
  potential: () => t("Potencial", "Potential"),
  commercialValue: () => t("Valor comercial", "Commercial value"),
};

export const ATTRIBUTE_LABEL = {
  pace: () => t("Ritmo", "Pace"),
  qualifying: () => t("Clasificación", "Qualifying"),
  racecraft: () => t("Carrera", "Racecraft"),
  consistency: () => t("Constancia", "Consistency"),
  wet: () => t("Lluvia", "Wet"),
  technical: () => t("Técnica", "Technical"),
};

/** The best value of every attribute among all drivers of the world, and who holds it. */
const fieldBestOf = (drivers) => {
  const best = {};
  ATTRIBUTE_KEYS.forEach((key) => {
    best[key] = drivers.reduce((top, driver) => {
      const value = driver.attributes?.[key];
      return value !== undefined && value > top.value ? { value, name: driver.name } : top;
    }, { value: -Infinity, name: null });
  });
  return best;
};

const moraleText = (value) =>
  value >= 75 ? t("Contento", "Happy") : value >= 55 ? t("Tranquilo", "Settled") : value >= 35 ? t("Molesto", "Unhappy") : t("Quiere irse", "Wants out");

/**
 * One driver's profile: identity, attributes with the grid's best as a tick,
 * morale, season and contract. `children` holds the actions.
 */
export function DriverCard({ driver, stats, children, compact = false, best }) {
  const morale = driver.morale ?? 70;
  return (
    <article className={`mn-pp-card${compact ? " is-compact" : ""}`}>
      <header className="mn-pp-card__head">
        <Rating value={driver.rating} size="lg" />
        <div>
          <h3>
            <Flag code={driver.nat} width={20} /> {driver.name}
          </h3>
          <p>
            {driver.age} {t("años", "yrs")}
            {driver.contract && ` · ${ROLE[driver.contract.role]()} · ${t("hasta", "until")} ${driver.contract.until} · ${money(driver.contract.salary)}/${t("año", "yr")}`}
          </p>
        </div>
      </header>
      <div className="mn-pp-attrs">
        {ATTRIBUTE_KEYS.map((key) => {
          const value = driver.attributes[key];
          const top = best?.[key];
          const gap = top ? value - top.value : 0;
          return (
            <div key={key} className="mn-pp-attr">
              <Bar label={ATTRIBUTE_LABEL[key]()} value={value} min={30} max={99} marker={top?.value} caption={Math.round(value)} tone={gap >= -0.5 ? "gold" : "steel"} />
              {top && <small className={gap >= -0.5 ? "is-pos" : ""}>{gap >= -0.5 ? t("Mejor de la parrilla", "Best on the grid") : t(`${Math.round(gap)} vs. ${top.name}`, `${Math.round(gap)} vs ${top.name}`)}</small>}
            </div>
          );
        })}
      </div>
      {driver.skills && !compact && (
        <div className="mn-pp-attrs mn-pp-skills" aria-label={t("Atributos de carrera", "Race attributes")}>
          {SKILL_KEYS.map((key) => (
            <div key={key} className="mn-pp-attr">
              <Bar label={SKILL_LABEL[key]()} value={driver.skills[key]} min={30} max={99} caption={Math.round(driver.skills[key])} tone="steel" />
            </div>
          ))}
        </div>
      )}
      <div className="mn-pp-morale">
        <span>{t("Moral", "Morale")}</span>
        <Meter value={morale} label={t("Moral", "Morale")} />
        <b>{Math.round(morale)}</b>
        <small>{moraleText(morale)}</small>
        {driver.scouted && <Badge tone="accent">{t(`Techo ${Math.round(driver.talent)}`, `Ceiling ${Math.round(driver.talent)}`)}</Badge>}
      </div>
      {stats && (
        <dl className="mn-pp-season">
          <div>
            <dt>{t("Puntos", "Points")}</dt>
            <dd>{stats.points.reduce((a, b) => a + b, 0)}</dd>
          </div>
          <div>
            <dt>{t("Victorias", "Wins")}</dt>
            <dd>{stats.wins}</dd>
          </div>
          <div>
            <dt>{t("Podios", "Podiums")}</dt>
            <dd>{stats.podiums}</dd>
          </div>
          <div>
            <dt>{t("Poles", "Poles")}</dt>
            <dd>{stats.poles}</dd>
          </div>
          <div>
            <dt>{t("Abandonos", "DNFs")}</dt>
            <dd>{stats.dnfs}</dd>
          </div>
        </dl>
      )}
      {children}
    </article>
  );
}

export default function Drivers() {
  const { career, act } = useManager();
  const [renewing, setRenewing] = useState(null);
  const [notice, setNotice] = useState(null);
  const team = userTeam(career);
  const drivers = driversOf(career.world, team.id);
  const reserve = team.reserve ? career.world.drivers[team.reserve] : null;
  const winter = career.phase === PHASES.OFFSEASON || career.phase === PHASES.REVIEW;
  // The grid this season: race drivers of every team (retired or unsigned drivers in the pool do not count).
  const best = useMemo(
    () => fieldBestOf(Object.values(career.world.teams).flatMap((entry) => (entry.drivers || []).map((id) => career.world.drivers[id]).filter(Boolean))),
    [career.world.teams, career.world.drivers],
  );

  return (
    <div className="mn-pp">
      <PageHeader
        title={t("Pilotos", "Drivers")}
        meta={t(`Temporada ${career.year} · ${drivers.length} titulares · ${reserve ? "1 reserva" : "sin reserva"}`, `${career.year} season · ${drivers.length} race drivers · ${reserve ? "1 reserve" : "no reserve"}`)}
      />
      <div className="mn-pp__grid">
        {drivers.map((driver) => {
          const leaving = career.market.leaving.includes(driver.id);
          const expiring = driver.contract && driver.contract.until <= career.year;
          const compensation = releaseCompensation(career, driver);
          return (
            <Panel key={driver.id} className="mn-pp-panel">
              <DriverCard driver={driver} stats={career.season.drivers[driver.id]} best={best}>
                <div className="mn-pp-contract">
                  <h4>{t("Contrato", "Contract")}</h4>
                  <div className="mn-pp-contract__row">
                    <span>{t("Estatus", "Status")}</span>
                    <Segmented label={t("Estatus", "Status")} value={driver.contract?.role} onChange={(role) => act((c) => setRole(c, driver.id, role))} options={ROLES.map((role) => ({ value: role, label: ROLE[role]() }))} />
                  </div>
                  {expiring && !leaving && <Badge tone="warn" dot>{t(`Termina su contrato en ${driver.contract.until}`, `Contract ends in ${driver.contract.until}`)}</Badge>}
                  <div className="mn-pp-contract__actions">
                    {(expiring || winter) && !leaving && (
                      <button type="button" className="mn-btn mn-btn--sm mn-btn--primary" onClick={() => setRenewing(driver.id)}>
                        {t("Renovar", "Renew")}
                      </button>
                    )}
                    {leaving ? (
                      <Badge tone="neg" dot>
                        {t("Se va al final de temporada", "Leaving at season end")}
                      </Badge>
                    ) : (
                      <button type="button" className="mn-btn mn-btn--sm" onClick={() => act((c) => releaseOwnDriver(c, driver.id))}>
                        {t("No renovar", "Do not renew")}
                      </button>
                    )}
                    {reserve && !winter && (
                      <button type="button" className="mn-btn mn-btn--sm" onClick={() => act((c) => swapWithReserve(c, driver.id))}>
                        {t(`Dar su sitio a ${reserve.name}`, `Give his seat to ${reserve.name}`)}
                      </button>
                    )}
                    {!winter && (
                      <button
                        type="button"
                        className="mn-btn mn-btn--sm mn-btn--danger"
                        onClick={() => {
                          const result = act((c) => releaseOwnDriver(c, driver.id, { now: true }));
                          setNotice(result?.ok ? t(`Despedido. Indemnización: ${money(compensation)}.`, `Released. Compensation: ${money(compensation)}.`) : t("No hay nadie para sustituirle.", "There is nobody to replace him."));
                        }}
                      >
                        {t(`Despedir · ${money(compensation)}`, `Release · ${money(compensation)}`)}
                      </button>
                    )}
                  </div>
                </div>
              </DriverCard>
            </Panel>
          );
        })}
        <Panel className="mn-pp-reserve" title={t("Piloto reserva", "Reserve driver")}>
          {reserve ? (
            <DriverCard driver={reserve} compact best={best} />
          ) : (
            <EmptyState compact title={t("Sin reserva", "No reserve")} body={t("Puedes fichar uno en el Mercado.", "You can sign one on the Market.")} />
          )}
          {notice && <p className="mn-pp-note">{notice}</p>}
        </Panel>
      </div>
      <p className="mn-pp-legend">
        <i aria-hidden="true" /> {t("La marca de cada barra es el mejor piloto de la parrilla en ese atributo", "The tick on each bar is the best driver on the grid for that attribute")}
      </p>
      {renewing && <Negotiation driverId={renewing} onClose={() => setRenewing(null)} />}
    </div>
  );
}
