import React from 'react';
import './MinigameTutorial.css';

const MinigameTutorial = ({ title, description, image, onStart, lang }) => {
  return (
    <div className="tutorial-container">
      <h1 className="tutorial-title">{title}</h1>
      <div className="tutorial-content">
        <img src={image} alt={title} className="tutorial-image" />
        <p className="tutorial-description">{description}</p>
      </div>
      <button className="start-button" onClick={onStart}>
        {lang === 'es' ? 'Comenzar partida' : 'Start Game'}
      </button>
    </div>
  );
};

export default MinigameTutorial;
