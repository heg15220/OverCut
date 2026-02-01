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
import { flagEmojiFromCountryCode } from "../../../helpers/flags";

import "./TeamNationalityGame.css";

export default function TeamNationalityGame() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const lang = navigator.language.startsWith("es") ? "es" : "en";

  const game = useSelector(selectors.getGame);
  const suggestions = useSelector(selectors.getSuggestions);

  const [showTutorial, setShowTutorial] = useState(true);
  const [input, setInput] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  // animación para "nuevo acierto"
  const prevCountRef = useRef(0);
  const [poppingOrder, setPoppingOrder] = useState(null);

  const { canPlay, secondsRemaining, loading } = useSelector((state) =>
    getCooldownForGame(state, "TeamNationality")
  );

  useEffect(() => {
    dispatch(fetchCooldown("TeamNationality"));
  }, [dispatch]);

  const startedRef = useRef(false);

  useEffect(() => {
    if (!canPlay) return;
    if (startedRef.current) return;
    startedRef.current = true;
    dispatch(actions.startTeamNationalityGame());
  }, [dispatch, canPlay]);


  useEffect(() => {
    if (!game?.answers) return;

    const nowCount = game.answers.length;
    const prevCount = prevCountRef.current;

    if (nowCount > prevCount) {
      const last = game.answers[nowCount - 1];
      setPoppingOrder(last?.answerOrder ?? nowCount);

      setTimeout(() => setPoppingOrder(null), 650);
    }

    prevCountRef.current = nowCount;
  }, [game]);

  useEffect(() => {
    if (input.length > 1) {
      const t = setTimeout(() => dispatch(actions.fetchTeamNatSuggestions(input)), 250);
      return () => clearTimeout(t);
    } else {
      dispatch(actions.clearTeamNatSuggestions());
    }
  }, [input, dispatch]);

  const tutorial = tutorialTexts["/minigames/teamNationality"]?.[lang] || {
    title: lang === "es" ? "Equipo & Nacionalidad" : "Team & Nationality",
    description:
      lang === "es"
        ? "Acierta pilotos que cumplan la relación equipo + nacionalidad."
        : "Guess drivers matching the team + nationality pair."
  };

  const flag = useMemo(() => flagEmojiFromCountryCode(game?.countryCode), [game?.countryCode]);

  const onGuess = (name) => {
    const s = (name || "").trim();
    if (!s || !game || game.finished) return;

    dispatch(actions.guessTeamNationality({ gameId: game.id, driverName: s }));

    setInput("");
    setHighlightedIndex(-1);
    dispatch(actions.clearTeamNatSuggestions());
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
        image={sourceImages("./TeamNationality.png")}
        onStart={() => setShowTutorial(false)}
        lang={lang}
      />
    );
  }

  if (!game) return <LoadingScreen lang={lang} />;

  return (
    <div className="teamnat">
      <div className="teamnat-header">
        <div className="teamnat-titleRow">
          <div className="teamnat-flag" title={game.nationality}>{flag}</div>
          <div className="teamnat-titleBlock">
            <h2 className="teamnat-title">
              {lang === "es" ? "EQUIPO & NACIONALIDAD" : "TEAM & NATIONALITY"}
            </h2>
            <div className="teamnat-sub">
              <span className="teamnat-team">{game.teamName}</span>
              <span className="teamnat-dot">•</span>
              <span className="teamnat-nat">{game.nationality}</span>
            </div>
          </div>

          <div className="teamnat-score">
            <div className="teamnat-scoreMain">
              {lang === "es" ? "Aciertos" : "Correct"}: {game.correctAnswers}/{game.maxAnswers}
            </div>
            <div className="teamnat-scoreSub">
              {lang === "es" ? "Intentos" : "Attempts"}: {game.totalSubmitted}
            </div>
          </div>
        </div>
      </div>

      <div className="teamnat-inputWrap">
        <input
          className="teamnat-input"
          value={input}
          placeholder={
            lang === "es"
              ? "Escribe un piloto y pulsa Enter"
              : "Type a driver and press Enter"
          }
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
          <div className="teamnat-suggestions">
            {suggestions.map((s, idx) => (
              <div
                key={idx}
                className={`teamnat-suggestion ${idx === highlightedIndex ? "selected" : ""}`}
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

      <div className="teamnat-board">
        <div className="teamnat-boardHeader">
          <div className="teamnat-boardTitle">
            {lang === "es" ? "Pilotos acertados" : "Solved drivers"}
          </div>
          <div className="teamnat-boardHint">
            {lang === "es"
              ? "Máximo 30 (se valida al instante)"
              : "Max 30 (instant validation)"}
          </div>
        </div>

        <div className="teamnat-list">
          {game.answers?.length === 0 && (
            <div className="teamnat-empty">
              {lang === "es" ? "Aún no hay aciertos." : "No correct drivers yet."}
            </div>
          )}

          {game.answers?.map((a) => (
            <div
              key={`${a.driverId}-${a.answerOrder}`}
              className={`teamnat-item ${poppingOrder === a.answerOrder ? "pop" : ""}`}
            >
              <div className="teamnat-order">#{a.answerOrder}</div>
              <div className="teamnat-name">{a.driverName}</div>
              <div className="teamnat-check">✅</div>
            </div>
          ))}
        </div>
      </div>

      <div className="teamnat-footer">
        {game.finished && (
          <div className="teamnat-finished">
            ✅ {lang === "es" ? "Partida finalizada" : "Game finished"} ({game.correctAnswers}/{game.maxAnswers})
          </div>
        )}

        <button className="teamnat-back" onClick={() => navigate("/minigames")}>
          ⬅️ {lang === "es" ? "Volver al inicio" : "Back home"}
        </button>
      </div>
    </div>
  );
}
