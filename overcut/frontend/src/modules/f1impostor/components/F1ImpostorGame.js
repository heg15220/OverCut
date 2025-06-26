import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import * as actions from "../actions";
import * as selectors from "../selectors";
import "./F1ImpostorGame.css";
import LoadingScreen from '../../common/components/LoadingScreen';
import MinigameTutorial from "../../common/components/MinigameTutorial"; // nuevo componente compartido
import { sourceImages } from "../../../helpers/sourceMiniGamesImages"; // ya lo usas en MinigamesHome
import { tutorialTexts } from "../../../helpers/minigameTutorialTexts"; // explicaciones por minijuego
import CooldownScreen from "../../cooldown/components/CooldownScreen";
import { getCooldownForGame } from "../../cooldown/selectors";
import { fetchCooldown } from "../../cooldown/actions";
import { getUser } from "../../users/selectors";


const F1ImpostorGame = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const game = useSelector(selectors.getGame);
  const [selected, setSelected] = useState([]);
  const lang = navigator.language.startsWith("es") ? "es" : "en";

  const [showTutorial, setShowTutorial] = useState(true);

  const tutorial = tutorialTexts["/minigames/f1Impostor"][lang];

  const { canPlay, secondsRemaining } = useSelector(state =>
    getCooldownForGame(state, "F1Impostor")
  );
  const user = useSelector(getUser);


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
    lose_impostor: {
      es: "❌ Has fallado. Había impostores.",
      en: "❌ You failed. There were impostors."
    },
    lose_missing: {
      es: "⚠️ Faltaban respuestas correctas.",
      en: "⚠️ Missing correct answers."
    },
    back: {
      es: "⬅️ Volver al inicio",
      en: "⬅️ Back to home"
    }
  };

  useEffect(() => {
    dispatch(fetchCooldown("F1Impostor"));
  }, [dispatch]);

  useEffect(() => {
    if (canPlay) {
      dispatch(actions.startF1ImpostorGame());
    }
  }, [canPlay, dispatch]);

    if (!canPlay) {
      return (
        <CooldownScreen
          seconds={secondsRemaining}
          onBack={() => navigate("/minigames")}
        />
      );
    }

    if (showTutorial) {
      return (
        <MinigameTutorial
          title={tutorial.title}
          description={tutorial.description}
          image={sourceImages("./F1Impostors.png")}
          onStart={() => setShowTutorial(false)}
          lang={lang}
        />
      );
    }

  if (!game) return <LoadingScreen lang={lang} text={translations.loading[lang]} />;


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

  const countWrongSelections = game.pilots.filter(p => !p.valid && p.selectedByUser).length;
  const countMissedValids = game.pilots.filter(p => p.valid && !p.selectedByUser).length;

  let finalMessage = "";
  if (game.won) {
    finalMessage = translations.win[lang];
  } else if (countWrongSelections > 0) {
    finalMessage = translations.lose_impostor[lang];
  } else {
    finalMessage = translations.lose_missing[lang];
  }

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
          {finalMessage}
        </div>
      )}
    </div>
  );
};

export default F1ImpostorGame;
