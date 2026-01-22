// ============================
// WordleGame.jsx (UPDATED + ADS)
// ============================
import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import * as actions from "../actions";
import * as selectors from "../selectors";
import "./WordleGame.css";
import LoadingScreen from "../../common/components/LoadingScreen";

import MinigameTutorial from "../../common/components/MinigameTutorial";
import { sourceImages } from "../../../helpers/sourceMiniGamesImages";
import { tutorialTexts } from "../../../helpers/minigameTutorialTexts";

import CooldownScreen from "../../cooldown/components/CooldownScreen";
import { getCooldownForGame } from "../../cooldown/selectors";
import { fetchCooldown } from "../../cooldown/actions";
import { getUser } from "../../users/selectors";

// ✅ ADS (mismo patrón que ya metimos en TwoTeams/Top10)
import AdWindows, { AdInline } from "../../../ads/AdWindows";

const WordleGame = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const game = useSelector(selectors.getF1WordleGame);
  const [guess, setGuess] = useState("");

  const { canPlay, secondsRemaining, loading } = useSelector((state) =>
    getCooldownForGame(state, "F1Wordle")
  );

  // (consistencia / futuro tracking)
  const user = useSelector(getUser);

  const lang = navigator.language.startsWith("es") ? "es" : "en";
  const t = {
    title: { es: "🔤 F1 Wordle", en: "🔤 F1 Wordle" },
    placeholder: { es: "Apellido del piloto", en: "Driver surname" },
    guess: { es: "Adivinar", en: "Guess" },
    won: { es: "¡Correcto!", en: "Correct!" },
    lost: { es: "Perdiste. Era", en: "You lost. It was" },
    loading: { es: "Cargando...", en: "Loading..." },
    back: { es: "Volver al inicio", en: "Back to Home" },
  };

  const inputRefs = useRef([]);
  const [showTutorial, setShowTutorial] = useState(true);
  const tutorial = tutorialTexts["/minigames/wordle"][lang];

  useEffect(() => {
    dispatch(fetchCooldown("F1Wordle"));
  }, [dispatch]);

  useEffect(() => {
    if (canPlay) {
      dispatch(actions.startWordleGame());
    }
  }, [canPlay, dispatch]);

  if (loading) {
    return <LoadingScreen lang={lang} text={t.loading[lang]} />;
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
        image={sourceImages("./F1Wordle.png")}
        onStart={() => setShowTutorial(false)}
        lang={lang}
      />
    );
  }

  const handleGuess = () => {
    if (!game) return;
    const normalized = guess.trim().toLowerCase();
    if (normalized) {
      dispatch(actions.guessWordle({ gameId: game.id, driverGuess: normalized }));
      setGuess("");
      // volver a enfocar al primer input tras enviar
      setTimeout(() => inputRefs.current?.[0]?.focus?.(), 0);
    }
  };

  if (!game) return <LoadingScreen lang={lang} text={t.loading[lang]} />;

  return (
    <AdWindows placeholders={true} enableTabletSide={false} showBottomOnDesktop={false}>
      <div className="wordle-container">

        <h2 className="wordle-title">{t.title[lang]}</h2>

        <div className="wordle-grid">
          {Array.from({ length: 6 }).map((_, rowIndex) => {
            const attempt = game.attempts.find((a) => a.attemptOrder === rowIndex);

            if (attempt) {
              return (
                <div key={rowIndex} className="wordle-row">
                  {attempt.guess.split("").map((char, i) => (
                    <div key={i} className={`wordle-cell ${attempt.feedback[i]}`}>
                      {char.toUpperCase()}
                    </div>
                  ))}
                </div>
              );
            }

            // fila activa de input
            if (!game.finished && game.attempts.length === rowIndex) {
              const len = game?.surname?.length || 0;

              return (
                <div key={rowIndex} className="wordle-row-input">
                  {Array.from({ length: len }).map((_, i) => (
                    <input
                      key={i}
                      className="wordle-input-cell"
                      value={guess[i] || ""}
                      ref={(el) => (inputRefs.current[i] = el)}
                      onChange={(e) => {
                        const newChar = e.target.value.slice(-1).toLowerCase();
                        const newGuess = guess.slice(0, i) + newChar + guess.slice(i + 1);
                        setGuess(newGuess);

                        if (newChar && i < inputRefs.current.length - 1) {
                          inputRefs.current[i + 1]?.focus();
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Backspace") {
                          // si está vacío, vuelve atrás
                          if (!guess[i] && i > 0) {
                            inputRefs.current[i - 1]?.focus();
                          }
                        } else if (e.key === "Enter") {
                          e.preventDefault();
                          handleGuess();
                        } else if (e.key === "ArrowLeft" && i > 0) {
                          e.preventDefault();
                          inputRefs.current[i - 1]?.focus();
                        } else if (e.key === "ArrowRight" && i < inputRefs.current.length - 1) {
                          e.preventDefault();
                          inputRefs.current[i + 1]?.focus();
                        }
                      }}
                      maxLength={1}
                      autoFocus={i === 0}
                      aria-label={`${t.placeholder[lang]} ${i + 1}`}
                    />
                  ))}

                  <button className="wordle-btn" onClick={handleGuess}>
                    {t.guess[lang]}
                  </button>
                </div>
              );
            }

            // fila vacía
            return (
              <div key={rowIndex} className="wordle-row">
                {Array.from({ length: game?.surname?.length || 0 }).map((_, i) => (
                  <div key={i} className="wordle-cell empty">
                    {" "}
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        {game.finished && (
          <div className="wordle-end-container">
            <div className={`wordle-result ${game.successful ? "win" : "lose"}`}>
              {game.successful ? t.won[lang] : `${t.lost[lang]} ${game.surname}`}
            </div>

            <button
              className="wordle-btn wordle-btn-home"
              onClick={() => navigate("/minigames")}
            >
              {t.back[lang]}
            </button>
          </div>
        )}
      </div>
    </AdWindows>
  );
};

export default WordleGame;
