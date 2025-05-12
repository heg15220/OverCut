import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import * as actions from '../actions';
import * as selectors from '../selectors';
import './DriversLinkGame.css';

const DriversLinkGame = () => {
  const dispatch = useDispatch();
  const game = useSelector(selectors.getDriversLinkGame);
  const suggestions = useSelector(selectors.getDriverSuggestions);

  const [guessInput, setGuessInput] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const suggestionsRef = useRef([]);

  useEffect(() => {
    dispatch(actions.startDriversLinkGame());
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

  if (!game) return <div className="drivers-link-container">Cargando juego...</div>;

  return (
    <div className="drivers-link-container">
      <div className="drivers-link-overlay">
        <h2 className="drivers-link-title">🔗 Drivers Link</h2>

        <div className="clues-row">
          {game.clues.slice(0, game.currentClueIndex + 1).map((clue, idx) => (
            <div key={idx} className="clue-block">{clue.teammateName}</div>
          ))}
          {game.clues.slice(game.currentClueIndex + 1).map((_, idx) => (
            <div key={idx} className="clue-block locked">🔒</div>
          ))}
        </div>

        {!game.finished ? (
          <>
            <div style={{ position: 'relative', width: '100%' }}>
              <input
                className="driver-input"
                placeholder="Nombre del piloto"
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
              <button className="guess-btn" onClick={handleGuess}>Adivinar</button>
              <button className="skip-btn" onClick={() => dispatch(actions.skipClue(game.id))}>⏭️ Skip</button>
            </div>

          </>
        ) : (
          <div className={`game-result ${game.successful ? 'win' : 'lose'}`}>
            {game.successful ? '¡Ganaste!' : `Perdiste, era ${game.driverName}`}
          </div>
        )}
      </div>
    </div>
  );
};

export default DriversLinkGame;
