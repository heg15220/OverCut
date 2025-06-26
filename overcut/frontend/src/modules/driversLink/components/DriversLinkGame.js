import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import * as actions from '../actions';
import * as selectors from '../selectors';
import { useNavigate } from 'react-router-dom';
import './DriversLinkGame.css';
import LoadingScreen from '../../common/components/LoadingScreen';
import MinigameTutorial from "../../common/components/MinigameTutorial"; // nuevo componente compartido
import { sourceImages } from "../../../helpers/sourceMiniGamesImages"; // ya lo usas en MinigamesHome
import { tutorialTexts } from "../../../helpers/minigameTutorialTexts"; // explicaciones por minijuego
import CooldownScreen from "../../cooldown/components/CooldownScreen";
import { getCooldownForGame } from "../../cooldown/selectors";
import { fetchCooldown } from "../../cooldown/actions";
import { getUser } from "../../users/selectors";



const DriversLinkGame = () => {
  const dispatch = useDispatch();
  const game = useSelector(selectors.getDriversLinkGame);
  const suggestions = useSelector(selectors.getDriverSuggestions);

  const navigate = useNavigate();
  const [guessInput, setGuessInput] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const suggestionsRef = useRef([]);
  const lang = navigator.language.startsWith('es') ? 'es' : 'en';

  const [showTutorial, setShowTutorial] = useState(true);

  const tutorial = tutorialTexts["/minigames/driverslink"][lang];

  const { canPlay, secondsRemaining } = useSelector(state =>
    getCooldownForGame(state, "DriversLink")
  );
  const user = useSelector(getUser);


  const translations = {
    title: {
      es: '🔗 Drivers Link',
      en: '🔗 Drivers Link',
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
      es: '¡Correcto!',
      en: 'Correct!',
    },
    lose: {
      es: 'Incorrecto, era',
      en: 'Incorrect, it was',
    },
  };

  useEffect(() => {
    dispatch(fetchCooldown("DriversLink"));
  }, [dispatch]);


  useEffect(() => {
    if (canPlay) {
      dispatch(actions.startDriversLinkGame(user.id));
    }
  }, [canPlay, dispatch, user]);


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
            image={sourceImages("./DriversLink.png")}
            onStart={() => setShowTutorial(false)}
            lang={lang}
          />
        );
      }


  const handleGuess = () => {
    if (!guessInput.trim()) return;
    dispatch(actions.guessDriver({ gameId: game.id, driverGuess: guessInput }));
    setGuessInput('');
    dispatch(actions.clearDriverSuggestions());
    setHighlightedIndex(-1);
  };

  if (!game) return <LoadingScreen lang={lang} text={translations.loading[lang]} />;


  return (
    <div className="drivers-link-container">
      <div className="drivers-link-overlay">
        <h2 className="drivers-link-title">{translations.title[lang]}</h2>

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

            <button className="back-btn" onClick={() => navigate('/minigames')}>
              ⬅️ {lang === 'es' ? 'Volver al inicio' : 'Back home'}
            </button>
          </div>
        )}
      </div>
    </div>
  );

};

export default DriversLinkGame;
