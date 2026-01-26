// src/modules/higherLower/components/HigherLowerGame.jsx
import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import * as actions from "../actions";
import * as selectors from "../selectors";

import MinigameTutorial from "../../common/components/MinigameTutorial";
import LoadingScreen from "../../common/components/LoadingScreen";
import CooldownScreen from "../../cooldown/components/CooldownScreen";
import { fetchCooldown } from "../../cooldown/actions";
import { getCooldownForGame } from "../../cooldown/selectors";
import { sourceImages } from "../../../helpers/sourceMiniGamesImages";
import { tutorialTexts } from "../../../helpers/minigameTutorialTexts";

import "./HigherLowerGame.css";

export default function HigherLowerGame() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const lang = navigator.language.startsWith("es") ? "es" : "en";
  const game = useSelector(selectors.getGame);

  const { canPlay, secondsRemaining, loading } = useSelector((state) =>
    getCooldownForGame(state, "HigherLower")
  );

  const [showTutorial, setShowTutorial] = useState(true);

  // UI states
  const [revealed, setRevealed] = useState(false);
  const [locked, setLocked] = useState(false);
  const [feedback, setFeedback] = useState(null); // "correct" | "wrong" | null

  // snapshot de la ronda jugada (para revelar SIEMPRE la previa)
  const [revealRound, setRevealRound] = useState(null); // { left, right }

  // refs para detectar “respuesta del backend”
  const awaitingUpdateRef = useRef(false);
  const lastSeenRef = useRef({ score: null, index: null, finished: null, id: null });
  const timerRef = useRef(null);

  useEffect(() => {
    dispatch(fetchCooldown("HigherLower"));
  }, [dispatch]);

  useEffect(() => {
    if (!canPlay) return;
    if (showTutorial) return;
    if (game?.id) return; // evita doble start
    dispatch(actions.startHigherLowerGame());
  }, [canPlay, showTutorial, game?.id, dispatch]);


  // cleanup global
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // reset total al iniciar juego nuevo
  useEffect(() => {
    if (!game?.id) return;

    lastSeenRef.current = {
      score: game.score ?? 0,
      index: game.currentIndex ?? 0,
      finished: !!game.finished,
      id: game.id,
    };

    awaitingUpdateRef.current = false;

    setFeedback(null);
    setRevealed(false);
    setLocked(false);
    setRevealRound(null);

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
  }, [game?.id]);

  // ✅ “listener” del store: cuando el backend responde y cambia game,
  // procesamos SOLO si estamos esperando respuesta de un guess.
  useEffect(() => {
    if (!game) return;
    if (!awaitingUpdateRef.current) return;

    const prev = lastSeenRef.current;
    const curr = {
      score: game.score ?? 0,
      index: game.currentIndex ?? 0,
      finished: !!game.finished,
      id: game.id,
    };

    // Si todavía no ha cambiado nada relevante, NO consumimos el awaiting.
    const changed =
      curr.score !== prev.score ||
      curr.index !== prev.index ||
      curr.finished !== prev.finished ||
      curr.id !== prev.id;

    if (!changed) return;

    // ya llegó update real del backend
    awaitingUpdateRef.current = false;

    const wasCorrect = curr.score > (prev.score ?? 0);

    // actualizamos lastSeen al nuevo estado
    lastSeenRef.current = curr;

    // si terminó, dejamos revelar y listo
    if (curr.finished) {
      setLocked(false);
      setRevealed(true);
      return;
    }

    if (wasCorrect) {
      setFeedback("correct");
      setLocked(true);
      setRevealed(true);

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        // preparar siguiente ronda (ya está en el store)
        setFeedback(null);
        setRevealed(false);
        setLocked(false);
        setRevealRound(null);
        timerRef.current = null;
      }, 2000);
    } else {
      setFeedback("wrong");
      setLocked(false);
      setRevealed(true);
    }
  }, [game?.score, game?.currentIndex, game?.finished, game]);

  const t = {
    loading: { es: "Cargando...", en: "Loading..." },
    higher: { es: "⬆ Higher", en: "⬆ Higher" },
    lower: { es: "⬇ Lower", en: "⬇ Lower" },
    back: { es: "⬅️ Volver", en: "⬅️ Back" },
    win: { es: "🎉 ¡Perfecto! Has completado la ronda.", en: "🎉 Perfect! You completed the run." },
    lose: { es: "❌ Fallaste. Fin de la partida.", en: "❌ Wrong. Game over." },
    correct: { es: "✅ ¡Correcto!", en: "✅ Correct!" },
  };

  if (loading) return <LoadingScreen lang={lang} text={t.loading[lang]} />;

  if (!canPlay) {
    return <CooldownScreen seconds={secondsRemaining} onBack={() => navigate("/minigames")} />;
  }

  if (showTutorial) {
    const tutorial = tutorialTexts["/minigames/higherLower"]?.[lang];
    return (
      <MinigameTutorial
        title={tutorial?.title ?? "Higher or Lower"}
        description={tutorial?.description ?? ""}
        image={sourceImages(`./HigherLower.png`)}
        onStart={() => setShowTutorial(false)}
        lang={lang}
      />
    );
  }

  if (!game) return <LoadingScreen lang={lang} text={t.loading[lang]} />;

  const entries = game.entries || [];
  const i = game.currentIndex || 0;

  // fuente de render:
  // - si estamos revelando una ronda ya jugada -> snapshot
  // - si no -> ronda actual
  const displayLeft = revealRound?.left ?? entries[i];
  const displayRight = revealRound?.right ?? entries[i + 1];

  const done = !!game.finished;

  const onGuess = (dir) => {
    if (done || locked) return;

    // snapshot de LA RONDA ACTUAL (antes de que el backend avance)
    const left = entries[i];
    const right = entries[i + 1];
    setRevealRound({ left, right });

    setLocked(true);
    setRevealed(true); // al pulsar, mostramos valor real (de la ronda jugada)
    setFeedback(null);

    // IMPORTANTÍSIMO: marcamos que esperamos update REAL del backend
    awaitingUpdateRef.current = true;

    dispatch(actions.guessHigherLower(game.id, dir));
  };

  return (
    <div className="higher-lower-container">
      <h1 className="higher-lower-title">Higher or Lower</h1>

      <div className="higher-lower-theme">{game.themeDescription}</div>

      <div className="higher-lower-progress">
        {lang === "es" ? "Puntuación" : "Score"}: {game.score} / {Math.max(0, entries.length - 1)}
      </div>

      {feedback === "correct" && (
        <div className="higher-lower-feedback correct">{t.correct[lang]}</div>
      )}

      <div className="higher-lower-cards">
        <div className={`higher-lower-card ${feedback === "correct" ? "pulse-correct" : ""}`}>
          <div className="higher-lower-name">{displayLeft?.pilotName}</div>
          <div className="higher-lower-value">{displayLeft ? displayLeft.statValue : "-"}</div>
        </div>

        <div className="higher-lower-vs">VS</div>

        <div className={`higher-lower-card ${feedback === "correct" ? "pulse-correct" : ""}`}>
          <div className="higher-lower-name">{displayRight?.pilotName}</div>
          <div className="higher-lower-value">
            {revealed || done ? displayRight?.statValue : "???"}
          </div>
        </div>
      </div>

      {!done && displayRight && (
        <div className="higher-lower-actions">
          <button className="higher-lower-btn" disabled={locked} onClick={() => onGuess("higher")}>
            {t.higher[lang]}
          </button>
          <button className="higher-lower-btn" disabled={locked} onClick={() => onGuess("lower")}>
            {t.lower[lang]}
          </button>
        </div>
      )}

      {done && (
        <div className={`higher-lower-result ${game.won ? "win" : "lose"}`}>
          {game.won ? t.win[lang] : t.lose[lang]}
        </div>
      )}

      <div className="higher-lower-footer">
        <button className="higher-lower-btn secondary" onClick={() => navigate("/minigames")}>
          {t.back[lang]}
        </button>
      </div>
    </div>
  );
}
