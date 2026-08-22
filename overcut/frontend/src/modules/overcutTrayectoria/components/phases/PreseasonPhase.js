/**
 * The winter.
 *
 * One choice, four options, each a real trade-off. The screen also shows the
 * team and the calendar you are about to race, because the focus that is right
 * for twenty-two rounds on modern circuits is not the one that is right for
 * eight rounds in 1955.
 */

import React from "react";
import { Flag, TeamLogo } from "../atoms";
import { PRESEASON_FOCUS } from "../../engine/attributes";
import { upgradeChanceFor } from "../../engine/upgrade";
import { FOCUS_ICONS, Locked } from "../icons";
import { localizeRaceName } from "../../engine/circuits";
import { locale, t } from "../../i18n";

const FOCUS_LIST = [
  PRESEASON_FOCUS.QUALIFYING,
  PRESEASON_FOCUS.RACECRAFT,
  PRESEASON_FOCUS.CONSISTENCY,
  PRESEASON_FOCUS.TECHNICAL,
];

export const PreseasonPhase = ({ career, world, onFocus, onRun }) => {
  // Shown before the choice rather than after it, for the same reason the
  // negotiation shows its odds: four winters are only a decision if you can see
  // what you are choosing between.
  const upgradeChance = upgradeChanceFor({ career });

  return (
  <section className="tr-phase tr-preseason">
    <header className="tr-phase__head">
      <h2 className="tr-phase__title">{t.preseasonTitle(career.year)}</h2>
      <p className="tr-phase__lead">{t.preseasonLead}</p>
    </header>

    <div className="tr-teamline">
      <TeamLogo teamName={career.contract.teamName} size={44} />
      <div>
        <strong>{career.contract.teamName}</strong>
        <span>
          {t.objectives[career.contract.objective]} · {t.status[career.contract.status]}
        </span>
      </div>
      {world.generated && <span className="tr-tag tr-tag--warn">{t.generatedSeason}</span>}
    </div>

    <div className="tr-cards tr-cards--four">
      {FOCUS_LIST.map((focus) => (
        <button
          type="button"
          key={focus}
          className={`tr-optioncard${career.focus === focus ? " is-on" : ""}`}
          onClick={() => onFocus(focus)}
          aria-pressed={career.focus === focus}
        >
          <strong>
            {FOCUS_ICONS[focus] && React.createElement(FOCUS_ICONS[focus])}
            {t.focus[focus]}
          </strong>
          <span>{t.focusHint[focus]}</span>
          {focus === PRESEASON_FOCUS.TECHNICAL &&
            (upgradeChance > 0 ? (
              <>
                <span className="tr-optioncard__odds">{t.upgradeChance(upgradeChance)}</span>
                <span className="tr-odds" aria-hidden="true">
                  <span className="tr-odds__fill" style={{ width: `${(upgradeChance * 100).toFixed(1)}%` }} />
                </span>
              </>
            ) : (
              <span className="tr-optioncard__odds tr-optioncard__odds--shut">
                <Locked />
                {t.upgradeLocked}
              </span>
            ))}
        </button>
      ))}
    </div>

    <div className="tr-calendarpreview">
      {world.races.map((race) => (
        <span key={`${race.round}-${race.name}`} className="tr-calendarpreview__item">
          <Flag code={race.country} title={localizeRaceName(race.name, locale)} width={22} />
          <em>{race.round}</em>
        </span>
      ))}
    </div>

    <button type="button" className="tr-cta" onClick={onRun}>
      {t.runSeason}
    </button>
  </section>
  );
};

export default PreseasonPhase;
