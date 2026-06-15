import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowClockwise,
  ArrowDownShort,
  ArrowLeftShort,
  AwardFill,
  BriefcaseFill,
  Dice5Fill,
  FlagFill,
  Folder2Open,
  PauseFill,
  PersonFill,
  PlayFill,
  PlusCircleFill,
  SaveFill,
  TrophyFill,
} from "react-bootstrap-icons";
import { config } from "../../../config/constants";
import formulaCarLoadingUrl from "../../../assets/images/miniGames/FormulaCarLoading.png";
import racingHelmetUrl from "../../../assets/images/miniGames/RacingHelmet.png";
import {
  HELMET_COLORS,
  HELMET_STYLES,
  helmetBackground,
  completeRace,
  createCareerSeason,
  fetchCareerBootstrap,
  generateContracts,
  interpolateRacePosition,
  normalizeColor,
  playableDecades,
  prepareCareerBootstrap,
  raceResultRows,
  raceStateAtLap,
  randomYearInDecade,
  retirementSummary,
  simulateCareerRace,
  sillySeasonMarketWindow,
  teammateBattleSummary,
  evaluateSeason,
} from "./careerModeEngine";
import {
  ATTRIBUTE_KEYS,
  analyzeRaceXp,
  applyRaceXp,
  computeOverall,
  createDriverCard,
} from "./driverCard";
import { localizeRaceName } from "./careerRaceNames";
import { strings as t, locale, statusLabel, tierLabel, conditionLabel } from "./i18n";
import { fallbackBootstrap } from "../../overcutRacing/components/fallbackData";
import "./CareerMode.css";

const STARTING_AGE = 18;
const FINAL_AGE = 41; // last season the driver may race
const CAREER_SAVE_CODE_KEY = "overcutCareerModeSaveCode";
const CAREER_SAVE_VERSION = 1;

// Pick a localized field, falling back to the Spanish text when the English
// variant is missing (engine prose carries both `x` and `xEn`).
const localized = (es, en) => (locale === "en" ? en || es : es);

const normalizeSaveCode = (code = "") => code.trim().toUpperCase().replace(/-/g, "");

const formatSaveCode = (code = "") => {
  const normalized = normalizeSaveCode(code);
  return normalized ? normalized.replace(/(.{4})(?=.)/g, "$1-") : "";
};

const readBrowserSaveCode = () => {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(CAREER_SAVE_CODE_KEY) || "";
};

const writeBrowserSaveCode = (code) => {
  if (typeof window === "undefined" || !code) return;
  window.localStorage.setItem(CAREER_SAVE_CODE_KEY, normalizeSaveCode(code));
};

const saveCareerState = async ({ code, state }) => {
  const response = await fetch(`${config.BASE_PATH}/careerMode/saves`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: normalizeSaveCode(code), state }),
  });
  if (!response.ok) {
    throw new Error(`save failed: ${response.status}`);
  }
  return response.json();
};

const loadCareerState = async (code) => {
  const response = await fetch(`${config.BASE_PATH}/careerMode/saves/${encodeURIComponent(normalizeSaveCode(code))}`);
  if (!response.ok) {
    throw new Error(`load failed: ${response.status}`);
  }
  return response.json();
};

const createInitialProfile = () => {
  const card = createDriverCard();
  const overall = computeOverall(card);
  return {
    name: "",
    helmetColor: HELMET_COLORS[0],
    helmetColor2: HELMET_COLORS[7],
    helmetStyle: "solid",
    age: STARTING_AGE,
    card,
    cardXp: { pace: 0, racecraft: 0, awareness: 0, experience: 0 },
    overall,
    rating: overall,
    reputation: 28,
    seasons: 0,
    status: "rookie",
    stats: {
      points: 0,
      wins: 0,
      podiums: 0,
      titles: 0,
      teams: [],
    },
  };
};

const INITIAL_PROFILE = createInitialProfile();

// Short codes for the four card attributes (F1 25 style). The long names come
// from the active locale; the abbreviations stay language-neutral.
const ATTRIBUTE_LABELS = {
  pace: { short: "PAC" },
  racecraft: { short: "RAC" },
  awareness: { short: "AWA" },
  experience: { short: "EXP" },
};

const HelmetIcon = ({ color, color2, style = "solid", size = 34 }) => (
  <span
    className="cm-helmet"
    aria-hidden="true"
    style={{
      width: size,
      height: size,
      background: helmetBackground(style, color, color2),
      WebkitMaskImage: `url(${racingHelmetUrl})`,
      maskImage: `url(${racingHelmetUrl})`,
    }}
  />
);

// Spread helper: pulls the three helmet fields off a profile/draft/driver entity.
// Rivals only carry `helmetColor`, so style/color2 stay undefined and render solid.
const helmetFor = (entity = {}) => ({
  color: entity.helmetColor,
  color2: entity.helmetColor2,
  style: entity.helmetStyle,
});

const stat = (label, value) => (
  <div className="cm-stat" key={label}>
    <span>{label}</span>
    <b>{value}</b>
  </div>
);

// One attribute bar; when `delta > 0` a brighter overlay marks the points just
// gained so the post-race growth reads at a glance.
const AttributeBar = ({ value, delta = 0 }) => (
  <div className="cm-card-bar" aria-hidden="true">
    <span className="cm-card-bar-fill" style={{ width: `${value}%` }} />
    {delta > 0 && (
      <span
        className="cm-card-bar-gain"
        style={{ left: `${value - delta}%`, width: `${delta}%` }}
      />
    )}
  </div>
);

const buildRaceDevelopment = ({ profile, raceResult, season }) => {
  const xpGains = analyzeRaceXp(raceResult, season, profile);
  const progression = applyRaceXp(
    profile.card,
    profile.cardXp || { pace: 0, racecraft: 0, awareness: 0, experience: 0 },
    xpGains,
    profile.age || STARTING_AGE
  );
  const previousOverall = profile.overall ?? computeOverall(profile.card);
  const nextProfile = {
    ...profile,
    card: progression.card,
    cardXp: progression.cardXp,
    overall: progression.overall,
    rating: progression.overall,
  };
  return {
    previousProfile: profile,
    nextProfile,
    xpGains,
    deltas: progression.deltas,
    overallDelta: progression.overall - previousOverall,
    resultFactor: xpGains.resultFactor,
    expected: xpGains.expected,
    actual: xpGains.actual,
  };
};

// The driver's F1 25-style card: Pace / Racecraft / Awareness / Experience plus a
// derived Overall. `deltas` (optional) animates the points won after a race.
const DriverCardView = ({ profile, deltas = null, compact = false }) => {
  const card = profile?.card;
  if (!card) return null;
  const overall = profile.overall ?? computeOverall(card);
  return (
    <section
      className={`cm-driver-card${compact ? " is-compact" : ""}${deltas ? " is-animating" : ""}`}
      style={{ "--card-accent": normalizeColor(profile.helmetColor, "#d8a11d") }}
    >
      <header className="cm-card-head">
        <HelmetIcon {...helmetFor(profile)} size={compact ? 34 : 46} />
        <div className="cm-card-id">
          <span>{t.cardIdentity(statusLabel(profile.status), profile.age)}</span>
          <b>{profile.name || t.cardDriverFallback}</b>
        </div>
        <div className="cm-card-overall">
          <small>{t.cardOverall}</small>
          <strong>{overall}</strong>
        </div>
      </header>
      <ul className="cm-card-attrs">
        {ATTRIBUTE_KEYS.map((key) => {
          const delta = deltas?.[key] || 0;
          return (
            <li key={key} className={delta > 0 ? "is-up" : ""}>
              <span className="cm-card-attr-label">
                <b>{ATTRIBUTE_LABELS[key].short}</b>
                <small>{t.attributeNames[key]}</small>
              </span>
              <AttributeBar value={card[key]} delta={delta} />
              <span className="cm-card-attr-value">
                {card[key]}
                {delta > 0 && <em className="cm-card-attr-delta">+{delta}</em>}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
};

// Live head-to-head between the player and their team-mate during the race.
const TrackDuel = ({ player, teammate, playerPosition, teammatePosition }) => {
  if (!teammate || !Number.isFinite(playerPosition) || !Number.isFinite(teammatePosition)) return null;
  const ahead = playerPosition < teammatePosition;
  const tied = playerPosition === teammatePosition;
  const gap = Math.abs(teammatePosition - playerPosition);
  return (
    <section className={`cm-track-duel ${ahead ? "is-ahead" : tied ? "is-tied" : "is-behind"}`}>
      <header>{t.trackDuelTitle}</header>
      <div className="cm-duel-grid">
        <div className={`cm-duel-side${ahead || tied ? " is-leader" : ""}`}>
          <small>{t.you}</small>
          <HelmetIcon {...helmetFor(player)} size={28} />
          <b>P{playerPosition}</b>
        </div>
        <div className="cm-duel-mid" aria-hidden="true">
          <span className="cm-duel-arrow">{tied ? "=" : ahead ? "◄" : "►"}</span>
          {!tied && <em>+{gap}</em>}
        </div>
        <div className={`cm-duel-side${!ahead && !tied ? " is-leader" : ""}`}>
          <small>{t.teammate}</small>
          <HelmetIcon {...helmetFor(teammate)} size={28} />
          <b>P{teammatePosition}</b>
        </div>
      </div>
      <p className="cm-duel-name">{teammate.name}</p>
    </section>
  );
};

// Custom inline SVG icons for the on-track race-state overlays.
const SafetyCarIcon = ({ size = 30 }) => (
  <svg className="cm-flag-icon" width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
    <path d="M6 30l3-9a5 5 0 0 1 4.7-3.4h20.6A5 5 0 0 1 39 21l3 9v7a2 2 0 0 1-2 2h-3a2 2 0 0 1-2-2v-2H14v2a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2z" fill="currentColor" />
    <path d="M12 18l2.4-6.2A4 4 0 0 1 18.1 9h11.8a4 4 0 0 1 3.7 2.8L36 18z" fill="rgba(0,0,0,.35)" />
    <circle cx="14" cy="31" r="2.6" fill="#10141b" />
    <circle cx="34" cy="31" r="2.6" fill="#10141b" />
    <rect x="20" y="6" width="8" height="4" rx="1.4" fill="#10141b" />
    <path d="M6 24h36" stroke="#10141b" strokeWidth="2.4" strokeDasharray="4 3" opacity=".5" />
  </svg>
);

const RedFlagIcon = ({ size = 30 }) => (
  <svg className="cm-flag-icon" width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
    <rect x="11" y="6" width="3" height="36" rx="1.5" fill="#1c1f25" />
    <path d="M14 8h24l-4 7 4 7H14z" fill="currentColor" />
  </svg>
);

const RainIcon = ({ size = 30 }) => (
  <svg className="cm-flag-icon" width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
    <path d="M14 27a8 8 0 0 1 1.2-15.9A10 10 0 0 1 34 14.5 7 7 0 0 1 33 28z" fill="currentColor" />
    <g fill="none" stroke="#cfe6ff" strokeWidth="2.6" strokeLinecap="round">
      <path d="M16 33l-2 5" />
      <path d="M24 33l-2 5" />
      <path d="M32 33l-2 5" />
    </g>
  </svg>
);

const positionToTrackProgress = (position, fieldSize = 22) => {
  const size = Math.max(2, fieldSize || 22);
  const pos = Math.max(1, Math.min(size, position || size));
  return ((size - pos) / (size - 1)) * 100;
};

const CareerTrackCar = ({ player, position, fieldSize }) => {
  const progress = positionToTrackProgress(position, fieldSize);
  return (
    <div
      className="cm-career-car"
      style={{
        "--car-color": normalizeColor(player.teamColor, "#0f4c81"),
        "--track-car-left": `${7 + progress * 0.86}%`,
        "--track-car-anchor": `${progress}%`,
      }}
    >
      <img className="cm-career-car-base" src={formulaCarLoadingUrl} alt="" aria-hidden="true" />
      <span
        className="cm-career-car-paint"
        aria-hidden="true"
        style={{
          WebkitMaskImage: `url(${formulaCarLoadingUrl})`,
          maskImage: `url(${formulaCarLoadingUrl})`,
        }}
      />
      <img className="cm-career-car-lines" src={formulaCarLoadingUrl} alt="" aria-hidden="true" />
      <span className="cm-career-car-position">P{position || "--"}</span>
    </div>
  );
};

// Derive the prominent track overlay from the live race state. Priority:
// red flag > safety car > rain. Returns null when the track is green and dry.
const trackOverlayFor = (state) => {
  if (state.redFlagActive) return { kind: "redflag", label: t.overlayRedFlag, icon: <RedFlagIcon size={34} /> };
  if (state.scActive) return { kind: "safetycar", label: t.overlaySafetyCar, icon: <SafetyCarIcon size={34} /> };
  if (state.vscActive) return { kind: "vsc", label: t.overlayVsc, icon: <SafetyCarIcon size={34} /> };
  if (state.yellowActive) return { kind: "yellow", label: t.overlayYellow, icon: <FlagFill size={34} /> };
  if (state.greenFlag) return { kind: "green", label: t.overlayGreen, icon: <FlagFill size={34} /> };
  if (state.wet) return { kind: "rain", label: state.condition === "lluvia" ? t.overlayRain : t.overlayWetTrack, icon: <RainIcon size={34} /> };
  return null;
};

const RAIN_DROPS = Array.from({ length: 16 }, (_, index) => index);

const TeammateBattle = ({ battle }) => {
  if (!battle) return null;
  const stateClass = battle.tied ? "is-tied" : battle.leading ? "is-leading" : "is-behind";
  return (
    <section className={`cm-teammate ${stateClass}`}>
      <header>
        <span>{t.teammateBattleTitle}</span>
        <b>{battle.teammateName}</b>
      </header>
      <div className="cm-teammate-grid">
        <div>
          <small>{t.battleRaces}</small>
          <strong>{battle.raceWins}-{battle.raceLosses}</strong>
        </div>
        <div>
          <small>{t.battleQualifying}</small>
          <strong>{battle.qualiWins}-{battle.qualiLosses}</strong>
        </div>
        <div>
          <small>{t.battlePoints}</small>
          <strong>{battle.playerPoints}-{battle.teammatePoints}</strong>
        </div>
        <div>
          <small>{t.battleBalance}</small>
          <strong>{battle.pointsGap >= 0 ? `+${battle.pointsGap}` : battle.pointsGap}</strong>
        </div>
      </div>
      <p className="cm-teammate-state">
        {battle.tied
          ? t.battleTied
          : battle.leading
          ? t.battleLeading
          : t.battleBehind}
      </p>
    </section>
  );
};

const SetupPanel = ({ draft, setDraft, onSubmit }) => {
  const validName = draft.name.trim().length >= 2;
  return (
    <section className="cm-panel cm-setup">
      <div className="cm-panel-head">
        <PersonFill />
        <div>
          <span>{t.step1}</span>
          <h2>{t.setupTitle}</h2>
        </div>
      </div>
      <label className="cm-field">
        <span>{t.driverNameLabel}</span>
        <input
          type="text"
          value={draft.name}
          maxLength={32}
          onChange={(event) => setDraft({ ...draft, name: event.target.value })}
          placeholder={t.driverNamePlaceholder}
        />
      </label>
      <div className="cm-field">
        <span>{t.helmetStyleLabel}</span>
        <div className="cm-helmet-styles" role="group" aria-label={t.helmetStyleLabel}>
          {HELMET_STYLES.map((style) => (
            <button
              key={style}
              type="button"
              className={`cm-helmet-style${draft.helmetStyle === style ? " is-selected" : ""}`}
              onClick={() => setDraft({ ...draft, helmetStyle: style })}
            >
              <HelmetIcon color={draft.helmetColor} color2={draft.helmetColor2} style={style} size={26} />
              <small>{t.helmetStyleNames[style]}</small>
            </button>
          ))}
        </div>
      </div>
      <div className="cm-field">
        <span>{draft.helmetStyle === "solid" ? t.helmetColorLabel : t.helmetPrimaryLabel}</span>
        <div className="cm-color-picker" aria-label={t.helmetColorLabel}>
          {HELMET_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              className={draft.helmetColor === color ? "is-selected" : ""}
              onClick={() => setDraft({ ...draft, helmetColor: color })}
              style={{ "--helmet-choice": normalizeColor(color) }}
              aria-label={t.helmetAria(color)}
            >
              <HelmetIcon color={color} size={28} />
            </button>
          ))}
        </div>
      </div>
      {draft.helmetStyle !== "solid" && (
        <div className="cm-field">
          <span>{t.helmetSecondaryLabel}</span>
          <div className="cm-color-picker" aria-label={t.helmetSecondaryLabel}>
            {HELMET_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                className={draft.helmetColor2 === color ? "is-selected" : ""}
                onClick={() => setDraft({ ...draft, helmetColor2: color })}
                style={{ "--helmet-choice": normalizeColor(color) }}
                aria-label={t.helmetAria(color)}
              >
                <HelmetIcon color={color} size={28} />
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="cm-driver-preview">
        <HelmetIcon {...helmetFor(draft)} size={56} />
        <div>
          <span>{t.initialProfile}</span>
          <b>{draft.name.trim() || t.newDriver}</b>
          <small>{t.initialStats}</small>
        </div>
      </div>
      <button className="cm-btn cm-btn-primary" type="button" disabled={!validName} onClick={onSubmit}>
        <FlagFill />
        {t.enterF1}
      </button>
    </section>
  );
};

const DecadeChoicePanel = ({ decades, decadeRoll, rolling, manualOpen, onOpenManual, onChooseDecade, onRollDecade }) => (
  <section className={`cm-panel cm-dice-panel cm-decade-choice${rolling ? " is-rolling" : ""}`}>
    <div className="cm-dice-visual" aria-hidden="true">
      <Dice5Fill />
      <span />
    </div>
    <div className="cm-panel-head">
      <Dice5Fill />
      <div>
        <span>{t.step2}</span>
        <h2>{t.chooseDecadeTitle}</h2>
      </div>
    </div>
    <div className="cm-choice-stage">
      <div className="cm-roll-result cm-roll-result-choice">
        <span>{t.calendarEntry}</span>
        <b>{decadeRoll?.label || (rolling ? "..." : t.decadeFallback)}</b>
        <small>{t.decadeIntro}</small>
      </div>
      <div className="cm-dice-options">
        <button className="cm-choice-card" type="button" onClick={onOpenManual} aria-pressed={manualOpen}>
          <span>{t.controlLabel}</span>
          <b>{t.chooseDecadeAction}</b>
          <small>{t.chooseDecadeHint}</small>
        </button>
        <button className="cm-choice-card is-random" type="button" onClick={onRollDecade} disabled={rolling}>
          <span>{t.randomLabel}</span>
          <b>{t.rollDiceAction}</b>
          <small>{t.rollDiceHint}</small>
        </button>
      </div>
    </div>
    {manualOpen && (
      <div className="cm-decade-grid" aria-label={t.availableDecades}>
        {decades.map((decade) => (
          <button
            key={decade.key || decade.label}
            className={decadeRoll?.label === decade.label ? "is-selected" : ""}
            type="button"
            onClick={() => onChooseDecade(decade)}
          >
            <span>{decade.from}-{decade.to}</span>
            <b>{decade.label}</b>
          </button>
        ))}
      </div>
    )}
  </section>
);

const DicePanel = ({ decadeRoll, yearRoll, onRollYear, rolling }) => (
  <section className={`cm-panel cm-dice-panel cm-year-dice${rolling ? " is-rolling" : ""}`}>
    <div className="cm-dice-visual" aria-hidden="true">
      <Dice5Fill />
      <span />
    </div>
    <div className="cm-panel-head">
      <Dice5Fill />
      <div>
        <span>{t.step3}</span>
        <h2>{t.rollYearTitle}</h2>
      </div>
    </div>
    <div className="cm-roll-track" aria-hidden="true">
      <span>{decadeRoll?.from || "--"}</span>
      <i />
      <span>{decadeRoll?.to || "--"}</span>
    </div>
    <div className="cm-roll-result">
      <span>{t.exactSeason}</span>
      <b>{yearRoll || (rolling ? "..." : "--")}</b>
      <small>{t.yearHint(decadeRoll?.label || t.theDecade)}</small>
    </div>
    <button className="cm-btn cm-btn-primary" type="button" onClick={onRollYear} disabled={rolling || !decadeRoll}>
      <Dice5Fill />
      {t.decideYear}
    </button>
  </section>
);

const ContractCard = ({ contract, onSelect, badge = null }) => (
  <button
    className="cm-contract-card"
    type="button"
    onClick={() => onSelect(contract)}
    style={{ "--team-color": normalizeColor(contract.team.color, "#0f4c81") }}
  >
    <span className="cm-contract-tier">{badge || tierLabel(contract.objectives.tier)}</span>
    <div className="cm-contract-team">
      <span className="cm-team-stripe" />
      <div>
        <h3>{contract.team.name}</h3>
        <small>{t.carRatingSalary(contract.team.rating, contract.salary)}</small>
      </div>
    </div>
    <p>{localized(contract.promise, contract.promiseEn)}</p>
    {contract.marketReason && <small className="cm-market-reason">{localized(contract.marketReason, contract.marketReasonEn)}</small>}
    <dl>
      <div>
        <dt>{t.targetPoints}</dt>
        <dd>{contract.objectives.points}</dd>
      </div>
      <div>
        <dt>{t.constructors}</dt>
        <dd>{t.topN(contract.objectives.constructorPosition)}</dd>
      </div>
      <div>
        <dt>{t.reputation}</dt>
        <dd>+{contract.objectives.reputationBonus}</dd>
      </div>
    </dl>
  </button>
);

const PreContractNotice = ({ preContract }) => {
  if (!preContract) return null;
  return (
    <section
      className="cm-precontract-strip"
      style={{ "--team-color": normalizeColor(preContract.team.color, "#0f4c81") }}
    >
      <span>{t.precontractSigned}</span>
      <b>{preContract.team.name} {preContract.targetYear}</b>
      <small>{t.precontractDecided}</small>
    </section>
  );
};

const ContractSelection = ({ contracts, year, profile, onSelect }) => (
  <section className="cm-panel cm-contracts">
    <div className="cm-panel-head">
      <BriefcaseFill />
      <div>
        <span>{year}</span>
        <h2>{t.firstContractTitle}</h2>
      </div>
    </div>
    <p className="cm-panel-copy">
      {t.firstContractCopy(profile.name, statusLabel(profile.status))}
    </p>
    <div className="cm-contract-grid">
      {contracts.map((contract) => (
        <ContractCard key={contract.id} contract={contract} onSelect={onSelect} />
      ))}
    </div>
  </section>
);

const ContractSigning = ({ contract, profile, year, mode, status, onSign, onContinue, onCancel }) => {
  if (!contract) return null;
  const isPrecontract = mode === "precontract";
  const linked = status === "linked";
  const teammate = contract.team.drivers?.find((driver) => !driver.isPlayer);
  return (
    <section
      className={`cm-panel cm-contract-signing${status === "signing" ? " is-signing" : ""}${linked ? " is-linked" : ""}`}
      style={{ "--team-color": normalizeColor(contract.team.color, "#0f4c81") }}
    >
      <div className="cm-panel-head">
        <BriefcaseFill />
        <div>
          <span>{isPrecontract ? t.precontractTerm(contract.targetYear || year) : t.contractTerm(year)}</span>
          <h2>{linked ? t.driverLinked : t.contractSigning}</h2>
        </div>
      </div>
      <div className="cm-signing-layout">
        <section className="cm-contract-document">
          <span className="cm-contract-tier">{isPrecontract ? t.precontractBadge : tierLabel(contract.objectives.tier)}</span>
          <div className="cm-contract-party">
            <div>
              <small>{t.driverLabel}</small>
              <b>{profile.name}</b>
            </div>
            <span className="cm-contract-link" aria-hidden="true" />
            <div>
              <small>{t.teamLabel}</small>
              <b>{contract.team.name}</b>
            </div>
          </div>
          <p>{localized(contract.promise, contract.promiseEn)}</p>
          {contract.marketReason && <small className="cm-market-reason">{localized(contract.marketReason, contract.marketReasonEn)}</small>}
          <dl>
            <div>
              <dt>{t.carRating}</dt>
              <dd>{contract.team.rating}</dd>
            </div>
            <div>
              <dt>{t.salary}</dt>
              <dd>{contract.salary}</dd>
            </div>
            <div>
              <dt>{t.teammateLabel}</dt>
              <dd>{teammate?.name || t.toBeConfirmed}</dd>
            </div>
            <div>
              <dt>{t.teammateRating}</dt>
              <dd>{Number.isFinite(teammate?.rating) ? teammate.rating : "--"}</dd>
            </div>
            <div>
              <dt>{t.targetPoints}</dt>
              <dd>{contract.objectives.points}</dd>
            </div>
            <div>
              <dt>{t.constructors}</dt>
              <dd>{t.topN(contract.objectives.constructorPosition)}</dd>
            </div>
            <div>
              <dt>{t.reputation}</dt>
              <dd>+{contract.objectives.reputationBonus}</dd>
            </div>
            <div>
              <dt>{t.term}</dt>
              <dd>{isPrecontract ? contract.targetYear || year : year}</dd>
            </div>
          </dl>
          <div className="cm-signature-zone">
            <span>{t.signatureZone}</span>
            <div className="cm-signature-line">
              <b className={status !== "idle" ? "is-written" : ""}>{profile.name}</b>
              {status === "signing" && <i aria-hidden="true" />}
            </div>
          </div>
        </section>
        <aside className="cm-link-animation" aria-live="polite">
          <div className="cm-link-driver">
            <HelmetIcon {...helmetFor(profile)} size={42} />
            <b>{profile.name}</b>
          </div>
          <span className="cm-link-beam" />
          <div className="cm-link-team">
            <span className="cm-team-stripe" />
            <b>{contract.team.name}</b>
          </div>
          <p>
            {linked
              ? t.linkedMessage(profile.name, contract.team.name)
              : status === "signing"
              ? t.signingMessage
              : t.reviewMessage}
          </p>
        </aside>
      </div>
      <div className="cm-signing-actions">
        {!linked && (
          <button className="cm-btn cm-btn-secondary" type="button" onClick={onCancel} disabled={status === "signing"}>
            {t.back}
          </button>
        )}
        {status === "idle" && (
          <button className="cm-btn cm-btn-primary" type="button" onClick={onSign}>
            {t.signContract}
          </button>
        )}
        {linked && (
          <button className="cm-btn cm-btn-primary" type="button" onClick={onContinue}>
            {isPrecontract ? t.backToPaddock : t.joinTeam}
          </button>
        )}
      </div>
    </section>
  );
};

const StandingsTable = ({ title, rows, playerOnly = false, isDrivers = false }) => {
  const visibleRows = playerOnly ? rows : rows.slice(0, 10);
  const playerBelow =
    !playerOnly && isDrivers
      ? rows.find((row) => row.isPlayer && !visibleRows.some((visible) => visible.isPlayer))
      : null;
  return (
    <section className="cm-standings">
      <h3>{title}</h3>
      <ol>
        {visibleRows.map((row) => (
          <li
            key={row.id || row.name}
            className={row.isPlayer ? "is-player" : ""}
            style={{ "--row-color": normalizeColor(row.color || "#d8a11d", "#d8a11d") }}
          >
            <b>{row.position}</b>
            <span className="cm-row-stripe" />
            <div>
              <strong>{row.name}</strong>
              <small>{row.team || t.winsCount(row.wins || 0)}</small>
            </div>
            <em>{row.points}</em>
          </li>
        ))}
        {playerBelow && (
          <>
            <li className="cm-standing-player-label" aria-hidden="true">
              <span>{t.yourPosition}</span>
            </li>
            <li
              key={playerBelow.id || playerBelow.name}
              className="is-player"
              style={{ "--row-color": normalizeColor(playerBelow.color || "#d8a11d", "#d8a11d") }}
            >
              <b>{playerBelow.position}</b>
              <span className="cm-row-stripe" />
              <div>
                <strong>{playerBelow.name}</strong>
                <small>{playerBelow.team || t.winsCount(playerBelow.wins || 0)}</small>
              </div>
              <em>{playerBelow.points}</em>
            </li>
          </>
        )}
      </ol>
    </section>
  );
};

// Distance (px) from the bottom within which the feed is considered "live": the
// auto-scroll keeps the latest event in view while the reader stays at the end.
const FEED_BOTTOM_THRESHOLD = 24;

const RaceSimulation = ({ raceResult, visibleEvents, onFinish, onSkipToResult, lang, simulationSpeed, onSpeedChange, paused, onTogglePause, panelRef }) => {
  const player = raceResult.playerResult;
  const feedRef = useRef(null);
  const [feedScrollable, setFeedScrollable] = useState(false);
  // The feed follows the live narration only while the reader is at the bottom and
  // not hovering it. Hovering pauses the scroll so they can read at their own pace;
  // the "back to live" button (shown when behind) jumps back to the latest event.
  const [atBottom, setAtBottom] = useState(true);
  const [followingLive, setFollowingLive] = useState(true);
  const atBottomRef = useRef(true);
  const followingLiveRef = useRef(true);
  const isHoveringRef = useRef(false);
  const setBottomState = (value) => {
    atBottomRef.current = value;
    setAtBottom(value);
  };
  const setFollowingLiveState = (value) => {
    followingLiveRef.current = value;
    setFollowingLive(value);
  };
  const eventText = (event) => (lang === "en" && event.textEn ? event.textEn : event.text);
  const isComplete = visibleEvents.length >= raceResult.events.length;
  const livePlayerPosition =
    [...visibleEvents].reverse().find((event) => Number.isFinite(event.playerPosition))?.playerPosition ||
    raceResult.startingPosition ||
    player.gridPosition ||
    player.position;
  const currentLap = visibleEvents.length ? visibleEvents[visibleEvents.length - 1].lap : 1;
  const teammatePosition = raceResult.teammate
    ? interpolateRacePosition(
        raceResult.teammate.startingPosition,
        raceResult.teammate.finalPosition,
        currentLap / raceResult.race.lapCount
      )
    : null;
  // State is derived only from the current lap, so nothing about future safety
  // cars, red flags or rain is revealed before it actually happens.
  const liveState = raceStateAtLap(raceResult.conditions, currentLap);
  const overlay = trackOverlayFor(liveState);
  const trackStatusLabel =
    liveState.redFlagActive ? t.statusRedFlag :
    liveState.scActive ? t.statusSafetyCar :
    liveState.vscActive ? t.statusVsc :
    liveState.yellowActive ? t.statusYellow :
    liveState.greenFlag ? t.statusGreenFlag :
    t.statusGreen;
  const fieldSize = raceResult.results?.length || 22;

  const distanceFromBottom = (feed) => feed.scrollHeight - feed.scrollTop - feed.clientHeight;

  // Jump back to the latest event and resume following the live narration.
  const jumpToLive = () => {
    const feed = feedRef.current;
    if (!feed) return;
    setFollowingLiveState(true);
    feed.scrollTo({ top: feed.scrollHeight, behavior: "auto" });
    setBottomState(true);
  };

  // Reading-position tracking: once the reader scrolls up (or new events arrive
  // while hovering), the feed stops following and the "back to live" button shows.
  const handleFeedScroll = () => {
    const feed = feedRef.current;
    if (!feed) return;
    const isAtBottom = distanceFromBottom(feed) <= FEED_BOTTOM_THRESHOLD;
    setBottomState(isAtBottom);
    setFollowingLiveState(isAtBottom);
  };

  useEffect(() => {
    const feed = feedRef.current;
    if (!feed) return undefined;
    const syncFeed = () => {
      setFeedScrollable(feed.scrollHeight > feed.clientHeight + 1);
      // Follow the live feed after the user explicitly returns to live; otherwise
      // pause only when they intentionally scroll away to read older events.
      if (followingLiveRef.current || (!isHoveringRef.current && atBottomRef.current)) {
        feed.scrollTo({ top: feed.scrollHeight, behavior: "auto" });
        setBottomState(true);
        setFollowingLiveState(true);
      } else {
        setBottomState(distanceFromBottom(feed) <= FEED_BOTTOM_THRESHOLD);
      }
    };
    const frame = window.requestAnimationFrame(syncFeed);
    window.addEventListener("resize", syncFeed);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", syncFeed);
    };
  }, [visibleEvents.length]);

  return (
    <div className="cm-race-live-layout">
      <section className="cm-panel cm-race-live" ref={panelRef}>
      <div className="cm-panel-head">
        <FlagFill />
        <div>
          <span>{t.lapOf(visibleEvents.length ? visibleEvents[visibleEvents.length - 1].lap : 1, raceResult.race.lapCount)}</span>
          <h2>{localizeRaceName(raceResult.race.name, lang)}</h2>
        </div>
      </div>
      <div className="cm-sim-controls" aria-label={t.simulationSpeed}>
        <button
          className={simulationSpeed === "normal" ? "is-active" : ""}
          type="button"
          onClick={() => onSpeedChange("normal")}
          disabled={isComplete}
        >
          {t.speedNormal}
        </button>
        <button
          className={simulationSpeed === "x2" ? "is-active" : ""}
          type="button"
          onClick={() => onSpeedChange("x2")}
          disabled={isComplete}
        >
          x2
        </button>
        <button
          className={simulationSpeed === "x3" ? "is-active" : ""}
          type="button"
          onClick={() => onSpeedChange("x3")}
          disabled={isComplete}
        >
          x3
        </button>
        <button
          className={`cm-sim-pause${paused ? " is-active" : ""}`}
          type="button"
          onClick={onTogglePause}
          disabled={isComplete}
          aria-pressed={paused}
        >
          {paused ? <PlayFill /> : <PauseFill />}
          {paused ? t.resume : t.pause}
        </button>
        <button className="cm-sim-skip" type="button" onClick={onSkipToResult}>
          {t.simulateRaceSkip}
        </button>
      </div>
      <div
        className={`cm-track-scene cm-weather-${liveState.condition}${overlay ? ` cm-track-${overlay.kind}` : ""}`}
      >
        <div className="cm-track-line" />
        {liveState.wet && (
          <div className="cm-rain-layer" aria-hidden="true">
            {RAIN_DROPS.map((drop) => (
              <span
                key={drop}
                style={{
                  left: `${(drop * 6.1 + 4) % 96}%`,
                  animationDelay: `${(drop % 8) * 0.13}s`,
                  animationDuration: `${0.6 + (drop % 4) * 0.14}s`,
                }}
              />
            ))}
          </div>
        )}
        {overlay && overlay.kind !== "rain" && <span className="cm-flag-sweep" aria-hidden="true" />}
        <CareerTrackCar player={player} position={livePlayerPosition} fieldSize={fieldSize} />
        {overlay && (
          <div className={`cm-race-flag cm-race-flag-${overlay.kind}`} role="status">
            {overlay.icon}
            <span>{overlay.label}</span>
          </div>
        )}
      </div>
      <div className="cm-race-meta">
        {stat(t.metaWeather, conditionLabel(liveState.condition))}
        {stat(t.metaDegradation, `${Math.round(raceResult.conditions.degradation * 100)}%`)}
        {stat(t.metaTrackStatus, trackStatusLabel)}
      </div>
      <div className="cm-lap-feed-wrap">
        <ol
          className={`cm-lap-feed${feedScrollable ? " is-scrollable" : ""}`}
          ref={feedRef}
          onScroll={handleFeedScroll}
          onMouseEnter={() => { isHoveringRef.current = true; }}
          onMouseLeave={() => { isHoveringRef.current = false; }}
        >
          {visibleEvents.map((event, index) => (
            <li key={`${event.lap}-${index}`} className={`cm-event-${event.type}${event.important ? " is-important" : ""}`}>
              <b>{t.lapTag(event.lap)}</b>
              <span>
                {Number.isFinite(event.playerPosition) && event.important ? <em>P{event.playerPosition}</em> : null}
                {eventText(event)}
              </span>
            </li>
          ))}
        </ol>
        {feedScrollable && !atBottom && !followingLive && (
          <button
            className="cm-feed-live-btn"
            type="button"
            onClick={jumpToLive}
            aria-label={t.backToLive}
            title={t.backToLive}
          >
            <ArrowDownShort size={20} />
            <span>{t.backToLive}</span>
          </button>
        )}
      </div>
      {isComplete && (
        <button className="cm-btn cm-btn-primary" type="button" onClick={onFinish}>
          {t.viewResult}
        </button>
      )}
      </section>
      {raceResult.teammate && (
        <aside className="cm-race-duel-rail">
          <TrackDuel
            player={player}
            teammate={raceResult.teammate}
            playerPosition={livePlayerPosition}
            teammatePosition={teammatePosition}
          />
        </aside>
      )}
    </div>
  );
};

const RaceResult = ({ raceResult, onContinue, lang }) => {
  const { rows, playerBelow } = raceResultRows(raceResult.results);
  const playerTeam = (rows.find((row) => row.isPlayer) || playerBelow)?.team;
  const teammateRow = playerTeam
    ? raceResult.results.find((row) => !row.isPlayer && row.team === playerTeam)
    : null;
  const teammateBelow =
    teammateRow && !rows.some((row) => row.id === teammateRow.id) ? teammateRow : null;
  const resultRow = (row) => {
    const role = row.isPlayer
      ? "is-player"
      : teammateRow && row.id === teammateRow.id
      ? "is-teammate"
      : "";
    return (
      <div key={row.id} className={role}>
        <b>P{row.position}</b>
        <HelmetIcon {...helmetFor(row)} size={26} />
        <span>{row.driver}</span>
        <em>{row.status === "DNF" ? "DNF" : t.pointsShort(row.points)}</em>
      </div>
    );
  };
  return (
    <section className="cm-panel cm-race-result">
      <div className="cm-panel-head">
        <TrophyFill />
        <div>
          <span>{t.resultLabel}</span>
          <h2>{localizeRaceName(raceResult.race.name, lang)}</h2>
        </div>
      </div>
      <div className="cm-winner-card" style={{ "--team-color": normalizeColor(raceResult.winner.teamColor, "#0f4c81") }}>
        <span className="cm-team-stripe" />
        <div>
          <small>{t.winnerLabel}</small>
          <b>{raceResult.winner.driver}</b>
          <span>{raceResult.winner.team}</span>
        </div>
      </div>
      <div className="cm-result-grid">
        {rows.map(resultRow)}
        {playerBelow && (
          <>
            <p className="cm-result-player-label">{t.yourResult}</p>
            {resultRow(playerBelow)}
          </>
        )}
        {teammateBelow && (
          <>
            <p className="cm-result-player-label cm-result-teammate-label">{t.teammateResult}</p>
            {resultRow(teammateBelow)}
          </>
        )}
      </div>
      <button className="cm-btn cm-btn-primary" type="button" onClick={onContinue}>
        {t.viewProgress}
      </button>
    </section>
  );
};

const RaceDevelopment = ({ development, raceResult, onContinue, lang }) => {
  const player = raceResult.playerResult;
  const totalDelta = ATTRIBUTE_KEYS.reduce((sum, key) => sum + (development.deltas[key] || 0), 0);
  return (
    <section className="cm-panel cm-race-development">
      <div className="cm-panel-head">
        <AwardFill />
        <div>
          <span>{t.progressAfter(localizeRaceName(raceResult.race.name, lang))}</span>
          <h2>{development.overallDelta > 0 ? t.cardImproves : t.experienceGained}</h2>
        </div>
      </div>
      <div className="cm-development-layout">
        <DriverCardView profile={development.nextProfile} deltas={development.deltas} />
        <div className="cm-development-side">
          <div className="cm-season-stats">
            {stat(t.devResult, player.status === "DNF" ? "DNF" : `P${player.position}`)}
            {stat(t.devExpected, `P${development.expected}`)}
            {stat(t.devXpFactor, `${development.resultFactor.toFixed(2)}x`)}
            {stat(t.devGains, totalDelta > 0 ? `+${totalDelta}` : "0")}
          </div>
          <div className="cm-xp-list">
            {ATTRIBUTE_KEYS.map((key) => (
              <div
                key={key}
                className={development.deltas[key] > 0 ? "is-up" : ""}
                style={{ "--xp-width": `${Math.min(100, Math.round(development.xpGains[key] || 0))}%` }}
              >
                <span>{t.attributeNames[key]}</span>
                <b>{t.xpAmount(Math.round(development.xpGains[key] || 0))}</b>
                <em>{development.deltas[key] > 0 ? `+${development.deltas[key]}` : t.noGain}</em>
              </div>
            ))}
          </div>
          <p className="cm-panel-copy">
            {t.devCopy}
          </p>
          <button className="cm-btn cm-btn-primary" type="button" onClick={onContinue}>
            {t.continueSeason}
          </button>
        </div>
      </div>
    </section>
  );
};

const SeasonDashboard = ({
  season,
  currentRaceIndex,
  profile,
  preContract,
  onSimulateRace,
  onRetire,
  canSimulate,
  lang,
}) => {
  const currentRace = season.races[currentRaceIndex];
  const playerStanding = season.driverStandings.find((row) => row.isPlayer);
  const constructorStanding = season.constructorStandings.find((row) => row.name === season.contract.team.name);
  const teammateBattle = teammateBattleSummary(season, profile);
  return (
    <div className="cm-season-layout">
      <aside className="cm-season-side">
        <section className="cm-panel cm-profile-card">
          <div className="cm-driver-preview">
            <HelmetIcon {...helmetFor(profile)} size={50} />
            <div>
              <span>{statusLabel(profile.status)}</span>
              <b>{profile.name}</b>
              <small>{t.currentAge(profile.age)}</small>
              <small>{t.ratingReputation(profile.rating, profile.reputation)}</small>
            </div>
          </div>
          <DriverCardView profile={profile} compact />
          <div className="cm-season-objectives">
            {stat(t.objectiveTeam, season.contract.team.name)}
            {stat(t.objectivePoints, season.contract.objectives.points)}
            {stat(t.objectiveConstructors, t.topN(season.contract.objectives.constructorPosition))}
            {stat(t.objectiveRound, t.roundProgress(Math.min(currentRaceIndex + 1, season.races.length), season.races.length))}
          </div>
          <PreContractNotice preContract={preContract} />
          <button className="cm-btn cm-btn-secondary" type="button" onClick={onRetire}>
            {t.retire}
          </button>
        </section>
        <section className="cm-panel cm-calendar">
          <h3>{t.calendarYear(season.year)}</h3>
          <ol>
            {season.races.map((race, index) => (
              <li key={`${race.round}-${race.name}`} className={index === currentRaceIndex ? "is-active" : race.completed ? "is-done" : ""}>
                <b>{race.round}</b>
                <span>{localizeRaceName(race.name, lang)}</span>
              </li>
            ))}
          </ol>
        </section>
      </aside>
      <section className="cm-panel cm-next-race">
        <div className="cm-panel-head">
          <FlagFill />
          <div>
            <span>{currentRace ? t.roundLabel(currentRace.round) : t.seasonComplete}</span>
            <h2>{currentRace ? localizeRaceName(currentRace.name, lang) : t.finalEvaluation}</h2>
          </div>
        </div>
        <div className="cm-season-stats">
          {stat(t.driverPoints, playerStanding?.points || 0)}
          {stat(t.driverPosition, playerStanding ? `P${playerStanding.position}` : "--")}
          {stat(t.teamPoints, constructorStanding?.points || 0)}
          {stat(t.objectiveConstructors, constructorStanding ? `P${constructorStanding.position}` : "--")}
        </div>
        <p className="cm-panel-copy">
          {t.seasonCopy(profile.name)}
        </p>
        <button className="cm-btn cm-btn-primary cm-big-action" type="button" disabled={!canSimulate || !currentRace} onClick={onSimulateRace}>
          <FlagFill />
          {t.simulateRace}
        </button>
        {teammateBattle && (
          <section className="cm-teammate-panel">
            <TeammateBattle battle={teammateBattle} />
          </section>
        )}
      </section>
      <aside className="cm-season-standings">
        <StandingsTable title={t.standingsDrivers} rows={season.driverStandings} isDrivers />
        <StandingsTable title={t.standingsConstructors} rows={season.constructorStandings} />
      </aside>
    </div>
  );
};

const SillySeasonPanel = ({ market, onSign, onPass }) => (
  <section className="cm-panel cm-silly-season">
    <div className="cm-panel-head">
      <BriefcaseFill />
      <div>
        <span>{t.sillySeasonTitle(market.round)}</span>
        <h2>{t.paddockAsking}</h2>
      </div>
    </div>
    <p className="cm-panel-copy">
      {t.sillySeasonCopy}
    </p>
    <div className="cm-season-stats">
      {stat(t.probability, `${market.chance}%`)}
      {stat(t.pointsVsTarget, `${market.signal.pointsRatio.toFixed(2)}x`)}
      {stat(t.nextYear, market.targetYear)}
      {stat(t.offers, market.offers.length)}
    </div>
    <div className="cm-contract-grid">
      {market.offers.map((contract) => (
        <ContractCard key={contract.id} contract={contract} onSelect={onSign} badge={t.precontractBadge} />
      ))}
    </div>
    <button className="cm-btn cm-btn-secondary" type="button" onClick={onPass}>
      {t.carryOnUnsigned}
    </button>
  </section>
);

const SeasonReview = ({
  evaluation,
  season,
  contracts,
  preContract,
  exploringMarket,
  onHonorPreContract,
  onExploreMarket,
  onContract,
  onRetire,
}) => (
  <section className={`cm-panel cm-season-review${evaluation.champion ? " is-champion" : evaluation.titleFight ? " is-title-fight" : ""}`}>
    <div className="cm-review-animation" aria-hidden="true">
      <TrophyFill />
      <span />
      <span />
    </div>
    <div className="cm-panel-head">
      <AwardFill />
      <div>
        <span>{t.endOfSeason(season.year)}</span>
        <h2>
          {evaluation.champion
            ? t.reviewChampion
            : evaluation.titleFight
            ? t.reviewEliteSeason
            : evaluation.fired
            ? t.reviewFired
            : evaluation.met
            ? t.reviewObjectivesMet
            : t.reviewInsufficient}
        </h2>
      </div>
    </div>
    <div className="cm-season-stats">
      {stat(t.reviewPoints, evaluation.playerStanding?.points || 0)}
      {stat(t.reviewChampionship, evaluation.playerStanding ? `P${evaluation.playerStanding.position}` : "--")}
      {stat(t.reviewTeam, evaluation.constructorStanding ? `P${evaluation.constructorStanding.position}` : "--")}
      {stat(t.reviewReputation, `${evaluation.reputationDelta >= 0 ? "+" : ""}${evaluation.reputationDelta}`)}
    </div>
    {evaluation.teammateBattle && (
      <div className="cm-review-teammate">
        <TeammateBattle battle={evaluation.teammateBattle} />
        <p className="cm-teammate-impact">
          {evaluation.teammateBattle.tied
            ? t.teammateTied
            : evaluation.teammateBattle.beaten
            ? t.teammateBeaten(`${evaluation.teammateRepDelta >= 0 ? "+" : ""}${evaluation.teammateRepDelta}`)
            : t.teammateLost(`${evaluation.teammateRepDelta}`)}
        </p>
      </div>
    )}
    <p className="cm-panel-copy">
      {evaluation.fired
        ? t.reviewFiredCopy
        : evaluation.overDelivered
        ? t.reviewOverDeliveredCopy
        : t.reviewMarketCopy}
    </p>
    {preContract && !exploringMarket ? (
      <div className="cm-precontract-choice">
        <ContractCard contract={preContract} onSelect={onHonorPreContract} badge={t.precontractBadge} />
        <div>
          <h3>{t.sillySeasonDecision}</h3>
          <p className="cm-panel-copy">
            {t.precontractChoiceCopy(preContract.team.name)}
          </p>
          <div className="cm-choice-actions">
            <button className="cm-btn cm-btn-primary" type="button" onClick={() => onHonorPreContract(preContract)}>
              {t.honorPrecontract}
            </button>
            <button className="cm-btn cm-btn-secondary" type="button" onClick={onExploreMarket}>
              {t.lookOtherOffers}
            </button>
          </div>
        </div>
      </div>
    ) : (
      <div className="cm-contract-grid">
        {contracts.map((contract) => (
          <ContractCard key={contract.id} contract={contract} onSelect={onContract} />
        ))}
      </div>
    )}
    <button className="cm-btn cm-btn-secondary" type="button" onClick={onRetire}>
      {t.retireNow}
    </button>
  </section>
);

const Retirement = ({ summary, onRestart }) => (
  <section className="cm-panel cm-retirement">
    <div className="cm-panel-head">
      <TrophyFill />
      <div>
        <span>{t.retirementLabel}</span>
        <h2>{summary.name}</h2>
      </div>
    </div>
    <div className="cm-season-stats">
      {stat(t.retSeasons, summary.seasons)}
      {stat(t.retTeams, summary.teams)}
      {stat(t.retPoints, summary.points)}
      {stat(t.retWins, summary.wins)}
      {stat(t.retPodiums, summary.podiums)}
      {stat(t.retTitles, summary.titles)}
    </div>
    <button className="cm-btn cm-btn-primary" type="button" onClick={onRestart}>
      <ArrowClockwise />
      {t.newCareer}
    </button>
  </section>
);

const CareerEntryPanel = ({
  codeInput,
  setCodeInput,
  browserCode,
  loading,
  error,
  onNewCareer,
  onLoadCareer,
}) => (
  <section className="cm-entry-grid">
    <article className="cm-panel cm-entry-card">
      <div className="cm-panel-head">
        <PlusCircleFill />
        <div>
          <span>{t.newGameKicker}</span>
          <h2>{t.startNewGame}</h2>
        </div>
      </div>
      <p className="cm-panel-copy">{t.startNewGameCopy}</p>
      <button className="cm-btn cm-btn-primary" type="button" onClick={onNewCareer}>
        <PlayFill />
        {t.startNewGame}
      </button>
    </article>

    <article className="cm-panel cm-entry-card">
      <div className="cm-panel-head">
        <Folder2Open />
        <div>
          <span>{t.existingGameKicker}</span>
          <h2>{t.continueExisting}</h2>
        </div>
      </div>
      <p className="cm-panel-copy">{t.continueExistingCopy}</p>
      <label className="cm-field">
        <span>{t.exportCodeLabel}</span>
        <input
          type="text"
          value={codeInput}
          onChange={(event) => setCodeInput(event.target.value)}
          placeholder="ABCD-EFGH-JKLM"
          autoComplete="off"
          spellCheck="false"
        />
      </label>
      {browserCode && (
        <button className="cm-code-chip" type="button" onClick={() => setCodeInput(browserCode)}>
          {t.browserCode(formatSaveCode(browserCode))}
        </button>
      )}
      {error && <p className="cm-save-message is-error">{error}</p>}
      <button
        className="cm-btn cm-btn-secondary"
        type="button"
        onClick={onLoadCareer}
        disabled={loading || normalizeSaveCode(codeInput).length !== 12}
      >
        <Folder2Open />
        {loading ? t.loadingSave : t.continueExisting}
      </button>
    </article>
  </section>
);

const CareerMode = () => {
  const [bootstrap, setBootstrap] = useState(() => prepareCareerBootstrap(fallbackBootstrap, true));
  const [phase, setPhase] = useState("career-menu");
  const [draft, setDraft] = useState(INITIAL_PROFILE);
  const [profile, setProfile] = useState(null);
  const [decadeRoll, setDecadeRoll] = useState(null);
  const [yearRoll, setYearRoll] = useState(null);
  const [contracts, setContracts] = useState([]);
  const [season, setSeason] = useState(null);
  const [currentRaceIndex, setCurrentRaceIndex] = useState(0);
  const [raceResult, setRaceResult] = useState(null);
  const [raceDevelopment, setRaceDevelopment] = useState(null);
  const [visibleEventCount, setVisibleEventCount] = useState(0);
  const [simulationSpeed, setSimulationSpeed] = useState("normal");
  const [simulationPaused, setSimulationPaused] = useState(false);
  const [evaluation, setEvaluation] = useState(null);
  const [sillySeasonMarket, setSillySeasonMarket] = useState(null);
  const [preContract, setPreContract] = useState(null);
  const [exploringMarket, setExploringMarket] = useState(false);
  const [summary, setSummary] = useState(null);
  const [contractToSign, setContractToSign] = useState(null);
  const [contractSigningMode, setContractSigningMode] = useState("contract");
  const [contractSigningStatus, setContractSigningStatus] = useState("idle");
  const [manualDecadeOpen, setManualDecadeOpen] = useState(false);
  const [rollingTarget, setRollingTarget] = useState(null);
  const [saveCode, setSaveCode] = useState(() => readBrowserSaveCode());
  const [saveCodeInput, setSaveCodeInput] = useState(() => formatSaveCode(readBrowserSaveCode()));
  const [saveStatus, setSaveStatus] = useState("idle");
  const [saveMessage, setSaveMessage] = useState("");
  const [loadStatus, setLoadStatus] = useState("idle");
  const [loadError, setLoadError] = useState("");
  const headerRef = useRef(null);
  const mainRef = useRef(null);
  const raceLivePanelRef = useRef(null);
  const signingTimerRef = useRef(null);
  const rollTimerRef = useRef(null);
  const lang = locale;

  useEffect(() => {
    fetchCareerBootstrap().then(setBootstrap);
  }, []);

  useEffect(() => {
    if (phase !== "race-live" || !raceResult || simulationPaused) return undefined;
    if (visibleEventCount >= raceResult.events.length) return undefined;
    const delay = simulationSpeed === "x3" ? 500 : simulationSpeed === "x2" ? 750 : 1500;
    const timer = window.setTimeout(() => {
      setVisibleEventCount((count) => Math.min(raceResult.events.length, count + 1));
    }, delay);
    return () => window.clearTimeout(timer);
  }, [phase, raceResult, simulationSpeed, simulationPaused, visibleEventCount]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      if (phase === "career-menu") {
        headerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      const selectors = {
        setup: ".cm-setup",
        "decade-choice": ".cm-decade-choice",
        year: ".cm-year-dice",
        contracts: ".cm-contracts",
        season: ".cm-next-race",
        "silly-season": ".cm-silly-season",
        "contract-signing": ".cm-contract-signing",
        "race-live": ".cm-race-live",
        "race-result": ".cm-race-result",
        "race-development": ".cm-race-development",
        "season-review": ".cm-season-review",
        retired: ".cm-retirement",
      };
      const target = selectors[phase] ? mainRef.current?.querySelector(selectors[phase]) : null;
      (target || headerRef.current)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [phase, currentRaceIndex, raceResult, raceDevelopment, evaluation, summary]);

  useEffect(
    () => () => {
      window.clearTimeout(signingTimerRef.current);
      window.clearTimeout(rollTimerRef.current);
    },
    []
  );

  useEffect(() => {
    window.render_game_to_text = () =>
      JSON.stringify({
        mode: "CareerMode",
        phase,
        profile: profile
          ? {
              name: profile.name,
              rating: profile.rating,
              reputation: profile.reputation,
              status: profile.status,
            }
          : null,
        decade: decadeRoll?.label,
        year: yearRoll,
        contracts: contracts.map((contract) => ({
          team: contract.team.name,
          rating: contract.team.rating,
          targetPoints: contract.objectives.points,
          constructorTarget: contract.objectives.constructorPosition,
          kind: contract.kind || "contract",
        })),
        sillySeason: sillySeasonMarket
          ? {
              round: sillySeasonMarket.round,
              chance: sillySeasonMarket.chance,
              targetYear: sillySeasonMarket.targetYear,
              offers: sillySeasonMarket.offers.map((offer) => offer.team.name),
            }
          : null,
        preContract: preContract
          ? {
              team: preContract.team.name,
              targetYear: preContract.targetYear,
              round: preContract.generatedAtRound,
            }
          : null,
        season: season
          ? {
              year: season.year,
              team: season.contract.team.name,
              round: currentRaceIndex + 1,
              races: season.races.length,
              playerStanding: season.driverStandings.find((row) => row.isPlayer),
            }
          : null,
        race: raceResult
          ? {
              name: raceResult.race.name,
              lapCount: raceResult.race.lapCount,
              visibleEvents: visibleEventCount,
              totalEvents: raceResult.events.length,
              simulationSpeed,
              playerResult: raceResult.playerResult,
              winner: raceResult.winner,
              eventCatalogStats: raceResult.eventCatalogStats,
            }
          : null,
        development: raceDevelopment
          ? {
              rating: raceDevelopment.nextProfile.rating,
              deltas: raceDevelopment.deltas,
              xpGains: ATTRIBUTE_KEYS.reduce((acc, key) => {
                acc[key] = Math.round(raceDevelopment.xpGains[key] || 0);
                return acc;
              }, {}),
            }
          : null,
        summary,
      });
    window.advanceTime = () => undefined;
    return () => {
      delete window.render_game_to_text;
      delete window.advanceTime;
    };
  }, [phase, profile, decadeRoll, yearRoll, contracts, sillySeasonMarket, preContract, season, currentRaceIndex, raceResult, raceDevelopment, visibleEventCount, simulationSpeed, summary]);

  const clearRuntimeTimers = () => {
    window.clearTimeout(signingTimerRef.current);
    window.clearTimeout(rollTimerRef.current);
  };

  const applyCareerSnapshot = (snapshot) => {
    const state = snapshot?.v === CAREER_SAVE_VERSION ? snapshot : snapshot?.state;
    if (!state) {
      throw new Error("invalid snapshot");
    }
    clearRuntimeTimers();
    setPhase(state.phase || "setup");
    setDraft(state.draft || INITIAL_PROFILE);
    setProfile(state.profile || null);
    setDecadeRoll(state.decadeRoll || null);
    setYearRoll(state.yearRoll || null);
    setContracts(Array.isArray(state.contracts) ? state.contracts : []);
    setSeason(state.season || null);
    setCurrentRaceIndex(Number.isFinite(state.currentRaceIndex) ? state.currentRaceIndex : 0);
    setRaceResult(state.raceResult || null);
    setRaceDevelopment(state.raceDevelopment || null);
    setVisibleEventCount(Number.isFinite(state.visibleEventCount) ? state.visibleEventCount : 0);
    setSimulationSpeed(state.simulationSpeed || "normal");
    setSimulationPaused(Boolean(state.simulationPaused));
    setEvaluation(state.evaluation || null);
    setSillySeasonMarket(state.sillySeasonMarket || null);
    setPreContract(state.preContract || null);
    setExploringMarket(Boolean(state.exploringMarket));
    setSummary(state.summary || null);
    setContractToSign(state.contractToSign || null);
    setContractSigningMode(state.contractSigningMode || "contract");
    setContractSigningStatus(state.contractSigningStatus || "idle");
    setManualDecadeOpen(Boolean(state.manualDecadeOpen));
    setRollingTarget(null);
  };

  const buildCareerSnapshot = () => ({
    v: CAREER_SAVE_VERSION,
    phase,
    draft,
    profile,
    decadeRoll,
    yearRoll,
    contracts,
    season,
    currentRaceIndex,
    raceResult,
    raceDevelopment,
    visibleEventCount,
    simulationSpeed,
    simulationPaused,
    evaluation,
    sillySeasonMarket,
    preContract,
    exploringMarket,
    summary,
    contractToSign,
    contractSigningMode,
    contractSigningStatus,
    manualDecadeOpen,
  });

  const reset = () => {
    setPhase("setup");
    setDraft(INITIAL_PROFILE);
    setProfile(null);
    setDecadeRoll(null);
    setYearRoll(null);
    setContracts([]);
    setSeason(null);
    setCurrentRaceIndex(0);
    setRaceResult(null);
    setRaceDevelopment(null);
    setVisibleEventCount(0);
    setSimulationSpeed("normal");
    setSimulationPaused(false);
    setEvaluation(null);
    setSillySeasonMarket(null);
    setPreContract(null);
    setExploringMarket(false);
    setSummary(null);
    setContractToSign(null);
    setContractSigningMode("contract");
    setContractSigningStatus("idle");
    setManualDecadeOpen(false);
    setRollingTarget(null);
    setSaveMessage("");
    setLoadError("");
    clearRuntimeTimers();
  };

  const openNewCareer = () => {
    reset();
    setPhase("setup");
  };

  const handleSave = async () => {
    if (phase === "career-menu") return;
    setSaveStatus("saving");
    setSaveMessage("");
    try {
      const response = await saveCareerState({ code: saveCode, state: buildCareerSnapshot() });
      setSaveCode(response.code);
      setSaveCodeInput(formatSaveCode(response.code));
      writeBrowserSaveCode(response.code);
      setSaveStatus("saved");
      setSaveMessage(t.saveSuccess(formatSaveCode(response.code)));
    } catch (error) {
      setSaveStatus("error");
      setSaveMessage(t.saveError);
    }
  };

  const handleLoad = async () => {
    setLoadStatus("loading");
    setLoadError("");
    try {
      const response = await loadCareerState(saveCodeInput);
      applyCareerSnapshot(response.state);
      setSaveCode(response.code);
      setSaveCodeInput(formatSaveCode(response.code));
      writeBrowserSaveCode(response.code);
      setSaveMessage(t.loadSuccess(formatSaveCode(response.code)));
      setLoadStatus("idle");
    } catch (error) {
      setLoadStatus("idle");
      setLoadError(t.loadError);
    }
  };

  const startProfile = () => {
    const nextProfile = {
      ...INITIAL_PROFILE,
      name: draft.name.trim(),
      helmetColor: draft.helmetColor,
      helmetColor2: draft.helmetColor2,
      helmetStyle: draft.helmetStyle,
    };
    setProfile(nextProfile);
    setDecadeRoll(null);
    setYearRoll(null);
    setManualDecadeOpen(false);
    setRollingTarget(null);
    setPhase("decade-choice");
  };

  const chooseDecade = (decade) => {
    if (!decade) return;
    window.clearTimeout(rollTimerRef.current);
    setRollingTarget("decade");
    setDecadeRoll(decade);
    setYearRoll(null);
    rollTimerRef.current = window.setTimeout(() => {
      setRollingTarget(null);
      setPhase("year");
    }, 520);
  };

  const rollDecade = () => {
    const decades = playableDecades(bootstrap);
    const picked = decades[Math.floor(Math.random() * decades.length)] || bootstrap.decades?.[0];
    chooseDecade(picked);
  };

  const rollYear = () => {
    const year = randomYearInDecade(bootstrap, decadeRoll);
    window.clearTimeout(rollTimerRef.current);
    setRollingTarget("year");
    setYearRoll(year);
    rollTimerRef.current = window.setTimeout(() => {
      const nextContracts = generateContracts({ bootstrap, year, playerProfile: profile });
      setContracts(nextContracts);
      setRollingTarget(null);
      setPhase("contracts");
    }, 760);
  };

  const beginContractSigning = (contract, mode = "contract") => {
    setContractToSign(contract);
    setContractSigningMode(mode);
    setContractSigningStatus("idle");
    setPhase("contract-signing");
  };

  const signContractDocument = () => {
    window.clearTimeout(signingTimerRef.current);
    setContractSigningStatus("signing");
    signingTimerRef.current = window.setTimeout(() => setContractSigningStatus("linked"), 1450);
  };

  const cancelContractSigning = () => {
    window.clearTimeout(signingTimerRef.current);
    setContractToSign(null);
    setContractSigningStatus("idle");
    setPhase(contractSigningMode === "precontract" ? "silly-season" : evaluation ? "season-review" : "contracts");
  };

  const applySignedContract = () => {
    if (!contractToSign) return;
    window.clearTimeout(signingTimerRef.current);
    if (contractSigningMode === "precontract") {
      setPreContract(contractToSign);
      setSillySeasonMarket(null);
      setContractToSign(null);
      setContractSigningStatus("idle");
      setPhase("season");
      return;
    }
    const nextSeason = createCareerSeason({ bootstrap, profile, year: yearRoll, contract: contractToSign });
    setSeason(nextSeason);
    setCurrentRaceIndex(0);
    setEvaluation(null);
    setRaceResult(null);
    setRaceDevelopment(null);
    setSillySeasonMarket(null);
    setPreContract(null);
    setExploringMarket(false);
    setContractToSign(null);
    setContractSigningStatus("idle");
    setPhase("season");
  };

  const simulateRace = () => {
    if (!season || currentRaceIndex >= season.races.length) return;
    const result = simulateCareerRace({ season, raceIndex: currentRaceIndex, profile });
    setRaceResult(result);
    setRaceDevelopment(null);
    setVisibleEventCount(1);
    setSimulationSpeed("normal");
    setSimulationPaused(false);
    setPhase("race-live");
  };

  const showRaceResult = () => setPhase("race-result");
  const skipToRaceResult = () => {
    if (raceResult) {
      setVisibleEventCount(raceResult.events.length);
    }
    setPhase("race-result");
  };

  const showRaceDevelopment = () => {
    if (!profile || !raceResult || !season) return;
    setRaceDevelopment(buildRaceDevelopment({ profile, raceResult, season }));
    setPhase("race-development");
  };

  const continueSeason = () => {
    const activeDevelopment =
      raceDevelopment || (profile && raceResult && season ? buildRaceDevelopment({ profile, raceResult, season }) : null);
    const updatedProfile = activeDevelopment?.nextProfile || profile;
    const nextSeason = completeRace(season, currentRaceIndex, raceResult);
    setSeason(nextSeason);
    setRaceResult(null);
    setRaceDevelopment(null);
    setVisibleEventCount(0);
    setSimulationSpeed("normal");
    if (currentRaceIndex + 1 >= nextSeason.races.length) {
      const seasonEvaluation = evaluateSeason({ season: nextSeason, profile: updatedProfile });
      const nextYear = (bootstrap.seasonYears || []).find((year) => year > nextSeason.year) || nextSeason.year + 1;
      if (seasonEvaluation.nextProfile.age > FINAL_AGE) {
        setProfile(seasonEvaluation.nextProfile);
        setSummary(retirementSummary(seasonEvaluation.nextProfile, nextSeason));
        setPhase("retired");
        return;
      }
      const nextContracts = generateContracts({
        bootstrap,
        year: nextYear,
        playerProfile: seasonEvaluation.nextProfile,
      });
      setEvaluation({ ...seasonEvaluation, nextYear });
      setProfile(seasonEvaluation.nextProfile);
      setYearRoll(nextYear);
      setContracts(nextContracts);
      setExploringMarket(false);
      setPhase("season-review");
    } else {
      const market = sillySeasonMarketWindow({
        bootstrap,
        season: nextSeason,
        profile: updatedProfile,
        alreadySigned: Boolean(preContract),
      });
      setProfile(updatedProfile);
      setCurrentRaceIndex(currentRaceIndex + 1);
      if (market?.offers?.length) {
        setSillySeasonMarket(market);
        setPhase("silly-season");
      } else {
        setSillySeasonMarket(null);
        setPhase("season");
      }
    }
  };

  const passPreContracts = () => {
    setSillySeasonMarket(null);
    setPhase("season");
  };

  const exploreFinalMarket = () => {
    setExploringMarket(true);
    setPreContract(null);
  };

  const retire = () => {
    setSummary(retirementSummary(profile || draft, season));
    setPhase("retired");
  };

  const visibleEvents = useMemo(
    () => (raceResult ? raceResult.events.slice(0, visibleEventCount) : []),
    [raceResult, visibleEventCount]
  );
  const availableDecades = useMemo(() => playableDecades(bootstrap), [bootstrap]);
  const displaySeasonYear = season?.year || yearRoll;

  return (
    <main className={`career-mode-page cm-phase-${phase}`}>
      <section className="cm-shell">
        <header className="cm-header" ref={headerRef}>
          <div className="cm-brand-block">
            <img className="cm-brand-mark" src="/LogoOverCut.png" alt="OverCut" />
            <div>
              <span>{t.careerKicker}</span>
              <h1>{t.careerTitle}</h1>
            </div>
          </div>
          <nav className="cm-actions">
            <Link to="/" className="cm-home-link" aria-label={t.backToHome}>
              <ArrowLeftShort size={28} />
              <span>{t.homeLabel}</span>
            </Link>
            {phase !== "career-menu" && (
              <button className="cm-btn cm-btn-primary" type="button" onClick={handleSave} disabled={saveStatus === "saving"}>
                <SaveFill />
                {saveStatus === "saving" ? t.saving : t.saveGame}
              </button>
            )}
            {phase !== "career-menu" && (
              <button className="cm-btn cm-btn-secondary" type="button" onClick={reset}>
                <ArrowClockwise />
                {t.restart}
              </button>
            )}
          </nav>
        </header>

        <section className="cm-hero">
          <div>
            <span>{bootstrap.fallbackMode ? t.dataFallback : t.dataCache}</span>
            <h2>
              {phase === "career-menu"
                ? t.heroEntry
                : phase === "setup"
                ? t.heroSetup
                : profile
                ? t.heroProfile(profile.name, statusLabel(profile.status), profile.seasons + 1, displaySeasonYear)
                : t.heroFallbackTitle}
            </h2>
            {saveMessage && <p className={`cm-save-message${saveStatus === "error" ? " is-error" : ""}`}>{saveMessage}</p>}
          </div>
          {profile && (
            <div className="cm-hero-profile">
              <HelmetIcon {...helmetFor(profile)} size={42} />
              <span>{t.heroAge(profile.age)}</span>
              <span>{t.heroRep(profile.reputation)}</span>
              <b>{t.heroRtg(profile.rating)}</b>
            </div>
          )}
        </section>

        <section className="cm-main" ref={mainRef}>
          {phase === "career-menu" && (
            <CareerEntryPanel
              codeInput={saveCodeInput}
              setCodeInput={setSaveCodeInput}
              browserCode={saveCode}
              loading={loadStatus === "loading"}
              error={loadError}
              onNewCareer={openNewCareer}
              onLoadCareer={handleLoad}
            />
          )}
          {phase === "setup" && <SetupPanel draft={draft} setDraft={setDraft} onSubmit={startProfile} />}
          {phase === "decade-choice" && (
            <DecadeChoicePanel
              decades={availableDecades}
              decadeRoll={decadeRoll}
              rolling={rollingTarget === "decade"}
              manualOpen={manualDecadeOpen}
              onOpenManual={() => setManualDecadeOpen((open) => !open)}
              onChooseDecade={chooseDecade}
              onRollDecade={rollDecade}
            />
          )}
          {phase === "year" && (
            <DicePanel
              decadeRoll={decadeRoll}
              yearRoll={yearRoll}
              onRollYear={rollYear}
              rolling={rollingTarget === "year"}
            />
          )}
          {phase === "contracts" && (
            <ContractSelection contracts={contracts} year={yearRoll} profile={profile} onSelect={(contract) => beginContractSigning(contract, "contract")} />
          )}
          {phase === "contract-signing" && contractToSign && (
            <ContractSigning
              contract={contractToSign}
              profile={profile}
              year={yearRoll}
              mode={contractSigningMode}
              status={contractSigningStatus}
              onSign={signContractDocument}
              onContinue={applySignedContract}
              onCancel={cancelContractSigning}
            />
          )}
          {phase === "season" && season && (
            <SeasonDashboard
              season={season}
              currentRaceIndex={currentRaceIndex}
              profile={profile}
              preContract={preContract}
              onSimulateRace={simulateRace}
              onRetire={retire}
              canSimulate
              lang={lang}
            />
          )}
          {phase === "silly-season" && sillySeasonMarket && (
            <SillySeasonPanel
              market={sillySeasonMarket}
              onSign={(contract) => beginContractSigning(contract, "precontract")}
              onPass={passPreContracts}
            />
          )}
          {phase === "race-live" && raceResult && (
            <RaceSimulation
              raceResult={raceResult}
              visibleEvents={visibleEvents}
              onFinish={showRaceResult}
              onSkipToResult={skipToRaceResult}
              lang={lang}
              simulationSpeed={simulationSpeed}
              onSpeedChange={setSimulationSpeed}
              paused={simulationPaused}
              onTogglePause={() => setSimulationPaused((value) => !value)}
              panelRef={raceLivePanelRef}
            />
          )}
          {phase === "race-result" && raceResult && (
            <RaceResult raceResult={raceResult} onContinue={showRaceDevelopment} lang={lang} />
          )}
          {phase === "race-development" && raceResult && raceDevelopment && (
            <RaceDevelopment
              development={raceDevelopment}
              raceResult={raceResult}
              onContinue={continueSeason}
              lang={lang}
            />
          )}
          {phase === "season-review" && evaluation && (
            <SeasonReview
              evaluation={evaluation}
              season={season}
              contracts={contracts}
              preContract={preContract}
              exploringMarket={exploringMarket}
              onHonorPreContract={(contract) => beginContractSigning(contract, "contract")}
              onExploreMarket={exploreFinalMarket}
              onContract={(contract) => beginContractSigning(contract, "contract")}
              onRetire={retire}
            />
          )}
          {phase === "retired" && summary && <Retirement summary={summary} onRestart={reset} />}
          <div className="cm-ad-bottom-safe-space" aria-hidden="true" />
        </section>
      </section>
    </main>
  );
};

export default CareerMode;
