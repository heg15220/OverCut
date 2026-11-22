/** The driver market: who is available, who is out of contract, who you have signed. */

import React, { useMemo, useState } from "react";
import { LuStar } from "react-icons/lu";
import { buyoutFee, marketStatusOf, seatsFor } from "../engine/market";
import { useManager } from "./context";
import { Empty, Flag, Panel, Pill, Rating, Segmented, TeamBadge } from "./atoms";
import { ROLE, money, t } from "./texts";
import Negotiation from "./Negotiation";

const STATUS_LABEL = {
  free: () => t("Libre", "Free agent"),
  junior: () => t("Promesa", "Prospect"),
  reserve: () => t("Reserva", "Reserve"),
  expiring: () => t("Acaba contrato", "Out of contract"),
  contracted: () => t("Con contrato", "Under contract"),
  own: () => t("Tu piloto", "Your driver"),
};

export default function Market() {
  const { career, act, version } = useManager();
  const [filter, setFilter] = useState("available");
  const [sort, setSort] = useState("rating");
  const [talking, setTalking] = useState(null);
  const seats = seatsFor(career, "next");
  const list = useMemo(() => {
    const drivers = Object.values(career.world.drivers).filter((driver) => driver.status !== "retired");
    const filtered = drivers.filter((driver) => {
      const status = marketStatusOf(career, driver);
      if (status === "own") return false;
      if (filter === "available") return ["free", "junior", "reserve"].includes(status);
      if (filter === "expiring") return status === "expiring";
      if (filter === "contracted") return status === "contracted";
      if (filter === "shortlist") return career.market.shortlist.includes(driver.id);
      return true;
    });
    const key = { rating: (driver) => -driver.rating, age: (driver) => driver.age, talent: (driver) => -(driver.scouted ? driver.talent : driver.rating) }[sort];
    return filtered.sort((a, b) => key(a) - key(b));
  }, [career, filter, sort, version]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleShortlist = (id) =>
    act((c) => {
      const has = c.market.shortlist.includes(id);
      c.market.shortlist = has ? c.market.shortlist.filter((entry) => entry !== id) : [...c.market.shortlist, id];
    });

  const signed = Object.values(career.market.signed);

  return (
    <div className="mn-grid mn-grid--market">
      <Panel title={t("Mercado de pilotos", "Driver market")} className="mn-market">
        <div className="mn-market__filters">
          <Segmented
            label={t("Filtro", "Filter")}
            value={filter}
            onChange={setFilter}
            options={[
              { value: "available", label: t("Disponibles", "Available") },
              { value: "expiring", label: t("Acaban contrato", "Out of contract") },
              { value: "contracted", label: t("Con contrato", "Contracted") },
              { value: "shortlist", label: t("Seguimiento", "Shortlist") },
            ]}
          />
          <Segmented
            label={t("Orden", "Sort")}
            value={sort}
            onChange={setSort}
            options={[
              { value: "rating", label: t("Nivel", "Rating") },
              { value: "age", label: t("Edad", "Age") },
              { value: "talent", label: t("Techo", "Ceiling") },
            ]}
          />
        </div>
        {list.length ? (
          <div className="mn-driver-table" role="list">
            {list.map((driver) => {
              const status = marketStatusOf(career, driver);
              const team = driver.teamId ? career.world.teams[driver.teamId] : null;
              const fee = status === "contracted" ? buyoutFee(career, driver) : 0;
              const talks = career.market.talks[driver.id];
              return (
                <div role="listitem" key={driver.id} className="mn-driver-row">
                  <Rating value={driver.rating} size="sm" />
                  <Flag code={driver.nat} width={16} />
                  <span className="mn-driver-row__name">
                    <strong>{driver.name}</strong>
                    <small>
                      {driver.age} {t("años", "yrs")} · {STATUS_LABEL[status] ? STATUS_LABEL[status]() : status}
                      {driver.contract && status !== "free" ? ` · ${t("hasta", "until")} ${driver.contract.until}` : ""}
                      {driver.scouted ? ` · ${t("techo", "ceiling")} ${Math.round(driver.talent)}` : ""}
                    </small>
                  </span>
                  {team ? <TeamBadge team={team} size={22} /> : <span className="mn-driver-row__spacer" />}
                  {fee > 0 && <em className="mn-fee">{money(fee)}</em>}
                  {talks?.walked && <Pill tone="red">{t("Rompió", "Walked")}</Pill>}
                  {talks?.agreed && <Pill tone="green">{t("Acuerdo", "Agreed")}</Pill>}
                  <button type="button" className={`mn-icon-btn${career.market.shortlist.includes(driver.id) ? " is-on" : ""}`} onClick={() => toggleShortlist(driver.id)} aria-label={t("Seguimiento", "Shortlist")}>
                    <LuStar />
                  </button>
                  <button type="button" className="mn-btn mn-btn--sm" onClick={() => setTalking(driver.id)} disabled={talks?.walked}>
                    {t("Negociar", "Negotiate")}
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <Empty>{t("Nadie con ese filtro.", "Nobody matches.")}</Empty>
        )}
      </Panel>
      <Panel title={t(`Plantilla ${career.year + 1}`, `${career.year + 1} line-up`)}>
        <p className={seats.race >= 2 ? "mn-ok" : "mn-warn"}>
          {t(`Asientos titulares cubiertos: ${seats.race}/2`, `Race seats filled: ${seats.race}/2`)}
        </p>
        {signed.length ? (
          <ul className="mn-signed">
            {signed.map((deal) => {
              const driver = career.world.drivers[deal.driverId];
              return (
                <li key={deal.driverId}>
                  <strong>{driver?.name}</strong>
                  <span>
                    {deal.seat === "reserve" ? t("Reserva", "Reserve") : ROLE[deal.role]()} · {money(deal.salary)} · {deal.years} {t("años", "yrs")}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <Empty>{t("Aún no has fichado a nadie para el año que viene.", "No signings for next year yet.")}</Empty>
        )}
        <p className="mn-hint">{t("Si al empezar la temporada te falta un piloto, el equipo contratará al mejor libre disponible.", "If you are a driver short when the season starts, the team signs the best free agent available.")}</p>
      </Panel>
      {talking && <Negotiation driverId={talking} onClose={() => setTalking(null)} />}
    </div>
  );
}
