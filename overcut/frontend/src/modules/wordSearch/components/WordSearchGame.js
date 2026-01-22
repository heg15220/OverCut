// ============================
// WordSearchGame.jsx (UPDATED + ADS)
// ============================
import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import * as actions from "../actions";
import * as selectors from "../selectors";
import "./WordSearchGame.css";
import LoadingScreen from "../../common/components/LoadingScreen";

import MinigameTutorial from "../../common/components/MinigameTutorial";
import { sourceImages } from "../../../helpers/sourceMiniGamesImages";
import { tutorialTexts } from "../../../helpers/minigameTutorialTexts";

import { fetchCooldown } from "../../cooldown/actions";
import { getCooldownForGame } from "../../cooldown/selectors";
import CooldownScreen from "../../cooldown/components/CooldownScreen";
import { getUser } from "../../users/selectors";

// ✅ ADS (mismo patrón que el resto)
import AdWindows, { AdInline } from "../../../ads/AdWindows";

const translations = {
  es: {
    title: "Sopa de Letras",
    loading: "Cargando juego...",
    validate: "Validar selección",
    giveUp: "Rendirse",
    backToMenu: "Volver al inicio",
    foundWords: "Palabras encontradas:",
    toFind: "Palabras a encontrar:",
  },
  en: {
    title: "Word Search",
    loading: "Loading game...",
    validate: "Validate selection",
    giveUp: "Give up",
    backToMenu: "Back to menu",
    foundWords: "Found words:",
    toFind: "Words to find:",
  },
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
  const { canPlay, secondsRemaining, loading } = useSelector((state) =>
    getCooldownForGame(state, "WordSearch")
  );

  // (consistencia / futuro tracking)
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

  if (loading) {
    return <LoadingScreen lang={lang} text={t("loading")} />;
  }

  if (!canPlay) {
    return (
      <CooldownScreen seconds={secondsRemaining} onBack={() => navigate("/minigames")} />
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

  // OJO: esto debe coincidir con tu CSS (.wordsearch-grid columns y gap)
  const CELL_SIZE = 30;
  const GAP_SIZE = 4;
  const GRID_SIZE = 21;

  const getCellFromCoords = (clientX, clientY, isTouch = false) => {
    if (!gridRef.current) return null;

    const grid = gridRef.current;
    const rect = grid.getBoundingClientRect();

    let x = clientX - rect.left;
    let y = clientY - rect.top;

    if (isTouch) {
      const wrapper = grid.parentElement;
      const scrollLeft = wrapper ? wrapper.scrollLeft : 0;
      const scrollTop = wrapper ? wrapper.scrollTop : 0;
      x += scrollLeft;
      y += scrollTop;
    }

    const col = Math.floor(x / (CELL_SIZE + GAP_SIZE));
    const row = Math.floor(y / (CELL_SIZE + GAP_SIZE));

    if (col < 0 || row < 0 || col >= GRID_SIZE || row >= GRID_SIZE) return null;
    return keyFor(row, col);
  };

  // Mouse
  const handleMouseDown = (e) => {
    const key = getCellFromCoords(e.clientX, e.clientY);
    if (key) {
      setIsDragging(true);
      setSelectedCells([key]);
    }
  };

  const handleMouseEnter = (e) => {
    if (!isDragging) return;
    const key = getCellFromCoords(e.clientX, e.clientY);
    if (key) {
      setSelectedCells((prev) => (prev.includes(key) ? prev : [...prev, key]));
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  // Touch
  const handleTouchStart = (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const key = getCellFromCoords(touch.clientX, touch.clientY, true);
    if (key) {
      setIsDragging(true);
      setSelectedCells([key]);
    }
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    const key = getCellFromCoords(touch.clientX, touch.clientY, true);
    if (key) {
      setSelectedCells((prev) => (prev.includes(key) ? prev : [...prev, key]));
    }
  };

  const handleTouchEnd = () => setIsDragging(false);

  const handleValidate = () => {
    if (!game || selectedCells.length === 0) return;

    const letters = selectedCells.map((key) => {
      const [r, c] = key.split(",").map(Number);
      const cell = game.grid.find((cell) => cell.rowIndex === r && cell.colIndex === c);
      return cell ? cell.letter : "";
    });

    const word = letters.join("");
    if (!word) return;

    dispatch(
      actions.validateWord({ gameId: game.id, attemptedSurname: word }, (result) => {
        if (result?.valid) {
          dispatch(actions.getWordSearchGame(game.id));
          const normalized = word.toUpperCase();
          if (!foundWords.some((w) => w.toUpperCase() === normalized)) {
            dispatch(actions.addFoundWord(word));
          }
        }
        setSelectedCells([]);
      })
    );
  };

  const handleReveal = () => {
    if (!game) return;
    dispatch(actions.revealWords({ gameId: game.id }));
    setRevealed(true);
  };

  if (!game) return <LoadingScreen lang={lang} text={t("loading")} />;

  const remainingWords = game.words.filter(
    (w) => !foundWords.some((fw) => fw.toUpperCase() === w.surname.toUpperCase())
  );

  const isGameOver = revealed || remainingWords.length === 0;

  return (
    <AdWindows placeholders={true} enableTabletSide={false} showBottomOnDesktop={false}>
      <div className="wordsearch-container" onMouseLeave={handleMouseUp}>

        <h2 className="wordsearch-title">{t("title")}</h2>

        <div className="wordsearch-main-layout">
          <div>
            <div
              className="wordsearch-grid-wrapper"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              style={{ touchAction: "none" }}
            >
              <div
                className="wordsearch-grid"
                onMouseDown={handleMouseDown}
                onMouseEnter={handleMouseEnter}
                onMouseUp={handleMouseUp}
                ref={gridRef}
              >
                {game.grid.map((cell, idx) => {
                  const key = keyFor(cell.rowIndex, cell.colIndex);
                  const selected = selectedCells.includes(key);

                  return (
                    <div
                      key={idx}
                      data-row={cell.rowIndex}
                      data-col={cell.colIndex}
                      className={`wordsearch-cell ${cell.revealed ? "revealed" : ""} ${
                        selected ? "selected" : ""
                      }`}
                      onMouseDown={() => {
                        setIsDragging(true);
                        setSelectedCells([key]);
                      }}
                      onMouseEnter={() => {
                        if (isDragging) {
                          setSelectedCells((prev) => (prev.includes(key) ? prev : [...prev, key]));
                        }
                      }}
                      style={{ userSelect: "none", cursor: "pointer" }}
                    >
                      {cell.letter}
                    </div>
                  );
                })}
              </div>
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
              <button className="wordsearch-validate-btn" onClick={() => navigate("/minigames")}>
                {t("backToMenu")}
              </button>
            )}

            <div className="wordsearch-list-box found-box">
              <h3 className="wordsearch-list-title">{t("foundWords")}</h3>
              <ul>
                {[...new Set(foundWords.map((w) => w.toUpperCase()))].map((w, i) => (
                  <li key={i} className="wordsearch-list-item found">
                    {w}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="wordsearch-list-box tofind-box">
            <h3 className="wordsearch-list-title">{t("toFind")}</h3>
            <ul>
              {remainingWords.map((w, i) => (
                <li key={i} className="wordsearch-list-item tofind">
                  {w.surname}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </AdWindows>
  );
};

export default WordSearchGame;
