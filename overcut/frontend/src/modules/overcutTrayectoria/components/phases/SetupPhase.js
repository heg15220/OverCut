/**
 * Creating the driver: who you are and when you arrive.
 *
 * Debut year is chosen in two steps - decade, then year - because 75 years in
 * one dropdown is a wall, and because the decade is the choice that actually
 * matters: it decides what kind of Formula 1 you are about to race in.
 */

import React, { useMemo, useState } from "react";
import {
  Flag,
  HELMET_COLORS,
  HELMET_PRESETS,
  HELMET_STYLES,
  Helmet,
  NATIONALITIES,
  helmetStyleOf,
  randomHelmet,
} from "../atoms";
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
  const [helmet, setHelmet] = useState(HELMET_PRESETS[0]);
  const [difficulty, setDifficulty] = useState(DIFFICULTY.BALANCED);

  const paint = (part) => setHelmet((current) => ({ ...current, ...part }));
  const swapColours = () =>
    setHelmet((current) => ({ ...current, primary: current.secondary, secondary: current.primary }));

  const chooseDecade = (next) => {
    setDecade(next);
    const nextYears = yearsInDecade(bootstrap, next);
    setYear(nextYears[0]);
  };

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

        {/* Four ways in, in the order people actually use them: take one whole,
            change the design, change either colour. The preview is the size the
            helmet is worth looking at; every control under it is the same
            helmet drawn small, so nothing here is a label for a shape you have
            to imagine. */}
        <div className="tr-field tr-field--wide">
          <span className="tr-label">{t.helmetLabel}</span>

          <div className="tr-helmeteditor">
            <div className="tr-helmeteditor__stage">
              <span className="tr-helmeteditor__preview" data-testid="helmet-preview">
                <Helmet {...helmet} size={112} title={t.helmetStyleNames[helmetStyleOf(helmet.style)]} />
              </span>
              <div className="tr-helmeteditor__acts">
                <button
                  type="button"
                  className="tr-ghost tr-ghost--small"
                  onClick={swapColours}
                  disabled={helmet.style === "solid"}
                >
                  {t.helmetSwap}
                </button>
                <button
                  type="button"
                  className="tr-ghost tr-ghost--small"
                  onClick={() => setHelmet(randomHelmet())}
                >
                  {t.helmetRandom}
                </button>
              </div>
            </div>

            <div className="tr-helmeteditor__controls">
              <div className="tr-helmetrow">
                <span className="tr-helmetrow__label">{t.helmetPresets}</span>
                <div className="tr-helmetrow__items" role="group" aria-label={t.helmetPresets}>
                  {HELMET_PRESETS.map((preset) => {
                    const on =
                      preset.primary === helmet.primary &&
                      preset.secondary === helmet.secondary &&
                      preset.style === helmet.style;
                    return (
                      <button
                        type="button"
                        key={`${preset.primary}-${preset.secondary}-${preset.style}`}
                        className={`tr-helmetpick${on ? " is-on" : ""}`}
                        data-testid={`helmet-preset-${preset.style}-${preset.primary}`}
                        onClick={() => setHelmet(preset)}
                        aria-pressed={on}
                        aria-label={t.helmetStyleNames[preset.style]}
                      >
                        <Helmet {...preset} size={34} />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="tr-helmetrow">
                <span className="tr-helmetrow__label">{t.helmetDesign}</span>
                <div className="tr-helmetrow__items" role="group" aria-label={t.helmetDesign}>
                  {HELMET_STYLES.map((style) => (
                    <button
                      type="button"
                      key={style}
                      className={`tr-helmetpick${helmetStyleOf(helmet.style) === style ? " is-on" : ""}`}
                      data-testid={`helmet-design-${style}`}
                      onClick={() => paint({ style })}
                      aria-pressed={helmetStyleOf(helmet.style) === style}
                      title={t.helmetStyleNames[style]}
                    >
                      <Helmet {...helmet} style={style} size={34} />
                      <small>{t.helmetStyleNames[style]}</small>
                    </button>
                  ))}
                </div>
              </div>

              <div className="tr-helmetrow">
                <span className="tr-helmetrow__label">{t.helmetPrimaryLabel}</span>
                <div className="tr-helmetrow__items" role="group" aria-label={t.helmetPrimaryLabel}>
                  {HELMET_COLORS.map((colour) => (
                    <button
                      type="button"
                      key={colour.key}
                      className={`tr-swatch${helmet.primary === colour.hex ? " is-on" : ""}`}
                      style={{ background: colour.hex }}
                      data-testid={`helmet-primary-${colour.key}`}
                      onClick={() => paint({ primary: colour.hex })}
                      aria-pressed={helmet.primary === colour.hex}
                      aria-label={t.helmetColorNames[colour.key]}
                      title={t.helmetColorNames[colour.key]}
                    />
                  ))}
                </div>
              </div>

              {/* A plain helmet has no second colour, so the row that sets one
                  is not there to be wondered about. */}
              {helmetStyleOf(helmet.style) !== "solid" && (
                <div className="tr-helmetrow">
                  <span className="tr-helmetrow__label">{t.helmetSecondaryLabel}</span>
                  <div className="tr-helmetrow__items" role="group" aria-label={t.helmetSecondaryLabel}>
                    {HELMET_COLORS.map((colour) => (
                      <button
                        type="button"
                        key={colour.key}
                        className={`tr-swatch${helmet.secondary === colour.hex ? " is-on" : ""}`}
                        style={{ background: colour.hex }}
                        data-testid={`helmet-secondary-${colour.key}`}
                        onClick={() => paint({ secondary: colour.hex })}
                        aria-pressed={helmet.secondary === colour.hex}
                        aria-label={t.helmetColorNames[colour.key]}
                        title={t.helmetColorNames[colour.key]}
                      />
                    ))}
                  </div>
                </div>
              )}
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
