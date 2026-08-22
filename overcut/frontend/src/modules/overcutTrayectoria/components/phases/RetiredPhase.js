/**
 * The end.
 *
 * Three things, in the order they matter: the shape of the career (every season
 * as a strip, stacked), where the totals sit in the real all-time lists, and the
 * rival you were measured against for twenty years.
 *
 * The verdict line is last on purpose. It is the sentence the player takes away.
 */

import React from "react";
import { Helmet, StatTile } from "../atoms";
import { CareerStrips } from "../SeasonStrip";
import { STAT_ICONS } from "../icons";
import { t } from "../../i18n";

/** Your share of the duels the two of you settled between yourselves. */
const duelShare = ({ player, rival }) => {
  const total = player + rival;
  return (total > 0 ? (player / total) * 100 : 50).toFixed(1);
};

export const RetiredPhase = ({ career, seasonsByYear, onRestart }) => {
  const { totals, verdict, records, rivalVerdict } = career;
  const from = career.debutYear;
  const to = career.year - 1;

  return (
    <section className="tr-phase tr-retired">
      <header className="tr-phase__head tr-phase__head--retired">
        <Helmet {...career.driver.helmet} size={72} />
        <div>
          <span className="tr-eyebrow">{t.retiredTitle}</span>
          <h2 className="tr-phase__title">{career.driver.name}</h2>
          <p className="tr-phase__lead">{t.retiredLead(from, to)}</p>
        </div>
      </header>

      <div className="tr-statgrid tr-statgrid--totals">
        <StatTile icon={STAT_ICONS.titles} label={t.metrics.titles} value={totals.titles} accent={totals.titles > 0} />
        <StatTile icon={STAT_ICONS.wins} label={t.stats.wins} value={totals.wins} />
        <StatTile icon={STAT_ICONS.podiums} label={t.stats.podiums} value={totals.podiums} />
        <StatTile icon={STAT_ICONS.poles} label={t.stats.poles} value={totals.poles} />
        <StatTile icon={STAT_ICONS.fastestLaps} label={t.stats.fastestLaps} value={totals.fastestLaps} />
        <StatTile icon={STAT_ICONS.starts} label={t.stats.starts} value={totals.starts} />
        <StatTile icon={STAT_ICONS.points} label={t.stats.points} value={Math.round(totals.points)} />
        <StatTile icon={STAT_ICONS.seasons} label={t.metrics.seasons} value={totals.seasons} />
      </div>

      <div className="tr-block">
        <span className="tr-label">{t.careerTotals}</span>
        <CareerStrips history={career.history} seasonsByYear={seasonsByYear} />
      </div>

      {records && (
        <div className="tr-block">
          <span className="tr-label">{t.recordsTitle}</span>
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
                <li key={key}>
                  <strong>{entry.rank}</strong>
                  <span>{t.recordRank(entry.rank, t.metrics[key])}</span>
                  <span className="tr-records__bar" data-testid="record-bar" aria-hidden="true">
                    <span className="tr-records__fill" style={{ width: `${reached.toFixed(1)}%` }} />
                    {chasing !== null && (
                      <span className="tr-records__next" style={{ left: `${chasing.toFixed(1)}%` }} />
                    )}
                  </span>
                  {entry.next && (
                    <em>
                      {entry.next.name} · {entry.next.value}
                    </em>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {rivalVerdict && (
        <div className="tr-block tr-rival">
          <span className="tr-label">{t.rivalTitle}</span>
          <p className="tr-rival__lead">{t.rivalLead(rivalVerdict.rival.name, rivalVerdict.rival.startYear)}</p>
          <div className="tr-rival__scores">
            <span>
              <em>{career.driver.name}</em>
              {totals.titles} · {totals.wins} · {totals.podiums}
            </span>
            <span>
              <em>{rivalVerdict.rival.name}</em>
              {rivalVerdict.rival.titles} · {rivalVerdict.rival.wins} · {rivalVerdict.rival.podiums}
            </span>
          </div>

          {/* Twenty years of finishing ahead of each other, in one bar - the same
              one the team-mate duel uses, because it is the same question. */}
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
            {t.headToHead(rivalVerdict.headToHead.player, rivalVerdict.headToHead.rival)}
          </p>
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
