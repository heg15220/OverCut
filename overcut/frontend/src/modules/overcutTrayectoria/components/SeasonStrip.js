/**
 * The season strip.
 *
 * One cell per Grand Prix of that year's real calendar, in order, showing where
 * the player finished. It is the one thing on screen that has to be readable in
 * half a second, because it is how a Formula 1 season is actually read:
 *
 *   filled gold      a win
 *   gold outline     a podium
 *   bone             points
 *   hollow           finished, no points
 *   slashed          did not finish
 *
 * Stacked one per year, it turns a whole career into a single texture: a run of
 * gold across the middle of the sheet is a peak, a band of hollow cells is the
 * years in a bad car. Nothing else in the game shows that shape.
 *
 * While a season is being simulated the strip fills left to right, which is the
 * loading state - the game never shows a spinner, it shows the season arriving.
 */

import React from "react";
import { Flag, TeamLogo } from "./atoms";
import { localizeRaceName } from "../engine/circuits";
import { locale, t } from "../i18n";

const cellClass = (entry) => {
  if (!entry) return "tr-cell tr-cell--empty";
  if (entry.status && entry.status !== "finished") return "tr-cell tr-cell--dnf";
  if (entry.position === 1) return "tr-cell tr-cell--win";
  if (entry.position <= 3) return "tr-cell tr-cell--podium";
  if (entry.points > 0) return "tr-cell tr-cell--points";
  return "tr-cell tr-cell--plain";
};

const cellLabel = (entry) => {
  if (!entry) return "";
  if (entry.status && entry.status !== "finished") return t.dnf;
  return entry.position;
};

export const SeasonStrip = ({ races = [], revealed = races.length, compact = false, showFlags = true }) => (
  <ol className={`tr-strip${compact ? " tr-strip--compact" : ""}`}>
    {races.map((race, index) => {
      const visible = index < revealed;
      const entry = visible ? race.player : null;
      const name = localizeRaceName(race.name, locale);

      return (
        <li
          key={`${race.round}-${race.name}`}
          className={`tr-strip__item${visible ? " is-in" : ""}`}
          style={{ animationDelay: `${Math.min(index, 24) * 18}ms` }}
        >
          <span className={cellClass(entry)} title={`${name}${entry ? ` · ${cellLabel(entry)}` : ""}`}>
            <span className="tr-cell__value">{visible ? cellLabel(entry) : ""}</span>
            {visible && entry?.pole && <span className="tr-cell__pole" aria-hidden="true" />}
            {visible && entry?.fastestLap && <span className="tr-cell__fl" aria-hidden="true" />}
          </span>
          {showFlags && !compact && (
            <span className="tr-strip__flag">
              <Flag code={race.country} title={name} width={17} />
            </span>
          )}
        </li>
      );
    })}
  </ol>
);

/**
 * The whole career as a stack of strips. Shown on the retirement screen, where
 * the point is the shape of the years rather than any single result.
 */
export const CareerStrips = ({ history = [], seasonsByYear = {} }) => (
  <div className="tr-careerstrips">
    {history.map((season) => (
      <div
        className={`tr-careerstrips__row${season.champion ? " is-champion" : ""}`}
        key={season.year}
        data-testid={`careerstrip-${season.year}`}
      >
        <span className="tr-careerstrips__year">{season.year}</span>
        <span className="tr-careerstrips__team">
          <span className="tr-careerstrips__badge" data-testid="careerstrip-badge">
            <TeamLogo teamName={season.team} size={16} />
          </span>
          <span className="tr-careerstrips__teamname">{season.team}</span>
        </span>
        <SeasonStrip races={seasonsByYear[season.year] || []} compact showFlags={false} />
        {/* The championship position closes the row. A title year gets it on a
            gold ground rather than a letter, so the eye finds the years that
            mattered without reading a key first. */}
        <span className="tr-careerstrips__pos" title={t.stats.position}>
          {season.champion ? <strong className="tr-careerstrips__crown">1</strong> : season.position}
        </span>
      </div>
    ))}
  </div>
);

export default SeasonStrip;
