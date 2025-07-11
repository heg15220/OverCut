import React from 'react';
import { useNavigate } from 'react-router-dom';
import './quizMobileStyles.css';

const QuizMobile = () => {
  const navigate = useNavigate();

  return (
    <div className="quiz-mobile-container">
      <div className="quiz-mobile-overlay" />
      <div className="quiz-mobile-content">
        <h1 className="quiz-mobile-title">Quiz Móvil</h1>
        <p className="quiz-mobile-subtitle">¡Juega el quiz en tu dispositivo móvil!</p>
        <button
          className="quiz-mobile-button"
          onClick={() => navigate('/')}
        >
          Volver al inicio
        </button>
      </div>
    </div>
  );
};

export default QuizMobile;
