// src/modules/whoiswho/components/WhoIsWhoGame.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
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

import "./WhoIsWhoGame.css";

export default function WhoIsWhoGame() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const lang = navigator.language.startsWith("es") ? "es" : "en";
  const t = useMemo(
    () => ({
      es: {
        title: "Who Am I?",
        loading: "Cargando...",
        nextHint: "Mostrar pista",
        guess: "Adivinar",
        surrender: "Revelar respuesta",
        back: "🏁 Volver al inicio",
        placeholder: "Escribe el piloto (ej: Fernando Alonso)",
        attempts: "Intentos",
        hints: "Pistas",
        correct: "✅ ¡Correcto!",
        wrong: "❌ Incorrecto",
        attemptsLeft: "Intentos restantes",
        answerLabel: "Respuesta:",
        itWas: "Era:",
        select: "Seleccionar",
        correctToastTitle: "¡Correcto!",
        correctToastSubA: "Era",
        enter: "ENTER",
      },
      en: {
        title: "Who Am I?",
        loading: "Loading...",
        nextHint: "Show hint",
        guess: "Guess",
        surrender: "Reveal answer",
        back: "🏁 Back to home",
        placeholder: "Type the driver (e.g. Fernando Alonso)",
        attempts: "Attempts",
        hints: "Hints",
        correct: "✅ Correct!",
        wrong: "❌ Wrong",
        attemptsLeft: "Attempts left",
        answerLabel: "Answer:",
        itWas: "It was:",
        select: "Select",
        correctToastTitle: "Correct!",
        correctToastSubA: "It was",
        enter: "ENTER",
      },
    })[lang],
    [lang]
  );

  const game = useSelector(selectors.getWhoIsWhoGame);
  const guessResult = useSelector(selectors.getWhoIsWhoGuessResult);
  const suggestions = useSelector(selectors.getWhoIsWhoAutocompleteItems);
  const revealedAnswer = useSelector(selectors.getWhoIsWhoRevealedAnswer);

  const [showTutorial, setShowTutorial] = useState(true);
  const [guessText, setGuessText] = useState("");
  const [showSug, setShowSug] = useState(false);

  // keyboard navigation for suggestions
  const [activeSugIndex, setActiveSugIndex] = useState(-1);

  // UI feedback
  const [celebrate, setCelebrate] = useState(false);
  const [shake, setShake] = useState(false);

  // sticky result to keep it visible AND keep attempts synced
  const [stickyResult, setStickyResult] = useState(null);
  // { correct: boolean, attemptsLeft: number, attemptsUsed: number }

  // auto-first-hint control
  const didAutoFirstHintRef = useRef(false);
  const prevGameIdRef = useRef(null);

  // To ensure toast ONLY after "Guess"
  const lastActionRef = useRef(null); // "guess" | "reveal" | "hint" | null

  const { canPlay, secondsRemaining, loading } = useSelector((state) =>
    getCooldownForGame(state, "WhoIsWho")
  );

  useEffect(() => {
    dispatch(fetchCooldown("WhoIsWho"));
  }, [dispatch]);

  useEffect(() => {
    if (canPlay) dispatch(actions.startWhoIsWhoGame());
  }, [canPlay, dispatch]);

  // reset flags if game changes
  useEffect(() => {
    const gid = game?.id ?? null;
    if (prevGameIdRef.current !== gid) {
      prevGameIdRef.current = gid;
      didAutoFirstHintRef.current = false;
      lastActionRef.current = null;
      setCelebrate(false);
      setShake(false);
      setStickyResult(null);
      setActiveSugIndex(-1);
      setShowSug(false);
      setGuessText("");
    }
  }, [game?.id]);

  // first hint automatically
  useEffect(() => {
    if (!game) return;
    if (game.finished) return;

    const revealedLen = (game.revealedHints || []).length;
    const shouldAuto =
      !didAutoFirstHintRef.current &&
      game.hintsShown === 0 &&
      revealedLen === 0;

    if (shouldAuto) {
      didAutoFirstHintRef.current = true;
      lastActionRef.current = "hint";
      dispatch(actions.nextHint(game.id));
    }
  }, [game, dispatch]);

  // feedback ONLY when it comes from "guess" + persist result (sync attempts)
  useEffect(() => {
    if (!guessResult) return;
    if (lastActionRef.current !== "guess") return;

    lastActionRef.current = null;

    const nextAttemptsUsed =
      game?.maxAttempts != null && guessResult.attemptsLeft != null
        ? Math.max(
            0,
            Math.min(game.maxAttempts, game.maxAttempts - guessResult.attemptsLeft)
          )
        : game?.attemptsUsed ?? 0;

    setStickyResult({
      correct: !!guessResult.correct,
      attemptsLeft: guessResult.attemptsLeft,
      attemptsUsed: nextAttemptsUsed,
    });

    if (guessResult.correct) {
      setCelebrate(true);
      const to = setTimeout(() => setCelebrate(false), 1400);

      setGuessText("");
      setShowSug(false);
      setActiveSugIndex(-1);
      dispatch(actions.clearAutocomplete());

      return () => clearTimeout(to);
    } else {
      setShake(true);
      const to = setTimeout(() => setShake(false), 420);
      return () => clearTimeout(to);
    }
  }, [guessResult, dispatch, game]);

  const tutorial = tutorialTexts["/minigames/whoIsWho"]?.[lang];

  const finished = Boolean(game?.finished || guessResult?.finished);

  const attemptsLeftBase = game
    ? Math.max(0, game.maxAttempts - game.attemptsUsed)
    : 0;

  const attemptsUsedEffective =
    stickyResult?.attemptsUsed != null
      ? stickyResult.attemptsUsed
      : game?.attemptsUsed ?? 0;

  const attemptsLeftEffective =
    stickyResult?.attemptsLeft != null ? stickyResult.attemptsLeft : attemptsLeftBase;

  const hintLimitReached = game ? game.hintsShown >= game.maxHints : true;

  const correctName =
    revealedAnswer ||
    guessResult?.answer ||
    guessResult?.correctAnswer ||
    game?.answer ||
    game?.correctAnswer ||
    "—";

  const chooseSuggestion = (name) => {
    setGuessText(name);
    setShowSug(false);
    setActiveSugIndex(-1);
    dispatch(actions.clearAutocomplete());
  };

  const onNextHint = () => {
    if (!game) return;
    lastActionRef.current = "hint";
    dispatch(actions.nextHint(game.id));
  };

  const onGuess = () => {
    if (!game) return;
    if (!guessText.trim()) return;
    lastActionRef.current = "guess";
    dispatch(actions.guess(game.id, guessText.trim()));
  };

  const onReveal = () => {
    if (!game) return;
    lastActionRef.current = "reveal";
    dispatch(actions.reveal(game.id));
  };

  if (loading) return <LoadingScreen lang={lang} text={t.loading} />;

  if (!canPlay) {
    return (
      <CooldownScreen seconds={secondsRemaining} onBack={() => navigate("/minigames")} />
    );
  }

  if (showTutorial) {
    return (
      <MinigameTutorial
        title={tutorial?.title ?? t.title}
        description={tutorial?.description ?? ""}
        image={sourceImages(`./WhoAmI.png`)}
        onStart={() => setShowTutorial(false)}
        lang={lang}
      />
    );
  }

  if (!game) return <LoadingScreen lang={lang} text={t.loading} />;

  const showSuggestions = showSug && suggestions.length > 0;
  const cappedSuggestions = suggestions.slice(0, 10);

  // ✅ Put aria-expanded on combobox wrapper (not on input => removes eslint warning)
  const activeDescId =
    showSuggestions && activeSugIndex >= 0 ? `whoiswho-sug-${activeSugIndex}` : undefined;

  return (
    <div className="whoiswho">
      <h2 className="whoiswho__title">🕵️ {t.title}</h2>

      {celebrate && (
        <div className="whoiswho__toast" aria-live="polite">
          <div className="whoiswho__toastBadge">✅</div>
          <div className="whoiswho__toastText">
            <div className="whoiswho__toastTitle">{t.correctToastTitle}</div>
            <div className="whoiswho__toastSub">
              {t.correctToastSubA} <b>{correctName}</b>
            </div>
          </div>
        </div>
      )}

      <div className="whoiswho__meta">
        <div className="whoiswho__pill">
          {t.hints}: <b>{game.hintsShown}</b> / {game.maxHints}
        </div>
        <div className="whoiswho__pill">
          {t.attempts}: <b>{attemptsUsedEffective}</b> / {game.maxAttempts}
        </div>
      </div>

      <div className="whoiswho__hints">
        {(game.revealedHints || []).length === 0 ? (
          <div className="whoiswho__empty">—</div>
        ) : (
          (game.revealedHints || []).map((h) => (
            <div key={h.id} className="whoiswho__hint">
              <span className="whoiswho__hintOrder">#{h.order}</span>
              <span>{h.text}</span>
            </div>
          ))
        )}
      </div>

      {!finished && (
        <>
          <div className="whoiswho__controls">
            <button
              className="whoiswho__btn whoiswho__btn--hint"
              onClick={onNextHint}
              disabled={hintLimitReached}
            >
              {t.nextHint}
            </button>

            <button className="whoiswho__btn whoiswho__btn--reveal" onClick={onReveal}>
              {t.surrender}
            </button>
          </div>

          <div className={`whoiswho__guessBox ${shake ? "is-shaking" : ""}`}>
            {/* ✅ combobox wrapper carries aria-expanded */}
            <div
              className="whoiswho__inputWrap"
              role="combobox"
              aria-haspopup="listbox"
              aria-owns="whoiswho-sug-list"
              aria-expanded={showSuggestions}
            >
              <span className="whoiswho__inputIcon">🏎️</span>

              <input
                className="whoiswho__input"
                value={guessText}
                onChange={(e) => {
                  const v = e.target.value;
                  setGuessText(v);
                  dispatch(actions.autocomplete(v));
                  setShowSug(true);
                  setActiveSugIndex(-1);
                }}
                onBlur={() => setTimeout(() => setShowSug(false), 120)}
                onFocus={() => setShowSug(true)}
                onKeyDown={(e) => {
                  if (!showSuggestions) {
                    if (e.key === "Enter") onGuess();
                    return;
                  }

                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setActiveSugIndex((i) => {
                      const next = i + 1;
                      return next >= cappedSuggestions.length ? 0 : next;
                    });
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setActiveSugIndex((i) => {
                      const max = cappedSuggestions.length - 1;
                      const next = i - 1;
                      return next < 0 ? max : next;
                    });
                  } else if (e.key === "Enter") {
                    e.preventDefault();
                    const idx = activeSugIndex >= 0 ? activeSugIndex : 0;
                    const pick = cappedSuggestions[idx];
                    if (pick) chooseSuggestion(pick);
                    else onGuess();
                  } else if (e.key === "Escape") {
                    e.preventDefault();
                    setShowSug(false);
                    setActiveSugIndex(-1);
                  }
                }}
                placeholder={t.placeholder}
                disabled={attemptsLeftEffective <= 0}
                autoComplete="off"
                aria-autocomplete="list"
                aria-controls="whoiswho-sug-list"
                aria-activedescendant={activeDescId}
              />

              {showSuggestions && (
                <div className="whoiswho__suggestions" role="listbox" id="whoiswho-sug-list">
                  {cappedSuggestions.map((name, idx) => {
                    const isActive = idx === activeSugIndex;
                    return (
                      <button
                        type="button"
                        key={name}
                        id={`whoiswho-sug-${idx}`}
                        role="option"
                        aria-selected={isActive}
                        className={`whoiswho__suggestion ${isActive ? "is-active" : ""}`}
                        onMouseDown={(e) => e.preventDefault()}
                        onMouseEnter={() => setActiveSugIndex(idx)}
                        onClick={() => chooseSuggestion(name)}
                      >
                        <span className="whoiswho__suggestionLeft">
                          <span className={`whoiswho__suggestionArrow ${isActive ? "on" : ""}`}>
                            ▶
                          </span>
                          <span className="whoiswho__suggestionName">{name}</span>
                        </span>

                        <span className="whoiswho__suggestionRight">
                          {isActive && <span className="whoiswho__kbd">{t.enter}</span>}
                          <span className="whoiswho__suggestionHint">{t.select}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              className="whoiswho__btn whoiswho__btn--guess"
              onClick={onGuess}
              disabled={attemptsLeftEffective <= 0}
            >
              {t.guess}
            </button>
          </div>

          {stickyResult && (
            <div className={`whoiswho__result ${stickyResult.correct ? "ok" : "bad"}`}>
              <div>
                {stickyResult.correct ? t.correct : t.wrong} · {t.attemptsLeft}:{" "}
                {attemptsLeftEffective}
              </div>

              {stickyResult.correct && (
                <div className="whoiswho__resultAnswer">
                  {t.itWas} <b>{correctName}</b>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {finished && (
        <div className="whoiswho__finished">
          <div className="whoiswho__answer">
            {t.answerLabel} <b>{correctName}</b>
          </div>

          <button className="whoiswho__btn whoiswho__btn--back" onClick={() => navigate("/minigames")}>
            {t.back}
          </button>
        </div>
      )}
    </div>
  );
}
