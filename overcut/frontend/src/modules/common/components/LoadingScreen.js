import React from 'react';
import './LoadingScreen.css';

const LoadingScreen = ({ lang = 'en', text }) => {
  const translations = {
    loading: {
      es: 'Cargando...',
      en: 'Loading...',
    }
  };

  return (
    <div className="loading-screen">
      <div className="loading-container">
        <div className="progress-bar">
          <div className="progress-car" role="img" aria-label="car">🏎️</div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
