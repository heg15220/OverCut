// src/modules/tower/components/TowerGame.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import * as actions from "../actions";
import { getTowerGame, getTowerHint, getTowerThemesCatalog } from "../selectors";

import MinigameTutorial from "../../common/components/MinigameTutorial";
import LoadingScreen from "../../common/components/LoadingScreen";
import CooldownScreen from "../../cooldown/components/CooldownScreen";
import { fetchCooldown } from "../../cooldown/actions";
import { getCooldownForGame } from "../../cooldown/selectors";

import { tutorialTexts } from "../../../helpers/minigameTutorialTexts";

import TowerGuessBox from "./TowerGuessBox";
import TowerHistory from "./TowerHistory";
import TowerAnswerBox from "./TowerAnswerBox";
import { sourceImages } from "../../../helpers/sourceMiniGamesImages";
import "./TowerGame.css";

const TowerGame = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const lang = navigator.language.startsWith("es") ? "es" : "en";

  const game = useSelector(getTowerGame);
  const hint = useSelector(getTowerHint);
  const themesCatalog = useSelector(getTowerThemesCatalog);

  const { canPlay, secondsRemaining, loading } = useSelector((state) =>
    getCooldownForGame(state, "Tower")
  );

  const [showTutorial, setShowTutorial] = useState(true);
  const [showAnswerOverlay, setShowAnswerOverlay] = useState(false);

  const t = useMemo(() => {
    return {
      title: "Tower",
      loading: lang === "es" ? "Cargando..." : "Loading...",
      backToMinigames: lang === "es" ? "Volver al inicio" : "Back home",
      hint: lang === "es" ? "💡 Pista" : "💡 Hint",
      hintLocked:
        lang === "es"
          ? "Pista disponible tras 15 intentos"
          : "Hint available after 15 tries",
      finished: lang === "es" ? "✅ Partida finalizada" : "✅ Game finished",
      keepTrying:
        lang === "es"
          ? "Sigue probando pilotos..."
          : "Keep trying drivers...",
      attemptsLabel: lang === "es" ? "Intentos:" : "Attempts:",
      hintLabel: lang === "es" ? "Temática:" : "Theme:",
      solvedYes: lang === "es" ? "✅ ¡Correcto!" : "✅ Correct!",
      solvedNo: lang === "es" ? "❌ Incorrecto" : "❌ Wrong",
      answerBtn: lang === "es" ? "🎯 Responder" : "🎯 Answer",
      answerLocked:
        lang === "es"
          ? "Responder disponible tras 5 intentos"
          : "Answer available after 5 attempts",
      close: lang === "es" ? "Cerrar" : "Close",
      hintType: {
        team: lang === "es" ? "Equipo" : "Team",
        country: lang === "es" ? "Nacionalidad" : "Nationality",
        champions: lang === "es" ? "Campeón del mundo" : "World champion",
        surname_initial: lang === "es" ? "Inicial del apellido" : "Surname initial",
        teammates: lang === "es" ? "Compañeros de equipo" : "Teammates",
        champion_teammates:
          lang === "es" ? "Compañeros de un campeón" : "Champion teammates",
        circuit_winner: lang === "es" ? "Ganadores en un circuito" : "Circuit winners",
        decade: lang === "es" ? "Década" : "Decade",
      },
    };
  }, [lang]);

  // 1) Traer cooldown al entrar
  useEffect(() => {
    dispatch(fetchCooldown("Tower"));
  }, [dispatch]);

  // 2) Cargar catálogo de themes (solo si puede jugar; así evitas llamadas inútiles)
  useEffect(() => {
    if (!canPlay) return;
    dispatch(actions.loadTowerThemes());
    return () => dispatch(actions.clearTower());
  }, [dispatch, canPlay]);

  const onBack = () => {
    dispatch(actions.clearTower());
    navigate("/minigames");
  };

  const attempts = useMemo(() => {
    if (!game) return 0;
    if (Number.isFinite(game.attempts)) return game.attempts;
    return game.history?.length ?? 0;
  }, [game]);

  const canHint = attempts >= 15 && !(hint?.ok);
  const canAnswer = attempts >= 5 && !game?.finished;

  const onHint = () => {
    if (!game) return;
    dispatch(actions.requestTowerHint(game.id));
  };

  const openAnswer = () => {
    if (!canAnswer) return;
    setShowAnswerOverlay(true);
  };

  const closeAnswer = () => setShowAnswerOverlay(false);

  // ========= Cooldown loading =========
  if (loading) return <LoadingScreen text={t.loading} />;

  // ========= Cooldown blocked =========
  if (!canPlay) {
    return (
      <CooldownScreen
        seconds={secondsRemaining}
        onBack={() => navigate("/minigames")}
      />
    );
  }

  // ========= Tutorial =========
  if (showTutorial) {
    const tutorial = tutorialTexts["/minigames/tower"]?.[lang] || {
      title: "Tower",
      description:
        lang === "es"
          ? "Prueba pilotos para deducir la temática secreta. Tras 15 intentos podrás revelar la temática. Cuando lo tengas, pulsa Responder."
          : "Try drivers to infer the secret theme. After 15 attempts you can reveal the theme. When ready, press Answer.",
    };

    return (
      <MinigameTutorial
        title={tutorial.title}
        description={tutorial.description}
        image={sourceImages(`./Tower.png`)}
        onStart={() => {
          if (!canPlay) return;
          setShowTutorial(false);
          dispatch(actions.startTowerGame(null, null));
        }}
        lang={lang}
      />
    );
  }

  // ========= Loading game =========
  if (!game) return <LoadingScreen text={t.loading} />;

  const hintType = hint?.hintType || null;
  const hintValue = hint?.hintValue || null;
  const hasHint = !!(hint?.ok && hintType);

  return (
    <div className="tower-page">
      <div className="tower-container">
        <header className="tower-header">
          <div className="tower-titleWrap">
            <h1 className="tower-title">{t.title}</h1>
            <p className="tower-subtitle">
              {game.finished ? t.finished : t.keepTrying}
              <span className="tower-attempts">
                {t.attemptsLabel} {attempts}
              </span>
            </p>
          </div>

          <div className="tower-actions">
            {!game.finished && (
              <button
                className={`tower-answerBtn ${canAnswer ? "" : "disabled"}`}
                onClick={openAnswer}
                disabled={!canAnswer}
                title={!canAnswer ? t.answerLocked : t.answerBtn}
                type="button"
              >
                {t.answerBtn}
              </button>
            )}

            <button
              className={`tower-hintBtn ${canHint ? "" : "disabled"}`}
              onClick={onHint}
              disabled={!canHint}
              title={!canHint ? t.hintLocked : t.hint}
              type="button"
            >
              {t.hint}
            </button>

            <button className="tower-backBtn" onClick={onBack} type="button">
              {t.backToMinigames}
            </button>
          </div>
        </header>

        {hasHint && (
          <div className="tower-hintCard">
            <span className="tower-hintLabel">{t.hintLabel}</span>
            <span className="tower-hintValue">
              {t.hintType[hintType] || hintType}
              {hintValue ? ` — ${hintValue}` : ""}
            </span>
          </div>
        )}

        <section className="tower-main">
          <TowerGuessBox lang={lang} gameId={game.id} disabled={!!game.finished} />

          {game.finished && (
            <div className="tower-finishCard tower-finishCard--aboveHistory">
              <div className="tower-finishMsg">
                {game.solved ? t.solvedYes : t.solvedNo}
              </div>

              <button className="tower-backBtn" onClick={onBack} type="button">
                {t.backToMinigames}
              </button>
            </div>
          )}

          <TowerHistory lang={lang} guesses={game.history || []} />

          {showAnswerOverlay && !game.finished && (
            <div className="tower-overlay" role="dialog" aria-modal="true">
              <div className="tower-overlayBackdrop" onClick={closeAnswer} />
              <div className="tower-overlayCard">
                <button
                  className="tower-overlayClose"
                  type="button"
                  onClick={closeAnswer}
                  aria-label={t.close}
                >
                  ✕
                </button>

                <TowerAnswerBox
                  lang={lang}
                  gameId={game.id}
                  themesCatalog={themesCatalog}
                  attempts={attempts}
                />

                <div className="tower-overlayFooter">
                  <button className="tower-backBtn" onClick={closeAnswer} type="button">
                    {t.close}
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default TowerGame;
