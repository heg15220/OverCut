import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './quizStyles.css';
import { motion } from 'framer-motion';

const ResultsPage = ({score, totalScore}) => {
    const navigate = useNavigate();

    return (
        <div className="quiz-container" style={{ backgroundImage: `url(${require('../../../assets/images/finish-flag.jpg')})` }}>
            <div className="overlay" />
            <motion.div
                className="quiz-content"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1 }}
            >
                <h2 className="question-title">¡Carrera terminada!</h2>
                <p style={{ fontSize: '1.2rem', color: '#fff', marginBottom: '1rem' }}>
                    ¡Gracias por participar en este quiz de Fórmula 1!
                </p>

                <motion.div
                    className="score-popup positive"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 1, duration: 0.6 }}
                    style={{ fontSize: '2.5rem', marginBottom: '1.5rem' }}
                >
                    🏁 Puntos: {score}/{totalScore}
                </motion.div>

                <motion.div
                    className="score-popup positive"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.6, duration: 0.6 }}
                    style={{ fontSize: '1.5rem', marginBottom: '2rem' }}
                >
                    Total conseguido: {score} puntos
                </motion.div>

                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="quiz-answer-btn"
                    onClick={() => navigate('/')}
                >
                    Volver al inicio
                </motion.button>
            </motion.div>
        </div>
    );
};

export default ResultsPage;
