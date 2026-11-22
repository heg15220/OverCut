/**
 * The books (RF-FIN-01, SRS 4.1 `Transaction`).
 *
 * Every movement of money is one transaction:
 *
 *   { id, year, round, capYear, category, amount, countsForCap, capAmount, kind, meta }
 *
 *   round         the Grand Prix index it happened after (0-based, as career.round);
 *                 the day is the date of that round in career.world.races
 *
 *   category      one of finance.json `categories` (salaries, development, …)
 *   amount        signed dollars: + income, − spending
 *   countsForCap  whether it is reportable under the cost cap (RF-FIN-02)
 *   capAmount     dollars it adds to the cap (a share of an operations bill)
 *   capYear       the cap year it counts for: winter money is next year's money
 *   kind          the legacy ledger kind ("race-costs", "buyout", …) or a new one
 *
 * `career.finances.ledger` is the transaction list (newest first). Aggregates
 * per year (`byYear`) and per cap year (`capSpend`) are kept separately so the
 * books stay auditable after old rows are trimmed.
 *
 * Two ways in:
 *   postTransaction  moves the balance AND records the row (new code);
 *   recordTransaction records only (the caller already moved the balance, the
 *                    way every legacy `ledger()` call site works).
 */

import finance from "../../data/balance/finance.json";

export const CATEGORIES = finance.categories;
export const CATEGORY_IDS = CATEGORIES.map((category) => category.id);
const BY_ID = Object.fromEntries(CATEGORIES.map((category) => [category.id, category]));
const LEGACY = finance.legacyKinds;

export const categoryOf = (id) => BY_ID[id] || BY_ID.other;

/** Map an old `ledger()` kind to its category and cap rule. */
export const legacyCategory = (kind) => {
  const entry = LEGACY[kind];
  if (entry && typeof entry === "object") return entry;
  if (BY_ID[kind]) return { category: kind };
  return { category: "other" };
};

const WINTER = new Set(["review", "offseason"]);

/** The cap year money spent right now counts for. */
export const capYearOf = (career) => (WINTER.has(career.phase) ? career.year + 1 : career.year);

/** Does a category count for the cap in this year (category default + data overrides)? */
export const categoryCountsForCap = (categoryId, year) => {
  const override = finance.costCap.overrides.find(
    (entry) => entry.category === categoryId && year >= entry.from && (entry.to === null || entry.to === undefined || year <= entry.to),
  );
  if (override) return override.countsForCap;
  return Boolean(categoryOf(categoryId).countsForCap);
};

const emptyYear = () => ({ income: 0, spend: 0, byCategory: {} });

/** Make sure the finance aggregates exist (cheap; ensureFinance does the full upgrade). */
export const ensureBooks = (career) => {
  const f = career.finances;
  if (!Array.isArray(f.ledger)) f.ledger = [];
  if (!f.season) f.season = { income: 0, spend: 0 };
  if (!f.byYear) f.byYear = {};
  if (!f.capSpend) f.capSpend = {};
  if (!Number.isFinite(f.txSerial)) f.txSerial = 0;
  return f;
};

/**
 * Record a transaction without touching the balance. Returns the row.
 * `countsForCap` and `capShare` override the category defaults.
 */
export const recordTransaction = (career, { amount, category, kind = null, countsForCap, capShare, meta = {} }) => {
  const f = ensureBooks(career);
  const value = Math.round(amount || 0);
  const cat = categoryOf(category).id;
  const capYear = capYearOf(career);
  const counts = countsForCap === undefined ? categoryCountsForCap(cat, capYear) : Boolean(countsForCap);
  const share = capShare ?? categoryOf(cat).capShare ?? 1;
  const capAmount = counts && value < 0 ? Math.round(-value * share) : 0;
  f.txSerial += 1;
  const row = { id: `tx-${f.txSerial}`, year: career.year, round: career.round, capYear, category: cat, amount: value, countsForCap: counts, capAmount, kind: kind || cat, meta };
  f.ledger.unshift(compactRow(row));
  if (f.ledger.length > finance.ledgerLimit) f.ledger.length = finance.ledgerLimit;

  if (value >= 0) f.season.income += value;
  else f.season.spend -= value;
  const year = (f.byYear[career.year] = f.byYear[career.year] || emptyYear());
  if (value >= 0) year.income += value;
  else year.spend -= value;
  year.byCategory[cat] = (year.byCategory[cat] || 0) + value;
  if (capAmount) f.capSpend[capYear] = (f.capSpend[capYear] || 0) + capAmount;
  return row;
};

/**
 * Rows are stored without their defaults to keep saves small (RNF-06):
 * capYear = year, kind = category, countsForCap = false, capAmount = 0 and an
 * empty meta are left out. `txView` puts them back; read rows through
 * `transactions()`.
 */
export const compactRow = (row) => {
  const out = { id: row.id, year: row.year, round: row.round, category: row.category, amount: row.amount };
  if (row.capYear !== row.year) out.capYear = row.capYear;
  if (row.kind && row.kind !== row.category) out.kind = row.kind;
  if (row.countsForCap) out.countsForCap = true;
  if (row.capAmount) out.capAmount = row.capAmount;
  if (row.meta && Object.keys(row.meta).length) out.meta = row.meta;
  return out;
};

export const txView = (row) => ({
  ...row,
  capYear: row.capYear ?? row.year,
  kind: row.kind || row.category,
  countsForCap: Boolean(row.countsForCap),
  capAmount: row.capAmount || 0,
  meta: row.meta || {},
});

/** Move the balance and record it. */
export const postTransaction = (career, entry) => {
  career.finances.balance += Math.round(entry.amount || 0);
  return recordTransaction(career, entry);
};

/**
 * The old entry point, kept for every existing call site (market.js, events.js,
 * career.js): records only, like it always did, under the mapped category.
 */
export const legacyLedger = (career, amount, kind, extra = {}) => {
  const base = legacyCategory(kind);
  const special = (base.byMeta || []).find((rule) => extra && extra[rule.key] === rule.value);
  const mapped = special ? { ...base, category: special.category, countsForCap: special.countsForCap ?? base.countsForCap } : base;
  return recordTransaction(career, { amount, category: mapped.category, kind, countsForCap: mapped.countsForCap, meta: extra });
};

/** Filter the transaction list (UI and tests). */
export const transactions = (career, { year = null, category = null, capOnly = false, direction = null } = {}) =>
  (career.finances.ledger || []).map(txView).filter(
    (row) =>
      (year === null || row.year === year) &&
      (category === null || row.category === category) &&
      (!capOnly || row.countsForCap) &&
      (direction === null || (direction === "in" ? row.amount >= 0 : row.amount < 0)),
  );

/**
 * The audit: this year's rows must add up to the change in balance since the
 * year opened, and to the per-category totals. Returns the numbers either way.
 */
export const auditFinances = (career, year = career.year) => {
  const f = ensureBooks(career);
  const rows = transactions(career, { year });
  const sum = rows.reduce((total, row) => total + row.amount, 0);
  const aggregate = f.byYear[year] || emptyYear();
  const categorySum = Object.values(aggregate.byCategory).reduce((total, value) => total + value, 0);
  const opening = f.opening?.[year];
  const balanceDelta = opening === undefined ? null : f.balance - opening;
  const trimmed = rows.length > 0 && f.ledger.length >= finance.ledgerLimit;
  const ok = Math.abs(categorySum - (aggregate.income - aggregate.spend)) < 1 && (trimmed || Math.abs(sum - categorySum) < 1) && (balanceDelta === null || Math.abs(balanceDelta - categorySum) < 1);
  return { ok, year, rows: rows.length, sum, categorySum, income: aggregate.income, spend: aggregate.spend, opening: opening ?? null, balance: f.balance, balanceDelta };
};
