import { locale } from "./i18n";

const allResultsLabel = locale === "es" ? "Todos" : "All";

export const SCORING_SYSTEMS = [
  { id: "1950-1953", years: "1950-1953", points: [8, 6, 4, 3, 2], fastestLap: 1, maxResults: 4, notes: "1, 2" },
  { id: "1954", years: "1954", points: [8, 6, 4, 3, 2], fastestLap: 1, maxResults: 5, notes: "1, 2" },
  { id: "1955-1957", years: "1955-1957", points: [8, 6, 4, 3, 2], fastestLap: 1, maxResults: 5, notes: "1, 3, 4, 5, 6" },
  { id: "1958", years: "1958", points: [8, 6, 4, 3, 2], fastestLap: 1, maxResults: 6, notes: "5, 7, 8" },
  { id: "1959", years: "1959", points: [8, 6, 4, 3, 2], fastestLap: 1, maxResults: 5 },
  { id: "1960", years: "1960", points: [8, 6, 4, 3, 2, 1], fastestLap: 0, maxResults: 6 },
  { id: "1961-1962", years: "1961-1962", points: [9, 6, 4, 3, 2, 1], fastestLap: 0, maxResults: 5 },
  { id: "1963-1964", years: "1963-1964", points: [9, 6, 4, 3, 2, 1], fastestLap: 0, maxResults: 6 },
  { id: "1965", years: "1965", points: [9, 6, 4, 3, 2, 1], fastestLap: 0, maxResults: 6, notes: "9" },
  { id: "1966", years: "1966", points: [9, 6, 4, 3, 2, 1], fastestLap: 0, maxResults: 5, notes: "10, 11" },
  { id: "1967", years: "1967", points: [9, 6, 4, 3, 2, 1], fastestLap: 0, maxResults: 9, segmentLimits: [5, 4], notes: "5+4; 10, 12" },
  { id: "1968", years: "1968", points: [9, 6, 4, 3, 2, 1], fastestLap: 0, maxResults: 10, segmentLimits: [5, 5], notes: "5+5" },
  { id: "1969", years: "1969", points: [9, 6, 4, 3, 2, 1], fastestLap: 0, maxResults: 9, segmentLimits: [5, 4], notes: "5+4; 9, 13" },
  { id: "1970", years: "1970", points: [9, 6, 4, 3, 2, 1], fastestLap: 0, maxResults: 11, segmentLimits: [6, 5], notes: "6+5; 9" },
  { id: "1971", years: "1971", points: [9, 6, 4, 3, 2, 1], fastestLap: 0, maxResults: 9, segmentLimits: [5, 4], notes: "5+4; 9" },
  { id: "1972", years: "1972", points: [9, 6, 4, 3, 2, 1], fastestLap: 0, maxResults: 10, segmentLimits: [5, 5], notes: "5+5; 9" },
  { id: "1973-1974", years: "1973-1974", points: [9, 6, 4, 3, 2, 1], fastestLap: 0, maxResults: 13, segmentLimits: [7, 6], notes: "7+6; 9" },
  { id: "1975", years: "1975", points: [9, 6, 4, 3, 2, 1], fastestLap: 0, maxResults: 12, segmentLimits: [7, 5], notes: "7+5; 9" },
  { id: "1976-1978", years: "1976-1978", points: [9, 6, 4, 3, 2, 1], fastestLap: 0, maxResults: 14, segmentLimits: [7, 7], notes: "7+7; 9" },
  { id: "1979-1980", years: "1979-1980", points: [9, 6, 4, 3, 2, 1], fastestLap: 0, maxResults: 8, segmentLimits: [4, 4], notes: "4+4; 14" },
  { id: "1981-1990", years: "1981-1990", points: [9, 6, 4, 3, 2, 1], fastestLap: 0, maxResults: 11, notes: "14" },
  { id: "1991-2002", years: "1991-2002", points: [10, 6, 4, 3, 2, 1], fastestLap: 0, maxResults: null, notes: "14" },
  { id: "2003-2009", years: "2003-2009", points: [10, 8, 6, 5, 4, 3, 2, 1], fastestLap: 0, maxResults: null },
  { id: "2010-2018", years: "2010-2018", points: [25, 18, 15, 12, 10, 8, 6, 4, 2, 1], fastestLap: 0, maxResults: null, notes: "15" },
  { id: "2019-2024", years: "2019-2024", points: [25, 18, 15, 12, 10, 8, 6, 4, 2, 1], fastestLap: 1, maxResults: null, notes: "16" },
  { id: "2025-", years: "2025-", points: [25, 18, 15, 12, 10, 8, 6, 4, 2, 1], fastestLap: 0, maxResults: null },
];

export const pickScoringSystem = (rng) => SCORING_SYSTEMS[Math.floor(rng() * SCORING_SYSTEMS.length)];

export const describeScoringSystem = (system) => {
  const positions = system.points.map((points, index) => `P${index + 1} ${points}`).join(" · ");
  const fastestLap = system.fastestLap ? ` · VR +${system.fastestLap}` : "";
  const maxResults = system.segmentLimits ? system.segmentLimits.join("+") : system.maxResults || allResultsLabel;
  return `${system.years}: ${positions}${fastestLap} · MRE ${maxResults}`;
};
