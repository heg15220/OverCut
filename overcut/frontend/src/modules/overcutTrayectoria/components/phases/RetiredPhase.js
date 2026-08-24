/**
 * The end.
 *
 * This screen is a plaque, not a dashboard. It is read once, at the moment a
 * career closes, so it is built as a sequence of plates that each answer one
 * question and hand over to the next:
 *
 *   who you were        the closing plate - name, years, and the three numbers
 *                       a driver is actually remembered by
 *   what you were worth the trace - your championship line against your car's
 *   what it looked like the palmares - every race of every year
 *   where it ranks      the record book
 *   who you raced       the rival, laid out facing you
 *   what it meant       the verdict
 *
 * Titles, wins and podiums are given display scale and everything else is a
 * ruled tally, because eight identical tiles say every number weighs the same
 * and they do not. The verdict line stays last on purpose: it is the sentence
 * the player takes away.
 */

import React from "react";
import { Helmet } from "../atoms";
import { CareerStrips } from "../SeasonStrip";
import { CareerTrace } from "../CareerTrace";
import { STAT_ICONS } from "../icons";
import { t } from "../../i18n";

/** Your share of the duels the two of you settled between yourselves. */
const duelShare = ({ player, rival }) => {
  const total = player + rival;
  return (total > 0 ? (player / total) * 100 : 50).toFixed(1);
};

/** A ruled heading: what the plate is, and one true fact about it on the right. */
const PlateHead = ({ label, note }) => (
  <div className="tr-platehead">
    <span className="tr-label">{label}</span>
    {note && <span className="tr-platehead__note">{note}</span>}
  </div>
);

/** One of the three numbers that get said out loud about a driver. */
const Honour = ({ icon: Icon, label, value, lead = false }) => (
  <li className={`tr-honour${lead ? " is-lead" : ""}`}>
    <span className="tr-honour__value">{value}</span>
    <span className="tr-honour__label">
      <Icon />
      {label}
    </span>
  </li>
);

/** Everything else, on one rule. */
const Tally = ({ icon: Icon, label, value }) => (
  <li className="tr-tally__item">
    <span className="tr-tally__value">{value}</span>
    <span className="tr-tally__label">
      <Icon />
      {label}
    </span>
  </li>
);

const LEGEND = ["win", "podium", "points", "plain", "dnf"];

/** The three numbers a rivalry is settled on, laid out facing each other. */
const DUEL_ROWS = [
  { key: "titles", label: () => t.metrics.titles, mine: (totals) => totals.titles, theirs: (rival) => rival.titles },
  { key: "wins", label: () => t.stats.wins, mine: (totals) => totals.wins, theirs: (rival) => rival.wins },
  { key: "podiums", label: () => t.stats.podiums, mine: (totals) => totals.podiums, theirs: (rival) => rival.podiums },
];

export const RetiredPhase = ({ career, seasonsByYear, onRestart }) => {
  const { totals, verdict, records, rivalVerdict } = career;
  const from = career.debutYear;
  const to = career.year - 1;
  const teams = totals.teams?.length || 0;

  return (
    <section className="tr-phase tr-retired">
      <header className="tr-closing">
        <span className="tr-closing__rule" aria-hidden="true" />

        <div className="tr-closing__id">
          <Helmet {...career.driver.helmet} size={78} />
          <div className="tr-closing__name">
            <span className="tr-eyebrow">{t.retiredTitle}</span>
            <h2 className="tr-closing__driver">{career.driver.name}</h2>
            <p className="tr-closing__span">
              {t.retiredLead(from, to)}
              {teams > 0 && <em>{t.teamsCount(teams)}</em>}
            </p>
          </div>
        </div>

        <ol className="tr-honours">
          <Honour icon={STAT_ICONS.titles} label={t.metrics.titles} value={totals.titles} lead={totals.titles > 0} />
          <Honour icon={STAT_ICONS.wins} label={t.stats.wins} value={totals.wins} />
          <Honour icon={STAT_ICONS.podiums} label={t.stats.podiums} value={totals.podiums} />
        </ol>
      </header>

      <ul className="tr-tally">
        <Tally icon={STAT_ICONS.poles} label={t.stats.poles} value={totals.poles} />
        <Tally icon={STAT_ICONS.fastestLaps} label={t.stats.fastestLaps} value={totals.fastestLaps} />
        <Tally icon={STAT_ICONS.starts} label={t.stats.starts} value={totals.starts} />
        <Tally icon={STAT_ICONS.points} label={t.stats.points} value={Math.round(totals.points)} />
        <Tally icon={STAT_ICONS.seasons} label={t.metrics.seasons} value={totals.seasons} />
      </ul>

      {career.history.length > 1 && (
        <div className="tr-plate">
          <PlateHead label={t.traceTitle} note={t.traceNote} />
          <CareerTrace history={career.history} />
        </div>
      )}

      <div className="tr-plate">
        <PlateHead label={t.careerTotals} note={t.legendTitle} />
        <ul className="tr-legend">
          {LEGEND.map((key) => (
            <li className="tr-legend__item" key={key}>
              <span className={`tr-cell tr-cell--${key === "plain" ? "plain" : key}`} aria-hidden="true" />
              {t.legend[key]}
            </li>
          ))}
        </ul>
        <CareerStrips history={career.history} seasonsByYear={seasonsByYear} />
      </div>

      {records && (
        <div className="tr-plate">
          <PlateHead label={t.recordsTitle} note={t.recordsNote} />
          <ul className="tr-records">
            {["titles", "wins", "podiums", "seasons"].map((key) => {
              const entry = records[key];
              if (!entry || entry.value === 0) return null;
              // How far the book still is, drawn against whoever leads it. The
              // rank alone makes you do the arithmetic; the bar does not.
              const top = entry.leader?.value || entry.value || 1;
              const reached = Math.min(100, (entry.value / top) * 100);
              const chasing = entry.next ? Math.min(100, (entry.next.value / top) * 100) : null;

              return (
                <li className={`tr-record${entry.rank === 1 ? " is-first" : ""}`} key={key}>
                  <span className="tr-record__rank">
                    <strong>{entry.rank}</strong>
                  </span>

                  <span className="tr-record__body">
                    <span className="tr-record__metric">{t.recordRank(entry.rank, t.metrics[key])}</span>
                    <span className="tr-record__count">{entry.value}</span>
                  </span>

                  <span className="tr-records__bar" data-testid="record-bar" aria-hidden="true">
                    <span className="tr-records__fill" style={{ width: `${reached.toFixed(1)}%` }} />
                    {chasing !== null && (
                      <span className="tr-records__next" style={{ left: `${chasing.toFixed(1)}%` }} />
                    )}
                  </span>

                  <span className="tr-record__ends">
                    {entry.next ? (
                      <em>
                        {t.recordAhead} · {entry.next.name} {entry.next.value}
                      </em>
                    ) : (
                      <em>{t.recordLeader}</em>
                    )}
                    {entry.leader && entry.leader.value > entry.value && (
                      <em className="tr-record__leader">
                        {entry.leader.name} {entry.leader.value}
                      </em>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {rivalVerdict && (
        <div className="tr-plate tr-rival">
          <PlateHead label={t.rivalTitle} note={t.rivalLead(rivalVerdict.rival.name, rivalVerdict.rival.startYear)} />

          <div className="tr-duelsheet">
            <div className="tr-duelsheet__names">
              <span className="tr-duelsheet__name is-you">{career.driver.name}</span>
              <span className="tr-duelsheet__name">{rivalVerdict.rival.name}</span>
            </div>

            {DUEL_ROWS.map((row) => {
              const mine = row.mine(totals);
              const theirs = row.theirs(rivalVerdict.rival);
              return (
                <div className="tr-duelsheet__row" key={row.key}>
                  <span
                    className={`tr-duelsheet__score${mine >= theirs ? " is-winning" : ""}`}
                    data-testid={`duel-${row.key}-you`}
                  >
                    {mine}
                  </span>
                  <span className="tr-duelsheet__metric">{row.label()}</span>
                  <span
                    className={`tr-duelsheet__score${theirs >= mine ? " is-winning" : ""}`}
                    data-testid={`duel-${row.key}-them`}
                  >
                    {theirs}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Twenty years of finishing ahead of each other, in one bar - the same
              one the team-mate duel uses, because it is the same question. */}
          <div className="tr-rival__duel">
            <span className="tr-rival__duellabel">{t.rivalDuels}</span>
            <div
              className="tr-duel__bar"
              role="img"
              aria-label={t.headToHead(rivalVerdict.headToHead.player, rivalVerdict.headToHead.rival)}
            >
              <span
                className="tr-duel__share"
                data-testid="rival-share"
                style={{ width: `${duelShare(rivalVerdict.headToHead)}%` }}
              />
            </div>
            <p className="tr-rival__hh">
              <span>{rivalVerdict.headToHead.player}</span>
              <span>{rivalVerdict.headToHead.rival}</span>
            </p>
          </div>

          <p className="tr-rival__verdict">{t.rivalVerdicts[rivalVerdict.verdict]}</p>
        </div>
      )}

      <div className="tr-verdict">
        <span className="tr-label">{t.verdictTitle}</span>
        <p className="tr-verdict__text">{t.verdicts[verdict.tier]}</p>
        {verdict.overachiever && <p className="tr-verdict__note">{t.overachiever}</p>}
        {verdict.underachiever && <p className="tr-verdict__note">{t.underachiever}</p>}
      </div>

      <button type="button" className="tr-cta" onClick={onRestart}>
        {t.newCareer}
      </button>
    </section>
  );
};

export default RetiredPhase;
