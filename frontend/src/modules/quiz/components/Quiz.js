import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import * as actions from '../actions';
import * as UserSelector from '../../users/selectors';
import { useNavigate } from 'react-router-dom';
import './quizStyles.css';
import { motion } from 'framer-motion';
import { sourceImages } from '../../../helpers/sourceImages';


const Quiz = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const user = useSelector(UserSelector.getUser);

    const handleStart = () => {
        if (user.id) {
            dispatch(actions.createQuiz(user.id,
                (quizId) => navigate(`/quiz/quiz-list/${quizId}`),
                () => {}
            ));
        }
    };

    return (
        <div className="quiz-container" style={{ backgroundImage: `url(${sourceImages('./f1-2013-11-bel-parrilla-trasera.jpg')})` }}
>
            <div className="overlay" />
            <div className="quiz-content">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
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
            </div>
        </div>
    );
};

export default Quiz;