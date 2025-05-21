// === WordSearchGame.jsx ===

import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import * as actions from "../actions";
import * as selectors from "../selectors";
import "./WordSearchGame.css";

const WordSearchGame = () => {
  const dispatch = useDispatch();
  const game = useSelector(selectors.getGame);
  const foundWords = useSelector(selectors.getFoundWords);
  const [selectedCells, setSelectedCells] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const gridRef = useRef(null);

  useEffect(() => { dispatch(actions.startWordSearchGame()); }, [dispatch]);

  const keyFor = (row, col) => `${row},${col}`;

  const handleMouseDown = (row, col) => {
    setIsDragging(true);
    setSelectedCells([keyFor(row, col)]);
  };

  const handleMouseEnter = (row, col) => {
    if (isDragging) {
      const key = keyFor(row, col);
      setSelectedCells(prev => (prev.includes(key) ? prev : [...prev, key]));
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleValidate = () => {
    if (!game) return;

    const letters = selectedCells.map(key => {
      const [r, c] = key.split(",").map(Number);
      const cell = game.grid.find(cell => cell.rowIndex === r && cell.colIndex === c);
      return cell ? cell.letter : "";
    });

    const word = letters.join("");
    if (word) {
      dispatch(actions.validateWord({ gameId: game.id, attemptedSurname: word }));
      dispatch(actions.addFoundWord(word));
      dispatch(actions.getWordSearchGame(game.id)); // 🔁 vuelve a cargar el estado actualizado
      setSelectedCells([]);
    }
  };


  const handleReveal = () => {
    if (game) {
      dispatch(actions.revealWords({ gameId: game.id }));
    }
  };

  if (!game) return <div className="wordsearch-loading">Cargando juego...</div>;

  return (
    <div className="wordsearch-container" onMouseLeave={handleMouseUp}>
      <h2>Sopa de Letras: {game.theme}</h2>

      <div
        className="wordsearch-grid"
        onMouseUp={handleMouseUp}
        ref={gridRef}
      >
        {game.grid.map((cell, idx) => {
          const key = keyFor(cell.rowIndex, cell.colIndex);
          const selected = selectedCells.includes(key);
          return (
            <div
              key={idx}
              className={`wordsearch-cell ${cell.revealed ? "revealed" : ""} ${selected ? "selected" : ""}`}
              onMouseDown={() => handleMouseDown(cell.rowIndex, cell.colIndex)}
              onMouseEnter={() => handleMouseEnter(cell.rowIndex, cell.colIndex)}
            >
              {cell.letter}
            </div>
          );
        })}
      </div>

      <button className="wordsearch-validate-btn" onClick={handleValidate}>
        Validar selección
      </button>

      <button className="wordsearch-reveal-btn" onClick={handleReveal}>
        Rendirse
      </button>

      <div className="wordsearch-found">
        Palabras encontradas: {foundWords.join(", ")}
      </div>

      <style>{`
        .wordsearch-cell.selected {
          background-color: #2196f3;
          color: #fff;
          border: 2px solid #64b5f6;
        }
      `}</style>
    </div>
  );
};

export default WordSearchGame;
