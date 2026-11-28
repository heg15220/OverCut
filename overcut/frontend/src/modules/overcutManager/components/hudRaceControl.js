/**
 * Race control on the HUD, pure (no React): HUD-C3 of docs/manager/F1M24-CHINA.md (GS-12, the HUD part;
 * §1.5 «DRS habilitado» and «Mensajes de mojado», §2.9; RF-SIM-10, RF-SIM-08, RNF-08, RNF-09, SRS §6).
 *
 * The engine emits race control's messages as events `{type: "control", kind, lap, t, sector?, reason?}`
 * (engine/sim/stepRace.js CONTROL_KINDS, engine/rules.js DRS_CONTROL): "drsEnabled" {lap}, "drsDisabled"
 * {reason}, and the wet chain "climaticChange", "wetTrack", "slippery" (by sector) and "lowGrip". The view
 * only paints them, in the order they come, with no threshold of its own; any other shape is ignored (no
 * banner). DRS messages only in an era with DRS (rules.drs.enabled: not before 2011, not in 2026).
 *
 *   controlEventsOf(events)          the well-formed control events, in the engine's order
 *   engineHasDrsControl(events)      the engine speaks for DRS itself (then the view's own rule is quiet)
 *   controlBanners({events, rules})  the banners (hudBanners queue items) of those events
 *   raceControlState(events, tau)    what holds now for the conditions header: wet state, slippery sectors,
 *                                    low grip, DRS shut and why (hud.json raceControl.header)
 *   raceControlLabel(state)          that state in words (ES and EN), or null
 *   controlText(kind, detail)        the words of one message
 */

import HUD from "../data/balance/hud.json";
import { CONTROL_EVENT, DRS_CONTROL } from "../engine/rules";
import { t } from "./texts";

const DRS_KINDS = new Set([DRS_CONTROL.ENABLED, DRS_CONTROL.DISABLED]);

const wetKindsOf = (hud) => new Set(hud.raceControl?.wetKinds || []);
const bannerOn = (kind, hud) => (hud.banners.kinds || []).includes(kind);
const finite = (value) => Number.isFinite(value);

/** The race time of a control event: its own `t` (the worker stamps `at` at the end of the chunk). */
export const controlTimeOf = (event) => {
  if (finite(event.t) && finite(event.at)) return Math.min(event.t, event.at);
  if (finite(event.t)) return event.t;
  return finite(event.at) ? event.at : null;
};

/** The control events that have the §1.5 shape, in the order the engine logged them. */
export const controlEventsOf = (events = [], hud = HUD) => {
  const wet = wetKindsOf(hud);
  return (Array.isArray(events) ? events : []).filter(
    (event) => event && event.type === CONTROL_EVENT && typeof event.kind === "string" && (DRS_KINDS.has(event.kind) || wet.has(event.kind)) && controlTimeOf(event) !== null,
  );
};

/** Does the engine announce DRS itself? Then the view's own rule (hudBanners.drsCalls) stays quiet. */
export const engineHasDrsControl = (events = []) => (Array.isArray(events) ? events : []).some((event) => event && event.type === CONTROL_EVENT && DRS_KINDS.has(event.kind));

const drsAllowed = (rules) => Boolean(rules?.drs?.enabled);

/**
 * The banners of the engine's control events (hudBanners offerBanners items). `rules` the race's rules (DRS
 * only with rules.drs.enabled). A DRS banner has the same key as the view's own rule would give it
 * (`drs:<lap>:<open>`), so the two never show the same call twice.
 */
export const controlBanners = ({ events = [], rules = null, hud = HUD } = {}) => {
  if (!hud.raceControl?.enabled) return [];
  const out = [];
  controlEventsOf(events, hud).forEach((event, seq) => {
    const at = controlTimeOf(event);
    if (DRS_KINDS.has(event.kind)) {
      if (!drsAllowed(rules) || !bannerOn("drs", hud)) return;
      const open = event.kind === DRS_CONTROL.ENABLED;
      const lap = finite(event.lap) ? event.lap : "";
      out.push({ key: `drs:${lap}:${open ? 1 : 0}`, kind: "drs", at, seq, own: false, detail: { open, lap: event.lap, reason: open ? null : event.reason ?? null } });
      return;
    }
    if (!bannerOn("raceControl", hud)) return;
    const sector = finite(event.sector) ? event.sector : null;
    out.push({
      key: `rc:${event.kind}:${sector ?? ""}:${event.lap ?? ""}:${Math.round(at * 1000)}`,
      kind: "raceControl",
      at,
      seq,
      own: false,
      detail: { control: event.kind, sector },
    });
  });
  return out;
};

/**
 * What race control has said that still holds at race time `tau`, for the conditions header: the wet
 * state ("wetTrack" or null), the slippery sectors, low grip, and DRS shut with its reason when the
 * reason is one of hud.json raceControl.header.drsReasons. A message in header.clearOn (the engine opens
 * DRS again) clears the wet state. Null when nothing holds or the header is off.
 */
export const raceControlState = (events = [], tau = Infinity, { rules = null, hud = HUD } = {}) => {
  const header = hud.raceControl?.header;
  if (!hud.raceControl?.enabled || !header?.enabled) return null;
  const clearOn = new Set(header.clearOn || []);
  let state = { climatic: false, wetTrack: false, sectors: [], lowGrip: false, drsOff: null };
  controlEventsOf(events, hud).forEach((event) => {
    if (controlTimeOf(event) > tau) return;
    if (clearOn.has(event.kind)) state = { climatic: false, wetTrack: false, sectors: [], lowGrip: false, drsOff: null };
    switch (event.kind) {
      case "climaticChange":
        state.climatic = true;
        break;
      case "wetTrack":
        state.wetTrack = true;
        break;
      case "slippery":
        if (finite(event.sector) && !state.sectors.includes(event.sector)) state.sectors = [...state.sectors, event.sector].sort((a, b) => a - b);
        else if (!finite(event.sector) && !state.sectors.includes("all")) state.sectors = [...state.sectors, "all"];
        break;
      case "lowGrip":
        state.lowGrip = true;
        break;
      case DRS_CONTROL.DISABLED:
        state.drsOff = drsAllowed(rules) && (header.drsReasons || []).includes(event.reason) ? event.reason : null;
        break;
      case DRS_CONTROL.ENABLED:
        state.drsOff = null;
        break;
      default:
        break;
    }
  });
  const any = state.wetTrack || state.sectors.length > 0 || state.lowGrip || state.drsOff !== null;
  return any ? state : null;
};

const REASON_WORDS = {
  wet: () => t("pista mojada", "wet track"),
  era: () => t("reglamento", "regulations"),
  noZones: () => t("sin zonas", "no zones"),
  start: () => t("salida", "start"),
  restart: () => t("reanudación", "restart"),
  safetyCar: () => t("coche de seguridad", "safety car"),
  vsc: () => t("coche de seguridad virtual", "virtual safety car"),
  redFlag: () => t("bandera roja", "red flag"),
  yellow: () => t("bandera amarilla", "yellow flag"),
};

/** Why DRS is shut, in words ("" when the engine gives no reason or one the view does not know). */
export const drsReasonText = (reason) => (REASON_WORDS[reason] ? REASON_WORDS[reason]() : "");

const sectorsText = (sectors) =>
  sectors.includes("all")
    ? t("resbaladiza", "slippery")
    : sectors.length === 1
      ? t(`resbaladiza en el sector ${sectors[0]}`, `slippery in sector ${sectors[0]}`)
      : t(`resbaladiza en los sectores ${sectors.join(", ")}`, `slippery in sectors ${sectors.join(", ")}`);

/** The header's words for raceControlState, or null. */
export const raceControlLabel = (state) => {
  if (!state) return null;
  const parts = [];
  if (state.wetTrack) parts.push(t("Pista mojada", "Wet track"));
  if (state.sectors.length) parts.push(parts.length ? sectorsText(state.sectors) : sectorsText(state.sectors).replace(/^./, (c) => c.toUpperCase()));
  if (state.lowGrip) parts.push(parts.length ? t("poco agarre", "low grip") : t("Poco agarre", "Low grip"));
  if (state.drsOff !== null) parts.push(drsReasonText(state.drsOff) ? t(`DRS desactivado (${drsReasonText(state.drsOff)})`, `DRS disabled (${drsReasonText(state.drsOff)})`) : t("DRS desactivado", "DRS disabled"));
  return parts.join(" · ");
};

/** The words of one control message: { title, line }. */
export const controlText = (kind, detail = {}) => {
  const title = t("Dirección de carrera", "Race control");
  switch (kind) {
    case "climaticChange":
      return { title, line: t("Cambio en las condiciones climáticas", "Change in climatic conditions") };
    case "wetTrack":
      return { title, line: t("Pista mojada", "Wet track") };
    case "slippery":
      return { title, line: finite(detail.sector) ? t(`Pista resbaladiza en el sector ${detail.sector}`, `Track surface slippery in sector ${detail.sector}`) : t("Pista resbaladiza", "Track surface slippery") };
    case "lowGrip":
      return { title, line: t("Condiciones de poco agarre", "Low grip conditions") };
    default:
      return { title, line: "" };
  }
};
