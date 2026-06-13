const TEAM_DECADE_RATINGS = {
  "1950s": {
    "alfa romeo": 91,
    ferrari: 92,
    maserati: 84,
    mercedes: 96,
    vanwall: 86,
    cooper: 78,
    lotus: 62,
    brm: 63,
  },
  "1960s": {
    ferrari: 89,
    lotus: 94,
    cooper: 84,
    brabham: 90,
    brm: 88,
    mclaren: 66,
    honda: 73,
    matra: 82,
  },
  "1970s": {
    ferrari: 93,
    lotus: 90,
    mclaren: 91,
    tyrrell: 88,
    brabham: 85,
    williams: 79,
    ligier: 77,
    renault: 73,
    shadow: 69,
    march: 68,
  },
  "1980s": {
    mclaren: 98,
    williams: 94,
    ferrari: 88,
    lotus: 82,
    brabham: 82,
    renault: 81,
    benetton: 75,
    ligier: 70,
    arrows: 67,
    minardi: 60,
  },
  "1990s": {
    williams: 97,
    mclaren: 91,
    ferrari: 90,
    benetton: 92,
    jordan: 76,
    sauber: 70,
    tyrrell: 65,
    arrows: 62,
    minardi: 58,
    stewart: 74,
    bar: 64,
    prost: 63,
  },
  "2000s": {
    ferrari: 97,
    renault: 91,
    mclaren: 90,
    williams: 78,
    "red bull": 77,
    mercedes: 72,
    "bmw sauber": 78,
    toyota: 74,
    brawn: 94,
    "force india": 68,
    "toro rosso": 64,
    sauber: 67,
    bar: 72,
  },
  "2010s": {
    mercedes: 99,
    "red bull": 95,
    ferrari: 90,
    mclaren: 74,
    renault: 73,
    "force india": 78,
    "racing point": 76,
    "toro rosso": 69,
    williams: 70,
    sauber: 64,
    "haas f1 team": 67,
    lotus: 73,
    alpine: 70,
  },
  "2020s": {
    "red bull": 98,
    mercedes: 89,
    ferrari: 88,
    mclaren: 87,
    "aston martin": 78,
    alpine: 73,
    williams: 66,
    "haas f1 team": 64,
    sauber: 62,
    "racing bulls": 67,
    "toro rosso": 65,
    "force india": 62,
    "racing point": 75,
    audi: 68,
    cadillac: 66,
  },
};

const TEAM_ALIASES = {
  "alfa romeo racing": "alfa romeo",
  "alphatauri": "toro rosso",
  "rb": "racing bulls",
  "racing bulls rb": "racing bulls",
  "haas": "haas f1 team",
  "bmw": "bmw sauber",
  "mercedes-amg": "mercedes",
};

const clampRating = (rating) => Math.max(55, Math.min(99, Math.round(rating)));

const normalizeTeamName = (name = "") =>
  name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\bf1\b/gi, "f1")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

const teamKey = (name) => {
  const normalized = normalizeTeamName(name);
  return TEAM_ALIASES[normalized] || normalized;
};

const decadeIndex = (decade) => Number(String(decade || "").slice(0, 4)) || 2000;

const heuristicEraAdjustment = (team, decade) => {
  const activeFirstYear = Number(team.firstYear) || decadeIndex(decade);
  const activeLastYear = Number(team.lastYear) || activeFirstYear;
  const decadeStart = decadeIndex(decade);
  const decadeEnd = decadeStart + 9;
  const overlapStart = Math.max(activeFirstYear, decadeStart);
  const overlapEnd = Math.min(activeLastYear, decadeEnd);
  const yearsInDecade = Math.max(1, overlapEnd - overlapStart + 1);
  const base = Number(team.rating) || 68;
  const experience = Math.min(7, yearsInDecade * 0.85);
  const shortSpellPenalty = yearsInDecade <= 2 ? 4 : yearsInDecade <= 4 ? 2 : 0;
  const pioneerEraBoost = decadeStart <= 1960 && activeFirstYear <= decadeStart + 2 ? 3 : 0;
  const modernEntrantPenalty = decadeStart >= 2010 && yearsInDecade <= 3 ? 3 : 0;

  return clampRating(base + experience + pioneerEraBoost - shortSpellPenalty - modernEntrantPenalty - 4);
};

export const getTeamDecadeRating = (team, decade) => {
  const key = teamKey(team?.name);
  const explicitRating = TEAM_DECADE_RATINGS[decade]?.[key];
  if (Number.isFinite(explicitRating)) {
    return explicitRating;
  }
  return heuristicEraAdjustment(team, decade);
};

export const applyTeamDecadeRatings = (teamsByDecade = {}) =>
  Object.entries(teamsByDecade).reduce((acc, [decade, teams]) => {
    acc[decade] = (teams || [])
      .map((team) => ({
        ...team,
        rating: getTeamDecadeRating(team, decade),
        baseRating: team.rating,
      }))
      .sort((a, b) => b.rating - a.rating || a.name.localeCompare(b.name));
    return acc;
  }, {});
