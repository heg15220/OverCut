/**
 * Glyphs for the season screen.
 *
 * Drawn rather than imported: eight shapes at fourteen pixels do not justify a
 * dependency, and an inline stroke inherits `currentColor`, which is what lets a
 * tile turn its number and its glyph gold together.
 *
 * They are built the way a timing screen is - straight strokes, right angles,
 * no fills and no rounded corners - because that is the language the rest of
 * this game is drawn in. Detail is the enemy at this size: every shape here is
 * the fewest lines that still reads as itself.
 */

import React from "react";

const Glyph = ({ testId, children }) => (
  <svg
    className="tr-glyph"
    data-testid={testId}
    viewBox="0 0 16 16"
    width="14"
    height="14"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.4"
    aria-hidden="true"
    focusable="false"
  >
    {children}
  </svg>
);

/** Championship position: a medal on its ribbon. */
const Position = () => (
  <Glyph testId="stat-icon-position">
    <path d="M5 1.5 7 6M11 1.5 9 6" />
    <circle cx="8" cy="10.5" r="4" />
  </Glyph>
);

/** Races started: the chequered flag. */
const Starts = () => (
  <Glyph testId="stat-icon-starts">
    <path d="M3 1.5v13" />
    <path d="M3 2.5h10v7H3z" />
    <path d="M3 6h5V2.5M8 9.5V6h5" />
  </Glyph>
);

/** Wins: the trophy. */
const Wins = () => (
  <Glyph testId="stat-icon-wins">
    <path d="M4.5 1.5h7v4a3.5 3.5 0 0 1-7 0z" />
    <path d="M4.5 2.5h-2v1a2 2 0 0 0 2 2M11.5 2.5h2v1a2 2 0 0 1-2 2" />
    <path d="M8 9v3M5.5 14.5h5" />
  </Glyph>
);

/** Podiums: the three steps, second and third either side of the win. */
const Podiums = () => (
  <Glyph testId="stat-icon-podiums">
    <path d="M6 5.5h4v9H6zM1.5 8.5H6v6H1.5zM10 10.5h4.5v4H10z" />
  </Glyph>
);

/** Points: the tally that decides everything. */
const Points = () => (
  <Glyph testId="stat-icon-points">
    <path d="M8 1.5 9.9 5.9l4.6.4-3.5 3.1 1 4.6L8 11.6l-4 2.4 1-4.6L1.5 6.3l4.6-.4z" />
  </Glyph>
);

/** Poles: the lights above the grid. */
const Poles = () => (
  <Glyph testId="stat-icon-poles">
    <path d="M1.5 3.5h13v6h-13z" />
    <path d="M4.5 6.5h.01M8 6.5h.01M11.5 6.5h.01" strokeWidth="2.2" strokeLinecap="round" />
    <path d="M8 9.5v5" />
  </Glyph>
);

/** Fastest laps: the stopwatch. */
const FastestLaps = () => (
  <Glyph testId="stat-icon-fastestLaps">
    <circle cx="8" cy="9.5" r="5" />
    <path d="M8 9.5V6.5M6.5 1.5h3M8 1.5v2" />
  </Glyph>
);

/** Retirements: the lap you did not finish. */
const Retirements = () => (
  <Glyph testId="stat-icon-retirements">
    <circle cx="8" cy="8" r="6.5" />
    <path d="M3.4 3.4l9.2 9.2" />
  </Glyph>
);

/** Championships: the laurel, not the trophy - a title is not a Sunday. */
const Titles = () => (
  <Glyph testId="stat-icon-titles">
    <path d="M6 14.2C3 12.9 1.8 9.6 2.6 6.2 5.6 7.5 6.8 10.8 6 14.2z" />
    <path d="M10 14.2c3-1.3 4.2-4.6 3.4-8-3 1.3-4.2 4.6-3.4 8z" />
    <path d="M8 14.5v-4" />
  </Glyph>
);

/** Seasons: the years themselves. */
const Seasons = () => (
  <Glyph testId="stat-icon-seasons">
    <path d="M1.5 3.5h13v11h-13zM1.5 6.5h13M5 1.5v3M11 1.5v3" />
    <path d="M4.5 9.5h2M4.5 12h2M9.5 9.5h2M9.5 12h2" />
  </Glyph>
);

export const STAT_ICONS = {
  titles: Titles,
  seasons: Seasons,
  position: Position,
  starts: Starts,
  wins: Wins,
  podiums: Podiums,
  points: Points,
  poles: Poles,
  fastestLaps: FastestLaps,
  retirements: Retirements,
};


// ---------------------------------------------------------------- the table

/** More money: a note. */
const Salary = () => (
  <Glyph testId="ask-icon-salary">
    <path d="M1.5 4h13v8h-13z" />
    <circle cx="8" cy="8" r="2" />
  </Glyph>
);

/** One more year: the calendar gains a season. */
const Length = () => (
  <Glyph testId="ask-icon-length">
    <path d="M1.5 3.5h13v11h-13zM1.5 6.5h13M5 1.5v3M11 1.5v3" />
    <path d="M8 9v3.5M6.25 10.75h3.5" />
  </Glyph>
);

/** One year less: the same calendar, one season shorter. */
const Shorten = () => (
  <Glyph testId="ask-icon-shorten">
    <path d="M1.5 3.5h13v11h-13zM1.5 6.5h13M5 1.5v3M11 1.5v3" />
    <path d="M6.25 10.75h3.5" />
  </Glyph>
);

/** Number one status: the top of the pecking order, not the top of the table. */
const LeadStatus = () => (
  <Glyph testId="ask-icon-leadStatus">
    <path d="M2 5.5h12M4 10.5h8" />
    <path d="M8 1.5v2" />
    <circle cx="8" cy="5.5" r="1.6" />
  </Glyph>
);

/** Release clause: the way out of the building. */
const ReleaseClause = () => (
  <Glyph testId="ask-icon-releaseClause">
    <path d="M9 1.5H2.5v13H9" />
    <path d="M6 8h8M11 5l3 3-3 3" />
  </Glyph>
);

/** Priority on development: the spanner, and who gets it first. */
const Development = () => (
  <Glyph testId="ask-icon-development">
    <path d="M10.2 1.9a3.4 3.4 0 0 0 3.9 5.3l-8 8-2.2-2.2 8-8a3.4 3.4 0 0 0-1.7-3.1z" />
  </Glyph>
);

// -------------------------------------------------------------- the winter

/** One flying lap. */
const Qualifying = () => (
  <Glyph testId="focus-icon-qualifying">
    <circle cx="8" cy="9.5" r="5" />
    <path d="M8 9.5V6.5M6.5 1.5h3M8 1.5v2" />
  </Glyph>
);

/** Wheel to wheel. */
const Racecraft = () => (
  <Glyph testId="focus-icon-racecraft">
    <path d="M1.5 4.5h6l1.5 3-1.5 3h-6z" />
    <path d="M9.5 4.5h5l-1.5 3 1.5 3h-5" />
  </Glyph>
);

/** Week after week, the same lap. */
const Consistency = () => (
  <Glyph testId="focus-icon-consistency">
    <path d="M1.5 8h13" />
    <path d="M4 5.5v5M8 5.5v5M12 5.5v5" />
  </Glyph>
);

/** The factory. */
const Technical = () => (
  <Glyph testId="focus-icon-technical">
    <path d="M10.2 1.9a3.4 3.4 0 0 0 3.9 5.3l-8 8-2.2-2.2 8-8a3.4 3.4 0 0 0-1.7-3.1z" />
  </Glyph>
);

/** The factory is not listening yet. */
export const Locked = () => (
  <Glyph testId="focus-locked">
    <path d="M3 7.5h10v7H3zM5.5 7.5V5a2.5 2.5 0 0 1 5 0v2.5" />
  </Glyph>
);

// -------------------------------------------------------- away from the track

/** Inside the garage. */
const Garage = () => (
  <Glyph testId="event-icon-garage">
    <path d="M1.5 6 8 2l6.5 4v8.5h-13z" />
    <path d="M4.5 9.5h7M4.5 12h7" />
  </Glyph>
);

/** The market: two seats changing hands. */
const Market = () => (
  <Glyph testId="event-icon-market">
    <path d="M2 4.5h9M8.5 2l2.5 2.5L8.5 7" />
    <path d="M14 11.5H5M7.5 9 5 11.5 7.5 14" />
  </Glyph>
);

/** Your own life, which the calendar does not care about. */
const Personal = () => (
  <Glyph testId="event-icon-personal">
    <circle cx="8" cy="5" r="3" />
    <path d="M2 14.5a6 6 0 0 1 12 0" />
  </Glyph>
);

/** Somebody you are measured against. */
const Rivalry = () => (
  <Glyph testId="event-icon-rivalry">
    <path d="M2 2.5 7 8l-5 5.5" />
    <path d="M14 2.5 9 8l5 5.5" />
  </Glyph>
);

export const ASK_ICONS = {
  salary: Salary,
  length: Length,
  shorten: Shorten,
  leadStatus: LeadStatus,
  releaseClause: ReleaseClause,
  development: Development,
};

export const FOCUS_ICONS = {
  qualifying: Qualifying,
  racecraft: Racecraft,
  consistency: Consistency,
  technical: Technical,
};

export const EVENT_ICONS = {
  garage: Garage,
  market: Market,
  personal: Personal,
  rivalry: Rivalry,
};
