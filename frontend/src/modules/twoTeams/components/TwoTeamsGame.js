import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import * as actions from '../actions';
import * as selectors from '../selectors';
import TeamLogo from './TeamLogo';
import './TwoTeamsGame.css';

const TwoTeamsGame = () => {
  const dispatch = useDispatch();
  const game = useSelector(selectors.getGame);
  const suggestions = useSelector(selectors.getDriverSuggestions);

  const [guessInput, setGuessInput] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const suggestionsRef = useRef([]);

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

  if (!game) return <div className="two-teams-game">Loading...</div>;

  const current = game.pairs[game.currentPairIndex];
  const showResult = current.guessedCorrectly !== null;

  return (
    <div className="two-teams-game">
      <h2 className="two-teams-title">2 EQUIPOS, 1 PILOTO</h2>

      <div className="teams-pair">
        <div className={`team-box ${showResult && current.guessedCorrectly ? 'correct' : ''}`}>
          <TeamLogo teamName={current.teamA} />
          <span>{current.teamA}</span>
        </div>
        <div className={`team-box ${showResult && current.guessedCorrectly ? 'correct' : ''}`}>
          <TeamLogo teamName={current.teamB} />
          <span>{current.teamB}</span>
        </div>
      </div>

      {!game.finished && (
        <>
          <div style={{ position: 'relative', width: '100%' }}>
            <input
              className="driver-input"
              placeholder="Nombre del piloto"
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
            <button className="guess-btn" onClick={handleGuess}>✅ Adivinar</button>
            <button className="skip-btn" onClick={handleSkip}>⏭️ Saltar</button>
          </div>
        </>
      )}

      {game.finished && (
        <div className="final-result">
          <h3>Juego terminado</h3>
          <p>Aciertos: {game.correctAnswers} / 10</p>
        </div>
      )}
    </div>
  );
};

export default TwoTeamsGame;
