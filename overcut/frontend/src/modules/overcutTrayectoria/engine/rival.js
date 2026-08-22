/**
 * The driver you are measured against.
 *
 * Careers are not judged in isolation - they are judged against whoever came up
 * at the same time. So the game picks one, on your debut weekend, from the
 * drivers close to your age on that grid.
 *
 * The important design choice: the rival is not a separate simulation running in
 * a shadow world. They are a real entrant in the same championship you are
 * racing, so their year comes out of the same standings your year comes out of.
 * When they win a title it is because they beat you at Monza in July. Nothing
 * here is scripted; this module only remembers.
 */

import { clamp, substream } from "./rng.js";

/**
 * Pick the rival from the debut season's field.
 *
 * Weighted towards drivers of a similar age - a rivalry needs two careers that
 * run alongside each other - and towards the better ones, because the story only
 * works if they are worth chasing.
 */
export const chooseRival = ({ world, playerAge, teamId, seed }) => {
  const stream = substream(seed, "rival");

  const candidates = [];
  world.teams.forEach((team) => {
    team.drivers.slice(0, 2).forEach((driver) => {
      // Your own team-mate is a different story with its own screen.
      if (team.id === teamId) return;
      candidates.push({ driver, team });
    });
  });

  if (candidates.length === 0) return null;

  const picked = stream.pickWeighted(candidates, ({ driver }) => {
    const ageGap = Math.abs(driver.age - playerAge);
    const closeness = Math.exp(-(ageGap * ageGap) / 24);
    const quality = Math.exp((driver.rating - 62) / 9);
    return closeness * quality;
  });

  if (!picked) return null;

  return {
    name: picked.driver.name,
    id: picked.driver.id,
    startedWith: picked.team.name,
    startYear: world.year,
    seasons: 0,
    points: 0,
    wins: 0,
    podiums: 0,
    poles: 0,
    fastestLaps: 0,
    titles: 0,
    bestPosition: null,
    retiredIn: null,
    lastSeenYear: world.year,
    headToHead: { player: 0, rival: 0 },
  };
};

/**
 * Fold one season into the rival's record.
 *
 * If they are not on the grid any more they have retired, and the game stops
 * looking for them - but their totals stay, because a career you were compared
 * to does not stop counting when it ends.
 */
export const updateRival = ({ rival, season }) => {
  if (!rival || rival.retiredIn) return rival;

  const row = season.standings.find((entry) => entry.driver === rival.name);
  if (!row) {
    return { ...rival, retiredIn: season.year };
  }

  const playerRow = season.standings.find((entry) => entry.isPlayer);
  const headToHead = { ...rival.headToHead };
  if (playerRow) {
    if (playerRow.position < row.position) headToHead.player += 1;
    else headToHead.rival += 1;
  }

  return {
    ...rival,
    seasons: rival.seasons + 1,
    points: rival.points + row.points,
    wins: rival.wins + row.wins,
    podiums: rival.podiums + row.podiums,
    poles: rival.poles + row.poles,
    fastestLaps: rival.fastestLaps + row.fastestLaps,
    titles: rival.titles + (row.position === 1 ? 1 : 0),
    bestPosition:
      rival.bestPosition === null ? row.position : Math.min(rival.bestPosition, row.position),
    lastSeenYear: season.year,
    headToHead,
  };
};

/**
 * The comparison the retirement screen prints.
 *
 * `verdict` is deliberately blunt - it is the sentence the player will remember
 * about a career they just spent an hour on.
 */
export const rivalComparison = ({ rival, totals }) => {
  if (!rival) return null;

  const score = (entry) => entry.titles * 100 + entry.wins * 8 + entry.podiums * 3;
  const playerScore = score(totals);
  const rivalScore = score(rival);

  const margin = playerScore - rivalScore;
  const verdict =
    margin > 60 ? "eclipsed" : margin > 12 ? "ahead" : margin >= -12 ? "even" : margin >= -60 ? "behind" : "overshadowed";

  return {
    rival,
    playerScore,
    rivalScore,
    verdict,
    headToHead: rival.headToHead,
    seasonsShared: clamp(rival.seasons, 0, 40),
  };
};
