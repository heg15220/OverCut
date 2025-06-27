import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { sourceImages } from '../../../helpers/sourceImages';
import './QuizLoadingScreen.css';

const backgroundImages = [
  './f1-2013-11-bel-parrilla-trasera.png',
  './salida-gp-bahrein-2024-f1.png',
  './mundial-f1.png'
];

const QuizLoadingScreen = ({ lang = 'en', text }) => {
  const [bgIndex, setBgIndex] = useState(0);
  const [prevBgIndex, setPrevBgIndex] = useState(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setPrevBgIndex(bgIndex);
      setBgIndex(prev => (prev + 1) % backgroundImages.length);
    }, 15000);

    return () => clearInterval(interval);
  }, [bgIndex]);

  const translations = {
    loading: {
      es: 'Cargando quiz...',
      en: 'Loading quiz...',
    }
  };

  return (
    <div className="quiz-loading-container">
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

      <div className="quiz-loading-content">
        <div className="loading-spinner">
          <div className="spinner-wheel" />
          <p>{text || translations.loading[lang]}</p>
        </div>
      </div>
    </div>
  );
};

export default QuizLoadingScreen;
