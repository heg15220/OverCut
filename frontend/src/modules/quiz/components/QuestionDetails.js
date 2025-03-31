import React, { useEffect, useState } from 'react';
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


const QuestionDetails = ({ question, onAnswerSubmit, quizType }) => {
    const user = useSelector(userSelectors.getUser);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const answers = useSelector(selectors.getAnswers);
    const quiz = useSelector(selectors.findQuiz);
    const [responseState, setResponseState] = useState({});
    const [scoreEffect, setScoreEffect] = useState(null);

    useEffect(() => {
        const questionId = Number(question.id);
        if (!Number.isNaN(questionId)) {
            dispatch(actions.getQuestionDetails(questionId, () => {}, () => {}));
            dispatch(actions.getAnswersForQuestion(questionId, () => {}, () => {}));
        }
    }, [question, dispatch]);

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
        setResponseState(prev => ({ ...prev, [answer.id]: { isSelected: true, isCorrect } }));

        setScoreEffect(isCorrect ? `+${knowledge}` : '-0');

        setTimeout(() => {
            setScoreEffect(null);
            setResponseState({});
            onAnswerSubmit();
        }, 2000);
    };

    return (
        <Box className="question-box" sx={{ color: 'white', textAlign: 'center' }}>
            <Typography variant="h4" className="question-title">
                {question.name}
            </Typography>
            {question.imagePath && (
                <img
                    src={sourceImages(`./${question.imagePath}`)}
                    alt="Question visual"
                    className="question-image"
                />
            )}

            <Grid container spacing={2} justifyContent="center" mt={3}>
                {answers && answers.map((answer) => (
                    <Grid item xs={12} md={6} key={answer.id}>
                        <Button
                            fullWidth
                            variant="contained"
                            onClick={() => handleSelectAnswer(answer)}
                            className={`quiz-answer-btn ${responseState[answer.id]?.isCorrect === true ? 'correct' : ''}`}
                        >
                            {answer.name}
                            {responseState[answer.id]?.isSelected && (
                                answer.correct ? <CheckCircleOutlineIcon sx={{ ml: 1 }} /> : <CancelIcon sx={{ ml: 1 }} />
                            )}
                        </Button>
                    </Grid>
                ))}
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