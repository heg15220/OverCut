/** Your drivers: what they are made of, how they feel, what they cost. */

import React, { useState } from "react";
import { ATTRIBUTE_KEYS } from "../../overcutTrayectoria/engine/attributes";
import { PHASES } from "../engine/career";
import { ROLES, releaseCompensation, releaseOwnDriver, setRole, swapWithReserve, userTeam } from "../engine/market";
import { driversOf } from "../engine/world";
import { useManager } from "./context";
import { Bar, Empty, Flag, Panel, Pill, Rating, Segmented } from "./atoms";
import { ROLE, money, t } from "./texts";
import Negotiation from "./Negotiation";

export const ATTRIBUTE_LABEL = {
  pace: () => t("Ritmo", "Pace"),
  qualifying: () => t("Clasificación", "Qualifying"),
  racecraft: () => t("Carrera", "Racecraft"),
  consistency: () => t("Constancia", "Consistency"),
  wet: () => t("Lluvia", "Wet"),
  technical: () => t("Técnica", "Technical"),
};

export function DriverCard({ driver, stats, children, compact = false }) {
  return (
    <article className={`mn-driver-card${compact ? " is-compact" : ""}`}>
      <header>
        <Rating value={driver.rating} size="lg" />
        <div>
          <h3>
            <Flag code={driver.nat} width={18} /> {driver.name}
          </h3>
          <span>
            {driver.age} {t("años", "yrs")}
            {driver.contract && ` · ${ROLE[driver.contract.role]()} · ${t("hasta", "until")} ${driver.contract.until} · ${money(driver.contract.salary)}/${t("año", "yr")}`}
          </span>
        </div>
      </header>
      <div className="mn-attrs">
        {ATTRIBUTE_KEYS.map((key) => (
          <Bar key={key} label={ATTRIBUTE_LABEL[key]()} value={driver.attributes[key]} min={30} max={99} caption={Math.round(driver.attributes[key])} />
        ))}
      </div>
      <div className="mn-driver-card__meta">
        <Bar label={t("Moral", "Morale")} value={driver.morale ?? 70} caption={`${Math.round(driver.morale ?? 70)}`} tone={(driver.morale ?? 70) < 40 ? "red" : "green"} />
        {driver.scouted && <Pill tone="gold">{t(`Techo ${Math.round(driver.talent)}`, `Ceiling ${Math.round(driver.talent)}`)}</Pill>}
      </div>
      {stats && (
        <dl className="mn-facts mn-facts--tight">
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

  return (
    <div className="mn-grid mn-grid--drivers">
      {drivers.map((driver) => {
        const leaving = career.market.leaving.includes(driver.id);
        const expiring = driver.contract && driver.contract.until <= career.year;
        return (
          <DriverCard key={driver.id} driver={driver} stats={career.season.drivers[driver.id]}>
            <div className="mn-driver-card__actions">
              <Segmented
                label={t("Estatus", "Status")}
                value={driver.contract?.role}
                onChange={(role) => act((c) => setRole(c, driver.id, role))}
                options={ROLES.map((role) => ({ value: role, label: ROLE[role]() }))}
              />
              <div className="mn-row">
                {(expiring || winter) && !leaving && (
                  <button type="button" className="mn-btn mn-btn--sm mn-btn--primary" onClick={() => setRenewing(driver.id)}>
                    {t("Renovar", "Renew")}
                  </button>
                )}
                {leaving ? (
                  <Pill tone="red">{t("Se va al final de temporada", "Leaving at season end")}</Pill>
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
                    className="mn-btn mn-btn--sm mn-btn--ghost"
                    onClick={() => {
                      const cost = releaseCompensation(career, driver);
                      const result = act((c) => releaseOwnDriver(c, driver.id, { now: true }));
                      setNotice(result?.ok ? t(`Despedido. Indemnización: ${money(cost)}.`, `Released. Compensation: ${money(cost)}.`) : t("No hay nadie para sustituirle.", "There is nobody to replace him."));
                    }}
                  >
                    {t(`Despedir (${money(releaseCompensation(career, driver))})`, `Release (${money(releaseCompensation(career, driver))})`)}
                  </button>
                )}
              </div>
            </div>
          </DriverCard>
        );
      })}
      <Panel title={t("Piloto reserva", "Reserve driver")}>
        {reserve ? (
          <DriverCard driver={reserve} compact />
        ) : (
          <Empty>{t("Sin reserva. Puedes fichar uno en el Mercado.", "No reserve. You can sign one on the Market.")}</Empty>
        )}
        {notice && <p className="mn-muted">{notice}</p>}
      </Panel>
      {renewing && <Negotiation driverId={renewing} onClose={() => setRenewing(null)} />}
    </div>
  );
}
