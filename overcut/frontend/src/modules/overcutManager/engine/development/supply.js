/**
 * RF-DEV-05: who builds a team's engine.
 *
 * A works team designs its own engine (and KERS/ERS); a customer pays an annual
 * fee, cannot design those parts and gets its supplier's upgrades. The answer
 * comes from data only:
 *
 *   1. a season pack names each team's engine manufacturer (teams[].engines,
 *      carried on team.engines as names);
 *   2. a team whose id or name contains its manufacturer's name is the works
 *      team (Ferrari-Ferrari, Renault, Toyota, BMW Sauber...), and so is a known
 *      works partnership (development.json engineSupply.worksPairs, e.g.
 *      McLaren-Mercedes up to 2009);
 *   3. without a pack, a team named after a manufacturer is its works team and
 *      every other team is a customer of an unnamed supplier;
 *   4. a team built by the player (team.engine from identity.ENGINES) is always
 *      a customer and pays that engine's own price.
 */

import DEV from "../../data/balance/development.json";
import { byYear } from "../rules";

const SUPPLY = DEV.engineSupply;

const normal = (text) =>
  String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/** The manufacturer key for an engine name ("Mercedes", "Ford Cosworth", "Honda RBPT"). */
export const manufacturerOf = (name) => {
  const text = normal(name);
  if (!text) return null;
  const hit = Object.entries(SUPPLY.manufacturers).find(([key, names]) => text.includes(key) || names.some((entry) => text.includes(entry)));
  return hit ? hit[0] : text.split(" ")[0];
};

const teamTokens = (team) => `${normal(team.id).replace(/-/g, " ")} ${normal(team.name)}`;

const namedAfter = (team, manufacturer) => {
  if (!manufacturer) return false;
  const tokens = teamTokens(team);
  const names = [manufacturer, ...(SUPPLY.manufacturers[manufacturer] || [])];
  return names.some((entry) => entry && new RegExp(`(^| )${entry}( |$)`).test(tokens));
};

const worksPair = (team, manufacturer, year) =>
  SUPPLY.worksPairs.some((pair) => pair.manufacturer === manufacturer && year >= pair.from && year <= pair.to && (team.id === pair.team || team.id.startsWith(`${pair.team}-`)));

/** The annual customer fee for a season, in that season's money (before moneyScale). */
export const customerFee = (year) => byYear(SUPPLY.fee, year)?.value ?? 0;

/**
 * { manufacturer, name, works, fee } for a team in a season. `fee` is in 2024
 * dollars a year (the caller scales it); a custom team keeps its engine price.
 */
export const engineSupplyFor = (team, year) => {
  if (team.engine && team.custom) {
    return { manufacturer: team.engine.id, name: team.engine.name, works: false, fee: team.engine.price || 0, source: "custom" };
  }
  const named = (team.engines || []).filter(Boolean);
  if (named.length) {
    const keys = named.map(manufacturerOf);
    const works = keys.find((key) => namedAfter(team, key) || worksPair(team, key, year));
    const key = works || keys[0];
    return { manufacturer: key, name: named[keys.indexOf(key)], works: Boolean(works), fee: works ? 0 : customerFee(year), source: "pack" };
  }
  const own = Object.keys(SUPPLY.manufacturers).find((key) => namedAfter(team, key));
  if (own) return { manufacturer: own, name: null, works: true, fee: 0, source: "name" };
  const pair = SUPPLY.worksPairs.find((entry) => (team.id === entry.team || team.id.startsWith(`${entry.team}-`)) && year >= entry.from && year <= entry.to);
  if (pair) return { manufacturer: pair.manufacturer, name: null, works: true, fee: 0, source: "pair" };
  return { manufacturer: null, name: null, works: false, fee: customerFee(year), source: "inferred" };
};

/** Parts a customer team cannot design: those its engine supplier provides. */
export const suppliedParts = () => Object.keys(DEV.parts).filter((part) => DEV.parts[part].supplied);

export const canDevelop = (supply, part) => !(DEV.parts[part]?.supplied && supply && !supply.works);
