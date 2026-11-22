/**
 * Sponsors (RF-FIN-03, RF-FIN-05).
 *
 * The prestige-based sponsorship of economy.sponsorIncome is the team's existing
 * portfolio. On top of it the team has a few open slots (sponsors.json `slots`)
 * filled from offers: a fixed fee per Grand Prix plus bonuses for race
 * objectives (win, podium, points, both cars home, beat a rival, top-ten grid).
 *
 * Names are fictional by default: an invented root and a sector that existed in
 * the year. Real names only come from a data pack the player supplies:
 *
 *   career.sponsorPack = { real: true, sponsors: [{ name, sector? }] }
 *
 * Offers are deterministic: substream(seed, "sponsor-offers", year, reason).
 *
 * A deal: { id, name, root, sector, tier, perRace, from, until, bonuses: [{ type, amount, rivalId?, gridTarget? }], earned, real }
 * Deals from events.js (`{ id, perRace, until }`) keep working: no tier, no bonuses.
 */

import { substream } from "../../../overcutTrayectoria/engine/rng";
import data from "../../data/balance/sponsors.json";
import { ratingBand, teamRating } from "../board";
import { roundMoney, sponsorIncome } from "../economy";
import { expectedRankOf, teamsByPace } from "../world";

export const SPONSOR_TIERS = data.tiers;
export const SPONSOR_SECTORS = data.names.sectors;
export const BONUS_TYPES = Object.keys(data.bonuses).filter((key) => !key.startsWith("$"));
export const sponsorSector = (id) => SPONSOR_SECTORS.find((sector) => sector.id === id) || null;

const activeDeals = (career) => (career.finances.sponsors || []).filter((deal) => deal.until >= career.year);
export const packagedDeals = (career) => activeDeals(career).filter((deal) => deal.tier);
export const freeSponsorSlots = (career) => Math.max(0, data.slots - packagedDeals(career).length);

const rivalOf = (career) => {
  const ranked = teamsByPace(career.world);
  const expected = expectedRankOf(career.world, career.teamId);
  const rival = expected > 1 ? ranked[expected - 2] : ranked[1];
  return rival?.id || null;
};

/**
 * Generate `count` offers for the player (deterministic). `reason` separates
 * the season-start batch from the mid-season one.
 */
export const generateSponsorOffers = (career, { count = data.offersPerSeason, reason = "season" } = {}) => {
  const stream = substream(career.seed, "sponsor-offers", career.year, reason, career.teamId);
  const team = career.world.teams[career.teamId];
  const prestige = team?.prestige ?? 0.4;
  const raceCount = Math.max(1, career.world.races.length);
  const band = ratingBand(teamRating(career)).id;
  const base = sponsorIncome(prestige, career.year);
  const taken = new Set([...(career.finances.sponsors || []).map((deal) => deal.root || deal.name), ...(career.finances.sponsorOffers || []).map((offer) => offer.root || offer.name)]);
  const pack = career.sponsorPack?.sponsors?.length ? stream.shuffle(career.sponsorPack.sponsors) : null;
  const roots = stream.shuffle(data.names.roots).filter((root) => !taken.has(root));
  const sectors = SPONSOR_SECTORS.filter((sector) => career.year >= sector.from);
  const tiers = SPONSOR_TIERS.filter((tier) => prestige >= tier.minPrestige);
  const bonusPool = BONUS_TYPES.filter((type) => data.bonuses[type].bands.includes(band));
  const rivalId = rivalOf(career);
  const offers = [];
  for (let index = 0; index < count; index += 1) {
    const tier = tiers[Math.min(tiers.length - 1, index % tiers.length)];
    const perRace = roundMoney((base * tier.feeShare * (0.85 + stream.next() * 0.3)) / raceCount);
    const years = stream.int(tier.years[0], tier.years[1]);
    const picked = stream.shuffle(bonusPool.filter((type) => type !== "beatRival" || rivalId)).slice(0, tier.bonusCount);
    const bonuses = picked.map((type) => ({
      type,
      amount: roundMoney(perRace * data.bonuses[type].multiple),
      ...(type === "beatRival" ? { rivalId } : {}),
      ...(type === "topTenGrid" ? { gridTarget: data.bonuses[type].gridTarget } : {}),
    }));
    const real = pack ? pack[index % pack.length] : null;
    const sector = real?.sector ? sponsorSector(real.sector) || { id: real.sector } : stream.pick(sectors);
    const root = real ? real.name : roots[index % roots.length];
    offers.push({
      id: `so-${career.year}-${reason}-${index + 1}`,
      root,
      name: real ? real.name : `${root} ${sector.en}`,
      sector: sector.id,
      real: Boolean(real && career.sponsorPack.real),
      tier: tier.id,
      perRace,
      years,
      bonuses,
      year: career.year,
    });
  }
  return offers;
};

/** Put a fresh batch of offers on the table (replaces the old ones). */
export const refreshSponsorOffers = (career, opts) => {
  career.finances.sponsorOffers = generateSponsorOffers(career, opts);
  return career.finances.sponsorOffers;
};

export const acceptSponsorOffer = (career, offerId) => {
  const offers = career.finances.sponsorOffers || [];
  const offer = offers.find((entry) => entry.id === offerId);
  if (!offer) return { error: "invalid" };
  if (freeSponsorSlots(career) <= 0) return { error: "slots" };
  const deal = { ...offer, id: `sp-${offer.id}`, from: career.year, until: career.year + offer.years - 1, earned: 0 };
  delete deal.years;
  career.finances.sponsors.push(deal);
  career.finances.sponsorOffers = offers.filter((entry) => entry.id !== offerId);
  return { ok: true, deal };
};

export const declineSponsorOffer = (career, offerId) => {
  const before = (career.finances.sponsorOffers || []).length;
  career.finances.sponsorOffers = (career.finances.sponsorOffers || []).filter((entry) => entry.id !== offerId);
  return before !== career.finances.sponsorOffers.length ? { ok: true } : { error: "invalid" };
};

/** Did one race meet a bonus? */
export const bonusMet = (bonus, summary, teamId) => {
  const own = summary.rows.filter((row) => row.teamId === teamId);
  const finished = own.filter((row) => row.status === "finished" && row.position);
  const best = Math.min(99, ...finished.map((row) => row.position));
  switch (bonus.type) {
    case "win":
      return best === 1;
    case "podium":
      return best <= 3;
    case "points":
      return own.some((row) => (row.points || 0) > 0);
    case "bothFinish":
      return own.length >= 2 && finished.length === own.length;
    case "beatRival": {
      const rival = summary.rows.filter((row) => row.teamId === bonus.rivalId && row.status === "finished" && row.position);
      const rivalBest = Math.min(99, ...rival.map((row) => row.position));
      return best < rivalBest;
    }
    case "topTenGrid":
      return own.some((row) => row.grid && row.grid <= (bonus.gridTarget || 10));
    default:
      return false;
  }
};

/** Bonuses earned in one race: [{ dealId, name, type, amount }]. */
export const sponsorBonusesFor = (career, summary) => {
  const earned = [];
  activeDeals(career).forEach((deal) => {
    (deal.bonuses || []).forEach((bonus) => {
      if (bonusMet(bonus, summary, career.teamId)) earned.push({ dealId: deal.id, name: deal.name, type: bonus.type, amount: bonus.amount });
    });
  });
  return earned;
};

export const midSeasonOfferCount = data.midSeasonOffers;
