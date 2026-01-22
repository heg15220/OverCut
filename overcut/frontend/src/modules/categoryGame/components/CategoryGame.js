// ============================
// CategoryGame.jsx (UPDATED)
// ============================
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import * as actions from "../actions";
import * as selectors from "../selectors";
import { useNavigate } from "react-router-dom";
import "./CategoryGame.css";
import LoadingScreen from '../../common/components/LoadingScreen';
import MinigameTutorial from "../../common/components/MinigameTutorial";
import { sourceImages } from "../../../helpers/sourceMiniGamesImages";
import { tutorialTexts } from "../../../helpers/minigameTutorialTexts";
import CooldownScreen from "../../cooldown/components/CooldownScreen";
import { getCooldownForGame } from "../../cooldown/selectors";
import { fetchCooldown } from "../../cooldown/actions";
import { getUser } from "../../users/selectors";

import AdWindows, { AdInline } from "../../../ads/AdWindows";

const CategoryGame = () => {
  const dispatch = useDispatch();
  const game = useSelector(selectors.getCategoryGame);
  const [answers, setAnswers] = useState({});
  const navigate = useNavigate();
  const lang = navigator.language.startsWith("es") ? "es" : "en";

  const [showTutorial, setShowTutorial] = useState(true);
  const tutorial = tutorialTexts["/minigames/categoryGame"][lang];

  const { canPlay, secondsRemaining, loading } = useSelector(state =>
    getCooldownForGame(state, "CategoryGame")
  );

  const user = useSelector(getUser);

  useEffect(() => {
    dispatch(fetchCooldown("CategoryGame"));
  }, [dispatch]);

  // ✅ IMPORTANTE:
  // Tenías 2 useEffect que hacían startGame -> el segundo lo lanzaba SIEMPRE,
  // incluso si NO puedes jugar (y además duplicaba peticiones).
  // Lo dejamos en uno solo condicionado por canPlay.
  useEffect(() => {
    if (canPlay) {
      dispatch(actions.startGame(lang));
    }
  }, [canPlay, dispatch, lang]);

  const handleChange = (category, value) => {
    setAnswers(prev => ({ ...prev, [category]: value.trim().toLowerCase() }));
  };

  const handleSubmit = () => {
    if (!game) return;
    dispatch(actions.submitAnswers(game.id, answers, lang))
      .then(() => dispatch(actions.getGameStatus(game.id)));
  };

  useEffect(() => {
    if (game && game.finished) {
      const updatedAnswers = {};
      game.slots.forEach(slot => {
        updatedAnswers[slot.category] = slot.answer || "";
      });
      setAnswers(updatedAnswers);
    }
  }, [game]);

  if (loading) {
    return <LoadingScreen lang={lang} text={lang === 'es' ? 'Cargando...' : 'Loading...'} />;
  }

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
        image={sourceImages("./CategoryGame.png")}
        onStart={() => setShowTutorial(false)}
        lang={lang}
      />
    );
  }

  if (!game) {
    return <LoadingScreen lang={lang} text={lang === 'es' ? 'Cargando juego...' : 'Loading game...'} />;
  }

  return (
    <AdWindows
      placeholders={true}
      enableTabletSide={false}
      showBottomOnDesktop={false}
    >
      <div className="category-page">
        <div className="category-game-container">
          <h2 className="category-title">
            {lang === "es" ? "🎯 Categorías con la letra" : "🎯 Categories with letter"} {game.letter}
          </h2>


          <div className="category-form">
            {game.slots.map((slot, i) => (
              <div className="category-input-block" key={i}>
                <label>{slot.category}</label>
                <input
                  type="text"
                  value={answers[slot.category] || ""}
                  onChange={(e) => handleChange(slot.category, e.target.value)}
                  disabled={game.finished}
                  className={game.finished ? (slot.valid ? "correct" : "incorrect") : ""}
                />
              </div>
            ))}

            {!game.finished ? (
              <button className="submit-btn" onClick={handleSubmit}>
                {lang === "es" ? "Enviar respuestas" : "Submit answers"}
              </button>
            ) : (
              <>
                <div className="results-summary">
                  {lang === "es" ? "Juego finalizado" : "Game finished"}
                </div>
                <button className="back-btn" onClick={() => navigate("/minigames")}>
                  {lang === "es" ? "Volver al inicio" : "Back to home"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </AdWindows>
  );
};

export default CategoryGame;
