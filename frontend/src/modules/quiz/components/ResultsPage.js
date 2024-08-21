import React, { useEffect, useState } from 'react';
import { Container, Typography, Box, Button } from '@mui/material';
import * as selectors from '../selectors';
import * as actions from '../actions';
import * as userSelectors from '../../users/selectors';
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

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

    return (
        <Container maxWidth="sm" sx={{ mt: 8, mb: 4 }}>
            <Typography variant="h4" gutterBottom>
                Resultados
            </Typography>
            <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <Typography variant="h5" component="div" sx={{
                    fontSize: '2rem',
                    fontWeight: '500',
                    fontStyle: 'italic',
                    textTransform: 'none',
                    color: 'text.primary',
                    marginRight: '0.5rem', // Espacio entre el texto y la puntuación
                }}>
                    Puntuación disponible:</Typography>
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
                    marginRight: '0.5rem', // Espacio entre el texto y la puntuación
                }}>
                    Puntuación obtenida:</Typography>
                <Typography variant="h5" component="div" sx={{
                    fontSize: '2rem',
                    fontWeight: '500',
                    fontStyle: 'italic',
                    textTransform: 'none',
                    color: quizPoints >= availableQuizPoints ? 'green' : 'text.primary', // Cambia el color a verde si la condición es verdadera
                }}>{quizPoints}</Typography>
            </Box>
            <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <Typography variant="h5" component="div" sx={{
                    fontSize: '2rem',
                    fontWeight: '500',
                    fontStyle: 'italic',
                    textTransform: 'none',
                    color: 'text.primary',
                    marginRight: '0.5rem', // Espacio entre el texto y la puntuación
                }}>
                    Total de Preguntas:</Typography>
                <Typography variant="h5" component="div" sx={{
                    fontSize: '2rem',
                    fontWeight: '500',
                    fontStyle: 'italic',
                    textTransform: 'none',
                    color: 'text.primary',
                }}>10</Typography>
            </Box>
            <Button variant="contained" color="primary" onClick={() => navigate('/')}>
                Volver al inicio
            </Button>

            {/* Aplicar animación basada en el estado de animationState */}
            {animationState === 'success' && (
                <Box sx={{ mt: 4, textAlign: 'center' }}>
                    <Typography variant="h6">¡Excelente! Has superado la mitad.</Typography>
                </Box>
            )}
            {animationState === 'failure' && (
                <Box sx={{ mt: 4, textAlign: 'center' }}>
                    <Typography variant="h6">Intenta mejor la próxima vez.</Typography>
                </Box>
            )}
        </Container>
    );
};

export default ResultsPage;
