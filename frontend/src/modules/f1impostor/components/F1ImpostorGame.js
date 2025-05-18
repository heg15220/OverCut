import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import * as actions from "../actions";
import * as selectors from "../selectors";
import "./F1ImpostorGame.css";

const F1ImpostorGame = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const game = useSelector(selectors.getGame);
  const [selected, setSelected] = useState([]);
  const lang = navigator.language.startsWith("es") ? "es" : "en";

  const translations = {
    title: {
      es: "F1 Impostors",
      en: "F1 Impostors"
    },
    loading: {
      es: "Cargando partida...",
      en: "Loading game..."
    },
    check: {
      es: "✅ Comprobar",
      en: "✅ Check"
    },
    win: {
      es: "🎉 ¡Has ganado!",
      en: "🎉 You won!"
    },
    lose: {
      es: "❌ Has fallado. Había impostores.",
      en: "❌ You failed. There were impostors."
    },
    back: {
      es: "⬅️ Volver al inicio",
      en: "⬅️ Back to home"
    }
  };

  useEffect(() => {
    dispatch(actions.startF1ImpostorGame());
  }, [dispatch]);

  if (!game) return <div className="f1impostor-loading">{translations.loading[lang]}</div>;

  const toggleSelect = (name) => {
    if (game.finished) return;
    setSelected(prev =>
      prev.includes(name) ? prev.filter(p => p !== name) : [...prev, name]
    );
  };

  const handleValidate = () => {
    dispatch(actions.validateF1ImpostorSelection({
      gameId: game.id,
      selectedPilotNames: selected
    }));
  };

  const handleBack = () => {
    navigate("/minigames");
  };

  return (
    <div className="f1impostor-container">
      <h1 className="f1impostor-title">{translations.title[lang]}</h1>
      <h2>{game.themeDescription}</h2>
      <div className="f1impostor-rondo">
        {game.pilots.map((p, i) => {
          const isSelected = selected.includes(p.pilotName);
          const isCorrect = game.finished && p.valid && p.selectedByUser;
          const isMissedValid = game.finished && p.valid && !p.selectedByUser;
          const isWrong = game.finished && !p.valid && p.selectedByUser;
          const isImpostorAvoided = game.finished && !p.valid && !p.selectedByUser;

          const className = `
            f1impostor-card
            ${isSelected ? "selected" : ""}
            ${isCorrect ? "correct" : ""}
            ${isWrong ? "wrong" : ""}
            ${isMissedValid ? "missed-valid" : ""}
            ${isImpostorAvoided ? "avoided" : ""}
          `;

          return (
            <div
              key={i}
              className={className.trim()}
              style={{ transform: `rotate(${i * 36}deg) translate(12rem) rotate(-${i * 36}deg)` }}
              onClick={() => toggleSelect(p.pilotName)}
            >
              <span>
                {p.pilotName}
                {game.finished && (
                  <>
                    {isCorrect && " ✅"}
                    {isWrong && " ❌"}
                    {isMissedValid && " ⚠️"}
                    {isImpostorAvoided && " 🕵️"}
                  </>
                )}
              </span>
            </div>
          );
        })}

        {!game.finished ? (
          <button className="f1impostor-validate-btn center-button" onClick={handleValidate}>
            {translations.check[lang]}
          </button>
        ) : (
          <button className="f1impostor-validate-btn center-button" onClick={handleBack}>
            {translations.back[lang]}
          </button>
        )}
      </div>

      {game.finished && (
        <div className="f1impostor-result">
          {game.won ? translations.win[lang] : translations.lose[lang]}
        </div>
      )}
    </div>
  );
};

export default F1ImpostorGame;
