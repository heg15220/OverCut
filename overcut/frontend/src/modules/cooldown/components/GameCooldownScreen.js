import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { sourceImages } from '../../../helpers/sourceImages';
import './GameCooldownScreen.css';

const backgroundImages = [
  './f1-2013-11-bel-parrilla-trasera.png',
  './salida-gp-bahrein-2024-f1.png',
  './mundial-f1.png'
];

const GameCooldownScreen = ({ seconds, loading, onBack })  => {
  const [bgIndex, setBgIndex] = useState(0);
  const [prevBgIndex, setPrevBgIndex] = useState(null);
  const [timeLeft, setTimeLeft] = useState(seconds);

  const lang = navigator.language.startsWith('es') ? 'es' : 'en';

  const translations = {
    es: {
      title: "⏳ ¡Espera un poco antes de volver al Quiz!",
      description: "Solo puedes jugar un Quiz cada 12 horas. Cuando termine la cuenta atrás podrás volver a intentarlo. ¡Estate atento!",
      back: "Volver al inicio"
    },
    en: {
      title: "⏳ Hold on before playing the Quiz again!",
      description: "You can only play one Quiz every 12 hours. When the countdown ends you'll be able to try again. Keep an eye on it!",
      back: "Back to home"
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setPrevBgIndex(bgIndex);
      setBgIndex(prev => (prev + 1) % backgroundImages.length);
    }, 15000);
    return () => clearInterval(interval);
  }, [bgIndex]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setTimeLeft(seconds);
  }, [seconds]);

  const formatTime = (secs) => {
    const hours = Math.floor(secs / 3600);
    const minutes = Math.floor((secs % 3600) / 60);
    const seconds = secs % 60;
    return `${hours > 0 ? hours + "h " : ""}${minutes}m ${seconds < 10 ? "0" : ""}${seconds}s`;
  };

  return (
    <div className="quiz-cooldown-container">
      {prevBgIndex !== null && (
        <motion.div
          key={`prev-${prevBgIndex}`}
          className="background-image"
          initial={{ opacity: 1, scale: 1 }}
          animate={{ opacity: 0 }}
          transition={{ opacity: { duration: 2.5 } }}
          style={{
            backgroundImage: `linear-gradient(to bottom, rgba(0, 0, 0, 0.3), rgba(0,0,0,0.3)), url(${sourceImages(backgroundImages[prevBgIndex])})`
          }}
        />
      )}

      <motion.div
        key={`current-${bgIndex}`}
        className="background-image"
        initial={{ opacity: 0, scale: 1 }}
        animate={{ opacity: 1, scale: 1.05 }}
        transition={{
          opacity: { duration: 2 },
          scale: { duration: 15, ease: "easeInOut" }
        }}
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(0, 0, 0, 0.2), rgba(0,0,0,0.2)), url(${sourceImages(backgroundImages[bgIndex])})`
        }}
      />

      <div className="overlay" />

      <div className="quiz-cooldown-content">
        {loading ? (
          <div className="loading-spinner">
            <div className="spinner-wheel" />
            <p>{lang === 'es' ? 'Cargando...' : 'Loading...'}</p>
          </div>
        ) : (
          <>
            <h2>{translations[lang].title}</h2>
            <p>{translations[lang].description}</p>
            <div className="countdown-timer">{formatTime(timeLeft)}</div>
            <button className="cooldown-back-button" onClick={onBack}>
              {translations[lang].back}
            </button>
          </>
        )}
      </div>

    </div>
  );
};

export default GameCooldownScreen;
