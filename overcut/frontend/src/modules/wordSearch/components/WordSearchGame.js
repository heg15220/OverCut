import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import * as actions from "../actions";
import * as selectors from "../selectors";
import "./WordSearchGame.css";
import LoadingScreen from '../../common/components/LoadingScreen';
import MinigameTutorial from "../../common/components/MinigameTutorial"; // nuevo componente compartido
import { sourceImages } from "../../../helpers/sourceMiniGamesImages"; // ya lo usas en MinigamesHome
import { tutorialTexts } from "../../../helpers/minigameTutorialTexts"; // explicaciones por minijuego

import { fetchCooldown } from "../../cooldown/actions";
import { getCooldownForGame } from "../../cooldown/selectors";
import CooldownScreen from "../../cooldown/components/CooldownScreen";
import { getUser } from "../../users/selectors";



// Traducciones embebidas
const translations = {
  es: {
    title: "Sopa de Letras",
    loading: "Cargando juego...",
    validate: "Validar selección",
    giveUp: "Rendirse",
    backToMenu: "Volver al inicio",
    foundWords: "Palabras encontradas:",
    toFind: "Palabras a encontrar:"
  },
  en: {
    title: "Word Search",
    loading: "Loading game...",
    validate: "Validate selection",
    giveUp: "Give up",
    backToMenu: "Back to menu",
    foundWords: "Found words:",
    toFind: "Words to find:"
  }
};

const lang = navigator.language.startsWith("es") ? "es" : "en";
const t = (key) => translations[lang][key] || key;

const WordSearchGame = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const game = useSelector(selectors.getGame);
  const foundWords = useSelector(selectors.getFoundWords);
  const [selectedCells, setSelectedCells] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const gridRef = useRef(null);

  const [showTutorial, setShowTutorial] = useState(true);

  const tutorial = tutorialTexts["/minigames/wordSearch"][lang];

  const { canPlay, secondsRemaining } = useSelector(state =>
    getCooldownForGame(state, "WordSearch")
  );
  const user = useSelector(getUser);

  useEffect(() => {
    dispatch(fetchCooldown("WordSearch"));
  }, [dispatch]);


  useEffect(() => {
    if (canPlay) {
      dispatch(actions.startWordSearchGame());
      dispatch({ type: "wordSearch/resetFoundWords" });
    }
  }, [dispatch, canPlay]);

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
          image={sourceImages("./searchGame.png")}
          onStart={() => setShowTutorial(false)}
          lang={lang}
        />
      );
    }

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


  if (!game) return <LoadingScreen lang={lang} text={t("loading")} />;
  const handleValidate = () => {

    const letters = selectedCells.map(key => {
      const [r, c] = key.split(",").map(Number);
      const cell = game.grid.find(cell => cell.rowIndex === r && cell.colIndex === c);
      return cell ? cell.letter : "";
    });

    const word = letters.join("");
    if (word) {
      dispatch(actions.validateWord({ gameId: game.id, attemptedSurname: word }, (result) => {
        if (result?.valid) {
          dispatch(actions.getWordSearchGame(game.id));
          const normalized = word.toUpperCase();
          const alreadyAdded = foundWords.some(w => w.toUpperCase() === normalized);
          if (!alreadyAdded) {
            dispatch(actions.addFoundWord(word));
          }
        }
        setSelectedCells([]);
      }));
    }
  };

  const handleReveal = () => {
    if (game) {
      dispatch(actions.revealWords({ gameId: game.id }));
      setRevealed(true);
    }
  };

  const handleBackToMenu = () => {
    navigate("/minigames");
  };

  if (!game) return <div className="wordsearch-loading">{t("loading")}</div>;

  const remainingWords = game.words.filter(w =>
    !foundWords.some(fw => fw.toUpperCase() === w.surname.toUpperCase())
  );

  const isGameOver = revealed || remainingWords.length === 0;

  return (
    <div className="wordsearch-container" onMouseLeave={handleMouseUp}>
      <h2 className="wordsearch-title">{t("title")}</h2>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '3rem' }}>
        <div>
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
                  style={{ userSelect: "none", cursor: "pointer" }}
                >
                  {cell.letter}
                </div>
              );
            })}
          </div>

          {!isGameOver && (
            <>
              <button className="wordsearch-validate-btn" onClick={handleValidate}>
                {t("validate")}
              </button>

              <button className="wordsearch-reveal-btn" onClick={handleReveal}>
                {t("giveUp")}
              </button>
            </>
          )}

          {isGameOver && (
            <button className="wordsearch-validate-btn" onClick={handleBackToMenu}>
              {t("backToMenu")}
            </button>
          )}

          <div className="wordsearch-list-box found-box">
            <h3 className="wordsearch-list-title">{t("foundWords")}</h3>
            <ul>
              {[...new Set(foundWords.map(w => w.toUpperCase()))].map((w, i) => (
                <li key={i} className="wordsearch-list-item found">{w}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="wordsearch-list-box tofind-box">
          <h3 className="wordsearch-list-title">{t("toFind")}</h3>
          <ul>
            {remainingWords.map((w, i) => (
              <li key={i} className="wordsearch-list-item tofind">{w.surname}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default WordSearchGame;
