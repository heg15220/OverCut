import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './quizStyles.css';
import { motion } from 'framer-motion';
import { FormattedMessage } from 'react-intl';

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
};

const ResultsPage = ({ score, totalScore }) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  return (
    <div
      className="quiz-container"
      style={{
        backgroundImage: `url(${require('../../../assets/images/finish-flag.jpg')})`
      }}
    >
      <div className="overlay" />
      <motion.div
        className="quiz-content"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
      >
        <h2
          className="question-title"
          style={{
            fontSize: isMobile ? '1.3rem' : '2.2rem',
            marginBottom: '1.5rem',
            color: '#ffcc00',
            textShadow: '1px 1px 2px #000',
            textTransform: 'uppercase'
          }}
        >
          <FormattedMessage id="quiz.result.title" />
        </h2>

        <p
          style={{
            fontSize: isMobile ? '1rem' : '1.2rem',
            color: '#fff',
            marginBottom: '1rem'
          }}
        >
          <FormattedMessage id="quiz.result.subtitle" />
        </p>

        <motion.div
          className="score-popup positive"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 1, duration: 0.6 }}
          style={{
            fontSize: isMobile ? '2rem' : '2.5rem',
            marginBottom: '1.5rem'
          }}
        >
          <FormattedMessage id="quiz.result.points" /> {score}/{totalScore}
        </motion.div>

        <motion.div
          className="score-popup positive"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6, duration: 0.6 }}
          style={{
            fontSize: isMobile ? '1.2rem' : '1.5rem',
            marginBottom: '2rem'
          }}
        >
          <FormattedMessage id="quiz.result.total" /> {score}{' '}
          <FormattedMessage id="quiz.result.point" />
        </motion.div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="quiz-answer-btn"
          onClick={() => navigate('/')}
        >
          <FormattedMessage id="quiz.result.back" />
        </motion.button>
      </motion.div>
    </div>
  );
};

export default ResultsPage;
