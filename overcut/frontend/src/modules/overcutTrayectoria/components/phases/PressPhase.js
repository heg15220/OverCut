/**
 * The winter verdict: what was written about you, where you stand in your own
 * garage, and any record you passed on the way.
 *
 * This is also where the game tells you whether the seat is safe, and why - a
 * driver who missed the objective deserves to know it was the team-mate duel or
 * the garage's affection that kept them in the car.
 */

import React from "react";
import { Meter } from "../atoms";
import { idolatryLevel } from "../../engine/press";
import { t } from "../../i18n";

const milestoneText = (milestone) => {
  if (milestone.key === "allTimeWins") {
    return t.milestone.allTimeWins(milestone.threshold, milestone.passed);
  }
  const render = t.milestone[milestone.key];
  return render ? render(milestone.threshold) : null;
};

export const PressPhase = ({ career, onContinue }) => {
  const objective = career.objective || { met: false, beatTeammate: false };
  const survivedOnTeammate = !objective.met && objective.beatTeammate;
  const survivedOnLove = !objective.met && !objective.beatTeammate && career.idolatry >= 70;

  return (
    <section className="tr-phase tr-press">
      <header className="tr-phase__head">
        <span className="tr-eyebrow">{t.pressTitle}</span>
        <h2 className="tr-phase__title">{career.year}</h2>
      </header>

      <ul className="tr-headlines">
        {career.headlines.map((headline) => (
          <li key={headline.key}>{headline.text}</li>
        ))}
      </ul>

      <p className={`tr-alert${objective.met ? " tr-alert--good" : " tr-alert--bad"}`}>
        {objective.met ? t.objectiveMet : t.objectiveMissed}
      </p>
      {survivedOnTeammate && <p className="tr-hint tr-hint--rule">{t.savedByTeammate}</p>}
      {survivedOnLove && <p className="tr-hint tr-hint--rule">{t.savedByLove}</p>}

      <div className="tr-idolatry">
        <Meter
          value={career.idolatry}
          label={t.idolatryTitle}
          caption={t.idolatry[idolatryLevel(career.idolatry)]}
        />
      </div>

      {career.milestones.length > 0 && (
        <div className="tr-milestones">
          <span className="tr-label">{t.milestones}</span>
          <ul>
            {career.milestones.map((milestone) => {
              const text = milestoneText(milestone);
              return text ? <li key={`${milestone.key}-${milestone.threshold}`}>{text}</li> : null;
            })}
          </ul>
        </div>
      )}

      <button type="button" className="tr-cta" onClick={onContinue}>
        {t.nextSeason}
      </button>
    </section>
  );
};

export default PressPhase;
