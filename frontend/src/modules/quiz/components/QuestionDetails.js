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
                    justifyContent: 'center',
                    alignItems: 'center',
                    mt: 1,
                    mb: 1
                }}
            >
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.5 }}
                    style={{
                        width: 70,
                        height: 70,
                        borderRadius: '50%',
                        border: '4px solid #ffcc00',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.2rem',
                        fontWeight: 'bold',
                        backgroundColor: 'rgba(0, 0, 0, 0.6)',
                        color: '#fff',
                        boxShadow: '0 0 10px #ffcc00',
                    }}
                >
                    {timeLeft}s
                </motion.div>
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


            <AnimatePresence>
                {scoreEffect && (
                    <motion.div
                        key={scoreEffect}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.8 }}
                        className={`score-popup ${scoreEffect.startsWith('+') ? 'positive' : 'negative'}`}
                    >
                        {scoreEffect}
                    </motion.div>
                )}
            </AnimatePresence>
        </Box>
    );
};

export default QuestionDetails;
