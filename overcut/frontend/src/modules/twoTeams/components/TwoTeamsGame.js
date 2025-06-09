import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import * as actions from '../actions';
import * as selectors from '../selectors';
import TeamLogo from './TeamLogo';
import { useNavigate } from 'react-router-dom';
import './TwoTeamsGame.css';
import LoadingScreen from '../../common/components/LoadingScreen';

import AdPlaceholder from '../../common/components/AdPlaceholder';
import AdFloatingBottom from '../../common/components/AdFloatingBottom';




const TwoTeamsGame = () => {
  const dispatch = useDispatch();
  const game = useSelector(selectors.getGame);
  const suggestions = useSelector(selectors.getDriverSuggestions);

  const [guessInput, setGuessInput] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const suggestionsRef = useRef([]);
  const [animateFlip, setAnimateFlip] = useState(true);
  const navigate = useNavigate();

  const lang = navigator.language.startsWith('es') ? 'es' : 'en';

  const translations = {
    title: {
      es: "2 EQUIPOS, 1 PILOTO",
      en: "2 TEAMS, 1 DRIVER",
    },
    placeholder: {
      es: "Nombre del piloto",
      en: "Driver name",
    },
    guess: {
      es: "✅ Adivinar",
      en: "✅ Guess",
    },
    skip: {
      es: "⏭️ Saltar",
      en: "⏭️ Skip",
    },
    loading: {
      es: "Cargando...",
      en: "Loading...",
    },
    gameOver: {
      es: "Juego terminado",
      en: "Game Over",
    },
    score: {
      es: (n) => `Aciertos: ${n} / 10`,
      en: (n) => `Correct: ${n} / 10`,
    }
  };

  useEffect(() => {
    dispatch(actions.startTwoTeamsGame());
  }, [dispatch]);

  useEffect(() => {
    if (guessInput.length > 1) {
      const timer = setTimeout(() => {
        dispatch(actions.fetchDriverSuggestions(guessInput));
      }, 300);
      return () => clearTimeout(timer);
    } else {
      dispatch(actions.clearDriverSuggestions());
    }
  }, [guessInput, dispatch]);

  useEffect(() => {
    setAnimateFlip(false);
    const timer = setTimeout(() => setAnimateFlip(true), 50); // breve pausa para reiniciar la animación
    return () => clearTimeout(timer);
  }, [game?.currentPairIndex]);


  const handleGuess = () => {
    if (!guessInput.trim()) return;
    dispatch(actions.guessDriver({ gameId: game.id, driverGuess: guessInput }));
    setGuessInput('');
    setHighlightedIndex(-1);
    dispatch(actions.clearDriverSuggestions());
  };

  const handleSkip = () => {
    dispatch(actions.skipPair(game.id));
    setGuessInput('');
    setHighlightedIndex(-1);
    dispatch(actions.clearDriverSuggestions());
  };

  if (!game) return <LoadingScreen lang={lang} />;

  const current = game.pairs[game.currentPairIndex];
  const showResult = current.guessedCorrectly !== null;

  return (
    <div className="two-teams-game">
        <AdPlaceholder position="left" />
          <AdPlaceholder position="right" />
          <AdFloatingBottom />
      <h2 className="two-teams-title">{translations.title[lang]}</h2>

      <div className="teams-pair">
        <div className={`team-box ${showResult && current.guessedCorrectly ? 'correct' : ''} ${animateFlip ? 'flip-in' : ''}`}>
          <TeamLogo teamName={current.teamA} />
          <span>{current.teamA}</span>
        </div>
        <div className={`team-box ${showResult && current.guessedCorrectly ? 'correct' : ''} ${animateFlip ? 'flip-in' : ''}`}>
          <TeamLogo teamName={current.teamB} />
          <span>{current.teamB}</span>
        </div>
      </div>

      {!game.finished && (
        <>
          <div className="search-panel">
            <input
              className="driver-input"
              placeholder={translations.placeholder[lang]}
              value={guessInput}
              onChange={(e) => setGuessInput(e.target.value)}
              onKeyDown={(e) => {
                if (suggestions.length === 0) return;
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setHighlightedIndex((prev) => (prev + 1) % suggestions.length);
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  setHighlightedIndex((prev) =>
                    prev <= 0 ? suggestions.length - 1 : prev - 1
                  );
                } else if (e.key === 'Enter') {
                  e.preventDefault();
                  if (highlightedIndex >= 0) {
                    dispatch(actions.guessDriver({
                      gameId: game.id,
                      driverGuess: suggestions[highlightedIndex]
                    }));
                    setGuessInput('');
                    dispatch(actions.clearDriverSuggestions());
                  } else {
                    handleGuess();
                  }
                }
              }}
            />

            {suggestions.length > 0 && (
              <div className="pilot-suggestion-list">
                {suggestions.map((name, idx) => (
                  <div
                    key={idx}
                    ref={(el) => suggestionsRef.current[idx] = el}
                    className={`suggestion-item ${highlightedIndex === idx ? 'selected' : ''}`}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      dispatch(actions.guessDriver({ gameId: game.id, driverGuess: name }));
                      setGuessInput('');
                      dispatch(actions.clearDriverSuggestions());
                    }}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                  >
                    {name}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="action-buttons">
            <button className="guess-btn" onClick={handleGuess}>
              {translations.guess[lang]}
            </button>
            <button className="skip-btn" onClick={handleSkip}>
              {translations.skip[lang]}
            </button>

          </div>
        </>
      )}

      {game.finished && (
        <div className="final-result">
          <h3>{translations.gameOver[lang]}</h3>
          <p>{translations.score[lang](game.correctAnswers)}</p>

          <button className="back-btn" onClick={() => navigate('/minigames')}>
            ⬅️ {lang === 'es' ? 'Volver al inicio' : 'Back home'}
          </button>
        </div>
      )}
    </div>
  );
};

export default TwoTeamsGame;
