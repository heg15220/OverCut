/**
 * The driver market (RF-STF-02..04): who is available, who is out of contract,
 * your shortlist and the deals already signed for next year. Data screen
 * (DESIGN.md §6.3): candidates as a table, the selected driver's card and the
 * negotiate button at the side; the negotiation itself opens a wide Sheet.
 */

import React, { useMemo, useRef, useState } from "react";
import { ATTRIBUTE_KEYS } from "../../overcutTrayectoria/engine/attributes";
import { buyoutFee, marketStatusOf, seatsFor } from "../engine/market";
import { useManager } from "./context";
import { Badge, Bar, DataTable, EmptyState, Flag, IconButton, Meter, PageHeader, Panel, Rating, Segmented, Tabs, TeamStripe } from "./atoms";
import { Facts, revealOnPhone } from "./dataScreen";
import { IconStar } from "./icons";
import { DRIVER_ATTRIBUTE, ROLE, money, t } from "./texts";
import Negotiation from "./Negotiation";
import "./styles/market.css";

const STATUS_LABEL = {
  free: () => t("Libre", "Free agent"),
  junior: () => t("Promesa", "Prospect"),
  reserve: () => t("Reserva", "Reserve"),
  expiring: () => t("Acaba contrato", "Out of contract"),
  contracted: () => t("Con contrato", "Under contract"),
  own: () => t("Tu piloto", "Your driver"),
};
const STATUS_TONE = { free: "pos", junior: "info", reserve: "neutral", expiring: "warn", contracted: "neutral", own: "accent" };

const FILTERS = [
  { value: "available", label: () => t("Disponibles", "Available"), test: (status) => ["free", "junior", "reserve"].includes(status) },
  { value: "expiring", label: () => t("Acaban contrato", "Out of contract"), test: (status) => status === "expiring" },
  { value: "contracted", label: () => t("Con contrato", "Contracted"), test: (status) => status === "contracted" },
  { value: "shortlist", label: () => t("Seguimiento", "Shortlist"), test: null },
];

const StarOn = (props) => <IconStar filled {...props} />;
const StarOff = (props) => <IconStar {...props} />;

export default function Market() {
  const { career, act, version } = useManager();
  const [filter, setFilter] = useState("available");
  const [sort, setSort] = useState("rating");
  const [talking, setTalking] = useState(null);
  const [selected, setSelected] = useState(null);
  const seats = seatsFor(career, "next");
  const side = useRef(null);

  const pool = useMemo(
    () =>
      Object.values(career.world.drivers)
        .filter((driver) => driver.status !== "retired")
        .map((driver) => ({ driver, status: marketStatusOf(career, driver) }))
        .filter((entry) => entry.status !== "own"),
    [career, version], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const counts = Object.fromEntries(FILTERS.map((entry) => [entry.value, entry.test ? pool.filter((row) => entry.test(row.status)).length : career.market.shortlist.length]));
  const list = useMemo(() => {
    const spec = FILTERS.find((entry) => entry.value === filter);
    const filtered = pool.filter((row) => (spec.test ? spec.test(row.status) : career.market.shortlist.includes(row.driver.id)));
    const key = { rating: (row) => -row.driver.rating, age: (row) => row.driver.age, talent: (row) => -(row.driver.scouted ? row.driver.talent : row.driver.rating) }[sort];
    return [...filtered].sort((a, b) => key(a) - key(b));
  }, [pool, filter, sort, career.market.shortlist]);

  const toggleShortlist = (id) =>
    act((c) => {
      const has = c.market.shortlist.includes(id);
      c.market.shortlist = has ? c.market.shortlist.filter((entry) => entry !== id) : [...c.market.shortlist, id];
    });

  const focus = (selected && career.world.drivers[selected]) || list[0]?.driver || null;
  const signed = Object.values(career.market.signed);
  const best = useMemo(() => {
    const out = {};
    ATTRIBUTE_KEYS.forEach((key) => {
      out[key] = Math.max(...Object.values(career.world.drivers).map((driver) => driver.attributes?.[key] ?? 0));
    });
    return out;
  }, [career.world.drivers]);

  return (
    <div className="mn-ds mn-market2">
      <PageHeader
        title={t("Mercado", "Market")}
        meta={t(`Fichajes para ${career.year + 1} · asientos titulares cubiertos ${seats.race}/2`, `Signings for ${career.year + 1} · race seats filled ${seats.race}/2`)}
      />
      <div className="mn-ds__grid">
        <div className="mn-ds__main">
          <Panel flush title={t("Mercado de pilotos", "Driver market")} meta={t(`${list.length} pilotos`, `${list.length} drivers`)}>
            <div className="mn-ds__filters">
              <Tabs label={t("Filtro", "Filter")} value={filter} onChange={setFilter} options={FILTERS.map((entry) => ({ value: entry.value, label: entry.label(), count: counts[entry.value] }))} />
              <div className="mn-ds__controls">
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
            </div>
            {list.length ? (
              <DataTable
                className="mn-ds-selectable"
                caption={t("Mercado de pilotos", "Driver market")}
                rowKey={(row) => row.driver.id}
                highlight={(row) => focus && row.driver.id === focus.id}
                onRowClick={(row) => {
                  setSelected(row.driver.id);
                  revealOnPhone(side.current);
                }}
                columns={[
                  { key: "rating", label: t("Val.", "Rtg"), width: 56, render: (row) => <Rating value={row.driver.rating} size="sm" /> },
                  {
                    key: "name",
                    label: t("Piloto", "Driver"),
                    render: ({ driver, status }) => (
                      <span className="mn-ds-who">
                        <Flag code={driver.nat} width={16} />
                        <span>
                          <strong>{driver.name}</strong>
                          <small>
                            {STATUS_LABEL[status] ? STATUS_LABEL[status]() : status}
                            {career.market.talks[driver.id]?.agreed ? ` · ${t("acuerdo", "agreed")}` : ""}
                            {career.market.talks[driver.id]?.walked ? ` · ${t("rompió", "walked")}` : ""}
                          </small>
                        </span>
                      </span>
                    ),
                  },
                  { key: "age", label: t("Edad", "Age"), align: "right", width: 52, render: (row) => row.driver.age },
                  {
                    key: "team",
                    label: t("Equipo", "Team"),
                    className: "mn-ds-hide-sm",
                    render: ({ driver }) => {
                      const team = driver.teamId ? career.world.teams[driver.teamId] : null;
                      return team ? (
                        <span className="mn-dt__team">
                          <TeamStripe color={team.color} />
                          {team.name}
                        </span>
                      ) : (
                        <span className="mn-ds-muted">—</span>
                      );
                    },
                  },
                  filter !== "available" && { key: "until", label: t("Hasta", "Until"), width: 56, mono: true, className: "mn-ds-hide-sm", render: ({ driver, status }) => (driver.contract && status !== "free" ? driver.contract.until : <span className="mn-ds-muted">—</span>) },
                  { key: "ceiling", label: t("Techo", "Ceiling"), align: "right", width: 60, className: "mn-ds-hide-sm", render: ({ driver }) => (driver.scouted ? Math.round(driver.talent) : <span className="mn-ds-muted">?</span>) },
                  ["contracted", "shortlist"].includes(filter) && { key: "fee", label: t("Cláusula", "Fee"), align: "right", width: 88, className: "mn-ds-hide-sm", render: ({ driver, status }) => (status === "contracted" ? <span className="mn-ds-mono">{money(buyoutFee(career, driver))}</span> : <span className="mn-ds-muted">—</span>) },
                  {
                    key: "star",
                    label: "",
                    align: "right",
                    width: 48,
                    render: ({ driver }) => {
                      const on = career.market.shortlist.includes(driver.id);
                      return (
                        <span onClick={(event) => event.stopPropagation()} onKeyDown={(event) => event.stopPropagation()} role="presentation">
                          <IconButton icon={on ? StarOn : StarOff} size={16} active={on} label={on ? t(`Quitar a ${driver.name} del seguimiento`, `Remove ${driver.name} from the shortlist`) : t(`Seguir a ${driver.name}`, `Shortlist ${driver.name}`)} onClick={() => toggleShortlist(driver.id)} className="mn-mk-star" />
                        </span>
                      );
                    },
                  },
                ].filter(Boolean)}
                rows={list}
              />
            ) : (
              <div className="mn-mk-pad">
                <EmptyState
                  compact
                  title={filter === "shortlist" ? t("Nadie en seguimiento", "Nobody on the shortlist") : t("Nadie con ese filtro", "Nobody matches")}
                  body={filter === "shortlist" ? t("Marca la estrella de un piloto para tenerlo aquí.", "Star a driver to keep them here.") : undefined}
                />
              </div>
            )}
          </Panel>
        </div>

        <div className="mn-ds__side" ref={side}>
          <DriverCard career={career} driver={focus} best={best} onTalk={setTalking} onStar={toggleShortlist} />
          <Panel flush title={t(`Plantilla ${career.year + 1}`, `${career.year + 1} line-up`)}>
            <div className="mn-mk-seats">
              <span>{t("Asientos titulares", "Race seats")}</span>
              <Meter value={(seats.race / 2) * 100} tone={seats.race >= 2 ? "pos" : "warn"} width="100%" label={t("Asientos titulares", "Race seats")} />
              <b>{seats.race}/2</b>
            </div>
            {signed.length ? (
              <DataTable
                dense
                caption={t("Fichajes", "Signings")}
                rowKey={(row) => row.driverId}
                columns={[
                  { key: "name", label: t("Piloto", "Driver"), render: (row) => career.world.drivers[row.driverId]?.name },
                  { key: "role", label: t("Papel", "Role"), render: (row) => (row.seat === "reserve" ? t("Reserva", "Reserve") : ROLE[row.role]()) },
                  { key: "salary", label: t("Salario", "Salary"), align: "right", render: (row) => <span className="mn-ds-mono">{money(row.salary)}</span> },
                  { key: "years", label: t("Años", "Yrs"), align: "right", width: 48 },
                ]}
                rows={signed}
              />
            ) : (
              <div className="mn-mk-pad">
                <EmptyState compact title={t("Sin fichajes para el año que viene", "No signings for next year yet")} body={t("Si al empezar la temporada te falta un piloto, el equipo contratará al mejor libre disponible.", "If you are a driver short when the season starts, the team signs the best free agent available.")} />
              </div>
            )}
          </Panel>
        </div>
      </div>
      {talking && <Negotiation driverId={talking} onClose={() => setTalking(null)} />}
    </div>
  );
}

function DriverCard({ career, driver, best, onTalk, onStar }) {
  if (!driver) {
    return (
      <Panel title={t("Ficha", "Profile")}>
        <EmptyState compact title={t("Elige un piloto de la tabla", "Pick a driver from the table")} />
      </Panel>
    );
  }
  const status = marketStatusOf(career, driver);
  const team = driver.teamId ? career.world.teams[driver.teamId] : null;
  const talks = career.market.talks[driver.id];
  const fee = status === "contracted" ? buyoutFee(career, driver) : 0;
  const on = career.market.shortlist.includes(driver.id);
  return (
    <Panel title={t("Ficha", "Profile")} action={<Badge tone={STATUS_TONE[status] || "neutral"} dot>{STATUS_LABEL[status] ? STATUS_LABEL[status]() : status}</Badge>}>
      <div className="mn-mk-card">
        <div className="mn-mk-card__id">
          <Rating value={driver.rating} size="lg" />
          <span>
            <strong>{driver.name}</strong>
            <small>
              <Flag code={driver.nat} width={16} /> {t(`${driver.age} años`, `${driver.age} years old`)}
              {team ? ` · ${team.name}` : ""}
            </small>
          </span>
        </div>
        <div className="mn-mk-attrs">
          {ATTRIBUTE_KEYS.map((key) => {
            const value = driver.attributes?.[key];
            if (value === undefined) return null;
            return <Bar key={key} label={DRIVER_ATTRIBUTE[key] ? DRIVER_ATTRIBUTE[key]() : key} value={value} min={30} max={99} marker={best[key]} caption={Math.round(value)} tone="steel" />;
          })}
        </div>
        <Facts
          label={t("Contrato", "Contract")}
          items={[
            [t("Contrato", "Contract"), driver.contract && status !== "free" ? t(`hasta ${driver.contract.until}`, `until ${driver.contract.until}`) : t("ninguno", "none")],
            driver.contract?.salary ? [t("Salario actual", "Current salary"), <span className="mn-ds-mono">{money(driver.contract.salary)}</span>] : null,
            fee > 0 ? [t("Cláusula de salida", "Release fee"), <span className="mn-ds-mono">{money(fee)}</span>] : null,
            [t("Techo", "Ceiling"), driver.scouted ? Math.round(driver.talent) : t("sin ojear", "not scouted")],
            talks?.agreed ? [t("Negociación", "Talks"), <Badge tone="pos">{t("Acuerdo", "Agreed")}</Badge>] : null,
            talks?.walked ? [t("Negociación", "Talks"), <Badge tone="neg">{t("Rompió", "Walked")}</Badge>] : null,
          ]}
        />
        <div className="mn-mk-card__actions">
          <button type="button" className="mn-btn mn-btn--primary" onClick={() => onTalk(driver.id)} disabled={talks?.walked}>
            {t("Negociar", "Negotiate")}
          </button>
          <button type="button" className="mn-btn mn-btn--ghost" onClick={() => onStar(driver.id)} aria-pressed={on}>
            <IconStar filled={on} size={16} />
            {on ? t("En seguimiento", "Shortlisted") : t("Seguir", "Shortlist")}
          </button>
        </div>
      </div>
    </Panel>
  );
}
