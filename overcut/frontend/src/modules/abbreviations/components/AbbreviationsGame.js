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

import "./AbbreviationsGame.css";

export default function AbbreviationsGame() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const lang = navigator.language.startsWith("es") ? "es" : "en";

  const game = useSelector(selectors.getGame);
  const suggestions = useSelector(selectors.getSuggestions);

  const [showTutorial, setShowTutorial] = useState(true);
  const [input, setInput] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  // Para animar solo los "nuevos solved"
  const prevSolvedRef = useRef(new Set());
  const [popping, setPopping] = useState(new Set());

  const { canPlay, secondsRemaining, loading } = useSelector((state) =>
    getCooldownForGame(state, "Abbreviations")
  );

  useEffect(() => {
    dispatch(fetchCooldown("Abbreviations"));
  }, [dispatch]);

  useEffect(() => {
    if (canPlay) dispatch(actions.startAbbreviationsGame());
  }, [dispatch, canPlay]);

  useEffect(() => {
    if (!game?.answers?.length) return;

    const prev = prevSolvedRef.current;
    const nowSolved = new Set(game.answers.filter(a => a.solved).map(a => a.answerOrder));

    const newlySolved = [];
    nowSolved.forEach((idx) => {
      if (!prev.has(idx)) newlySolved.push(idx);
    });

    if (newlySolved.length > 0) {
      setPopping((old) => {
        const next = new Set(old);
        newlySolved.forEach((x) => next.add(x));
        return next;
      });

      // quitar animación tras 650ms
      setTimeout(() => {
        setPopping((old) => {
          const next = new Set(old);
          newlySolved.forEach((x) => next.delete(x));
          return next;
        });
      }, 650);
    }

    prevSolvedRef.current = nowSolved;
  }, [game]);

  useEffect(() => {
    if (input.length > 1) {
      const t = setTimeout(() => dispatch(actions.fetchDriverSuggestions(input)), 250);
      return () => clearTimeout(t);
    } else {
      dispatch(actions.clearDriverSuggestions());
    }
  }, [input, dispatch]);

  const tutorial = tutorialTexts["/minigames/abbreviations"]?.[lang] || {
    title: lang === "es" ? "Abbreviations" : "Abbreviations",
    description:
      lang === "es"
        ? "Adivina el piloto correspondiente a cada abreviatura (3 letras)."
        : "Guess the driver for each 3-letter abbreviation."
  };

  const onGuess = (name) => {
    const s = (name || "").trim();
    if (!s || !game || game.finished) return;

    dispatch(actions.guessAbbreviation({ gameId: game.id, guessText: s }));
    setInput("");
    setHighlightedIndex(-1);
    dispatch(actions.clearDriverSuggestions());
  };

  const solvedCount = game?.answers?.filter(a => a.solved).length || 0;

  if (loading) return <LoadingScreen lang={lang} text={lang === "es" ? "Cargando..." : "Loading..."} />;

  if (!canPlay) {
    return <CooldownScreen seconds={secondsRemaining} onBack={() => navigate("/minigames")} />;
  }

  if (showTutorial) {
    return (
      <MinigameTutorial
        title={tutorial.title}
        description={tutorial.description}
        image={sourceImages("./Abbreviations.png")}
        onStart={() => setShowTutorial(false)}
        lang={lang}
      />
    );
  }

  if (!game) return <LoadingScreen lang={lang} />;

  return (
    <div className="abbr">
      <div className="abbr-header">
        <h2 className="abbr-title">ABBREVIATIONS</h2>
        <div className="abbr-score">
          {lang === "es" ? "Aciertos" : "Solved"}: {solvedCount}/20
        </div>
      </div>

      <div className="abbr-inputWrap">
        <input
          className="abbr-input"
          value={input}
          placeholder={lang === "es" ? "Escribe un piloto y pulsa Enter" : "Type a driver and press Enter"}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
                onGuess(suggestions[highlightedIndex]);
              } else {
                onGuess(input);
              }
            } else if (suggestions.length > 0 && e.key === "ArrowDown") {
              e.preventDefault();
              setHighlightedIndex((p) => (p + 1) % suggestions.length);
            } else if (suggestions.length > 0 && e.key === "ArrowUp") {
              e.preventDefault();
              setHighlightedIndex((p) => (p <= 0 ? suggestions.length - 1 : p - 1));
            }
          }}
          disabled={game.finished}
        />

        {suggestions.length > 0 && (
          <div className="abbr-suggestions">
            {suggestions.map((s, idx) => (
              <div
                key={idx}
                className={`abbr-suggestion ${idx === highlightedIndex ? "selected" : ""}`}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => onGuess(s)}
                onMouseEnter={() => setHighlightedIndex(idx)}
              >
                {s}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="abbr-grid">
        {game.answers?.map((a) => (
          <div
            key={a.answerOrder}
            className={[
              "abbr-card",
              a.solved ? "solved" : "",
              popping.has(a.answerOrder) ? "pop" : ""
            ].join(" ")}
          >
            <div className="abbr-code">{a.abbr}</div>
            <div className="abbr-name">
              {a.solved ? a.revealedName : "???"}
            </div>
          </div>
        ))}
      </div>

      <div className="abbr-footer">
        {game.finished && (
          <div className="abbr-finished">
            ✅ {lang === "es" ? "¡Completado!" : "Completed!"} ({game.correctAnswers}/20)
          </div>
        )}

        <button className="abbr-back" onClick={() => navigate("/minigames")}>
          ⬅️ {lang === "es" ? "Volver al inicio" : "Back home"}
        </button>
      </div>
    </div>
  );
}
