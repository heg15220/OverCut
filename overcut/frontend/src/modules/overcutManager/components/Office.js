/**
 * The principal's office: the board, the budget and the cost cap, the audited
 * transactions, the headquarters and the sponsors (RF-FIN-01..05, RF-HQ-01..03).
 * Built on the "Data screen" template (DESIGN.md §6.3): a row of figures, one
 * main table, a side panel with the detail.
 */

import React, { useMemo, useState } from "react";
import { objectiveStatus } from "../engine/board";
import {
  CATEGORIES, acceptSponsorOffer, auditFinances, budgetByCategory, declineSponsorOffer, engineSupplyIncome, ensureFinance, freeSponsorSlots,
  seasonBudget, sponsorSector, transactions,
} from "../engine/finance";
import { HQ_BUILDINGS, HQ_MAX_LEVEL, activeUpgrades, buildingAvailable, ensureHq, hqEffect, hqMaintenancePerRace, repairBuilding, repairQuote, startUpgrade, upgradeQuote } from "../engine/hq";
import hqData from "../data/balance/hq.json";
import boardData from "../data/balance/board.json";
import sponsorData from "../data/balance/sponsors.json";
import { useManager } from "./context";
import { Badge, DataTable, EmptyState, Meter, PageHeader, Panel, StatTile, Tabs, TeamStripe } from "./atoms";
import { Amount, Delta, Facts } from "./dataScreen";
import LineChart from "./lineChart";
import { IconLevelUp, IconWrench } from "./icons";
import { CAP_STATE, CONFIDENCE_REASON, HQ_EFFECT_SHORT, OBJECTIVE_STATE, SPONSOR_BONUS, TX_KIND, money, objectiveText, ordinal, pick, t } from "./texts";
import "./styles/office.css";

const CATEGORY = Object.fromEntries(CATEGORIES.map((category) => [category.id, category]));
const categoryLabel = (id) => pick(CATEGORY[id], id);
const kindLabel = (kind) => (TX_KIND[kind] ? TX_KIND[kind]() : categoryLabel(kind));
const reasonLabel = (reason) => (CONFIDENCE_REASON[reason] ? CONFIDENCE_REASON[reason]() : reason);
const OBJECTIVE_TONE = { done: "pos", "on-track": "pos", close: "warn", "off-track": "neg", failed: "neg", pending: "neutral" };
const CAP_TONE = { free: "neutral", ok: "pos", tight: "warn", over: "neg", breach: "neg" };

const TABS = [
  { value: "board", label: () => t("Directiva", "Board") },
  { value: "budget", label: () => t("Presupuesto", "Budget") },
  { value: "ledger", label: () => t("Movimientos", "Transactions") },
  { value: "hq", label: () => t("Instalaciones", "Facilities") },
  { value: "sponsors", label: () => t("Patrocinio", "Sponsors") },
];

/* ---------------------------------------------------------------- board */

const BoardTab = ({ career }) => {
  const status = objectiveStatus(career);
  const team = career.world.teams[career.teamId];
  const band = boardData.bands.find((entry) => entry.id === career.board.band);
  const history = career.board.history || [];
  const confidence = Math.round(career.board.confidence);
  const warn = boardData.security.warnBelow;
  const onTrack = status.filter((objective) => ["on-track", "done"].includes(objective.state)).length;
  const last = history[history.length - 1];
  const points = history.slice(-40);
  const who = career.owner ? t("los inversores", "the investors") : t("la directiva", "the board");
  return (
    <div className="mn-ds__grid">
      <div className="mn-ds__tiles">
        <StatTile
          label={career.owner ? t("Confianza de los inversores", "Investor confidence") : t("Confianza de la directiva", "Board confidence")}
          value={confidence}
          unit="%"
          delta={last ? `${last.delta > 0 ? "+" : last.delta < 0 ? "−" : ""}${Math.abs(last.delta)}` : undefined}
          trend={last && last.delta ? (last.delta > 0 ? "up" : "down") : undefined}
          hint={last ? t("en el último GP", "at the last GP") : t(`aviso por debajo del ${warn}%`, `warning below ${warn}%`)}
          accent
        />
        <StatTile label={t("Objetivos en camino", "Objectives on track")} value={`${onTrack}/${status.length}`} hint={band ? pick(band) : undefined} />
        <StatTile label={t("Valoración del equipo", "Team rating")} value={career.board.rating} hint={t("sobre 1.000", "out of 1,000")} />
        <StatTile label={t("Reputación", "Reputation")} value={Math.round(career.reputation)} hint={t(`Afición ${Math.round(career.fans ?? 60)} · prestigio ${Math.round(team.prestige * 100)}`, `Fans ${Math.round(career.fans ?? 60)} · prestige ${Math.round(team.prestige * 100)}`)} />
      </div>

      <div className="mn-ds__main">
        <Panel flush title={t("Objetivos de la temporada", "Season objectives")} meta={t(`Lo que espera ${who} en ${career.year}`, `What ${who} expect in ${career.year}`)}>
          <DataTable
            caption={t("Objetivos", "Objectives")}
            rowKey={(row) => row.id}
            columns={[
              { key: "text", label: t("Objetivo", "Objective"), render: (row) => objectiveText(career, row), className: "mn-of-wrap" },
              {
                key: "state",
                label: t("Estado", "Status"),
                align: "right",
                width: 140,
                render: (row) => (
                  <Badge tone={OBJECTIVE_TONE[row.state] || "neutral"} dot>
                    {OBJECTIVE_STATE[row.state] ? OBJECTIVE_STATE[row.state]() : ""}
                  </Badge>
                ),
              },
            ]}
            rows={status}
            empty={t("Sin objetivos este año", "No objectives this year")}
          />
        </Panel>
        <Panel title={t("Confianza", "Confidence")} meta={points.length > 1 ? t(`Últimos ${points.length} cambios`, `Last ${points.length} changes`) : undefined}>
          {points.length > 1 ? (
            <LineChart
              ariaLabel={t(`Confianza de ${Math.round(points[0].confidence)}% a ${confidence}% en ${points.length} cambios`, `Confidence from ${Math.round(points[0].confidence)}% to ${confidence}% over ${points.length} changes`)}
              series={[{ id: "confidence", label: t("Confianza", "Confidence"), color: "var(--mn-accent)", values: points.map((point) => point.confidence), emphasis: true }]}
              xLabels={points.map((point) => `R${point.round + 1}`)}
              xTitle={(index) => `${points[index].year} · R${points[index].round + 1} · ${reasonLabel(points[index].reason)}`}
              yMax={100}
              height={180}
              threshold={{ value: warn, label: t(`Aviso ${warn}%`, `Warning ${warn}%`) }}
              format={(value) => `${Math.round(value)}%`}
            />
          ) : (
            <EmptyState compact title={t("Aún no hay cambios de confianza", "No confidence changes yet")} body={t("Tras cada Gran Premio la directiva compara el resultado con lo esperado.", "After every Grand Prix the board compares the result with what it expected.")} />
          )}
          {history.length > 0 && (
            <DataTable
              dense
              caption={t("Últimos cambios de confianza", "Latest confidence changes")}
              rowKey={(row, index) => `${row.year}-${row.round}-${index}`}
              columns={[
                { key: "gp", label: t("GP", "GP"), width: 72, mono: true, render: (row) => `${row.year} R${row.round + 1}` },
                { key: "reason", label: t("Motivo", "Reason"), render: (row) => reasonLabel(row.reason) },
                { key: "after", label: t("Confianza", "Confidence"), align: "right", width: 96, mono: true, render: (row) => `${Math.round(row.confidence)}%` },
                { key: "delta", label: t("Cambio", "Change"), align: "right", width: 80, render: (row) => <Delta value={row.delta} digits={1} /> },
              ]}
              rows={history.slice(-6).reverse()}
            />
          )}
        </Panel>
      </div>

      <div className="mn-ds__side">
        <Record career={career} />
      </div>
    </div>
  );
};

const Record = ({ career }) => (
  <Panel flush title={t("Historial", "Record")} meta={career.trophies.length ? t(`${career.trophies.length} títulos`, `${career.trophies.length} titles`) : undefined}>
    {career.trophies.length > 0 && (
      <ul className="mn-of-trophies">
        {career.trophies.map((trophy) => (
          <li key={`${trophy.year}-${trophy.kind}`}>
            <b>{trophy.year}</b>
            <span>{trophy.kind === "constructors" ? t(`Constructores con ${trophy.teamName}`, `Constructors' with ${trophy.teamName}`) : t(`${trophy.name}, campeón con ${trophy.teamName}`, `${trophy.name}, champion with ${trophy.teamName}`)}</span>
          </li>
        ))}
      </ul>
    )}
    {career.history.length ? (
      <DataTable
        dense
        caption={t("Temporadas anteriores", "Past seasons")}
        rowKey={(row) => row.year}
        columns={[
          { key: "year", label: t("Año", "Year"), width: 56, mono: true },
          {
            key: "team",
            label: t("Equipo", "Team"),
            render: (row) => (
              <span className="mn-dt__team">
                <TeamStripe color={row.color} />
                {row.teamName}
              </span>
            ),
          },
          { key: "position", label: t("Pos", "Pos"), align: "right", width: 48, render: (row) => ordinal(row.position) },
          { key: "points", label: t("Pts", "Pts"), align: "right", width: 48, render: (row) => <b>{row.points}</b> },
        ]}
        rows={[...career.history].reverse()}
      />
    ) : (
      <div className="mn-of-pad">
        <EmptyState compact title={t("Tu primera temporada está en marcha", "Your first season is under way")} body={t("Cada año cerrado quedará aquí con su posición y sus puntos.", "Every finished year will be listed here with its position and points.")} />
      </div>
    )}
  </Panel>
);

/* --------------------------------------------------------------- budget */

const CapGauge = ({ cap }) => {
  const used = cap.spent + cap.committed;
  const scale = Math.max(cap.cap, used) || 1;
  const pct = (value) => `${Math.max(0, Math.min(100, (value / scale) * 100))}%`;
  const over = cap.state === "over" || cap.state === "breach";
  return (
    <div className={`mn-of-cap is-${cap.state}`}>
      <div className="mn-of-cap__head">
        <span>{cap.left >= 0 ? t("Libre bajo el techo", "Left under the cap") : t("Por encima del techo", "Over the cap")}</span>
        <strong>{money(Math.abs(cap.left))}</strong>
        <Badge tone={CAP_TONE[cap.state]} dot>
          {CAP_STATE[cap.state]()}
        </Badge>
      </div>
      <div className="mn-of-cap__track" role="img" aria-label={t(`Gastado ${money(cap.spent)}, comprometido ${money(cap.committed)} de un techo de ${money(cap.cap)}`, `Spent ${money(cap.spent)}, committed ${money(cap.committed)} of a ${money(cap.cap)} cap`)}>
        <i className="is-spent" style={{ width: pct(cap.spent) }} />
        <i className="is-committed" style={{ left: pct(cap.spent), width: pct(cap.committed) }} />
        {over && <em style={{ left: pct(cap.cap) }} />}
      </div>
      <ul className="mn-of-cap__legend">
        <li>
          <i className="is-spent" aria-hidden="true" />
          {t("Gastado", "Spent")} <b>{money(cap.spent)}</b>
        </li>
        <li>
          <i className="is-committed" aria-hidden="true" />
          {t("Comprometido hasta final de año", "Committed to year end")} <b>{money(cap.committed)}</b>
        </li>
      </ul>
      <Facts
        label={t("Techo de gasto", "Cost cap")}
        items={[
          [t(`Techo ${cap.year}`, `${cap.year} cap`), money(cap.cap)],
          [t("Usado y comprometido", "Used and committed"), `${Math.round(cap.share * 100)}%`],
        ]}
      />
      {cap.status === "pending" && <p className="mn-ds-note">{t("Cifra del techo por verificar.", "Cap figure still to be verified.")}</p>}
      <p className="mn-ds-note">{t("Fuera del techo: salarios de pilotos, los tres sueldos más altos, motor, hospitality y multas.", "Outside the cap: driver salaries, the three highest salaries, engine, hospitality and fines.")}</p>
    </div>
  );
};

const BudgetTab = ({ career }) => {
  const rows = budgetByCategory(career).filter((row) => row.amount !== 0);
  const budget = seasonBudget(career);
  const team = career.world.teams[career.teamId];
  const supply = engineSupplyIncome(career);
  const net = rows.reduce((sum, row) => sum + row.amount, 0);
  const spendMax = Math.max(1, ...rows.map((row) => Math.abs(row.amount)));
  const tableRows = rows.length ? [...[...rows].sort((a, b) => b.amount - a.amount), { id: "__total", total: true, amount: net }] : [];
  return (
    <div className="mn-ds__grid">
      <div className="mn-ds__tiles">
        <StatTile label={t("Caja", "Balance")} value={money(career.finances.balance)} accent hint={t("hoy", "today")} />
        <StatTile label={t("Ingresado este año", "Earned this year")} value={money(career.finances.season.income)} hint={String(career.year)} />
        <StatTile label={t("Gastado este año", "Spent this year")} value={money(career.finances.season.spend)} hint={String(career.year)} />
        <StatTile label={t("Margen para el coche", "Room for the car")} value={money(budget.developmentRoom)} hint={budget.cap.active ? t("según el techo y la caja", "by the cap and the cash") : t("tras costes fijos y reserva", "after fixed costs and reserve")} />
      </div>
      <div className="mn-ds__main">
        <Panel flush title={t("Presupuesto por categoría", "Budget by category")} meta={String(career.year)}>
          <DataTable
            className="mn-ds-totals"
            caption={t("Presupuesto por categoría", "Budget by category")}
            rowKey={(row) => row.id}
            empty={t("Sin movimientos todavía", "No movements yet")}
            columns={[
              {
                key: "category",
                label: t("Categoría", "Category"),
                render: (row) => (row.total ? t("Neto del año", "Net for the year") : categoryLabel(row.id)),
              },
              {
                key: "cap",
                label: t("Techo", "Cap"),
                className: "mn-ds-hide-sm",
                width: 72,
                render: (row) => (row.total || !budget.cap.active ? "" : row.countsForCap ? <Badge>{t("Cuenta", "Counts")}</Badge> : <span className="mn-ds-muted">—</span>),
              },
              {
                key: "share",
                label: t("Peso", "Share"),
                className: "mn-ds-hide-sm",
                width: "28%",
                render: (row) =>
                  row.total ? null : (
                    <span className={`mn-of-share${row.amount < 0 ? " is-out" : ""}`} aria-hidden="true">
                      <i style={{ width: `${(Math.abs(row.amount) / spendMax) * 100}%` }} />
                    </span>
                  ),
              },
              { key: "amount", label: t("Importe", "Amount"), align: "right", width: 120, render: (row) => <Amount value={row.amount} /> },
            ]}
            rows={tableRows}
          />
        </Panel>
      </div>
      <div className="mn-ds__side">
        <Panel title={t("Techo de gasto", "Cost cap")}>
          {budget.cap.active ? (
            <CapGauge cap={budget.cap} />
          ) : (
            <>
              <Badge tone="neutral" dot>
                {CAP_STATE.free()}
              </Badge>
              <p className="mn-ds-note">{t(`En ${career.year} no hay techo de gasto: el presupuesto lo marca el tamaño del equipo.`, `In ${career.year} there is no cost cap: the team's size sets the budget.`)}</p>
              <Facts
                label={t("Plan del resto del año", "Plan for the rest of the year")}
                items={[
                  [t("Ingresos previstos", "Projected income"), <Amount value={budget.projectedIncome} />],
                  [t("Costes fijos previstos", "Projected fixed costs"), <Amount value={-budget.projectedCosts} />],
                  [t("Reserva", "Reserve"), <Amount value={-budget.reserve} />],
                  [t("Margen para el coche", "Room for the car"), <b>{money(budget.developmentRoom)}</b>],
                ]}
              />
            </>
          )}
        </Panel>
        {(team.engine || supply > 0) && (
          <Panel title={t("Motor", "Engine")}>
            <Facts
              label={t("Motor", "Engine")}
              items={[
                team.engine && [t("Proveedor", "Supplier"), team.engine.name],
                team.engine && [t("Pago", "Payment"), t("carrera a carrera", "race by race")],
                supply > 0 && [t("Venta a clientes", "Customer sales"), <Amount value={supply} />],
              ]}
            />
          </Panel>
        )}
      </div>
    </div>
  );
};

/* -------------------------------------------------------------- ledger */

const PAGE = 60;

const LedgerTab = ({ career }) => {
  const years = [...new Set((career.finances.ledger || []).map((row) => row.year))].sort((a, b) => b - a);
  const [year, setYear] = useState(career.year);
  const [category, setCategory] = useState("");
  const [direction, setDirection] = useState("all");
  const [capOnly, setCapOnly] = useState(false);
  const [shown, setShown] = useState(PAGE);
  const rows = transactions(career, { year: Number(year), category: category || null, capOnly, direction: direction === "all" ? null : direction });
  const audit = auditFinances(career, Number(year));
  const income = rows.filter((row) => row.amount > 0).reduce((sum, row) => sum + row.amount, 0);
  const spend = rows.filter((row) => row.amount < 0).reduce((sum, row) => sum + row.amount, 0);
  const capped = rows.reduce((sum, row) => sum + (row.capAmount || 0), 0);
  const visible = rows.slice(0, shown);
  const tableRows = visible.length ? [...visible, { id: "__total", total: true, amount: income + spend, capAmount: capped }] : [];
  return (
    <div className="mn-ds__grid">
      <div className="mn-ds__main mn-of-ledger">
        <Panel
          flush
          title={t("Movimientos", "Transactions")}
          meta={
            <Badge tone={audit.ok ? "pos" : "neg"} dot>
              {audit.ok ? t("Cuentas cuadradas", "Books balance") : t("Descuadre", "Books off")}
            </Badge>
          }
        >
          <div className="mn-ds__filters">
            <Tabs
              label={t("Sentido", "Direction")}
              value={direction}
              onChange={(value) => {
                setDirection(value);
                setShown(PAGE);
              }}
              options={[
                { value: "all", label: t("Todos", "All") },
                { value: "in", label: t("Ingresos", "Income") },
                { value: "out", label: t("Gastos", "Spending") },
              ]}
            />
            <div className="mn-ds__controls">
              <select className="mn-ds-select" aria-label={t("Año", "Year")} value={year} onChange={(event) => setYear(event.target.value)}>
                {(years.length ? years : [career.year]).map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
              <select className="mn-ds-select" aria-label={t("Categoría", "Category")} value={category} onChange={(event) => setCategory(event.target.value)}>
                <option value="">{t("Todas las categorías", "All categories")}</option>
                {CATEGORIES.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {pick(entry)}
                  </option>
                ))}
              </select>
              <label className="mn-ds-check">
                <input type="checkbox" checked={capOnly} onChange={(event) => setCapOnly(event.target.checked)} />
                {t("Solo lo que cuenta para el techo", "Cap-reportable only")}
              </label>
            </div>
          </div>
          <DataTable
            className="mn-ds-totals"
            caption={t("Movimientos", "Transactions")}
            rowKey={(row) => row.id}
            empty={t("Sin movimientos con ese filtro", "No transactions for that filter")}
            columns={[
              { key: "id", label: t("Ref.", "Ref."), width: 64, mono: true, className: "mn-ds-hide-sm mn-ds-muted", render: (row) => (row.total ? "" : row.id) },
              { key: "gp", label: t("GP", "GP"), width: 56, mono: true, render: (row) => (row.total ? "" : `R${row.round + 1}`) },
              {
                key: "item",
                label: t("Concepto", "Item"),
                render: (row) => (row.total ? t(`${rows.length} movimientos${rows.length > visible.length ? ` (${visible.length} a la vista)` : ""}`, `${rows.length} transactions${rows.length > visible.length ? ` (${visible.length} shown)` : ""}`) : kindLabel(row.kind)),
              },
              { key: "category", label: t("Categoría", "Category"), className: "mn-ds-hide-sm", render: (row) => (row.total ? "" : <Badge>{categoryLabel(row.category)}</Badge>) },
              { key: "cap", label: t("Techo", "Cap"), align: "right", width: 88, className: "mn-ds-hide-sm", render: (row) => (row.capAmount ? <span className="mn-ds-mono mn-ds-muted">{money(row.capAmount)}</span> : <span className="mn-ds-muted">—</span>) },
              { key: "amount", label: t("Importe", "Amount"), align: "right", width: 112, render: (row) => <Amount value={row.amount} /> },
            ]}
            rows={tableRows}
          />
          {rows.length > shown && (
            <div className="mn-ds-more">
              <button type="button" className="mn-btn mn-btn--ghost mn-btn--sm" onClick={() => setShown((value) => value + PAGE)}>
                {t(`Ver ${Math.min(PAGE, rows.length - shown)} más`, `Show ${Math.min(PAGE, rows.length - shown)} more`)}
              </button>
            </div>
          )}
        </Panel>
      </div>
      <div className="mn-ds__side is-first-sm">
        <div className="mn-ds__stack">
          <StatTile label={t("Ingresos", "Income")} value={money(income)} hint={t("con este filtro", "for this filter")} />
          <StatTile label={t("Gastos", "Spending")} value={money(Math.abs(spend))} hint={t("con este filtro", "for this filter")} />
          <StatTile label={t("Neto", "Net")} value={`${income + spend > 0 ? "+" : income + spend < 0 ? "−" : ""}${money(Math.abs(income + spend))}`} hint={t(`en ${year}`, `in ${year}`)} />
          <StatTile label={t("Cuenta para el techo", "Counts for the cap")} value={money(capped)} hint={t("parte declarable", "reportable share")} />
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------- HQ */

const formatEffect = (key, value) => {
  const meta = hqData.effectKeys[key];
  if (key === "hospitalityIncome") return money(value);
  if (key === "forecastAccuracy") return `${Math.round(value * 100)}%`;
  if (meta.neutral === 1) return `×${Number(value).toFixed(2)}`;
  return meta.integer ? String(Math.round(value)) : String(Math.round(value * 10) / 10);
};

const Levels = ({ level }) => (
  <span className="mn-of-levels" role="img" aria-label={t(`Nivel ${level} de ${HQ_MAX_LEVEL}`, `Level ${level} of ${HQ_MAX_LEVEL}`)}>
    {Array.from({ length: HQ_MAX_LEVEL }, (_, index) => (
      <i key={index} className={index < level ? "is-on" : ""} />
    ))}
  </span>
);

const HQ_ERRORS = {
  money: () => t("No hay dinero suficiente", "Not enough money"),
  slots: () => t("Ya hay demasiadas obras en marcha", "Too many works under way"),
  busy: () => t("Ya está en obras", "Already being upgraded"),
  max: () => t("Nivel máximo", "Top level"),
  none: () => t("No necesita reparación", "No repair needed"),
};

const Building = ({ career, spec, act, onMessage }) => {
  const building = career.hq.buildings[spec.id];
  const available = buildingAvailable(spec.id, career.year);
  const quote = upgradeQuote(career, spec.id);
  const repair = repairQuote(career, spec.id);
  const good = hqData.condition.goodCondition;
  const level = building.level || 0;
  const run = (fn, done) => {
    const result = act(fn);
    onMessage(result?.ok ? { text: done } : { text: (HQ_ERRORS[result?.error] || (() => result?.error))(), bad: true });
  };
  return (
    <article className={`mn-of-building${available ? "" : " is-locked"}`} aria-label={pick(spec)}>
      <header>
        <h3>{pick(spec)}</h3>
        {available ? <Levels level={level} /> : null}
        <span className="mn-of-building__level">{!available ? t(`Desde ${spec.availableFrom}`, `From ${spec.availableFrom}`) : level ? t(`Nivel ${level}`, `Level ${level}`) : t("Sin construir", "Not built")}</span>
      </header>

      {level > 0 && (
        <div className="mn-of-building__cond">
          <span>{t("Estado", "Condition")}</span>
          <Meter value={building.condition} tone={building.condition < good ? (building.condition < good - 20 ? "neg" : "warn") : "pos"} width="100%" label={t("Estado", "Condition")} />
          <b>{Math.round(building.condition)}%</b>
        </div>
      )}

      <dl className="mn-of-effects">
        {Object.keys(spec.effects).map((key) => {
          const next = level < HQ_MAX_LEVEL ? spec.effects[key][level] : null;
          return (
            <div key={key} title={pick(hqData.effectKeys[key], key)}>
              <dt>{HQ_EFFECT_SHORT[key] ? HQ_EFFECT_SHORT[key]() : key}</dt>
              <dd>
                {formatEffect(key, hqEffect(career, key))}
                {available && next !== null && next !== undefined && <small>{` → ${formatEffect(key, next)}`}</small>}
              </dd>
            </div>
          );
        })}
      </dl>

      {building.upgrade && (
        <p className="mn-of-building__works">
          <Badge tone="accent" dot>
            {t(`Obras: nivel ${building.upgrade.to} en ${building.upgrade.roundsLeft} GP`, `Works: level ${building.upgrade.to} in ${building.upgrade.roundsLeft} GP`)}
          </Badge>
        </p>
      )}

      {available && (
        <footer>
          {!quote.error && (
            <button type="button" className="mn-btn mn-btn--sm" onClick={() => run((c) => startUpgrade(c, spec.id), t(`${pick(spec)}: obras empezadas`, `${pick(spec)}: works started`))} aria-label={level ? t(`Mejorar a ${quote.to}`, `Upgrade to ${quote.to}`) : t("Construir", "Build")}>
              <IconLevelUp size={16} />
              {level ? t(`Mejorar a ${quote.to}`, `Upgrade to ${quote.to}`) : t("Construir", "Build")}
              <span className="mn-of-building__cost">
                {money(quote.cost)} · {quote.rounds} GP
              </span>
            </button>
          )}
          {!repair.error && repair.missing > 0 && (
            <button type="button" className="mn-btn mn-btn--sm mn-btn--ghost" onClick={() => run((c) => repairBuilding(c, spec.id), t(`${pick(spec)} reparado`, `${pick(spec)} repaired`))} aria-label={t("Reparar", "Repair")}>
              <IconWrench size={16} />
              {t("Reparar", "Repair")}
              <span className="mn-of-building__cost">{money(repair.cost)}</span>
            </button>
          )}
          {quote.error === "max" && <span className="mn-ds-note">{t("Nivel máximo", "Top level")}</span>}
        </footer>
      )}
    </article>
  );
};

const HqTab = ({ career, act }) => {
  const [message, setMessage] = useState(null);
  const built = HQ_BUILDINGS.filter((spec) => career.hq.buildings[spec.id]?.level > 0);
  const avgCondition = built.length ? Math.round(built.reduce((sum, spec) => sum + career.hq.buildings[spec.id].condition, 0) / built.length) : 0;
  const works = activeUpgrades(career);
  return (
    <div className="mn-ds__grid">
      <div className="mn-ds__tiles">
        <StatTile label={t("Obras en marcha", "Works under way")} value={`${works.length}/${hqData.maxConcurrentUpgrades}`} hint={t("a la vez como máximo", "at most at once")} />
        <StatTile label={t("Estado medio", "Average condition")} value={avgCondition} unit="%" hint={t(`rinde al 100% desde el ${hqData.condition.goodCondition}%`, `full yield from ${hqData.condition.goodCondition}%`)} />
        <StatTile label={t("Mantenimiento", "Upkeep")} value={money(hqMaintenancePerRace(career))} hint={t("por Gran Premio", "per Grand Prix")} />
        <StatTile label={t("Caja", "Balance")} value={money(career.finances.balance)} hint={t("para obras y reparaciones", "for works and repairs")} />
      </div>
      <div className="mn-ds__full">
        <div className="mn-of-hq-head">
          <p className="mn-ds-note">{t("Cada edificio se desgasta un poco en cada GP; por debajo del 70% rinde menos. Mejorar cuesta dinero y varias carreras.", "Every building wears a little each GP; below 70% it yields less. Upgrading costs money and several races.")}</p>
          {message && (
            <p className={`mn-ds-flash${message.bad ? " is-bad" : ""}`} role="status">
              {message.text}
            </p>
          )}
        </div>
        <div className="mn-of-buildings">
          {HQ_BUILDINGS.map((spec) => (
            <Building key={spec.id} career={career} spec={spec} act={act} onMessage={setMessage} />
          ))}
        </div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------- sponsors */

const tierLabel = (id) => pick(sponsorData.tiers.find((tier) => tier.id === id), id);
const sponsorName = (deal) => {
  if (deal.real || !deal.root) return deal.name || t("Patrocinador", "Sponsor");
  const sector = sponsorSector(deal.sector);
  return `${deal.root} ${pick(sector, "")}`.trim();
};
const bonusText = (career, bonus) =>
  `${SPONSOR_BONUS[bonus.type] ? SPONSOR_BONUS[bonus.type]() : bonus.type}${bonus.type === "beatRival" && bonus.rivalId ? ` (${career.world.teams[bonus.rivalId]?.name || bonus.rivalId})` : ""}`;

const SponsorsTab = ({ career, act }) => {
  const [message, setMessage] = useState(null);
  const deals = career.finances.sponsors.filter((deal) => deal.until >= career.year);
  const offers = career.finances.sponsorOffers || [];
  const slots = freeSponsorSlots(career);
  const sponsorship = budgetByCategory(career).find((row) => row.id === "sponsorship")?.amount || 0;
  const perRace = deals.reduce((sum, deal) => sum + deal.perRace, 0);
  return (
    <div className="mn-ds__grid">
      <div className="mn-ds__tiles">
        <StatTile label={t("Patrocinio este año", "Sponsorship this year")} value={money(sponsorship)} hint={t("base, contratos y bonus", "base, deals and bonuses")} accent />
        <StatTile label={t("Contratos por GP", "Deals per GP")} value={money(perRace)} hint={t(`${deals.length} contratos activos`, `${deals.length} active deals`)} />
        <StatTile label={t("Huecos libres", "Free slots")} value={`${slots}/${sponsorData.slots}`} hint={t("en el coche", "on the car")} />
        <StatTile label={t("Ofertas", "Offers")} value={offers.length} hint={offers.length ? t("esperando respuesta", "awaiting an answer") : t("ninguna ahora", "none right now")} />
      </div>
      <div className="mn-ds__main">
        <Panel flush title={t("Contratos", "Deals")} meta={t("Marcas genéricas (RF-FIN-05)", "Generic brands (RF-FIN-05)")}>
          {deals.length ? (
            <DataTable
              caption={t("Contratos de patrocinio", "Sponsor deals")}
              rowKey={(row) => row.id}
              columns={[
                {
                  key: "name",
                  label: t("Patrocinador", "Sponsor"),
                  render: (row) => (
                    <span className="mn-ds-who">
                      <span>
                        <strong>{sponsorName(row)}</strong>
                        <small>{[row.tier ? tierLabel(row.tier) : t("Socio de siempre", "Long-time partner"), ...(row.bonuses || []).map((bonus) => `${bonusText(career, bonus)} +${money(bonus.amount)}`)].join(" · ")}</small>
                      </span>
                    </span>
                  ),
                },
                { key: "until", label: t("Hasta", "Until"), width: 64, mono: true, className: "mn-ds-hide-sm" },
                { key: "earned", label: t("Cobrado", "Earned"), align: "right", width: 96, className: "mn-ds-hide-sm", render: (row) => (row.earned ? <span className="mn-ds-mono">{money(row.earned)}</span> : <span className="mn-ds-muted">—</span>) },
                { key: "perRace", label: t("Por GP", "Per GP"), align: "right", width: 96, render: (row) => <Amount value={row.perRace} /> },
              ]}
              rows={deals}
            />
          ) : (
            <div className="mn-of-pad">
              <EmptyState compact title={t("Solo los socios de siempre", "Only the usual partners")} body={t("No hay contratos extra. Las ofertas llegan al empezar el año y a mitad de temporada.", "No extra deals. Offers arrive at the start of the year and mid-season.")} />
            </div>
          )}
        </Panel>
      </div>
      <div className="mn-ds__side">
        <Panel title={t("Ofertas", "Offers")} meta={slots <= 0 ? t("Sin huecos", "No slots") : undefined}>
          {message && (
            <p className={`mn-ds-flash${message.bad ? " is-bad" : ""}`} role="status">
              {message.text}
            </p>
          )}
          {offers.length ? (
            <ul className="mn-of-offers">
              {offers.map((offer) => (
                <li key={offer.id}>
                  <div className="mn-of-offers__head">
                    <strong>{sponsorName(offer)}</strong>
                    <Badge>{tierLabel(offer.tier)}</Badge>
                  </div>
                  <Facts
                    label={sponsorName(offer)}
                    items={[
                      [t("Por GP", "Per GP"), <Amount value={offer.perRace} />],
                      [t("Duración", "Length"), `${offer.years} ${offer.years === 1 ? t("año", "year") : t("años", "years")}`],
                      ...offer.bonuses.map((bonus) => [bonusText(career, bonus), <span className="mn-ds-mono">+{money(bonus.amount)}</span>]),
                    ]}
                  />
                  <div className="mn-of-offers__actions">
                    <button
                      type="button"
                      className="mn-btn mn-btn--sm"
                      disabled={slots <= 0}
                      onClick={() => {
                        const result = act((c) => acceptSponsorOffer(c, offer.id));
                        setMessage(result?.ok ? { text: t("Contrato firmado", "Deal signed") } : { text: t("No quedan huecos", "No slots left"), bad: true });
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
            <EmptyState compact title={t("No hay ofertas ahora mismo", "No offers right now")} />
          )}
        </Panel>
      </div>
    </div>
  );
};

/* ---------------------------------------------------------------- screen */

export default function Office() {
  const { career, act } = useManager();
  const [tab, setTab] = useState("board");
  // RNF-06: a save from before the finance/HQ modules gets its fields here. Both
  // calls are idempotent and only add missing fields, so running them in render is safe.
  ensureFinance(career);
  ensureHq(career);
  const offers = (career.finances.sponsorOffers || []).length;
  const options = useMemo(() => TABS.map((entry) => ({ value: entry.value, label: entry.label(), count: entry.value === "sponsors" && offers ? offers : undefined })), [offers]);
  return (
    <div className="mn-ds mn-office">
      <PageHeader title={t("Oficina", "Office")} meta={t(`Temporada ${career.year} · caja ${money(career.finances.balance)}`, `${career.year} season · ${money(career.finances.balance)} in the bank`)} />
      <Tabs label={t("Oficina", "Office")} value={tab} onChange={setTab} options={options} />
      {tab === "board" && <BoardTab career={career} />}
      {tab === "budget" && <BudgetTab career={career} />}
      {tab === "ledger" && <LedgerTab career={career} />}
      {tab === "hq" && <HqTab career={career} act={act} />}
      {tab === "sponsors" && <SponsorsTab career={career} act={act} />}
    </div>
  );
}
