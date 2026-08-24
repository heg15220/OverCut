/**
 * The season, told back to the player.
 *
 * The whole year has already been raced by the time this mounts, so the reveal
 * is presentation rather than progress - but it is the presentation that makes a
 * simulated season feel raced. The strip fills a race at a time, the totals count
 * up behind it, and only then does the screen settle into the tables.
 *
 * Winning the championship interrupts all of that with the one moment the game
 * builds to.
 */

import React, { useEffect, useMemo, useState } from "react";
import { Flag, StatTile, TeamLogo } from "../atoms";
import { Trophy } from "../Trophy";
import { SeasonStrip } from "../SeasonStrip";
import { STAT_ICONS } from "../icons";
import { localizeRaceName } from "../../engine/circuits";
import { locale, t } from "../../i18n";

const REVEAL_INTERVAL = 62;

/** The celebration runs the year past faster than you raced it. */
const CHAMPION_INTERVAL = 32;

/** A driver's points as a share of the leader's, for the bar behind their row. */
const leaderShare = (points, standings) => {
  const leader = standings[0]?.points ?? 0;
  const share = leader > 0 ? Math.max(0, (points / leader) * 100) : 0;
  return share.toFixed(1);
};

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const SeasonPhase = ({ career, onContinue }) => {
  const season = career.lastSeason;
  const stats = season?.player;
  const raceCount = season?.races.length ?? 0;

  const [revealed, setRevealed] = useState(() => (prefersReducedMotion() ? raceCount : 0));
  const [celebrated, setCelebrated] = useState(false);
  // The celebration replays the year rather than announcing it, so it needs its
  // own counter: the strip behind it has already finished filling by then.
  const [championReveal, setChampionReveal] = useState(() => (prefersReducedMotion() ? raceCount : 0));

  useEffect(() => {
    if (revealed >= raceCount) return undefined;
    const timer = setTimeout(() => setRevealed((value) => value + 1), REVEAL_INTERVAL);
    return () => clearTimeout(timer);
  }, [revealed, raceCount]);

  const done = revealed >= raceCount;
  const showChampion = done && stats?.champion && !celebrated;

  useEffect(() => {
    if (!showChampion || championReveal >= raceCount) return undefined;
    const timer = setTimeout(() => setChampionReveal((value) => value + 1), CHAMPION_INTERVAL);
    return () => clearTimeout(timer);
  }, [showChampion, championReveal, raceCount]);

  const championWins = useMemo(
    () =>
      (season?.races || [])
        .slice(0, championReveal)
        .filter((race) => race.player?.status === "finished" && race.player.position === 1).length,
    [season, championReveal],
  );

  // Where the car sits this year against where it sat last, but only while it is
  // the same team: after a transfer the comparison would be between two cars the
  // player had nothing to do with.
  const carStanding = useMemo(() => {
    const history = career.history || [];
    const current = history[history.length - 1];
    const previous = history[history.length - 2];
    if (!current || !previous || previous.teamId !== current.teamId) return null;
    return { now: current.carRank, before: previous.carRank };
  }, [career.history]);

  // The tallies climb with the strip, so the numbers arrive as the races do.
  const running = useMemo(() => {
    const slice = (season?.races || []).slice(0, revealed);
    return slice.reduce(
      (totals, race) => {
        const entry = race.player;
        if (!entry) return totals;
        if (entry.status === "finished") {
          if (entry.position === 1) totals.wins += 1;
          if (entry.position <= 3) totals.podiums += 1;
        } else {
          totals.retirements += 1;
        }
        if (entry.pole) totals.poles += 1;
        if (entry.fastestLap) totals.fastestLaps += 1;
        totals.points += entry.points;
        totals.starts += 1;
        return totals;
      },
      { wins: 0, podiums: 0, points: 0, poles: 0, fastestLaps: 0, retirements: 0, starts: 0 },
    );
  }, [season, revealed]);

  if (!season || !stats) return null;

  if (showChampion) {
    return (
      <div className="tr-champion" role="dialog" aria-label={t.worldChampion}>
        <span className="tr-champion__rule" aria-hidden="true" />

        {/* The year, run past again at speed. A championship is not a number you
            are handed; it is twenty Sundays, and this is the only screen with
            room to show them. The name lands after them, not before. */}
        <div className="tr-champion__inner">
          <div className="tr-champion__season">
            <SeasonStrip races={season.races} revealed={championReveal} showFlags={false} />
          </div>

          <span className="tr-champion__tally">
            <em data-testid="champion-wins">{championWins}</em>
            {t.stats.wins}
          </span>

          {/* The object of the moment. The player's helmet is on the read-out
              above this screen and on the retirement plate; what a champion
              actually collects is this. */}
          <span className="tr-champion__trophy" data-testid="champion-trophy">
            <Trophy size={172} title={t.worldChampion} />
          </span>
          <span className="tr-champion__eyebrow">{t.worldChampion}</span>
          <p className="tr-champion__driver">{career.driver.name}</p>
          <p className="tr-champion__sub">{t.championSubtitle(season.year, stats.team)}</p>

          <button type="button" className="tr-cta" onClick={() => setCelebrated(true)}>
            {t.continue}
          </button>
        </div>
      </div>
    );
  }

  return (
    <section className="tr-phase tr-season">
      <header className="tr-phase__head">
        <h2 className="tr-phase__title">{t.seasonTitle(season.year)}</h2>
        <p className="tr-phase__lead">{done ? t.yourSeason : t.simulating}</p>
      </header>

      {/* The winter was settled before the first race, so it is the first thing
          the year has to say for itself - and it is said in the only terms that
          are true. The gain is measured against the car the team would otherwise
          have built, not against last year's: a season's natural swing is more
          than twice the size of an upgrade, so a real step forward routinely
          arrives in a car that is further down the grid than the one before it.
          The standing line is there so that never reads as a contradiction. */}
      {career.upgrade?.chance > 0 && (
        <p className={`tr-alert${career.upgrade.granted ? " tr-alert--good" : ""}`}>
          {career.upgrade.granted
            ? t.upgradeGranted(career.contract.teamName, Math.round(career.upgrade.gain * 100))
            : t.upgradeMissed}
          {carStanding && ` ${t.upgradeCarStanding(carStanding.now, carStanding.before)}`}
        </p>
      )}

      <SeasonStrip races={season.races} revealed={revealed} />

      <div className="tr-statgrid">
        <StatTile icon={STAT_ICONS.position} label={t.stats.position} value={done ? stats.position : "—"} accent />
        <StatTile icon={STAT_ICONS.starts} label={t.stats.starts} value={running.starts} />
        <StatTile icon={STAT_ICONS.wins} label={t.stats.wins} value={running.wins} accent={running.wins > 0} />
        <StatTile icon={STAT_ICONS.podiums} label={t.stats.podiums} value={running.podiums} />
        <StatTile icon={STAT_ICONS.points} label={t.stats.points} value={Math.round(running.points)} />
        <StatTile icon={STAT_ICONS.poles} label={t.stats.poles} value={running.poles} />
        <StatTile icon={STAT_ICONS.fastestLaps} label={t.stats.fastestLaps} value={running.fastestLaps} />
        <StatTile icon={STAT_ICONS.retirements} label={t.stats.retirements} value={running.retirements} />
      </div>

      {done && stats.droppedPoints > 0 && (
        <p className="tr-hint tr-hint--rule">
          {t.droppedPoints(stats.droppedPoints, season.countingRounds)}
        </p>
      )}

      {done && (
        <>
          {season.teammate && (() => {
            // One bar, split where the season split it. Two numbers with a verdict
            // between them made you do the arithmetic; a bar hands you the answer
            // before you have read a word.
            const mine = Math.round(stats.points);
            const theirs = Math.round(season.teammate.points);
            const total = mine + theirs;
            const share = total > 0 ? (mine / total) * 100 : 50;
            const ahead = stats.points >= season.teammate.points;

            return (
              <div className="tr-duel">
                <span className="tr-duel__title">{t.teammateDuel}</span>

                <div className="tr-duel__ends">
                  <span className="tr-duel__end">
                    <strong>{career.driver.name}</strong>
                    <em>{mine}</em>
                  </span>
                  <span className="tr-duel__end tr-duel__end--them">
                    <em>{theirs}</em>
                    <strong>{season.teammate.driver}</strong>
                  </span>
                </div>

                <div
                  className="tr-duel__bar"
                  role="img"
                  aria-label={t.duelLabel(career.driver.name, mine, season.teammate.driver, theirs)}
                >
                  <span
                    className="tr-duel__share"
                    data-testid="duel-share"
                    style={{ width: `${share.toFixed(1)}%` }}
                  />
                </div>

                <span className={`tr-duel__verdict${ahead ? " is-good" : ""}`}>
                  {ahead ? t.teammateBehind : t.teammateAhead}
                </span>
              </div>
            );
          })()}

          <div className="tr-tables">
            <div className="tr-table tr-table--drivers">
              <h3>{t.championsTable}</h3>
              <ol>
                {season.standings.slice(0, 10).map((row) => (
                  <li key={row.entrantId} className={row.isPlayer ? "is-player" : ""}>
                    {/* The gap to the leader, drawn. A column of numbers cannot
                        tell you whether the year was a walkover or a fight. */}
                    <span
                      className="tr-table__bar"
                      aria-hidden="true"
                      style={{ width: `${leaderShare(row.points, season.standings)}%` }}
                    />
                    <span className="tr-table__pos">{row.position}</span>
                    <span className="tr-table__name">{row.isPlayer ? career.driver.name : row.driver}</span>
                    <span className="tr-table__team">
                      <span className="tr-table__badge" data-testid="standings-badge">
                        <TeamLogo teamName={row.team} size={18} />
                      </span>
                      <span className="tr-table__teamname">{row.team}</span>
                    </span>
                    <span className="tr-table__pts">{Math.round(row.points)}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="tr-table tr-table--constructors">
              <h3>{t.constructorsTable}</h3>
              <ol>
                {season.constructorStandings.slice(0, 10).map((row) => (
                  <li key={row.teamId} className={row.teamId === stats.teamId ? "is-player" : ""}>
                    <span className="tr-table__pos">{row.position}</span>
                    <span className="tr-table__name">
                      <TeamLogo teamName={row.team} size={32} />
                      <span className="tr-table__teamname">{row.team}</span>
                    </span>
                    <span className="tr-table__pts">{Math.round(row.points)}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <div className="tr-table tr-table--calendar">
            <h3>{t.calendar}</h3>
            <ol>
              {season.races.map((race) => (
                <li key={`${race.round}-${race.name}`}>
                  <span className="tr-table__pos">{race.round}</span>
                  <span className="tr-table__name">
                    <Flag code={race.country} width={20} />
                    {localizeRaceName(race.name, locale)}
                  </span>
                  <span className="tr-table__weather">{t.weather[race.weather]}</span>
                  <span className="tr-table__team">{race.winner}</span>
                  <span className={`tr-table__pts${race.player?.status !== "finished" ? " is-dnf" : ""}`}>
                    {race.player ? (race.player.status === "finished" ? race.player.position : t.dnf) : "—"}
                  </span>
                </li>
              ))}
            </ol>
          </div>

          <button type="button" className="tr-cta" onClick={onContinue}>
            {t.continue}
          </button>
        </>
      )}
    </section>
  );
};

export default SeasonPhase;
