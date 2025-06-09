import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import * as actions from '../actions';
import * as selectors from '../selectors';
import './CareerPathGame.css';
import TeamLogo from './TeamLogo';
import { useNavigate } from 'react-router-dom';
import LoadingScreen from '../../common/components/LoadingScreen';
import AdPlaceholder from '../../common/components/AdPlaceholder';
import AdFloatingBottom from '../../common/components/AdFloatingBottom';


const CareerPathGame = () => {
  const dispatch = useDispatch();
  const game = useSelector(selectors.getCareerPathGame);
  const suggestions = useSelector(selectors.getDriverSuggestions);

  const navigate = useNavigate();
  const [guessInput, setGuessInput] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const suggestionsRef = useRef([]);
  const lang = navigator.language.startsWith('es') ? 'es' : 'en';

  const translations = {
    title: {
      es: '🏁 Career Path',
      en: '🏁 Career Path',
    },
    placeholder: {
      es: 'Nombre del piloto',
      en: 'Driver name',
    },
    guess: {
      es: 'Adivinar',
      en: 'Guess',
    },
    skip: {
      es: '⏭️ Pista siguiente',
      en: '⏭️ Skip',
    },
    loading: {
      es: 'Cargando juego...',
      en: 'Loading game...',
    },
    win: {
      es: '¡Ganaste!',
      en: 'You won!',
    },
    lose: {
      es: 'Perdiste, era',
      en: 'You lost, it was',
    },
  };

  useEffect(() => {
    dispatch(actions.startCareerPathGame());
  }, [dispatch]);

  useEffect(() => {
    if (guessInput.trim().length > 1) {
      const timer = setTimeout(() => {
        dispatch(actions.fetchDriverSuggestions(guessInput));
      }, 300);
      return () => clearTimeout(timer);
    } else {
      dispatch(actions.clearDriverSuggestions());
    }
  }, [guessInput, dispatch]);

  useEffect(() => {
    if (highlightedIndex >= 0 && suggestionsRef.current[highlightedIndex]) {
      suggestionsRef.current[highlightedIndex].scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [highlightedIndex]);

  const handleGuess = () => {
    if (!guessInput.trim()) return;
    dispatch(actions.guessDriver({ gameId: game.id, driverGuess: guessInput }));
    setGuessInput('');
    dispatch(actions.clearDriverSuggestions());
    setHighlightedIndex(-1);
  };

  if (!game) return <LoadingScreen lang={lang} text={translations.loading[lang]} />;


  return (
    <div className="career-path-container">
        <AdPlaceholder position="left" />
        <AdPlaceholder position="right" />
        <AdFloatingBottom />
      <div className="career-path-overlay">
        <h2 className="career-path-title">{translations.title[lang]}</h2>

        <div className={`driver-reveal-card-wrapper ${game.finished ? 'flipped' : ''}`}>
          <div className="driver-reveal-card-inner">
            <div className="driver-reveal-card-face front">?</div>
            <div className={`driver-reveal-card-face back ${game.successful ? 'success' : 'fail'}`}>
              {game.driverName}
            </div>
          </div>
        </div>

        <div className="clues-row">
          {game.clues.slice(0, game.currentClueIndex + 1).map((clue, idx) => (
            <div key={idx} className="team-card-wrapper">
              <div className="team-card-inner">
                <TeamLogo teamName={clue.teamName} />
                <div className="team-name">{clue.teamName}</div>
              </div>
            </div>
          ))}
          {game.clues.slice(game.currentClueIndex + 1).map((_, idx) => (
            <div key={idx} className="team-card-wrapper">
              <div className="team-card-inner" style={{ background: '#333', color: '#888' }}>
                🔒
              </div>
            </div>
          ))}
        </div>


        {!game.finished ? (
          <>
            <div style={{ position: 'relative', width: '100%' }}>
              <input
                className="driver-input"
                placeholder={translations.placeholder[lang]}
                value={guessInput}
                onChange={(e) => {
                  setGuessInput(e.target.value);
                  setHighlightedIndex(-1);
                }}
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
                      const selected = suggestions[highlightedIndex];
                      setGuessInput('');
                      dispatch(actions.clearDriverSuggestions());
                      dispatch(actions.guessDriver({ gameId: game.id, driverGuess: selected }));
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
                        setGuessInput('');
                        dispatch(actions.clearDriverSuggestions());
                        dispatch(actions.guessDriver({ gameId: game.id, driverGuess: name }));
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
              <button className="guess-btn" onClick={handleGuess}>{translations.guess[lang]}</button>
              <button className="skip-btn" onClick={() => dispatch(actions.skipClue(game.id))}>
                {translations.skip[lang]}
              </button>
            </div>
          </>
        ) : (
          <div className={`game-result ${game.successful ? 'win' : 'lose'}`}>
            <div>
              {game.successful
                ? translations.win[lang]
                : `${translations.lose[lang]} ${game.driverName}`}
            </div>
            <button className="back-to-home-btn" onClick={() => navigate("/minigames")}>
              {lang === 'es' ? 'Volver al inicio' : 'Back to Home'}
            </button>
          </div>

        )}
      </div>
    </div>
  );
};

export default CareerPathGame;
