import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import * as actions from '../actions';
import * as selectors from '../selectors';
import TeamLogo from './TeamLogo';
import { useNavigate } from 'react-router-dom';
import './TeamGuessGame.css';
import LoadingScreen from '../../common/components/LoadingScreen';
import MinigameTutorial from "../../common/components/MinigameTutorial"; // nuevo componente compartido
import { sourceImages } from "../../../helpers/sourceMiniGamesImages"; // ya lo usas en MinigamesHome
import { tutorialTexts } from "../../../helpers/minigameTutorialTexts"; // explicaciones por minijuego
import CooldownScreen from "../../cooldown/components/CooldownScreen";
import { fetchCooldown } from "../../cooldown/actions";
import { getCooldownForGame } from "../../cooldown/selectors";
import { getUser } from "../../users/selectors";


const TeamGuessGame = () => {
  const dispatch = useDispatch();
  const game = useSelector(selectors.getTeamGuessGame);
  const suggestions = useSelector(selectors.getTeamSuggestions);
  const [guessInput, setGuessInput] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const suggestionsRef = useRef([]);
  const navigate = useNavigate();
  const lang = navigator.language.startsWith('es') ? 'es' : 'en';

  const [showTutorial, setShowTutorial] = useState(true);

  const tutorial = tutorialTexts["/minigames/teamGuess"][lang];

  const { canPlay, secondsRemaining } = useSelector(state =>
    getCooldownForGame(state, "TeamGuess")
  );
  const user = useSelector(getUser);


  const translations = {
    title: { es: '🏁 Adivina el equipo', en: '🏁 Guess the Team' },
    placeholder: { es: 'Nombre del equipo', en: 'Team name' },
    guess: { es: 'Adivinar', en: 'Guess' },
    loading: { es: 'Cargando juego...', en: 'Loading game...' },
    win: { es: '¡Correcto!', en: 'Correct!' },
    lose: { es: 'Era', en: 'It was' },
  };

  useEffect(() => {
    dispatch(fetchCooldown("TeamGuess"));
  }, [dispatch]);

  useEffect(() => {
    if (canPlay) {
      dispatch(actions.startTeamGuessGame());
    }
  }, [canPlay, dispatch]);


  useEffect(() => {
    if (guessInput.trim().length > 1) {
      const timer = setTimeout(() => {
        dispatch(actions.fetchTeamSuggestions(guessInput));
      }, 300);
      return () => clearTimeout(timer);
    } else {
      dispatch(actions.clearTeamSuggestions());
    }
  }, [guessInput, dispatch]);

  useEffect(() => {
    if (highlightedIndex >= 0 && suggestionsRef.current[highlightedIndex]) {
      suggestionsRef.current[highlightedIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [highlightedIndex]);

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
                image={sourceImages("./GuessTeam.png")}
                onStart={() => setShowTutorial(false)}
                lang={lang}
              />
            );
          }

  const handleGuess = () => {
    if (!guessInput.trim()) return;
    dispatch(actions.guessTeam({ gameId: game.id, teamGuess: guessInput }));
    setGuessInput('');
    dispatch(actions.clearTeamSuggestions());
    setHighlightedIndex(-1);
  };

  if (!game) return <LoadingScreen lang={lang} text={translations.loading[lang]} />;

  return (
    <div className="team-guess-container">
      <div className="team-guess-overlay">
        <h2 className="team-guess-title">{translations.title[lang]}</h2>

        <div className={`team-reveal-card-wrapper ${game.finished ? 'flipped' : ''}`}>
          <div className="team-reveal-card-inner">
            <div className="team-reveal-card-face front">?</div>
            <div className={`team-reveal-card-face back ${game.successful ? 'success' : 'fail'}`}>
              <TeamLogo teamName={game.teamName} />
              <div className="team-name-reveal">{game.teamName}</div>
            </div>
          </div>
        </div>

        <div className="clues-row">
          {game.clues.map((clue, idx) => (
            <div key={idx} className="clue-block">{clue.driverName}</div>
          ))}
        </div>


        {!game.finished ? (
          <>
            <div style={{ position: 'relative', width: '100%' }}>
              <input
                className="team-input"
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
                    setHighlightedIndex((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1));
                  } else if (e.key === 'Enter') {
                    e.preventDefault();
                    if (highlightedIndex >= 0) {
                      const selected = suggestions[highlightedIndex];
                      setGuessInput('');
                      dispatch(actions.clearTeamSuggestions());
                      dispatch(actions.guessTeam({ gameId: game.id, teamGuess: selected }));
                    } else {
                      handleGuess();
                    }
                  }
                }}
              />

              {suggestions.length > 0 && (
                <div className="team-suggestion-list">
                  {suggestions.map((name, idx) => (
                    <div
                      key={idx}
                      ref={(el) => suggestionsRef.current[idx] = el}
                      className={`suggestion-item ${highlightedIndex === idx ? 'selected' : ''}`}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setGuessInput('');
                        dispatch(actions.clearTeamSuggestions());
                        dispatch(actions.guessTeam({ gameId: game.id, teamGuess: name }));
                      }}
                      onMouseEnter={() => setHighlightedIndex(idx)}
                    >
                      {name}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button className="guess-btn" onClick={handleGuess}>{translations.guess[lang]}</button>
          </>
        ) : (
              <div className="result-container">
                <div className={`game-result ${game.successful ? 'win' : 'lose'}`}>
                  {game.successful
                    ? translations.win[lang]
                    : `${translations.lose[lang]} ${game.teamName}`}
                </div>

                <button className="back-btn" onClick={() => navigate('/minigames')}>
                  ⬅️ {lang === 'es' ? 'Volver al inicio' : 'Back home'}
                </button>
              </div>

            )}
      </div>
    </div>
  );
};

export default TeamGuessGame;
