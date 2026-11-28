/**
 * The event banners over the race picture, pure (no React): HUD-3 of
 * docs/manager/F1M24-GAMEPLAY.md (event-banners; RF-SIM-08, RF-SIM-10, RF-CMD-03, RF-3D-04,
 * RNF-07, RNF-08). Every choice is in data/balance/hud.json `banners`.
 *
 *   eventBanners    the engine's events that earn a banner (pass, mistake, contact,
 *                   investigation, penalty, fastest lap), at the time the engine says: a pass
 *                   at its `confirmedAt` when SIM-4 sends it (§1.7, the next timing point),
 *                   otherwise at the event's own time - never a fixed delay of the view
 *   lapCallouts     "N laps to go" and "last lap" from the leader's line crossings
 *   drsCalls        DRS enabled / disabled by race control, from the era's own rule
 *                   (engine/rules.js drsOpen: from lap drs.fromLap, restartLaps after a
 *                   restart, off in the wet); nothing in an era without DRS (RF-SIM-08, SRS §6)
 *   createBannerQueue / offerBanners / currentBanner   one banner at a time, in race order, each
 *                   for its duration in real seconds; stale ones (a skip ahead) never show
 *   bannerText      the words of a banner (ES and EN)
 *
 * HUD-C3 (F1M24-CHINA §1.5, GS-12 the HUD part): race control's own messages (hudRaceControl.controlBanners,
 * kind "raceControl", and the engine's DRS calls) ride the same queue; a kind with byKind.keep is never
 * dropped by queueMax and byKind.staleSimSec gives it its own staleness, so the chain arrives whole and in
 * the engine's order (the queue is sorted by race time, stably: equal times keep the order offered).
 *
 * The view only reads (§1.4 rule 5): nothing here changes the race.
 */

import HUD from "../data/balance/hud.json";
import { drsOpen } from "../engine/rules";
import { controlText, drsReasonText } from "./hudRaceControl";
import { lapTime, t } from "./texts";

const kindSpec = (kind, hud) => hud.banners.byKind?.[kind] || {};

/** Is a banner of `kind` on in hud.json (kinds lists the ones shown)? */
export const bannerOn = (kind, hud = HUD) => (hud.banners.kinds || []).includes(kind);

/** Real seconds a banner of `kind` stays up. */
export const bannerDuration = (kind, hud = HUD) => kindSpec(kind, hud).durationSec ?? hud.banners.durationSec ?? 0;

const priorityOf = (kind, hud) => kindSpec(kind, hud).priority ?? 1;

/** Race seconds after which a banner of `kind` is stale (byKind.staleSimSec, else banners.staleSimSec). */
const staleOf = (kind, hud) => kindSpec(kind, hud).staleSimSec ?? hud.banners.staleSimSec ?? Infinity;
const keptOf = (item, hud) => Boolean(kindSpec(item.kind, hud).keep);

/** Does the event concern the cars the kind's scope covers: all, only yours, or yours and the top N? */
const inScope = (kind, { carId, otherId }, positions, isUser, hud) => {
  const spec = kindSpec(kind, hud);
  const own = Boolean(isUser(carId) || (otherId !== undefined && isUser(otherId)));
  if (own) return true;
  if (spec.scope === "own") return false;
  if (spec.scope === "top") {
    const best = Math.min(positions[carId] ?? 99, otherId !== undefined ? positions[otherId] ?? 99 : 99);
    return best <= (spec.top ?? 0);
  }
  return true;
};

/** Engine event type → banner kind. */
const EVENT_KINDS = { pass: "pass", mistake: "mistake", contact: "contact", investigation: "investigation", penalty: "penalty", fastest: "fastest" };

/**
 * Banners from the engine's events. `events` are the visible ones; `timeOf(event)` the race time
 * the view places them at; `positions` car → position now; `isUser(id)`.
 */
export const eventBanners = ({ events = [], timeOf = (event) => event.at ?? 0, positions = {}, isUser = () => false, hud = HUD } = {}) => {
  const out = [];
  events.forEach((event) => {
    const kind = EVENT_KINDS[event.type];
    if (!kind || !bannerOn(kind, hud)) return;
    const spec = kindSpec(kind, hud);
    if (kind === "mistake" && Array.isArray(spec.kinds) && !spec.kinds.includes(event.kind)) return;
    if (!inScope(kind, event, positions, isUser, hud)) return;
    // §1.7: the pass banner waits for the timing point that confirms it, when the engine says which.
    const at = kind === "pass" && Number.isFinite(event.confirmedAt) ? event.confirmedAt : timeOf(event);
    if (!Number.isFinite(at)) return;
    out.push({
      key: `${event.type}:${event.carId ?? ""}:${event.otherId ?? ""}:${event.lap ?? ""}:${event.kind ?? event.offence ?? ""}:${Math.round(at * 1000)}`,
      kind,
      at,
      carId: event.carId,
      otherId: event.otherId,
      own: Boolean(isUser(event.carId) || isUser(event.otherId)),
      detail: { mistake: event.kind, offence: event.offence, penalty: event.penalty, time: event.time, drs: Boolean(event.drs), corner: event.corner },
    });
  });
  return out;
};

/**
 * "N laps to go" (hud.json lapsToGoCallouts; 1 is "last lap"): at the leader's line crossing that
 * leaves N laps. `ends` are the leader's line crossings so far (race times, lap 1 first).
 */
export const lapCallouts = ({ laps, ends = [], hud = HUD } = {}) => {
  const out = [];
  (hud.banners.lapsToGoCallouts || []).forEach((left) => {
    if (!(left >= 1) || left >= laps) return;
    const kind = left === 1 ? "lastLap" : "lapsToGo";
    if (!bannerOn(kind, hud)) return;
    const at = ends[laps - left - 1];
    if (!Number.isFinite(at)) return;
    out.push({ key: `${kind}:${left}`, kind, at, left, own: false, detail: {} });
  });
  return out;
};

/**
 * RF-SIM-08: the laps on which race control turns DRS on or off, from the era's rule alone
 * (rules.drs: fromLap, restartLaps, wetLimit) and the race's wetness per lap. [] when the era
 * has no DRS or the circuit no zone.
 */
export const drsCalls = (rules, { laps, wetness = [], zones = 1, restartLap = 0 } = {}) => {
  if (!rules?.drs?.enabled || !(zones > 0)) return [];
  const out = [];
  let open = false;
  for (let lap = 1; lap <= laps; lap += 1) {
    const now = drsOpen(rules, { lap, wetness: wetness[Math.min(lap, wetness.length - 1)] ?? 0, zones, restartLap });
    if (now !== open) out.push({ lap, open: now });
    open = now;
  }
  return out;
};

/** The DRS calls as banners, at the leader's crossing that starts the lap. */
export const drsBanners = (calls, { ends = [], hud = HUD } = {}) => {
  if (!bannerOn("drs", hud)) return [];
  return calls
    .map((call) => ({ call, at: ends[call.lap - 2] }))
    .filter(({ at }) => Number.isFinite(at))
    .map(({ call, at }) => ({ key: `drs:${call.lap}:${call.open ? 1 : 0}`, kind: "drs", at, own: false, detail: { open: call.open, lap: call.lap } }));
};

// ------------------------------------------------------------------ the queue

/** One queue per race view. */
export const createBannerQueue = () => ({ shown: null, until: -Infinity, waiting: [], seen: new Set() });

/**
 * Offer banners whose time has come (`at` ≤ tau): new ones join the queue in race order; ones
 * staler than hud.json staleSimSec (a skip ahead) are marked seen and never shown. When more than
 * queueMax wait, the lowest priority (then the oldest) goes.
 */
export const offerBanners = (queue, items, tau, hud = HUD) => {
  items.forEach((item) => {
    if (queue.seen.has(item.key) || item.at > tau) return;
    queue.seen.add(item.key);
    if (tau - item.at > staleOf(item.kind, hud)) return;
    queue.waiting.push(item);
  });
  queue.waiting.sort((a, b) => a.at - b.at);
  const max = hud.banners.queueMax ?? Infinity;
  while (queue.waiting.length > max) {
    let drop = -1;
    queue.waiting.forEach((item, index) => {
      if (keptOf(item, hud)) return;
      if (drop < 0) {
        drop = index;
        return;
      }
      const worst = queue.waiting[drop];
      const pi = priorityOf(item.kind, hud) + (item.own ? 1 : 0);
      const pw = priorityOf(worst.kind, hud) + (worst.own ? 1 : 0);
      if (pi < pw) drop = index;
    });
    // HUD-C3: only kept banners left (race control's chain) - they all stay.
    if (drop < 0) break;
    queue.waiting.splice(drop, 1);
  }
  return queue;
};

/** The banner up at real time `realNow` (seconds), moving the queue on; null when none. */
export const currentBanner = (queue, realNow, tau = Infinity, hud = HUD) => {
  if (queue.shown && realNow < queue.until) return queue.shown;
  queue.shown = null;
  while (queue.waiting.length) {
    const next = queue.waiting.shift();
    if (Number.isFinite(tau) && tau - next.at > staleOf(next.kind, hud)) continue;
    queue.shown = next;
    queue.until = realNow + bannerDuration(next.kind, hud);
    break;
  }
  return queue.shown;
};

// ------------------------------------------------------------------ words

/** What a banner says: { title, line } with the drivers' names (`names` id → name). */
export const bannerText = (banner, names = {}) => {
  const a = names[banner.carId] || "";
  const b = names[banner.otherId] || "";
  const d = banner.detail || {};
  switch (banner.kind) {
    case "pass":
      return { title: t("Adelantamiento", "Overtake"), line: t(`${a} adelanta a ${b}${d.drs ? " con DRS" : ""}`, `${a} passes ${b}${d.drs ? " with DRS" : ""}`) };
    case "mistake":
      return d.mistake === "spin"
        ? { title: t("Trompo", "Spin"), line: a }
        : d.mistake === "wide"
          ? { title: t("Fuera de pista", "Off track"), line: a }
          : { title: t("Bloqueo", "Lock-up"), line: a };
    case "contact":
      return { title: t("Contacto", "Contact"), line: b ? `${a} · ${b}` : a };
    case "investigation":
      return { title: t("Investigación", "Under investigation"), line: a };
    case "penalty":
      return { title: t("Sanción", "Penalty"), line: a };
    case "fastest":
      return { title: t("Vuelta rápida", "Fastest lap"), line: Number.isFinite(d.time) ? `${a} · ${lapTime(d.time)}` : a };
    case "drs": {
      // HUD-C3: the engine's reason when it gives one (engine/rules.js DRS_REASONS).
      const why = d.open ? "" : drsReasonText(d.reason);
      return { title: "DRS", line: d.open ? t("DRS activado", "DRS enabled") : why ? t(`DRS desactivado · ${why}`, `DRS disabled · ${why}`) : t("DRS desactivado", "DRS disabled") };
    }
    case "raceControl":
      return controlText(d.control, d);
    case "lapsToGo":
      return { title: t(`Quedan ${banner.left} vueltas`, `${banner.left} laps to go`), line: "" };
    case "lastLap":
      return { title: t("Última vuelta", "Last lap"), line: "" };
    default:
      return { title: banner.kind, line: a };
  }
};
