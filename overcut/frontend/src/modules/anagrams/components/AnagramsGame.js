import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import * as actions from "../actions";
import * as selectors from "../selectors";
import "./AnagramsGame.css";

import LoadingScreen from "../../common/components/LoadingScreen";
import MinigameTutorial from "../../common/components/MinigameTutorial";
import CooldownScreen from "../../cooldown/components/CooldownScreen";
import { getCooldownForGame } from "../../cooldown/selectors";
import { fetchCooldown } from "../../cooldown/actions";
import { sourceImages } from "../../../helpers/sourceMiniGamesImages";
import { tutorialTexts } from "../../../helpers/minigameTutorialTexts";

const MAX_ATTEMPTS = 5;

const AnagramsGame = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const game = useSelector(selectors.getAnagramsGame);
  const [guess, setGuess] = useState("");

  const lang = navigator.language.startsWith("es") ? "es" : "en";

  const t = {
    title: { es: "🔀 Anagrams", en: "🔀 Anagrams" },
    placeholder: { es: "Escribe el apellido", en: "Type the surname" },
    guess: { es: "Comprobar", en: "Check" },
    wonRound: { es: "¡Correcto!", en: "Correct!" },
    lostRound: { es: "Fallaste. Era", en: "You missed. It was" },
    wonGame: { es: "¡Partida completada!", en: "Game completed!" },
    lostGame: { es: "Partida terminada", en: "Game finished" },
    attempts: { es: "Intentos", en: "Attempts" },
    round: { es: "Piloto", en: "Driver" },
    of: { es: "de", en: "of" },
    next: { es: "Siguiente", en: "Next" },
    backHome: { es: "Volver al inicio", en: "Back to Home" },
    loading: { es: "Cargando...", en: "Loading..." }
  };

  const tutorial = tutorialTexts["/minigames/anagrams"]?.[lang] || {
    title: t.title[lang],
    description:
      lang === "es"
        ? "Reordena las letras para adivinar el apellido del piloto. Son 6 pilotos por partida."
        : "Reorder the letters to guess the driver's surname. 6 drivers per game."
  };

  const { canPlay, secondsRemaining, loading } = useSelector(state =>
    getCooldownForGame(state, "Anagrams")
  );

  const [showTutorial, setShowTutorial] = useState(true);

  // ✅ Overlay / confirmación de paso de ronda
  const [pendingRoundIndex, setPendingRoundIndex] = useState(null); // ronda que queremos mostrar (congelada)
  const [roundOverlay, setRoundOverlay] = useState(null); // { success, text, isLastRound }
  const lastSeenRoundRef = useRef(null);

  useEffect(() => {
    dispatch(fetchCooldown("Anagrams"));
  }, [dispatch]);

  useEffect(() => {
    if (!canPlay) return;
    if (showTutorial) return;
    if (game?.id) return; // o game?.gameId según tu DTO
    dispatch(actions.startAnagramsGame());
  }, [canPlay, showTutorial, game?.id, dispatch]);


  // ✅ Inicialización del “freeze”
  useEffect(() => {
    if (!game) return;
    const idx = Number.isFinite(game.currentRound) ? game.currentRound : 0;
    if (pendingRoundIndex === null) {
      setPendingRoundIndex(idx);
      lastSeenRoundRef.current = idx;
    }
  }, [game, pendingRoundIndex]);

  // ✅ Detectar avance de ronda: el backend incrementa currentRound tras terminar
  useEffect(() => {
    if (!game) return;

    const newIdx = Number.isFinite(game.currentRound) ? game.currentRound : 0;
    const prevIdx = lastSeenRoundRef.current;

    // primera vez
    if (prevIdx === null || prevIdx === undefined) {
      lastSeenRoundRef.current = newIdx;
      return;
    }

    // si está el overlay activo, NO actualizamos nada
    if (roundOverlay) return;

    // Si ha avanzado (por acierto o por agotar intentos)
    if (newIdx !== prevIdx) {
      // Sacamos info del round anterior (prevIdx) para mostrar resultado
      const prevRound =
        game.rounds?.find(r => r.roundOrder === prevIdx) || game.rounds?.[prevIdx];

      const success = !!prevRound?.successful;
      const surname = prevRound?.surname || "";

      const totalRounds = game.totalRounds || 6;
      const isLastRound = prevIdx === totalRounds - 1;

      setRoundOverlay({
        success,
        isLastRound,
        text: success ? t.wonRound[lang] : `${t.lostRound[lang]} ${surname}`
      });

      // congelamos la UI en la ronda anterior hasta que el usuario pulse “Siguiente”
      setPendingRoundIndex(prevIdx);
      // NO actualizamos lastSeen aún; lo haremos al cerrar overlay
      return;
    }

    // si no hay avance, actualizamos normally
    setPendingRoundIndex(newIdx);
    lastSeenRoundRef.current = newIdx;
  }, [game, lang, roundOverlay, t.lostRound, t.wonRound]);

  const closeOverlayAndAdvance = () => {
    if (!game) return;
    const newIdx = Number.isFinite(game.currentRound) ? game.currentRound : 0;
    setRoundOverlay(null);
    setPendingRoundIndex(newIdx);
    lastSeenRoundRef.current = newIdx;
    setGuess("");
  };

  if (loading) return <LoadingScreen lang={lang} text={t.loading[lang]} />;

  if (!canPlay) {
    return <CooldownScreen seconds={secondsRemaining} onBack={() => navigate("/minigames")} />;
  }

  if (showTutorial) {
    return (
      <MinigameTutorial
        title={tutorial.title}
        description={tutorial.description}
        image={sourceImages(`./Anagrams.png`)}
        onStart={() => setShowTutorial(false)}
        lang={lang}
      />
    );
  }

  if (!game || pendingRoundIndex === null) {
    return <LoadingScreen lang={lang} text={t.loading[lang]} />;
  }

  const totalRounds = game.totalRounds || 6;
  const round =
    game.rounds?.find(r => r.roundOrder === pendingRoundIndex) ||
    game.rounds?.[pendingRoundIndex];

  if (!round) return <LoadingScreen lang={lang} text={t.loading[lang]} />;

  const roundAttempts = round.attempts || [];
  const roundFinished = !!round.finished;

  const handleGuess = () => {
    if (!guess.trim()) return;
    if (game.finished) return;
    if (roundOverlay) return; // ✅ si está el overlay, bloqueamos input
    if (roundFinished) return;

    dispatch(actions.guessAnagrams({ gameId: game.id, guess }));
    setGuess("");
  };

  return (
    <div className="anagrams-container">
      <h2 className="anagrams-title">{t.title[lang]}</h2>

      {/* Progreso */}
      <div className="anagrams-progress">
        {t.round[lang]} {Math.min(pendingRoundIndex + 1, totalRounds)} {t.of[lang]} {totalRounds}
      </div>

      {/* Letras */}
      <div className="anagrams-tiles">
        {(round.scrambled || "").split("").map((c, idx) => (
          <div key={idx} className="anagrams-tile">{c}</div>
        ))}
      </div>

      {/* Input solo si la ronda está activa */}
      {!game.finished && !roundFinished && !roundOverlay && (
        <div className="anagrams-inputRow">
          <input
            className="anagrams-input"
            value={guess}
            onChange={e => setGuess(e.target.value)}
            placeholder={t.placeholder[lang]}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") handleGuess();
            }}
          />
          <button className="anagrams-btn" onClick={handleGuess}>
            {t.guess[lang]}
          </button>
        </div>
      )}

      {/* Intentos de la ronda */}
      <div className="anagrams-attempts">
        <div className="anagrams-attemptsTitle">
          {t.attempts[lang]}: {roundAttempts.length}/{MAX_ATTEMPTS}
        </div>

        {roundAttempts.map(a => (
          <div key={a.attemptOrder} className={`anagrams-attempt ${a.correct ? "ok" : "ko"}`}>
            <span className="num">#{a.attemptOrder + 1}</span>
            <span className="val">{a.guess}</span>
            <span className="res">{a.correct ? "✓" : "✗"}</span>
          </div>
        ))}
      </div>

      {/* ✅ Overlay animado cuando termina una palabra */}
      {roundOverlay && (
        <div className="anagrams-overlay">
          <div className={`anagrams-overlayCard ${roundOverlay.success ? "win" : "lose"} pop`}>
            <div className="anagrams-overlayIcon">
              {roundOverlay.success ? "✅" : "❌"}
            </div>
            <div className="anagrams-overlayText">
              {roundOverlay.text}
            </div>

            {/* Si NO es la última palabra: botón Siguiente */}
            {!roundOverlay.isLastRound && (
              <button className="anagrams-btn" onClick={closeOverlayAndAdvance}>
                {t.next[lang]}
              </button>
            )}

            {/* ✅ Si era la última palabra, el backend ya debería marcar game.finished,
                pero por si el overlay aparece justo antes, damos botón de home igual */}
            {roundOverlay.isLastRound && (
              <button className="anagrams-btn anagrams-btn-home" onClick={() => navigate("/minigames")}>
                {t.backHome[lang]}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ✅ Fin de partida (última palabra ya cerrada / estado final) */}
      {game.finished && !roundOverlay && (
        <div className="anagrams-end">
          <div className={`anagrams-result ${game.successful ? "win" : "lose"}`}>
            {game.successful ? t.wonGame[lang] : t.lostGame[lang]}
          </div>

          <button className="anagrams-btn anagrams-btn-home" onClick={() => navigate("/minigames")}>
            {t.backHome[lang]}
          </button>
        </div>
      )}
    </div>
  );
};

export default AnagramsGame;
