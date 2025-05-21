import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import * as actions from "../actions";
import * as selectors from "../selectors";
import "./WordSearchGame.css";

const WordSearchGame = () => {
  const dispatch = useDispatch();
  const game = useSelector(selectors.getGame);
  const foundWords = useSelector(selectors.getFoundWords);
  const [input, setInput] = useState("");

  useEffect(() => { dispatch(actions.startWordSearchGame()); }, [dispatch]);

  const handleValidate = () => {
    dispatch(actions.validateWord({ gameId: game.id, attemptedSurname: input }));
    dispatch(actions.addFoundWord(input));
    setInput("");
  };

  const handleReveal = () => {
    dispatch(actions.revealWords({ gameId: game.id }));  // Llamada para rendirse
  };

  if (!game) return <div className="wordsearch-loading">Cargando juego...</div>;

  return (
    <div className="wordsearch-container">
      <h2>Sopa de Letras: {game.theme}</h2>

      <div className="wordsearch-grid">
        {game.grid.map((cell, idx) => (
          <div
            key={idx}
            className={`wordsearch-cell ${cell.revealed ? "revealed" : ""}`}
          >
            {cell.letter}
          </div>
        ))}
      </div>

      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Introduce un apellido"
        className="wordsearch-input"
      />

      <button className="wordsearch-validate-btn" onClick={handleValidate}>
        Validar
      </button>

      <button className="wordsearch-reveal-btn" onClick={handleReveal}>
        Rendirse
      </button>

      <div className="wordsearch-found">
        Palabras encontradas: {foundWords.join(", ")}
      </div>
    </div>
  );
};

export default WordSearchGame;
