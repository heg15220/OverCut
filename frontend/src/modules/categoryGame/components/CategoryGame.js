import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import * as actions from "../actions";
import * as selectors from "../selectors";
import { useNavigate } from "react-router-dom";
import "./CategoryGame.css";

const CategoryGame = () => {
  const dispatch = useDispatch();
  const game = useSelector(selectors.getCategoryGame);
  const [answers, setAnswers] = useState({});
  const navigate = useNavigate();
  const lang = navigator.language.startsWith("es") ? "es" : "en";

  useEffect(() => {
    dispatch(actions.startGame(lang));
  }, [dispatch, lang]);

  const handleChange = (category, value) => {
    // Normaliza la respuesta a minúsculas antes de guardarla
    setAnswers(prev => ({ ...prev, [category]: value.trim().toLowerCase() }));
  };

  const handleSubmit = () => {
    dispatch(actions.submitAnswers(game.id, answers, lang))
      .then(() => dispatch(actions.getGameStatus(game.id))); // Aseguramos el fetch actualizado
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

  if (!game) return <div className="category-game-loading">Loading...</div>;

  return (
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
                className={
                  game.finished ? (slot.valid ? "correct" : "incorrect") : ""
                }
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
  );
};


export default CategoryGame;
