import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { sourceImages } from '../../../helpers/sourceImages';
import './quizStyles.css';

const QuizIntroTypeCategory = ({ quizType, quizCategory, onContinue }) => {
    const backgroundImage = quizType?.imagePath ? sourceImages(`./${quizType.imagePath}`) : '';

    useEffect(() => {
        const timeout = setTimeout(() => {
            onContinue();
        }, 4000); // 4 segundos

        return () => clearTimeout(timeout);
    }, [onContinue]);

    return (
        <div className="quiz-container" style={{ backgroundImage: `url(${backgroundImage})` }}>
            <div className="overlay" />
            <div className="quiz-content">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1 }}
                    className="intro-card"
                >
                    <motion.p
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 1, delay: 0.3 }}
                        style={{
                            fontSize: '3rem',
                            color: '#ffcc00',
                            marginBottom: '1.5rem',
                            textShadow: '2px 2px 4px rgba(0,0,0,0.6)',
                            fontWeight: 'bold'
                        }}
                    >
                        {quizType.name}
                    </motion.p>
                    <motion.p
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 1, delay: 0.8 }}
                        style={{
                            fontSize: '2.2rem',
                            color: '#ffffff',
                            marginBottom: '2rem',
                            textShadow: '1px 1px 3px rgba(0,0,0,0.6)'
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
