import React from 'react';
import './OvercutGamesInfo.css';
import { useNavigate } from 'react-router-dom';
import { getAboutOvercutImage } from '../../../helpers/sourceAboutOvercutImages';

const OvercutGamesInfo = () => {
  const navigate = useNavigate();
  const lang = navigator.language.startsWith('es') ? 'es' : 'en';

  const description = lang === 'es'
    ? (
        <>
          <p>Diviértete con minijuegos temáticos como Drivers Connections, Grid Guess, Career Path, F1 Wordle... ¡Y muchos más!</p>
          <p>Cada juego pone a prueba tu conocimiento de la F1 de formas originales e interactivas.</p>
          <p>¡Regístrate y demuestra tu habilidad!</p>
        </>
      )
    : (
        <>
          <p>Enjoy themed minigames like Drivers Connections, Grid Guess, Career Path or F1 Wordle.</p>
          <p>And many more! Each game tests your F1 knowledge in original and interactive ways.</p>
          <p className="highlight-text">Sign up and prove your skill.</p>
        </>
      );

  return (
    <div className="overcut-info-container">
      <h1 className="overcut-info-title">OverCut Games</h1>
      <div className="overcut-info-content">
        <div className="overcut-info-image-wrapper">
          <img
            src={getAboutOvercutImage('OverCutGames.png')}
            alt="OverCut Games"
            className="overcut-info-image"
          />
        </div>
        <div className="overcut-info-text-wrapper">
          <div className="overcut-info-description">
            {description}
          </div>
          <div className="overcut-info-button-wrapper">
            <button
              className="overcut-info-button"
              onClick={() => navigate('/users/signUp')}
            >
              {lang === 'es' ? 'Regístrate ahora' : 'Sign up now'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OvercutGamesInfo;
