/**
 * The principal's office: the board, the budget and its transactions, the cost
 * cap, the headquarters and the sponsors (RF-FIN-01..05, RF-HQ-01..03).
 */

import React, { useState } from "react";
import { objectiveStatus } from "../engine/board";
import {
  CATEGORIES, acceptSponsorOffer, auditFinances, budgetByCategory, declineSponsorOffer, engineSupplyIncome, ensureFinance, freeSponsorSlots,
  seasonBudget, sponsorSector, transactions,
} from "../engine/finance";
import { HQ_BUILDINGS, HQ_MAX_LEVEL, buildingAvailable, ensureHq, hqEffect, repairBuilding, repairQuote, startUpgrade, upgradeQuote } from "../engine/hq";
import hqData from "../data/balance/hq.json";
import boardData from "../data/balance/board.json";
import sponsorData from "../data/balance/sponsors.json";
import { useManager } from "./context";
import { Bar, Empty, Panel, Pill, Segmented, Stat, TeamBadge } from "./atoms";
import { CAP_STATE, CONFIDENCE_REASON, OBJECTIVE_STATE, SPONSOR_BONUS, TX_KIND, money, objectiveText, ordinal, pick, t } from "./texts";

const CATEGORY = Object.fromEntries(CATEGORIES.map((category) => [category.id, category]));
const categoryLabel = (id) => pick(CATEGORY[id], id);
const kindLabel = (kind) => (TX_KIND[kind] ? TX_KIND[kind]() : categoryLabel(kind));

const TABS = [
  { value: "board", label: () => t("Directiva", "Board") },
  { value: "budget", label: () => t("Presupuesto", "Budget") },
  { value: "ledger", label: () => t("Movimientos", "Transactions") },
  { value: "hq", label: () => t("Instalaciones", "Facilities") },
  { value: "sponsors", label: () => t("Patrocinio", "Sponsors") },
];

/** Signed horizontal bars, one per category; the number is always written next to the bar. */
const CategoryBars = ({ rows }) => {
  const max = Math.max(1, ...rows.map((row) => Math.abs(row.amount)));
  return (
    <ul className="mn-catbars" style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 6 }} aria-label={t("Presupuesto por categoría", "Budget by category")}>
      {rows.map((row) => (
        <li key={row.id} style={{ display: "grid", gridTemplateColumns: "minmax(7rem, 11rem) 1fr minmax(4.5rem, auto)", gap: 8, alignItems: "center" }}>
          <span>{categoryLabel(row.id)}</span>
          <span aria-hidden="true" style={{ height: 10, background: "var(--mn-line)", borderRadius: 4, overflow: "hidden" }}>
            <i style={{ display: "block", height: "100%", width: `${(Math.abs(row.amount) / max) * 100}%`, background: row.amount >= 0 ? "var(--mn-gold)" : "var(--mn-steel)", borderRadius: 4 }} />
          </span>
          <b className={row.amount < 0 ? "is-bad" : "is-good"} style={{ textAlign: "right", fontFamily: "var(--mn-mono)" }}>
            {money(row.amount)}
          </b>
        </li>
      ))}
    </ul>
  );
};

/** Confidence over time: a single line, 0..100, with a text summary for screen readers. */
const ConfidenceLine = ({ history }) => {
  const points = history.slice(-48);
  if (points.length < 2) return null;
  const width = 320;
  const height = 72;
  const x = (index) => (index / (points.length - 1)) * width;
  const y = (value) => height - (value / 100) * height;
  const path = points.map((point, index) => `${index ? "L" : "M"}${x(index).toFixed(1)},${y(point.confidence).toFixed(1)}`).join(" ");
  const first = points[0];
  const last = points[points.length - 1];
  const label = t(`Confianza de ${Math.round(first.confidence)}% a ${Math.round(last.confidence)}% en ${points.length} cambios`, `Confidence from ${Math.round(first.confidence)}% to ${Math.round(last.confidence)}% over ${points.length} changes`);
  return (
    <figure style={{ margin: "8px 0" }}>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} role="img" aria-label={label} preserveAspectRatio="none">
        <title>{label}</title>
        <line x1="0" x2={width} y1={y(boardData.security.warnBelow)} y2={y(boardData.security.warnBelow)} stroke="var(--mn-line)" strokeDasharray="4 4" />
        <path d={path} fill="none" stroke="var(--mn-gold)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
        {points.map((point, index) => (
          <circle key={index} cx={x(index)} cy={y(point.confidence)} r="6" fill="transparent">
            <title>{`${point.year} R${point.round + 1}: ${Math.round(point.confidence)}% (${point.delta >= 0 ? "+" : ""}${point.delta}) ${CONFIDENCE_REASON[point.reason] ? CONFIDENCE_REASON[point.reason]() : point.reason}`}</title>
          </circle>
        ))}
      </svg>
      <figcaption className="mn-hint">{label}</figcaption>
    </figure>
  );
};

const BoardTab = ({ career }) => {
  const status = objectiveStatus(career);
  const team = career.world.teams[career.teamId];
  const band = boardData.bands.find((entry) => entry.id === career.board.band);
  const history = career.board.history || [];
  return (
    <>
      <Panel title={career.owner ? t("Los inversores", "The investors") : t("La directiva", "The board")} action={band && <Pill tone="gold">{pick(band)} · {career.board.rating}</Pill>}>
        <Bar label={t("Confianza", "Confidence")} value={career.board.confidence} marker={boardData.security.warnBelow} caption={`${Math.round(career.board.confidence)}%`} tone={career.board.confidence < 30 ? "red" : "gold"} />
        <ul className="mn-objectives">
          {status.map((objective) => (
            <li key={objective.id} className={`is-${objective.state}`}>
              <span>{objectiveText(career, objective)}</span>
              <em>{OBJECTIVE_STATE[objective.state] ? OBJECTIVE_STATE[objective.state]() : ""}</em>
            </li>
          ))}
        </ul>
        <ConfidenceLine history={history} />
        {history.length > 0 && (
          <table className="mn-table">
            <caption className="mn-hint" style={{ textAlign: "left" }}>{t("Últimos cambios de confianza", "Latest confidence changes")}</caption>
            <tbody>
              {history.slice(-6).reverse().map((entry, index) => (
                <tr key={`${entry.year}-${entry.round}-${index}`}>
                  <td>{entry.year} · R{entry.round + 1}</td>
                  <td>{CONFIDENCE_REASON[entry.reason] ? CONFIDENCE_REASON[entry.reason]() : entry.reason}</td>
                  <td className={entry.delta < 0 ? "is-bad" : "is-good"}>{entry.delta >= 0 ? "+" : ""}{entry.delta}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="mn-stats-row">
          <Stat label={t("Reputación", "Reputation")} value={Math.round(career.reputation)} />
          <Stat label={t("Afición", "Fans")} value={Math.round(career.fans ?? 60)} />
          <Stat label={t("Prestigio del equipo", "Team prestige")} value={Math.round(team.prestige * 100)} />
        </div>
      </Panel>
      <Record career={career} />
    </>
  );
};

const CapGauge = ({ budget }) => {
  const cap = budget.cap;
  if (!cap.active) {
    return (
      <div>
        <Pill tone="muted">{CAP_STATE.free()}</Pill>
        <p className="mn-hint">{t("Antes de 2021 no hay techo de gasto: el presupuesto lo marca el tamaño del equipo.", "Before 2021 there is no cost cap: the team's size sets the budget.")}</p>
        <div className="mn-stats-row">
          <Stat label={t("Ingresos previstos", "Projected income")} value={money(budget.projectedIncome)} />
          <Stat label={t("Costes fijos previstos", "Projected fixed costs")} value={money(budget.projectedCosts)} />
          <Stat label={t("Margen para el coche", "Room for the car")} value={money(budget.developmentRoom)} accent />
        </div>
      </div>
    );
  }
  const used = cap.spent + cap.committed;
  return (
    <div>
      <Bar
        label={t(`Techo de gasto ${cap.year}${cap.status === "pending" ? " (cifra por verificar)" : ""}`, `${cap.year} cost cap${cap.status === "pending" ? " (figure to verify)" : ""}`)}
        value={cap.spent}
        marker={Math.min(cap.cap, used)}
        max={cap.cap}
        caption={`${money(cap.spent)} / ${money(cap.cap)}`}
        tone={cap.state === "breach" || cap.state === "over" ? "red" : "gold"}
      />
      <p className="mn-hint">
        {CAP_STATE[cap.state]()} · {t(`Comprometido hasta final de año: ${money(cap.committed)} · Libre: ${money(cap.left)}`, `Committed to year end: ${money(cap.committed)} · Left: ${money(cap.left)}`)}
      </p>
      <p className="mn-hint">{t("Fuera del techo: salarios de pilotos, los tres sueldos más altos, motor, hospitality y multas.", "Outside the cap: driver salaries, the three highest salaries, engine, hospitality and fines.")}</p>
    </div>
  );
};

const BudgetTab = ({ career }) => {
  const rows = budgetByCategory(career).filter((row) => row.amount !== 0);
  const budget = seasonBudget(career);
  const team = career.world.teams[career.teamId];
  const supply = engineSupplyIncome(career);
  return (
    <>
      <Panel title={t("Finanzas", "Finances")}>
        <div className="mn-stats-row">
          <Stat label={t("Caja", "Balance")} value={money(career.finances.balance)} accent />
          <Stat label={t("Ingresado este año", "Earned this year")} value={money(career.finances.season.income)} />
          <Stat label={t("Gastado este año", "Spent this year")} value={money(career.finances.season.spend)} />
        </div>
        {rows.length ? <CategoryBars rows={rows} /> : <Empty>{t("Sin movimientos todavía.", "No movements yet.")}</Empty>}
        {team.engine && <p className="mn-hint">{t(`Motor ${team.engine.name}: se paga carrera a carrera.`, `${team.engine.name} engine: paid race by race.`)}</p>}
        {supply > 0 && <p className="mn-hint">{t(`Venta de motores a clientes: ${money(supply)} por temporada.`, `Engine sales to customers: ${money(supply)} a season.`)}</p>}
      </Panel>
      <Panel title={t("Techo de gasto", "Cost cap")}>
        <CapGauge budget={budget} />
      </Panel>
    </>
  );
};

const LedgerTab = ({ career }) => {
  const years = [...new Set((career.finances.ledger || []).map((row) => row.year))].sort((a, b) => b - a);
  const [year, setYear] = useState(career.year);
  const [category, setCategory] = useState("");
  const [capOnly, setCapOnly] = useState(false);
  const rows = transactions(career, { year: Number(year), category: category || null, capOnly });
  const audit = auditFinances(career, Number(year));
  const total = rows.reduce((sum, row) => sum + row.amount, 0);
  return (
    <Panel title={t("Movimientos", "Transactions")} className="mn-panel--wide">
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", marginBottom: 8 }}>
        <label>
          {t("Año", "Year")}{" "}
          <select value={year} onChange={(event) => setYear(event.target.value)}>
            {(years.length ? years : [career.year]).map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t("Categoría", "Category")}{" "}
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="">{t("Todas", "All")}</option>
            {CATEGORIES.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {pick(entry)}
              </option>
            ))}
          </select>
        </label>
        <label>
          <input type="checkbox" checked={capOnly} onChange={(event) => setCapOnly(event.target.checked)} /> {t("Solo lo que cuenta para el techo", "Cap-reportable only")}
        </label>
        <Pill tone={audit.ok ? "green" : "red"}>{audit.ok ? t("Cuentas cuadradas", "Books balance") : t("Descuadre", "Books off")}</Pill>
      </div>
      {rows.length ? (
        <table className="mn-table mn-table--ledger">
          <thead>
            <tr>
              <th>{t("Ref.", "Ref.")}</th>
              <th>{t("GP", "GP")}</th>
              <th>{t("Categoría", "Category")}</th>
              <th>{t("Concepto", "Item")}</th>
              <th>{t("Importe", "Amount")}</th>
              <th>{t("Techo", "Cap")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 120).map((row) => (
              <tr key={row.id}>
                <td>{row.id}</td>
                <td>
                  {row.year} · R{row.round + 1}
                </td>
                <td>{categoryLabel(row.category)}</td>
                <td>{kindLabel(row.kind)}</td>
                <td className={row.amount < 0 ? "is-bad" : "is-good"}>{money(row.amount)}</td>
                <td>{row.capAmount ? money(row.capAmount) : "—"}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={4}>{t(`${rows.length} movimientos`, `${rows.length} transactions`)}</td>
              <td>{money(total)}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      ) : (
        <Empty>{t("Sin movimientos con ese filtro.", "No transactions for that filter.")}</Empty>
      )}
    </Panel>
  );
};

const effectText = (key, value) => {
  const meta = hqData.effectKeys[key];
  const shown = key === "hospitalityIncome" ? money(value) : key === "forecastAccuracy" ? `${Math.round(value * 100)}%` : meta.neutral === 1 ? `×${value.toFixed(2)}` : value;
  return `${pick(meta, key)}: ${shown}`;
};

const HqTab = ({ career, act }) => {
  const [message, setMessage] = useState(null);
  const errors = { money: t("No hay dinero suficiente.", "Not enough money."), slots: t("Ya hay demasiadas obras en marcha.", "Too many works under way."), busy: t("Ya está en obras.", "Already being upgraded."), max: t("Nivel máximo.", "Top level."), none: t("No necesita reparación.", "No repair needed.") };
  return (
    <Panel title={t("Instalaciones", "Facilities")} className="mn-panel--wide">
      <p className="mn-hint">{t("Cada edificio se desgasta un poco en cada GP; por debajo del 70 % rinde menos. Mejorar cuesta dinero y varias carreras.", "Every building wears a little each GP; below 70% it yields less. Upgrading costs money and several races.")}</p>
      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 12 }}>
        {HQ_BUILDINGS.map((spec) => {
          const building = career.hq.buildings[spec.id];
          const available = buildingAvailable(spec.id, career.year);
          const quote = upgradeQuote(career, spec.id);
          const repair = repairQuote(career, spec.id);
          return (
            <li key={spec.id} style={{ borderTop: "1px solid var(--mn-line)", paddingTop: 8 }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", justifyContent: "space-between" }}>
                <strong>
                  {pick(spec)} · {building.level ? `${building.level}/${HQ_MAX_LEVEL}` : t("sin construir", "not built")}
                </strong>
                {!available && <Pill tone="muted">{t(`Disponible desde ${spec.availableFrom}`, `Available from ${spec.availableFrom}`)}</Pill>}
                {building.upgrade && <Pill tone="gold">{t(`Obras: nivel ${building.upgrade.to} en ${building.upgrade.roundsLeft} GP`, `Works: level ${building.upgrade.to} in ${building.upgrade.roundsLeft} GP`)}</Pill>}
              </div>
              {building.level > 0 && <Bar label={t("Estado", "Condition")} value={building.condition} marker={hqData.condition.goodCondition} caption={`${Math.round(building.condition)}%`} tone={building.condition < hqData.condition.goodCondition ? "red" : "gold"} />}
              <p className="mn-hint">{Object.keys(spec.effects).map((key) => effectText(key, hqEffect(career, key))).join(" · ")}</p>
              {available && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {!quote.error && (
                    <button
                      type="button"
                      className="mn-btn mn-btn--sm"
                      onClick={() => {
                        const result = act((c) => startUpgrade(c, spec.id));
                        setMessage(result?.ok ? t(`${pick(spec)}: obras empezadas.`, `${pick(spec)}: works started.`) : errors[result?.error] || result?.error);
                      }}
                    >
                      {building.level ? t(`Mejorar a ${quote.to}`, `Upgrade to ${quote.to}`) : t("Construir", "Build")} · {money(quote.cost)} · {quote.rounds} GP
                    </button>
                  )}
                  {!repair.error && repair.missing > 0 && (
                    <button
                      type="button"
                      className="mn-btn mn-btn--sm mn-btn--ghost"
                      onClick={() => {
                        const result = act((c) => repairBuilding(c, spec.id));
                        setMessage(result?.ok ? t(`${pick(spec)} reparado.`, `${pick(spec)} repaired.`) : errors[result?.error] || result?.error);
                      }}
                    >
                      {t("Reparar", "Repair")} · {money(repair.cost)}
                    </button>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {message && <p className="mn-muted">{message}</p>}
    </Panel>
  );
};

const tierLabel = (id) => pick(sponsorData.tiers.find((tier) => tier.id === id), id);
const sponsorName = (deal) => {
  if (deal.real || !deal.root) return deal.name || t("Patrocinador", "Sponsor");
  const sector = sponsorSector(deal.sector);
  return `${deal.root} ${pick(sector, "")}`.trim();
};
const bonusText = (career, bonus) =>
  `${SPONSOR_BONUS[bonus.type] ? SPONSOR_BONUS[bonus.type]() : bonus.type}${bonus.type === "beatRival" && bonus.rivalId ? ` (${career.world.teams[bonus.rivalId]?.name || bonus.rivalId})` : ""}: +${money(bonus.amount)}`;

const SponsorsTab = ({ career, act }) => {
  const [message, setMessage] = useState(null);
  const deals = career.finances.sponsors.filter((deal) => deal.until >= career.year);
  const offers = career.finances.sponsorOffers || [];
  const slots = freeSponsorSlots(career);
  return (
    <>
      <Panel title={t("Patrocinadores", "Sponsors")}>
        {deals.length ? (
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 8 }}>
            {deals.map((deal) => (
              <li key={deal.id}>
                <strong>{sponsorName(deal)}</strong> {deal.tier && <Pill tone="muted">{tierLabel(deal.tier)}</Pill>}
                <p className="mn-hint">
                  {money(deal.perRace)} / GP · {t(`hasta ${deal.until}`, `until ${deal.until}`)}
                  {deal.earned ? ` · ${t("cobrado", "earned")} ${money(deal.earned)}` : ""}
                </p>
                {(deal.bonuses || []).length > 0 && <p className="mn-hint">{deal.bonuses.map((bonus) => bonusText(career, bonus)).join(" · ")}</p>}
              </li>
            ))}
          </ul>
        ) : (
          <Empty>{t("Solo los socios de siempre: ningún contrato extra.", "Only the usual partners: no extra deals.")}</Empty>
        )}
        <p className="mn-hint">{t(`Huecos libres en el coche: ${slots}.`, `Free slots on the car: ${slots}.`)}</p>
      </Panel>
      <Panel title={t("Ofertas", "Offers")}>
        {offers.length ? (
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 10 }}>
            {offers.map((offer) => (
              <li key={offer.id}>
                <strong>{sponsorName(offer)}</strong> <Pill tone="muted">{tierLabel(offer.tier)}</Pill>
                <p className="mn-hint">
                  {money(offer.perRace)} / GP · {offer.years} {offer.years === 1 ? t("año", "year") : t("años", "years")}
                </p>
                <p className="mn-hint">{offer.bonuses.map((bonus) => bonusText(career, bonus)).join(" · ")}</p>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    className="mn-btn mn-btn--sm"
                    disabled={slots <= 0}
                    onClick={() => {
                      const result = act((c) => acceptSponsorOffer(c, offer.id));
                      setMessage(result?.ok ? t("Contrato firmado.", "Deal signed.") : t("No quedan huecos.", "No slots left."));
                    }}
                  >
                    {t("Firmar", "Sign")}
                  </button>
                  <button type="button" className="mn-btn mn-btn--sm mn-btn--ghost" onClick={() => act((c) => declineSponsorOffer(c, offer.id))}>
                    {t("Rechazar", "Decline")}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <Empty>{t("No hay ofertas ahora mismo.", "No offers right now.")}</Empty>
        )}
        {message && <p className="mn-muted">{message}</p>}
      </Panel>
    </>
  );
};

const Record = ({ career }) => (
  <Panel title={t("Historial", "Record")}>
    {career.trophies.length > 0 && (
      <ul className="mn-trophies">
        {career.trophies.map((trophy) => (
          <li key={`${trophy.year}-${trophy.kind}`}>
            <b>{trophy.year}</b> {trophy.kind === "constructors" ? t(`Campeones de constructores con ${trophy.teamName}`, `Constructors' champions with ${trophy.teamName}`) : t(`${trophy.name}, campeón del mundo con ${trophy.teamName}`, `${trophy.name}, world champion with ${trophy.teamName}`)}
          </li>
        ))}
      </ul>
    )}
    {career.history.length ? (
      <table className="mn-table">
        <thead>
          <tr>
            <th>{t("Año", "Year")}</th>
            <th>{t("Equipo", "Team")}</th>
            <th>{t("Pos.", "Pos.")}</th>
            <th>{t("Pts", "Pts")}</th>
            <th>{t("Vict.", "Wins")}</th>
            <th>{t("Campeón", "Champion")}</th>
          </tr>
        </thead>
        <tbody>
          {[...career.history].reverse().map((entry) => (
            <tr key={entry.year}>
              <td>{entry.year}</td>
              <td className="mn-table__name">
                <TeamBadge team={{ name: entry.teamName, short: entry.teamName.slice(0, 3).toUpperCase(), color: entry.color, custom: true }} size={16} /> {entry.teamName}
              </td>
              <td>{ordinal(entry.position)}</td>
              <td>{entry.points}</td>
              <td>{entry.wins}</td>
              <td>{entry.champion?.name}</td>
            </tr>
          ))}
        </tbody>
      </table>
    ) : (
      <Empty>{t("Tu primera temporada está en marcha.", "Your first season is under way.")}</Empty>
    )}
  </Panel>
);

export default function Office() {
  const { career, act } = useManager();
  const [tab, setTab] = useState("board");
  // RNF-06: a save from before the finance/HQ modules gets its fields here. Both
  // calls are idempotent and only add missing fields, so running them in render is safe.
  ensureFinance(career);
  ensureHq(career);
  return (
    <div className="mn-office">
      <div style={{ marginBottom: 12 }}>
        <Segmented label={t("Oficina", "Office")} value={tab} onChange={setTab} options={TABS.map((entry) => ({ value: entry.value, label: entry.label() }))} />
      </div>
      <div className="mn-grid mn-grid--office">
        {tab === "board" && <BoardTab career={career} />}
        {tab === "budget" && <BudgetTab career={career} />}
        {tab === "ledger" && <LedgerTab career={career} />}
        {tab === "hq" && <HqTab career={career} act={act} />}
        {tab === "sponsors" && <SponsorsTab career={career} act={act} />}
      </div>
    </div>
  );
}
