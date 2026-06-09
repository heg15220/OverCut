import {
  classifyRaceScenario,
  pickDecisiveMoment,
  renderRaceNarrative,
  renderSeasonIntro,
} from "./narratives";
import { strings } from "./i18n";
import { translateGrandPrixName } from "./grandPrixTranslations";

const WEATHER_LABELS = {
  dry: strings.weatherDry,
  mixed: strings.weatherMixed,
  wet: strings.weatherWet,
};

const POINTS = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const hashString = (value) => {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

const createRng = (seedText) => {
  let seed = hashString(seedText) || 1;
  return () => {
    seed += 0x6d2b79f5;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const teamColor = (name, index) => {
  const colors = [
    "#d0182f",
    "#ff8700",
    "#00a19c",
    "#1e5bc6",
    "#0090ff",
    "#641e9b",
    "#006f62",
    "#c8b273",
    "#e8e8e8",
    "#263238",
    "#b71c1c",
  ];
  return colors[(hashString(name) + index) % colors.length];
};

export const buildGrid = (teams, drivers) =>
  teams.map((team, index) => {
    const driverA = drivers[index * 2];
    const driverB = drivers[index * 2 + 1];
    const reliability = clamp(0.68 + team.rating / 330 + ((hashString(team.name) % 9) - 4) / 100, 0.7, 0.96);
    return {
      ...team,
      color: teamColor(team.name, index),
      reliability,
      drivers: [driverA, driverB].filter(Boolean),
    };
  });

const raceProfile = (raceName) => {
  const name = raceName.toLowerCase();
  const profile = {
    power: 0.5,
    street: 0.3,
    tyre: 0.45,
    chaos: 0.32,
    overtaking: 0.48,
  };

  if (name.includes("monaco") || name.includes("singapore") || name.includes("las vegas") || name.includes("azerbaijan")) {
    profile.street += 0.35;
    profile.chaos += 0.15;
    profile.overtaking -= 0.14;
  }
  if (name.includes("italian") || name.includes("monza") || name.includes("belgian") || name.includes("spa") || name.includes("british")) {
    profile.power += 0.28;
    profile.overtaking += 0.1;
  }
  if (name.includes("hungarian") || name.includes("spanish") || name.includes("dutch") || name.includes("emilia")) {
    profile.tyre += 0.24;
    profile.overtaking -= 0.04;
  }
  if (name.includes("brazil") || name.includes("sao paulo") || name.includes("canadian") || name.includes("australian")) {
    profile.chaos += 0.12;
    profile.overtaking += 0.08;
  }

  return {
    power: clamp(profile.power, 0, 1),
    street: clamp(profile.street, 0, 1),
    tyre: clamp(profile.tyre, 0, 1),
    chaos: clamp(profile.chaos, 0, 1),
    overtaking: clamp(profile.overtaking, 0, 1),
  };
};

const raceConditions = (profile, rng) => {
  const wetRoll = rng();
  const weatherCode =
    wetRoll < profile.chaos * 0.16
      ? "wet"
      : wetRoll < profile.chaos * 0.32 + profile.tyre * 0.05
      ? "mixed"
      : "dry";
  const weatherRisk = weatherCode === "wet" ? 0.2 : weatherCode === "mixed" ? 0.1 : 0;
  const degradation = clamp(profile.tyre * 0.72 + rng() * 0.34 + (weatherCode === "dry" ? 0.04 : -0.03), 0.12, 0.96);

  return {
    weatherCode,
    weather: WEATHER_LABELS[weatherCode],
    safetyCar: rng() < clamp(profile.chaos * 0.34 + weatherRisk, 0.08, 0.58),
    degradation,
    trackTemp: Math.round(16 + degradation * 21 + rng() * 10),
  };
};

const chooseStrategy = ({ entrant, standing, leaderBefore, gapBefore, profile, conditions, rng }) => {
  const bias = (hashString(`${entrant.driver.name}-${entrant.team.name}-strategy`) % 100) / 100;
  const chasingLeader = leaderBefore && standing.id !== leaderBefore.id && gapBefore <= 35;

  if (conditions.weatherCode !== "dry" && rng() < 0.34 + profile.chaos * 0.22) {
    return {
      code: "early_inter",
      label: strings.strategyEarlyInter,
      score: 2.2 + profile.chaos * 4 + (bias - 0.45) * 3,
      risk: 0.02,
    };
  }

  if (chasingLeader && rng() < 0.46 + profile.overtaking * 0.16) {
    return {
      code: "undercut",
      label: strings.strategyUndercut,
      score: 1.8 + profile.overtaking * 3.2 + (rng() - 0.44) * 4,
      risk: 0.018,
    };
  }

  if (conditions.degradation > 0.66 && bias > 0.42) {
    return {
      code: "tyre_mgmt",
      label: strings.strategyTyreManagement,
      score: 1.6 + conditions.degradation * 3.1,
      risk: -0.008,
    };
  }

  if (profile.street > 0.5) {
    return {
      code: "track_pos",
      label: strings.strategyTrackPosition,
      score: 1.4 + profile.street * 2.8 + (bias - 0.5) * 2,
      risk: 0.006,
    };
  }

  return {
    code: "pure_pace",
    label: strings.strategyPureRace,
    score: (bias - 0.5) * 2,
    risk: 0,
  };
};

const entrantId = (driver, team) => `${driver.name}__${team.name}`;

const sortStandings = (standings) =>
  [...standings.values()].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (b.podiums !== a.podiums) return b.podiums - a.podiums;
    return a.name.localeCompare(b.name);
  });

const topGap = (standings) => {
  const sorted = sortStandings(standings);
  if (sorted.length < 2) return 0;
  return sorted[0].points - sorted[1].points;
};

const getRecentWinnerStreak = (history, key) => {
  if (!history.length) return 0;
  const last = history[history.length - 1][key];
  let streak = 0;
  for (let i = history.length - 1; i >= 0; i -= 1) {
    if (history[i][key] !== last) break;
    streak += 1;
  }
  return streak;
};

export const simulateChampionship = ({ teams, drivers, races, seasonYear }) => {
  const grid = buildGrid(teams, drivers);
  const seed = `${seasonYear}|${teams.map((team) => team.name).join("|")}|${drivers.map((driver) => driver.name).join("|")}`;
  const rng = createRng(seed);
  const entrants = grid.flatMap((team) =>
    team.drivers.map((driver) => ({
      id: entrantId(driver, team),
      driver,
      team,
      form: 0,
      recentDnfs: 0,
      base: driver.rating * 0.58 + team.rating * 0.42,
    }))
  );

  const driverStandings = new Map(
    entrants.map((entrant) => [
      entrant.id,
      {
        id: entrant.id,
        name: entrant.driver.name,
        team: entrant.team.name,
        color: entrant.team.color,
        helmetColor: entrant.driver.helmetColor,
        points: 0,
        wins: 0,
        podiums: 0,
        dnfs: 0,
      },
    ])
  );
  const constructorStandings = new Map(
    grid.map((team) => [
      team.name,
      {
        id: team.id,
        name: team.name,
        color: team.color,
        points: 0,
        wins: 0,
        podiums: 0,
      },
    ])
  );

  const teamMomentum = new Map(grid.map((team) => [team.name, 0]));
  const history = [];

  const raceResults = races.map((race, raceIndex) => {
    const originalRaceName = race.name;
    const displayRaceName = translateGrandPrixName(originalRaceName);
    const profile = raceProfile(originalRaceName);
    const conditions = raceConditions(profile, rng);
    const standingsBefore = sortStandings(driverStandings);
    const leaderBefore = standingsBefore[0];
    const gapBefore = topGap(driverStandings);
    const previousWinner = history[history.length - 1]?.winner;
    const previousTeamWinner = history[history.length - 1]?.teamWinner;
    const driverStreakBefore = getRecentWinnerStreak(history, "winner");
    const teamStreakBefore = getRecentWinnerStreak(history, "teamWinner");

    const scored = entrants.map((entrant) => {
      const standing = driverStandings.get(entrant.id);
      const teamStanding = constructorStandings.get(entrant.team.name);
      const strategy = chooseStrategy({ entrant, standing, leaderBefore, gapBefore, profile, conditions, rng });
      const pressure =
        leaderBefore?.id === entrant.id && gapBefore > 28
          ? -profile.chaos * (2.5 + rng() * 5)
          : 0;
      const comeback =
        standingsBefore[1]?.id === entrant.id && gapBefore <= 30
          ? 2.5 + profile.overtaking * 4
          : 0;
      const teamTrend = teamMomentum.get(entrant.team.name) || 0;
      const trackFit =
        ((hashString(`${entrant.team.name}-${originalRaceName}`) % 100) / 100 - 0.5) *
        (profile.power * 7 + profile.tyre * 5 + profile.street * 4);
      const baseRank = entrants.filter((other) => other.base > entrant.base).length + 1;
      const weatherSkill =
        ((hashString(`${entrant.driver.name}-wet`) % 100) / 100 - 0.44) *
        (conditions.weatherCode === "wet" ? 10 : conditions.weatherCode === "mixed" ? 5 : 1.5);
      const tyreManagement =
        ((hashString(`${entrant.driver.name}-tyres`) % 100) / 100 - 0.43) * conditions.degradation * 7;
      const safetyCarSwing = conditions.safetyCar ? (rng() - 0.45) * (profile.chaos * 8 + 4) : 0;
      const volatility =
        10 +
        profile.chaos * 16 +
        (conditions.weatherCode !== "dry" ? 6 : 0) +
        (conditions.safetyCar ? 4 : 0) +
        raceIndex * 0.08;
      const randomSwing = (rng() - 0.5) * volatility;
      const reliabilityRisk = clamp(
        0.025 +
          (1 - entrant.team.reliability) * 0.16 +
          profile.chaos * 0.055 +
          (conditions.weatherCode === "wet" ? 0.028 : conditions.weatherCode === "mixed" ? 0.014 : 0) +
          strategy.risk +
          entrant.recentDnfs * 0.012 -
          entrant.driver.rating / 4200,
        0.01,
        0.22
      );
      const dnf = rng() < reliabilityRisk;

      return {
        ...entrant,
        standing,
        teamStanding,
        strategy,
        baseRank,
        score:
          entrant.base +
          entrant.form * 2.6 +
          teamTrend * 1.7 +
          pressure +
          comeback +
          trackFit +
          strategy.score +
          weatherSkill +
          tyreManagement +
          safetyCarSwing +
          randomSwing,
        dnf,
      };
    });

    const classified = scored
      .filter((entry) => !entry.dnf)
      .sort((a, b) => b.score - a.score)
      .map((entry, index) => ({
        ...entry,
        position: index + 1,
        points: POINTS[index] || 0,
        status: "FIN",
        performanceRank: index + 1,
      }));

    const dnfs = scored
      .filter((entry) => entry.dnf)
      .sort((a, b) => b.score - a.score)
      .map((entry, index) => ({
        ...entry,
        position: classified.length + index + 1,
        points: 0,
        status: "DNF",
        performanceRank: classified.length + index + 1,
      }));

    const fullOrder = [...classified, ...dnfs];
    fullOrder.forEach((result) => {
      const standing = driverStandings.get(result.id);
      const constructor = constructorStandings.get(result.team.name);
      const liveEntrant = entrants.find((entrant) => entrant.id === result.id);

      standing.points += result.points;
      constructor.points += result.points;

      if (result.position === 1) {
        standing.wins += 1;
        constructor.wins += 1;
      }
      if (result.position <= 3) {
        standing.podiums += 1;
        constructor.podiums += 1;
      }
      if (result.status === "DNF") {
        standing.dnfs += 1;
        liveEntrant.recentDnfs += 1;
      } else {
        liveEntrant.recentDnfs = 0;
      }

      const formDelta =
        result.status === "DNF"
          ? -1.5
          : result.position === 1
          ? 1.7
          : result.position <= 3
          ? 1.1
          : result.points > 0
          ? 0.45
          : -0.55;
      liveEntrant.form = clamp(liveEntrant.form * 0.72 + formDelta, -4, 4);
      const currentTeamMomentum = teamMomentum.get(result.team.name) || 0;
      teamMomentum.set(result.team.name, clamp(currentTeamMomentum * 0.76 + formDelta / 2, -4, 4));
    });

    const winner = fullOrder[0];
    const podium = fullOrder.slice(0, 3);
    const standingsAfter = sortStandings(driverStandings);
    const constructorStandingsAfter = sortStandings(constructorStandings);
    const leaderAfter = standingsAfter[0];
    const gapAfter = topGap(driverStandings);
    const driverStreak = previousWinner === winner.driver.name ? driverStreakBefore + 1 : 1;
    const teamStreak = previousTeamWinner === winner.team.name ? teamStreakBefore + 1 : 1;

    const scenario = classifyRaceScenario({
      winner,
      podium,
      dnfList: dnfs,
      leaderBefore,
      driverStreak,
      teamStreak,
      gapBefore,
      gapAfter,
      conditions,
      profile,
      previousWinner,
      previousTeamWinner,
    });
    const decisiveMoment = pickDecisiveMoment(scenario, rng);
    const narrative = renderRaceNarrative({
      scenario,
      rng,
      vars: {
        race: displayRaceName,
        winner: winner.driver.name,
        team: winner.team.name,
        second: podium[1]?.driver.name || "",
        third: podium[2]?.driver.name || "",
        leaderAfter: leaderAfter?.name || "",
        gapAfter,
        weather: conditions.weather,
        decisive: decisiveMoment,
        previousWinner: previousWinner || "",
      },
    });

    history.push({
      winner: winner.driver.name,
      teamWinner: winner.team.name,
      tag: narrative.tag,
    });

    return {
      round: race.round || raceIndex + 1,
      name: displayRaceName,
      originalName: originalRaceName,
      circuit: race.circuit,
      locality: race.locality,
      country: race.country,
      profile,
      conditions,
      narrative,
      decisiveMoment,
      winner: {
        driver: winner.driver.name,
        team: winner.team.name,
        color: winner.team.color,
        helmetColor: winner.driver.helmetColor,
        strategy: winner.strategy.label,
        baseRank: winner.baseRank,
      },
      podium: podium.map((result) => ({
        position: result.position,
        driver: result.driver.name,
        team: result.team.name,
        helmetColor: result.driver.helmetColor,
        points: result.points,
      })),
      results: fullOrder.slice(0, 12).map((result) => ({
        position: result.position,
        driver: result.driver.name,
        team: result.team.name,
        helmetColor: result.driver.helmetColor,
        points: result.points,
        status: result.status,
        strategy: result.strategy.label,
      })),
      top10: fullOrder.slice(0, 10).map((result) => ({
        position: result.position,
        driver: result.driver.name,
        team: result.team.name,
        color: result.team.color,
        helmetColor: result.driver.helmetColor,
        points: result.points,
        status: result.status,
      })),
      driverStandingsSnapshot: standingsAfter.slice(0, 10).map((row) => ({
        id: row.id,
        name: row.name,
        team: row.team,
        color: row.color,
        helmetColor: row.helmetColor,
        points: row.points,
        wins: row.wins,
        podiums: row.podiums,
      })),
      constructorStandingsSnapshot: constructorStandingsAfter.slice(0, 11).map((row) => ({
        id: row.id,
        name: row.name,
        color: row.color,
        points: row.points,
        wins: row.wins,
        podiums: row.podiums,
      })),
      scenario,
      dnfs: dnfs.map((result) => result.driver.name),
      leaderAfter: leaderAfter?.name,
      gapAfter,
    };
  });

  const finalDrivers = sortStandings(driverStandings);
  const finalConstructors = sortStandings(constructorStandings);
  const stats = {
    uniqueWinners: new Set(raceResults.map((race) => race.winner.driver)).size,
    comebackWins: raceResults.filter((race) => race.winner.baseRank > 6 || race.narrative.tag === "Sorpresa").length,
    totalDnfs: raceResults.reduce((total, race) => total + race.dnfs.length, 0),
    safetyCars: raceResults.filter((race) => race.conditions.safetyCar).length,
    wetRaces: raceResults.filter((race) => race.conditions.weather !== "Seco").length,
  };

  const intro = renderSeasonIntro({
    year: seasonYear,
    teamCount: grid.length,
    driverCount: entrants.length,
    raceCount: raceResults.length,
    rng,
  });

  return {
    seasonYear,
    intro,
    races: raceResults,
    stats,
    driverStandings: finalDrivers,
    constructorStandings: finalConstructors,
    champion: finalDrivers[0],
    constructorsChampion: finalConstructors[0],
    grid,
  };
};
