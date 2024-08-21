import React, { useEffect, useState } from 'react';
import { Container, Typography, Box, Button, Grid } from '@mui/material';
import * as selectors from '../selectors';
import * as actions from '../actions';
import * as userSelectors from '../../users/selectors';
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {FormattedMessage} from "react-intl";

const ResultsPage = () => {
    const dispatch = useDispatch();
    const quizPoints = useSelector(selectors.getQuizPoints);
    const user = useSelector(userSelectors.getUser);
    const quiz = useSelector(selectors.findQuiz);
    const availableQuizPoints = useSelector(selectors.getAvailableQuizPoints);
    const navigate = useNavigate();

    // Estado para controlar qué animación mostrar
    const [animationState, setAnimationState] = useState('');

    useEffect(() => {
        const quizId = Number(quiz);
        if (!Number.isNaN(quizId)) {
            dispatch(actions.getQuizPoints({
                quizId: quizId,
                userId: user.id
            }, () => {}));
            dispatch(actions.getAvailableQuizPoints(quizId, () => {}));
        }
    }, [quiz, dispatch]);

    // Actualizar el estado de la animación basado en la condición
    useEffect(() => {
        if (quizPoints >= availableQuizPoints / 2) {
            setAnimationState('success');
        } else {
            setAnimationState('failure');
        }
    }, [quizPoints, availableQuizPoints]);

    function getColorBasedOnCondition(quizPoints, availableQuizPoints) {
        return quizPoints >= availableQuizPoints ? 'green' : 'inherit';
    }

    return (
        <Container maxWidth="sm" sx={{ mt: 8, mb: 4, height: '40vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <Grid container direction="column" alignItems="center">
                <Typography variant="h4" gutterBottom>
                    <FormattedMessage id="project.entities.Quiz.Result"></FormattedMessage>
                </Typography>
                <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                    <Typography variant="h5" component="div" sx={{
                        fontSize: '2rem',
                        fontWeight: '500',
                        fontStyle: 'italic',
                        textTransform: 'none',
                        color: 'text.primary',
                        marginRight: '0.5rem',
                    }}>
                        <FormattedMessage id="project.entities.Quiz.Result.Points"></FormattedMessage></Typography>
                    <Typography variant="h5" component="div" sx={{
                        fontSize: '2rem',
                        fontWeight: '500',
                        fontStyle: 'italic',
                        textTransform: 'none',
                        color: 'text.primary',
                    }}>{availableQuizPoints}</Typography>
                </Box>
                <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                    <Typography variant="h5" component="div" sx={{
                        fontSize: '2rem',
                        fontWeight: '500',
                        fontStyle: 'italic',
                        textTransform: 'none',
                        color: 'text.primary',
                        marginRight: '0.5rem',
                    }}>
                        <FormattedMessage id="project.entities.Quiz.Result.QuizPoints"></FormattedMessage></Typography>

                    <Typography variant="h5" component="div" sx={{
                        fontSize: '2rem',
                        fontWeight: '500',
                        fontStyle: 'italic',
                        textTransform: 'none',
                        color: 'text.primary',
                    }}>{quizPoints}</Typography>
                </Box>
                <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                    <Typography variant="h5" component="div" sx={{
                        fontSize: '2rem',
                        fontWeight: '500',
                        fontStyle: 'italic',
                        textTransform: 'none',
                        color: 'text.primary',
                        marginRight: '0.5rem',
                    }}>
                        <FormattedMessage id="project.entities.Quiz.Result.Questions"></FormattedMessage></Typography>
                    <Typography variant="h5" component="div" sx={{
                        fontSize: '2rem',
                        fontWeight: '500',
                        fontStyle: 'italic',
                        textTransform: 'none',
                        color: 'text.primary',
                    }}>10</Typography>
                </Box>
                <Button variant="contained" color="primary" onClick={() => navigate('/')}>
                    <FormattedMessage id="project.entities.Quiz.Result.ButtonHome"></FormattedMessage>
                </Button>

                {/* Aplicar animación basada en el estado de animationState */}
                {animationState === 'success' && (
                    <Box sx={{ mt: 4, textAlign: 'center' }}>
                        <Typography variant="h6" sx={{ color: 'green' }}> <FormattedMessage id="project.entities.Quiz.Result.Excellent"></FormattedMessage></Typography>
                    </Box>
                )}
                {animationState === 'failure' && (
                    <Box sx={{ mt: 4, textAlign: 'center' }}>
                        <Typography variant="h6" sx={{ color: 'red' }}><FormattedMessage id="project.entities.Quiz.Result.Retry"></FormattedMessage></Typography>
                    </Box>
                )}
            </Grid>
        </Container>
    );
};

export default ResultsPage;
