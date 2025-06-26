import React, { useEffect, useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import * as actions from '../actions';
import * as selectors from '../selectors';
import * as userSelectors from '../../users/selectors';
import { sourceImages } from '../../../helpers/sourceImages';
import { Card, CardContent, Typography, Button, Grid, Box } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelIcon from '@mui/icons-material/Cancel';
import './quizStyles.css';

const QuestionDetails = ({ question, onAnswerSubmit, quizType, setScore, setTotalScore, score, totalScore }) => {
    const user = useSelector(userSelectors.getUser);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const answers = useSelector(selectors.getAnswers);
    const quiz = useSelector(selectors.findQuiz);
    const [responseState, setResponseState] = useState({});
    const [scoreEffect, setScoreEffect] = useState(null);
    const [timeLeft, setTimeLeft] = useState(60);
    const timerRef = useRef(null);
    const [answered, setAnswered] = useState(false);
    const lang = navigator.language.startsWith("es") ? "es" : "en";

    const t = {
      es: {
        correctAnswer: "La respuesta correcta era:",
        unknown: "Desconocida"
      },
      en: {
        correctAnswer: "The correct answer was:",
        unknown: "Unknown"
      }
    }[lang];



    useEffect(() => {
        const questionId = Number(question.id);
        if (!Number.isNaN(questionId)) {
            dispatch(actions.getQuestionDetails(questionId, () => {}, () => {}));
            dispatch(actions.getAnswersForQuestion(questionId, () => {}, () => {}));
        }
    }, [question, dispatch]);

  useEffect(() => {
        setTimeLeft(60);
        setAnswered(false);

        timerRef.current = setInterval(() => {
            setTimeLeft((prev) => prev - 1);
        }, 1000);

        return () => clearInterval(timerRef.current);
    }, [question]);

    useEffect(() => {
        if (timeLeft <= 0 && !answered) {
            clearInterval(timerRef.current);
            setTotalScore(prev => prev + question.knowledgequestionlevel);
            setScoreEffect('-0');
            setAnswered(true);

            setTimeout(() => {
                setScoreEffect(null);
                setResponseState({});
                onAnswerSubmit();
            }, 2000);
        }
    }, [timeLeft, answered]);

    if (!question) return null;

    const handleSelectAnswer = (answer) => {
            const questionId = Number(question.id);
            const quizId = Number(quiz);
            const knowledge = question.knowledgequestionlevel;

            dispatch(actions.chooseAnswer(quizId, {
                questionId,
                userId: user.id,
                answerId: answer.id
            }, () => {}, () => {}));

            const isCorrect = answer.correct;

            setAnswered(true);
            clearInterval(timerRef.current);

            setTotalScore(prev => prev + knowledge);
            if (isCorrect) setScore(prev => prev + knowledge);

            setResponseState(prev => ({ ...prev, [answer.id]: { isSelected: true, isCorrect } }));
            setScoreEffect(isCorrect ? `+${knowledge}` : '-0');

            setTimeout(() => {
                setScoreEffect(null);
                setResponseState({});
                onAnswerSubmit();
            }, 2000);
        };


    return (
        <Box className="question-box" sx={{ color: 'white', textAlign: 'center', px: { xs: 2, sm: 4, md: 2 } }}>

            <Typography
                variant="h4"
                className="question-title"
                sx={{ whiteSpace: 'pre-line', wordBreak: 'break-word', maxWidth: '100%', fontSize: { xs: '1.3rem', sm: '1.6rem', md: '2rem' } }}
            >
                {question.name}
            </Typography>
            {question.imagePath && (
                <img
                    src={sourceImages(`./${question.imagePath}`)}
                    alt="Question visual"
                    className="question-image"
                />
            )}

            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    mt: 2,
                    mb: 2,
                    position: 'relative',
                    zIndex: 2,
                }}
            >
                {/* Cronómetro */}
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.5 }}
                    style={{
                        width: 80,
                        height: 80,
                        borderRadius: '50%',
                        border: '5px solid #ffcc00',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.6rem',
                        fontWeight: 'bold',
                        backgroundColor: 'rgba(0, 0, 0, 0.6)',
                        color: '#fff',
                        boxShadow: '0 0 12px #ffcc00',
                        marginBottom: 12
                    }}
                >
                    {timeLeft}s
                </motion.div>

                {/* Contenedor de animaciones: alineadas a extremos */}
                {(answered || scoreEffect) && (
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            width: '100%',
                            maxWidth: '800px',
                            px: { xs: 2, sm: 4 },
                            mb: 2,
                            position: 'relative',
                        }}
                    >
                        {/* Respuesta correcta (izquierda) */}
                        {answered && scoreEffect === '-0' && (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.6 }}
                                style={{
                                    fontWeight: 'bold',
                                    color: '#ffcc00',
                                    fontSize: '1rem',
                                    backgroundColor: 'rgba(0,0,0,0.7)',
                                    padding: '10px 14px',
                                    borderRadius: '12px',
                                    maxWidth: '45%',
                                    textAlign: 'left',
                                    whiteSpace: 'normal',
                                    wordBreak: 'break-word',
                                }}
                            >
                                {t.correctAnswer} {answers.find((a) => a.correct)?.name || t.unknown}
                            </motion.div>
                        )}

                        {/* Espaciador central invisible para mantener el cronómetro arriba centrado */}
                        <div style={{ flex: 1 }}></div>

                        {/* Puntos obtenidos (derecha) */}
                        {scoreEffect && (
                            <motion.div
                                key={scoreEffect}
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                transition={{ duration: 0.8 }}
                                style={{
                                    fontWeight: 'bold',
                                    fontSize: '1.4rem',
                                    color: scoreEffect.startsWith('+') ? '#00e676' : '#ff1744',
                                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                                    padding: '10px 18px',
                                    borderRadius: '12px',
                                    textAlign: 'center',
                                    minWidth: '80px',
                                    maxWidth: '20%',
                                }}
                            >
                                {scoreEffect}
                            </motion.div>
                        )}
                    </Box>
                )}

            </Box>


           <Grid container spacing={2} justifyContent="center" mt={3}>
               {answers && answers.map((answer) => {
                   const selected = responseState[answer.id]?.isSelected;
                   const isCorrect = responseState[answer.id]?.isCorrect;

                   return (
                       <Grid item xs={12} md={6} key={answer.id}>
                           <motion.button
                               whileHover={{ scale: 1.03 }}
                               whileTap={{ scale: 0.97 }}
                               onClick={() => handleSelectAnswer(answer)}
                               className={`custom-answer-btn
                                   ${selected ? (isCorrect ? 'correct' : 'incorrect') : ''}`}
                           >
                               <span className="answer-text">{answer.name}</span>
                               {selected && (
                                   isCorrect
                                       ? <CheckCircleOutlineIcon sx={{ ml: 1 }} className="answer-icon" />
                                       : <CancelIcon sx={{ ml: 1 }} className="answer-icon" />
                               )}
                           </motion.button>
                       </Grid>
                   );
               })}
           </Grid>
        </Box>
    );
};

export default QuestionDetails;
