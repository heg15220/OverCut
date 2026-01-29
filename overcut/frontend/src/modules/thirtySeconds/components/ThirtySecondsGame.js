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

import "./ThirtySecondsGame.css";

export default function ThirtySecondsGame() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const lang = navigator.language.startsWith("es") ? "es" : "en";

  const game = useSelector(selectors.getGame);
  const suggestions = useSelector(selectors.getSuggestions);

  const [showTutorial, setShowTutorial] = useState(true);
  const [timeLeft, setTimeLeft] = useState(30);

  const [input, setInput] = useState("");
  const [items, setItems] = useState([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const timerRef = useRef(null);

  const { canPlay, secondsRemaining, loading } = useSelector((state) =>
    getCooldownForGame(state, "ThirtySeconds")
  );

  useEffect(() => {
    dispatch(fetchCooldown("ThirtySeconds"));
  }, [dispatch]);

  useEffect(() => {
    if (canPlay) dispatch(actions.startThirtySecondsGame());
  }, [dispatch, canPlay]);

  useEffect(() => {
    if (!game || game.finished || showTutorial) return;

    // Arranca timer una sola vez
    if (timerRef.current) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((t) => t - 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [game, showTutorial]);

  useEffect(() => {
    if (!game || game.finished) return;
    if (timeLeft <= 0) {
      handleSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, game]);

  useEffect(() => {
    if (input.length > 1) {
      const t = setTimeout(() => dispatch(actions.fetchDriverSuggestions(input)), 250);
      return () => clearTimeout(t);
    } else {
      dispatch(actions.clearDriverSuggestions());
    }
  }, [input, dispatch]);

  const tutorial = tutorialTexts["/minigames/thirtySeconds"]?.[lang] || {
    title: lang === "es" ? "30 Seconds" : "30 Seconds",
    description:
      lang === "es"
        ? "Escribe tantos pilotos como puedas en 30 segundos según la temática."
        : "Type as many drivers as you can in 30 seconds for the given theme."
  };

  const themeText = (() => {
    if (!game) return "";
    const v = game.themeValue;
    switch (game.themeType) {
      case "WINNERS_AT_CIRCUIT": return (lang === "es" ? `Ganadores en "${v}"` : `Winners at "${v}"`);
      case "PODIUM_AT_CIRCUIT": return (lang === "es" ? `Podio en "${v}"` : `Podium at "${v}"`);
      case "WINNERS_FOR_TEAM": return (lang === "es" ? `Ganadores con "${v}"` : `Winners for "${v}"`);
      case "PODIUM_FOR_TEAM": return (lang === "es" ? `Podio con "${v}"` : `Podium for "${v}"`);
      case "RACED_FOR_TEAM": return (lang === "es" ? `Corrieron para "${v}"` : `Raced for "${v}"`);
      case "TEAMMATES_OF_DRIVER": return (lang === "es" ? `Compañeros de equipo de "${v}"` : `Teammates of "${v}"`);
      case "NATIONALITY": return (lang === "es" ? `Nacionalidad "${v}"` : `Nationality "${v}"`);
      default: return v;
    }
  })();

  const addItem = (name) => {
    const s = (name || "").trim();
    if (!s) return;

    const key = s.toLowerCase();
    if (items.some((x) => x.toLowerCase() === key)) return;

    setItems((prev) => [...prev, s]);
    setInput("");
    setHighlightedIndex(-1);
    dispatch(actions.clearDriverSuggestions());
  };

  const handleSubmit = () => {
    if (!game || game.finished) return;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    dispatch(actions.submitThirtySeconds({ gameId: game.id, answers: items }));
  };

  if (loading) return <LoadingScreen lang={lang} text={lang === "es" ? "Cargando..." : "Loading..."} />;

  if (!canPlay) {
    return <CooldownScreen seconds={secondsRemaining} onBack={() => navigate("/minigames")} />;
  }

  if (showTutorial) {
    return (
      <MinigameTutorial
        title={tutorial.title}
        description={tutorial.description}
        image={sourceImages("./ThirtySeconds.png")}
        onStart={() => setShowTutorial(false)}
        lang={lang}
      />
    );
  }

  if (!game) return <LoadingScreen lang={lang} />;

  return (
    <div className="thirty-seconds">
      <div className="ts-header">
        <h2 className="ts-title">30 SECONDS</h2>
        <div className={`ts-timer ${timeLeft <= 5 ? "danger" : ""}`}>{timeLeft}s</div>
      </div>

      <div className="ts-theme">{themeText}</div>

      {!game.finished && (
        <>
          <div className="ts-inputWrap">
            <input
              className="ts-input"
              value={input}
              placeholder={lang === "es" ? "Escribe un piloto y pulsa Enter" : "Type a driver and press Enter"}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
                    addItem(suggestions[highlightedIndex]);
                  } else {
                    addItem(input);
                  }
                } else if (suggestions.length > 0 && e.key === "ArrowDown") {
                  e.preventDefault();
                  setHighlightedIndex((p) => (p + 1) % suggestions.length);
                } else if (suggestions.length > 0 && e.key === "ArrowUp") {
                  e.preventDefault();
                  setHighlightedIndex((p) => (p <= 0 ? suggestions.length - 1 : p - 1));
                }
              }}
            />

            {suggestions.length > 0 && (
              <div className="ts-suggestions">
                {suggestions.map((s, idx) => (
                  <div
                    key={idx}
                    className={`ts-suggestion ${idx === highlightedIndex ? "selected" : ""}`}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => addItem(s)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                  >
                    {s}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="ts-chips">
            {items.map((x, i) => (
              <span key={i} className="ts-chip">
                {x}
                <button className="ts-chipRemove" onClick={() => setItems(items.filter((_, idx) => idx !== i))}>
                  ×
                </button>
              </span>
            ))}
          </div>

          <button className="ts-submit" onClick={handleSubmit}>
            {lang === "es" ? "Enviar" : "Submit"}
          </button>
        </>
      )}

      {game.finished && (
        <div className="ts-result">
          <h3>{lang === "es" ? "Resultado" : "Result"}</h3>
          <p>
            {lang === "es"
              ? `Aciertos: ${game.correctAnswers} / ${game.totalSubmitted}`
              : `Correct: ${game.correctAnswers} / ${game.totalSubmitted}`}
          </p>

          <div className="ts-list">
            {game.answers?.map((a, idx) => (
              <div key={idx} className={`ts-row ${a.correct ? "ok" : "bad"}`}>
                <span>{a.answerText}</span>
                <span>{a.correct ? "✅" : "❌"}</span>
              </div>
            ))}
          </div>

          <button className="ts-back" onClick={() => navigate("/minigames")}>
            ⬅️ {lang === "es" ? "Volver al inicio" : "Back home"}
          </button>
        </div>
      )}
    </div>
  );
}
