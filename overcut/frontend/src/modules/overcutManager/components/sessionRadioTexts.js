/**
 * SES-C1 (F1M24-CHINA §1.5 «Radio en sesiones», §2.7 AUD-C3; RF-CMD-03, RF-WKD-02, RNF-08): the words for the
 * session engineer's radio (engine/sessionSim/sessionRadio.js, state.radio kinds "session-*") and for the two
 * session events with the race's shape (`garageExit`, `lapComplete`), in Spanish and English through t().
 * Own wording: no text of the reference game.
 *
 * The HUD lane hooks these in (HUD-C2: components/SessionLive.js feed and audio frame): until then the session
 * feed shows what it showed before. Both functions return "" for a kind or type they do not know.
 */

import { COMPOUND, lapTime, t } from "./texts";

const tyre = (compound) => (COMPOUND[compound] ? COMPOUND[compound]().toLowerCase() : "");
const gapOf = (gap) => (Number.isFinite(gap) && gap > 0 ? `+${gap.toFixed(3)}` : null);

/** "P3, +0.215" / "P1" from a message or event with position and gapSec (null without a position). */
const placeOf = (entry) => {
  if (!Number.isFinite(entry.position)) return null;
  const gap = gapOf(entry.gapSec);
  return gap ? `P${entry.position}, ${gap}` : `P${entry.position}`;
};

/** The session engineer's radio to one of the player's drivers, "" for a kind that is not one of these. */
export const sessionRadioText = (message, names = {}) => {
  const who = names[message.carId] || "";
  const other = names[message.otherId] || "";
  const place = placeOf(message);
  switch (message.kind) {
    case "session-garage-exit":
      return message.queueSec > 0.5
        ? t(`Ingeniero a ${who}: «Salida libre ahora. Hemos esperado ${message.queueSec.toFixed(1)} s en el semáforo»`, `Engineer to ${who}: "Clear to join now. We waited ${message.queueSec.toFixed(1)}s at the light."`)
        : t(`Ingeniero a ${who}: «Salida libre. Calienta bien los ${tyre(message.compound)}»`, `Engineer to ${who}: "Pit exit is clear. Get the ${tyre(message.compound)} up to temperature."`);
    case "session-push":
      return message.of > 1
        ? t(`Ingeniero a ${who}: «Intento ${message.attempt} de ${message.of}. Adelante, todo»`, `Engineer to ${who}: "Attempt ${message.attempt} of ${message.of}. Go, full push."`)
        : t(`Ingeniero a ${who}: «Esta es la vuelta. Adelante, todo»`, `Engineer to ${who}: "This is the lap. Go, full push."`);
    case "session-lap": {
      const time = lapTime(message.time);
      const zone = message.dropZone ? t(" Seguimos en la zona de eliminación.", " We're still in the drop zone.") : "";
      if (message.improved && message.position === 1) return t(`Ingeniero a ${who}: «${time}. ¡Estás primero!»${zone}`, `Engineer to ${who}: "${time}. You're P1!"${zone}`);
      if (message.improved) return t(`Ingeniero a ${who}: «${time}, mejora. ${place || ""}»${zone}`, `Engineer to ${who}: "${time}, an improvement. ${place || ""}"${zone}`);
      return t(`Ingeniero a ${who}: «${time}, sin mejora. Seguimos ${place || "sin tiempo"}»${zone}`, `Engineer to ${who}: "${time}, no improvement. Still ${place || "without a time"}."${zone}`);
    }
    case "session-lap-deleted":
      return message.reason === "doubleYellow"
        ? t(`Ingeniero a ${who}: «Tiempo borrado por la doble amarilla»`, `Engineer to ${who}: "Lap time deleted for the double yellow."`)
        : t(`Ingeniero a ${who}: «Tiempo borrado por la amarilla»`, `Engineer to ${who}: "Lap time deleted for the yellow."`);
    case "session-yellow": {
      const flag = message.double ? t("Doble amarilla", "Double yellow") : t("Amarilla", "Yellow");
      const sector = Number.isFinite(message.sector) ? t(` en el sector ${message.sector}`, ` in sector ${message.sector}`) : "";
      if (message.outcome === "abandon") return t(`Ingeniero a ${who}: «${flag}${sector}. Abandona la vuelta»`, `Engineer to ${who}: "${flag}${sector}. Abandon the lap."`);
      if (message.outcome === "delete") return t(`Ingeniero a ${who}: «${flag}${sector}. Levanta, el tiempo no contará»`, `Engineer to ${who}: "${flag}${sector}. Lift, the time won't count."`);
      return t(`Ingeniero a ${who}: «${flag}${sector}. Levanta ahí»`, `Engineer to ${who}: "${flag}${sector}. Lift there."`);
    }
    case "session-impeded":
      return message.outcome === "abandon"
        ? t(`${who}: «¡${other} me ha estorbado, vuelta perdida!»`, `${who}: "${other} held me up, that lap's gone!"`)
        : t(`${who}: «${other} se ha puesto en medio»`, `${who}: "${other} got in the way."`);
    case "session-flag":
      return message.counts
        ? t(`Ingeniero a ${who}: «Bandera a cuadros, pero esta vuelta cuenta. Termínala»`, `Engineer to ${who}: "Chequered flag, but this lap counts. Finish it."`)
        : t(`Ingeniero a ${who}: «Bandera a cuadros. Vuelve a boxes»`, `Engineer to ${who}: "Chequered flag. Bring it in."`);
    case "session-through":
      return t(`Ingeniero a ${who}: «Pasamos. P${message.position ?? "-"}»`, `Engineer to ${who}: "We're through. P${message.position ?? "-"}."`);
    case "session-knocked-out":
      return t(`Ingeniero a ${who}: «Eliminados, P${message.position ?? "-"}. Lo siento»`, `Engineer to ${who}: "We're out, P${message.position ?? "-"}. Sorry."`);
    case "session-result":
      return Number.isFinite(message.position)
        ? t(`Ingeniero a ${who}: «Terminamos P${message.position}»`, `Engineer to ${who}: "We finish P${message.position}."`)
        : t(`Ingeniero a ${who}: «Terminamos sin tiempo»`, `Engineer to ${who}: "We finish without a time."`);
    default:
      return "";
  }
};

/** A session event with the race's shape as a commentary line, "" for any other type. */
export const sessionEventText = (event, names = {}) => {
  const who = names[event.carId] || "";
  switch (event.type) {
    case "garageExit":
      return t(`${who} sale a pista`, `${who} joins the track`);
    case "lapComplete": {
      if (event.deleted) return t(`${who}: tiempo borrado (${lapTime(event.time)})`, `${who}: lap time deleted (${lapTime(event.time)})`);
      const place = placeOf(event);
      return place ? t(`${who}: ${lapTime(event.time)} (${place})`, `${who}: ${lapTime(event.time)} (${place})`) : t(`${who}: ${lapTime(event.time)}`, `${who}: ${lapTime(event.time)}`);
    }
    default:
      return "";
  }
};
