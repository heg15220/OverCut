/**
 * SIM-4 (F1M24-GAMEPLAY §1.7, §2.7 eventos-duelo, §2.10 amarilla-sector; RF-CMD-03, RF-SIM-07, RF-SIM-10, RNF-08):
 * the words for what the step race now says about its fights and its yellows - the engineer's battle radio
 * (state.radio kinds "battle-*", race-sim.json radio), the `duel` events and the sector of a `yellow` - in
 * Spanish and English through t(). Own wording: no text of the reference game.
 *
 * The HUD lane hooks these in (components/texts.js radioText / commentary and LiveRace.worthTelling): until then
 * the feed shows nothing for these kinds (radioText and commentary return "" for a kind they do not know).
 */

import { cornerLabel, t } from "./texts";

/** The engineer's battle radio (engine/sim/duel.js battleRadio), "" for a kind that is not one of these. */
export const battleRadioText = (message, names = {}) => {
  const who = names[message.carId] || "";
  const other = names[message.otherId] || "";
  const gap = Number.isFinite(message.gap) ? message.gap.toFixed(1) : null;
  const gain = Number.isFinite(message.gain) ? message.gain.toFixed(1) : null;
  switch (message.kind) {
    case "battle-gaining":
      return gap && gain
        ? t(`Ingeniero a ${who}: «${other} a ${gap} s, le recortas ${gain} s por vuelta».`, `Engineer to ${who}: "${other} is ${gap}s ahead, you're taking ${gain}s a lap."`)
        : t(`Ingeniero a ${who}: «Le estás recortando a ${other}».`, `Engineer to ${who}: "You're catching ${other}."`);
    case "battle-closing":
      return gap
        ? t(`Ingeniero a ${who}: «${other} viene por detrás, a ${gap} s».`, `Engineer to ${who}: "${other} is coming, ${gap}s behind."`)
        : t(`Ingeniero a ${who}: «${other} viene por detrás».`, `Engineer to ${who}: "${other} is coming."`);
    case "battle-attack-failed":
      return t(`Ingeniero a ${who}: «No ha salido. Sigue con ${other}, habrá otra».`, `Engineer to ${who}: "Didn't stick. Stay with ${other}, there'll be another chance."`);
    case "battle-passed":
      return t(`Ingeniero a ${who}: «Bien hecho, ${other} está detrás. Ahora a abrir hueco».`, `Engineer to ${who}: "Good job, ${other} is behind. Now build the gap."`);
    case "battle-defended":
      return t(`Ingeniero a ${who}: «Bien defendido. ${other} sigue ahí».`, `Engineer to ${who}: "Good defending. ${other} is still there."`);
    case "battle-lost":
      return t(`Ingeniero a ${who}: «${other} nos ha pasado. Quédate cerca».`, `Engineer to ${who}: "${other} got us. Stay close."`);
    default:
      return "";
  }
};

/** A `duel` event as a commentary line, or "" when it is not worth one (an attempt starting, or alongside). */
export const duelText = (event, names = {}, track = null) => {
  if (!event || event.type !== "duel" || event.phase !== "resolved") return "";
  const a = names[event.carId] || "";
  const b = names[event.otherId] || "";
  const where = event.corner ? cornerLabel(event.corner, track) : "";
  const at = where ? t(` en la ${where}`, ` at ${where}`) : "";
  switch (event.result) {
    case "defended":
      return t(`${b} aguanta a ${a}${at}`, `${b} keeps ${a} behind${at}`);
    case "contact":
      return t(`¡Toque entre ${a} y ${b}${at}!`, `Contact between ${a} and ${b}${at}!`);
    default:
      return "";
  }
};

/** The words of a yellow by marshal sector: "Amarilla, sector 2" / "Doble amarilla, sector 2". */
export const yellowText = (yellow) => {
  if (!yellow) return "";
  const sector = Number.isFinite(yellow.sector) ? yellow.sector : null;
  if (yellow.double) return sector ? t(`Doble amarilla, sector ${sector}`, `Double yellow, sector ${sector}`) : t("Doble amarilla", "Double yellow");
  return sector ? t(`Amarilla, sector ${sector}`, `Yellow, sector ${sector}`) : t("Amarilla", "Yellow");
};

/** The battle state of a car (snapshot.battle[i]) in words, for a label next to it. */
export const BATTLE_STATE = {
  RUNNING: () => t("En carrera", "Running"),
  FOLLOWING: () => t("Siguiendo", "Following"),
  ATTACKING: () => t("Atacando", "Attacking"),
  DEFENDING: () => t("Defendiendo", "Defending"),
  TRAIN: () => t("En tren", "In a train"),
};
