import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import * as actions from '../actions';
import * as UserSelector from '../../users/selectors';
import { useNavigate } from 'react-router-dom';
import './quizStyles.css';
import { motion, AnimatePresence } from 'framer-motion';
import { sourceImages } from '../../../helpers/sourceImages';

const Quiz = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const user = useSelector(UserSelector.getUser);
    const [loading, setLoading] = useState(false);

    const handleStart = () => {
        if (user.id) {
            const rawLang = navigator.language || navigator.userLanguage; // fallback por compatibilidad
            const normalizedLang = rawLang.toLowerCase().startsWith('es') ? 'es' : 'en';

            setLoading(true);
            dispatch(actions.createQuiz({
                userId: user.id,
                lang: normalizedLang,
                onSuccess: (quizId) => navigate(`/quiz/quiz-list/${quizId}`),
                onErrors: () => setLoading(false)
            }));
        }
    };



    return (
        <div className="quiz-container" style={{ backgroundImage: `url(${sourceImages('./f1-2013-11-bel-parrilla-trasera.jpg')})` }}>
            <div className="overlay" />
            <div className="quiz-content">
                <AnimatePresence mode="wait">
                    {loading ? (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.5 }}
                            className="loading-spinner"
                        >
                            <motion.div
                                className="spinner-wheel"
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                            />
                            <p style={{ marginTop: '1rem', color: 'white', fontSize: '1.2rem' }}>
                                Preparando la parrilla de salida...
                            </p>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="intro"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 1 }}
                            className="intro-card"
                        >
                            <h1 className="question-title">Bienvenido al Quiz F1</h1>
                            <p style={{ fontSize: '1.2rem', color: '#fff', marginBottom: '2rem' }}>
                                Demuestra tu conocimiento sobre la Fórmula 1
                            </p>
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                className="quiz-answer-btn"
                                onClick={handleStart}
                            >
                                Jugar ahora
                            </motion.button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default Quiz;
