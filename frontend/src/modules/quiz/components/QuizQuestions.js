import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QuestionDetails } from "../index";
import ResultsPage from "./ResultsPage";
import './QuizQuestions.css';
import { motion, AnimatePresence } from 'framer-motion';
import { sourceImages } from '../../../helpers/sourceImages';



const QuizQuestions = ({ questions, quizType }) => {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const currentQuestion = questions?.items ? questions.items[currentQuestionIndex] : null;
    const navigate = useNavigate();
    const [score, setScore] = useState(0);
    const [totalScore, setTotalScore] = useState(0);

    const handleNextQuestion = () => {
        setCurrentQuestionIndex((prev) => prev + 1);
    };

    const backgroundImage = quizType?.imagePath
        ? sourceImages(`./${quizType.imagePath}`)
        : "";



    return (
        <div className="quiz-container" style={{ backgroundImage: `url(${backgroundImage})` }}>
            <div className="overlay" />
            <div className="quiz-content">
                <AnimatePresence mode="wait">
                    {currentQuestion ? (
                        <motion.div
                            key={currentQuestion.id}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -30 }}
                            transition={{ duration: 0.5 }}
                        >
                            <QuestionDetails
                                question={currentQuestion}
                                onAnswerSubmit={handleNextQuestion}
                                quizType={quizType}
                                setScore={setScore}
                                setTotalScore={setTotalScore}
                                score={score}
                                totalScore={totalScore}
                            />

                        </motion.div>
                    ) : (
                        <motion.div
                            key="results"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <ResultsPage score={score} totalScore={totalScore} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default QuizQuestions;
