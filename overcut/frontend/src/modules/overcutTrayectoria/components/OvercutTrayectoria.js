/**
 * OverCut Trayectoria - a Formula 1 driver career, played one season at a time.
 *
 * This component is only the shell: it fetches the f1db bootstrap, holds the
 * career object, and decides which phase screen is on. Every rule lives in
 * `../engine`, which is plain JavaScript with no React in it, so the whole game
 * can be driven by a test without rendering anything.
 *
 * The engine context (the bootstrap and the world cache) is kept in a ref rather
 * than in state: it is large, it never re-renders anything on its own, and it
 * must survive every career restart in the same session.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { config } from "../../../config/constants";
import { fallbackBootstrap } from "../data/fallbackBootstrap";
import { prepareBootstrap } from "../engine/world";
import {
  PHASES,
  acceptClause,
  advanceSeason,
  backToOffers,
  createCareer,
  createContext,
  currentEvent,
  makeAsk,
  openEvents,
  openMarket,
  rejectClause,
  resolveEvent,
  runSeason,
  selectOffer,
  setFocus,
  signSelected,
  worldOf,
} from "../engine/career";
import SetupPhase from "./phases/SetupPhase";
import { ClausePhase, NegotiationPhase, OffersPhase } from "./phases/MarketPhase";
import PreseasonPhase from "./phases/PreseasonPhase";
import SeasonPhase from "./phases/SeasonPhase";
import EventPhase from "./phases/EventPhase";
import PressPhase from "./phases/PressPhase";
import RetiredPhase from "./phases/RetiredPhase";
import { locale, t } from "../i18n";
import "./OvercutTrayectoria.css";

const loadBootstrap = async () => {
  try {
    const response = await fetch(`${config.BASE_PATH}/overcutTrayectoria/bootstrap`);
    if (!response.ok) throw new Error(`bootstrap ${response.status}`);
    return prepareBootstrap(await response.json(), { fallbackMode: false });
  } catch (error) {
    // Playable offline: one season per decade is baked into the bundle.
    return prepareBootstrap(fallbackBootstrap, { fallbackMode: true });
  }
};

export const OvercutTrayectoria = () => {
  const [bootstrap, setBootstrap] = useState(null);
  const [career, setCareer] = useState(null);
  const contextRef = useRef(null);
  // Every season's race list, kept for the career-wide strips at retirement.
  const seasonsByYear = useRef({});

  useEffect(() => {
    let active = true;
    loadBootstrap().then((data) => {
      if (!active) return;
      setBootstrap(data);
      contextRef.current = createContext(data, "overcut-trayectoria");
    });
    return () => {
      active = false;
    };
  }, []);

  // A phase change swaps the whole screen under a viewport that stays where the
  // last one left it: finish a negotiation at the bottom of the page and the
  // preseason opens halfway down. Every new screen starts at its own beginning.
  const phase = career?.phase;
  useEffect(() => {
    if (!phase) return;
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [phase]);

  const world = useMemo(() => {
    if (!career || !contextRef.current) return null;
    return worldOf(contextRef.current, career.year);
  }, [career]);

  const start = useCallback((setup) => {
    seasonsByYear.current = {};
    const fresh = createCareer({ ...setup, locale });
    setCareer(openMarket(fresh, contextRef.current));
  }, []);

  const restart = useCallback(() => {
    seasonsByYear.current = {};
    setCareer(null);
  }, []);

  const onSelectOffer = useCallback((teamId) => {
    setCareer((current) => selectOffer(current, teamId));
  }, []);

  const onAsk = useCallback((ask) => {
    setCareer((current) => makeAsk(current, ask));
  }, []);

  const onSign = useCallback(() => {
    setCareer((current) => signSelected(current, contextRef.current));
  }, []);

  const onBackToOffers = useCallback(() => {
    setCareer((current) => backToOffers(current));
  }, []);

  const onAcceptClause = useCallback(() => {
    setCareer((current) => acceptClause(current));
  }, []);

  const onRejectClause = useCallback(() => {
    setCareer((current) => rejectClause(current));
  }, []);

  const onFocus = useCallback((focus) => {
    setCareer((current) => setFocus(current, focus));
  }, []);

  const onRunSeason = useCallback(() => {
    setCareer((current) => {
      const next = runSeason(current, contextRef.current);
      if (next.lastSeason) seasonsByYear.current[next.lastSeason.year] = next.lastSeason.races;
      return next;
    });
  }, []);

  const onSeasonContinue = useCallback(() => {
    setCareer((current) => openEvents(current));
  }, []);

  const onEventChoice = useCallback((optionId) => {
    setCareer((current) => resolveEvent(current, optionId));
  }, []);

  const onPressContinue = useCallback(() => {
    setCareer((current) => advanceSeason(current, contextRef.current));
  }, []);

  if (!bootstrap) {
    return (
      <main className="tr-root tr-root--loading">
        <p className="tr-loading">{t.loading}</p>
      </main>
    );
  }

  return (
    <main className={`tr-root tr-root--${career?.phase || "setup"}`}>
      <div className="tr-cut" aria-hidden="true" />

      <header className="tr-top">
        <Link className="tr-top__back" to="/minigames">
          {t.back}
        </Link>
        <div className="tr-top__brand">
          <span className="tr-top__kicker">{t.kicker}</span>
          <span className="tr-top__title">{t.title}</span>
        </div>
        <div className="tr-top__meta">
          <span className={`tr-source${bootstrap.fallbackMode ? " is-offline" : ""}`}>
            {bootstrap.fallbackMode ? t.dataOffline : t.dataLive}
          </span>
          {career && (
            <button type="button" className="tr-ghost tr-ghost--small" onClick={restart}>
              {t.restart}
            </button>
          )}
        </div>
      </header>

      {career && career.phase !== PHASES.RETIRED && (
        <aside className="tr-hud">
          <span className="tr-hud__year">{career.year}</span>
          <span className="tr-hud__driver">{career.driver.name}</span>
          <span className="tr-hud__age">{career.driver.age}</span>
          {career.contract && <span className="tr-hud__team">{career.contract.teamName}</span>}
          <span className="tr-hud__record">
            {career.totals.wins} · {career.totals.podiums} · {career.totals.titles}
          </span>
        </aside>
      )}

      <div className="tr-stage">
        {!career && <SetupPhase bootstrap={bootstrap} onStart={start} />}

        {career?.phase === PHASES.OFFERS && world && (
          <OffersPhase career={career} world={world} onSelect={onSelectOffer} />
        )}

        {career?.phase === PHASES.NEGOTIATION && (
          <NegotiationPhase career={career} onAsk={onAsk} onSign={onSign} onBack={onBackToOffers} />
        )}

        {career?.phase === PHASES.CLAUSE && world && (
          <ClausePhase
            career={career}
            world={world}
            onAccept={onAcceptClause}
            onReject={onRejectClause}
          />
        )}

        {career?.phase === PHASES.PRESEASON && world && (
          <PreseasonPhase career={career} world={world} onFocus={onFocus} onRun={onRunSeason} />
        )}

        {career?.phase === PHASES.SEASON && (
          <SeasonPhase career={career} onContinue={onSeasonContinue} />
        )}

        {career?.phase === PHASES.EVENT && (
          <EventPhase event={currentEvent(career)} onChoose={onEventChoice} />
        )}

        {career?.phase === PHASES.PRESS && (
          <PressPhase career={career} onContinue={onPressContinue} />
        )}

        {career?.phase === PHASES.RETIRED && (
          <RetiredPhase career={career} seasonsByYear={seasonsByYear.current} onRestart={restart} />
        )}
      </div>
    </main>
  );
};

export default OvercutTrayectoria;
