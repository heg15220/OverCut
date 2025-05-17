import React, { useEffect, useRef, useState } from 'react'; // ya tienes esto arriba
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import * as actions from '../actions';
import * as selectors from '../selectors';
import './WordleGame.css';

const WordleGame = () => {
  const dispatch = useDispatch();
  const game = useSelector(selectors.getF1WordleGame);
  const [guess, setGuess] = useState('');
  const navigate = useNavigate();

  const lang = navigator.language.startsWith('es') ? 'es' : 'en';
  const t = {
    title: { es: '🔤 F1 Wordle', en: '🔤 F1 Wordle' },
    placeholder: { es: 'Apellido del piloto', en: 'Driver surname' },
    guess: { es: 'Adivinar', en: 'Guess' },
    won: { es: '¡Correcto!', en: 'Correct!' },
    lost: { es: 'Perdiste. Era', en: 'You lost. It was' },
    loading: { es: 'Cargando...', en: 'Loading...' }
  };

  const inputRefs = useRef([]);

  useEffect(() => {
    dispatch(actions.startWordleGame());
  }, [dispatch]);

  const handleGuess = () => {
    if (guess.trim()) {
      dispatch(actions.guessWordle({ gameId: game.id, driverGuess: guess }));
      setGuess('');
    }
  };

  if (!game) return <div className="wordle-container">{t.loading[lang]}</div>;

  return (
    <div className="wordle-container">
      <h2 className="wordle-title">{t.title[lang]}</h2>
      <div className="wordle-grid">
        {Array.from({ length: 6 }).map((_, rowIndex) => {
          const attempt = game.attempts.find(a => a.attemptOrder === rowIndex);
          if (attempt) {
            return (
              <div key={rowIndex} className="wordle-row">
                {attempt.guess.split('').map((char, i) => (
                  <div key={i} className={`wordle-cell ${attempt.feedback[i]}`}>
                    {char.toUpperCase()}
                  </div>
                ))}
              </div>
            );
          } else if (!game.finished && game.attempts.length === rowIndex) {
            // fila activa de input
            return (
              <div key={rowIndex} className="wordle-row-input">
                {Array.from({ length: game?.surname?.length || 0 }).map((_, i) => (
                  <input
                    key={i}
                    className="wordle-input-cell"
                    value={guess[i] || ''}
                    ref={el => inputRefs.current[i] = el}
                    onChange={e => {
                      const newChar = e.target.value.slice(-1).toLowerCase();
                      const newGuess = guess.slice(0, i) + newChar + guess.slice(i + 1);
                      setGuess(newGuess);

                      // mover al siguiente input si no es el último
                      if (newChar && i < inputRefs.current.length - 1) {
                        inputRefs.current[i + 1]?.focus();
                      }
                    }}
                    onKeyDown={e => {
                      // retroceso hacia atrás
                      if (e.key === 'Backspace' && !guess[i] && i > 0) {
                        inputRefs.current[i - 1]?.focus();
                      }
                    }}
                    maxLength={1}
                    autoFocus={i === 0}
                  />
                ))}
                <button className="wordle-btn" onClick={handleGuess}>
                  {t.guess[lang]}
                </button>
              </div>
            );
          } else {
            // fila vacía
            return (
              <div key={rowIndex} className="wordle-row">
                {Array.from({ length: game?.surname?.length || 0 }).map((_, i) => (
                  <div key={i} className="wordle-cell empty"> </div>
                ))}
              </div>
            );
          }
        })}
      </div>


      {game.finished && (
        <div className="wordle-end-container">
          <div className={`wordle-result ${game.successful ? 'win' : 'lose'}`}>
            {game.successful
              ? t.won[lang]
              : `${t.lost[lang]} ${game.surname}`}
          </div>

          <button className="wordle-btn wordle-btn-home" onClick={() => navigate('/minigames')}>
            {lang === 'es' ? 'Volver al inicio' : 'Back to Home'}
          </button>
        </div>
      )}

    </div>
  );
};

export default WordleGame;
