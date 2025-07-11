import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { sourceImages } from '../../../helpers/sourceImages';
import './quizStyles.css';

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
};

const QuizIntroTypeCategory = ({ quizType, quizCategory, onContinue }) => {
  const backgroundImage = quizType?.imagePath ? sourceImages(`./${quizType.imagePath}`) : '';
  const [showCar, setShowCar] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    const carDelay = setTimeout(() => setShowCar(true), 3000);
    const timeout = setTimeout(() => onContinue(), 4000);

    return () => {
      clearTimeout(timeout);
      clearTimeout(carDelay);
    };
  }, [onContinue]);

  if (!quizType || !quizCategory) {
    return (
      <div className="quiz-container">
        <div className="loading-spinner" style={{ textAlign: 'center', paddingTop: '6rem' }}>
          <div className="spinner-wheel" />
          <p style={{ marginTop: '1rem', color: 'white', fontSize: '1.2rem' }}>Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-container">
      <motion.div
        className="background-image"
        initial={{ opacity: 0, filter: 'brightness(1.1) saturate(1.2)' }}
        animate={{ opacity: 1, filter: 'brightness(1.25) saturate(1.3)' }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        style={{
          backgroundImage: `url(${backgroundImage})`
        }}
      />

      <div className="overlay" />
      <div className="quiz-content">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="intro-card"
        >
          <motion.p
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1, ease: 'easeOut' }}
            style={{
              fontSize: isMobile ? '1.7rem' : '3.5rem',
              color: '#ffcc00',
              marginBottom: '1.2rem',
              textShadow: '3px 3px 6px rgba(0,0,0,0.8)',
              fontWeight: '900',
              letterSpacing: '2px',
              textTransform: 'uppercase'
            }}
          >
            {quizType.name}
          </motion.p>

          <motion.p
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1, delay: 0.4, ease: 'easeOut' }}
            style={{
              fontSize: isMobile ? '1.5rem' : '2.5rem',
              color: '#ffffff',
              marginBottom: '2rem',
              textShadow: '2px 2px 4px rgba(0,0,0,0.7)',
              fontWeight: '600',
              letterSpacing: '1px'
            }}
          >
            {quizCategory.name}
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
};

export default QuizIntroTypeCategory;
