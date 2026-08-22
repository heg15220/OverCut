/**
 * Creating the driver: who you are and when you arrive.
 *
 * Debut year is chosen in two steps - decade, then year - because 75 years in
 * one dropdown is a wall, and because the decade is the choice that actually
 * matters: it decides what kind of Formula 1 you are about to race in.
 */

import React, { useMemo, useState } from "react";
import { Flag, HELMET_PRESETS, Helmet, NATIONALITIES } from "../atoms";
import { DIFFICULTY } from "../../engine/career";
import { playableDecades, yearsInDecade } from "../../engine/world";
import { eraProfileFor } from "../../engine/eras";
import { locale, t } from "../../i18n";

const eraHint = (year) => {
  const era = eraProfileFor(year);
  const finish = Math.round(era.finishRate * 100);
  return locale === "es"
    ? `${finish}% de los coches veían la bandera a cuadros`
    : `${finish}% of the cars saw the flag`;
};

export const SetupPhase = ({ bootstrap, onStart }) => {
  const decades = useMemo(() => playableDecades(bootstrap), [bootstrap]);
  const [decade, setDecade] = useState(decades[decades.length - 1] || null);
  const years = useMemo(
    () => (decade ? yearsInDecade(bootstrap, decade) : []),
    [bootstrap, decade],
  );
  const [year, setYear] = useState(years[0]);
  const [name, setName] = useState("");
  const [nationality, setNationality] = useState("es");
  const [helmetIndex, setHelmetIndex] = useState(0);
  const [difficulty, setDifficulty] = useState(DIFFICULTY.BALANCED);

  const chooseDecade = (next) => {
    setDecade(next);
    const nextYears = yearsInDecade(bootstrap, next);
    setYear(nextYears[0]);
  };

  const helmet = HELMET_PRESETS[helmetIndex];
  const ready = name.trim().length >= 2 && Boolean(year);

  return (
    <section className="tr-phase tr-setup">
      <header className="tr-phase__head">
        <h2 className="tr-phase__title">{t.setupTitle}</h2>
        <p className="tr-phase__lead">{t.setupLead}</p>
      </header>

      <div className="tr-setup__grid">
        <div className="tr-field tr-field--wide">
          <label className="tr-label" htmlFor="tr-name">{t.nameLabel}</label>
          <input
            id="tr-name"
            className="tr-input"
            value={name}
            maxLength={26}
            placeholder={t.namePlaceholder}
            onChange={(event) => setName(event.target.value)}
          />
        </div>

        <div className="tr-field">
          <span className="tr-label">{t.nationalityLabel}</span>
          <div className="tr-flagpicker">
            {NATIONALITIES.map((country) => (
              <button
                type="button"
                key={country.code}
                className={`tr-flagpicker__item${nationality === country.code ? " is-on" : ""}`}
                onClick={() => setNationality(country.code)}
                title={country[locale] || country.es}
                aria-pressed={nationality === country.code}
              >
                <Flag code={country.code} title={country[locale] || country.es} width={26} />
              </button>
            ))}
          </div>
        </div>

        <div className="tr-field">
          <span className="tr-label">{t.helmetLabel}</span>
          <div className="tr-helmetpicker">
            <Helmet {...helmet} size={78} />
            <div className="tr-helmetpicker__swatches">
              {HELMET_PRESETS.map((preset, index) => (
                <button
                  type="button"
                  key={`${preset.primary}-${preset.style}`}
                  className={`tr-swatch${helmetIndex === index ? " is-on" : ""}`}
                  style={{ background: `linear-gradient(135deg, ${preset.primary} 50%, ${preset.secondary} 50%)` }}
                  onClick={() => setHelmetIndex(index)}
                  aria-label={`${t.helmetLabel} ${index + 1}`}
                  aria-pressed={helmetIndex === index}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="tr-field tr-field--wide">
          <span className="tr-label">{t.decadeLabel}</span>
          <div className="tr-chiprow">
            {decades.map((entry) => (
              <button
                type="button"
                key={entry.key}
                className={`tr-chip${decade?.key === entry.key ? " is-on" : ""}`}
                onClick={() => chooseDecade(entry)}
                aria-pressed={decade?.key === entry.key}
              >
                {entry.label}
              </button>
            ))}
          </div>
        </div>

        <div className="tr-field tr-field--wide">
          <span className="tr-label">{t.yearLabel}</span>
          <div className="tr-chiprow tr-chiprow--years">
            {years.map((entry) => (
              <button
                type="button"
                key={entry}
                className={`tr-chip tr-chip--year${year === entry ? " is-on" : ""}`}
                onClick={() => setYear(entry)}
                aria-pressed={year === entry}
              >
                {entry}
              </button>
            ))}
          </div>
          {year && <p className="tr-hint">{eraHint(year)}</p>}
        </div>

        <div className="tr-field tr-field--wide">
          <span className="tr-label">{t.difficultyLabel}</span>
          <div className="tr-cards tr-cards--three">
            {Object.values(DIFFICULTY).map((entry) => (
              <button
                type="button"
                key={entry.key}
                className={`tr-optioncard${difficulty.key === entry.key ? " is-on" : ""}`}
                onClick={() => setDifficulty(entry)}
                aria-pressed={difficulty.key === entry.key}
              >
                <strong>{t.difficulty[entry.key]}</strong>
                <span>{t.difficultyHint[entry.key]}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        type="button"
        className="tr-cta"
        disabled={!ready}
        onClick={() => onStart({ name: name.trim(), nationality, debutYear: year, difficulty, helmet })}
      >
        {t.startCareer}
      </button>
    </section>
  );
};

export default SetupPhase;
