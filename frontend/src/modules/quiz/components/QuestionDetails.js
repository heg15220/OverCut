import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import * as actions from '../actions';
import * as selectors from '../selectors';
import * as userSelectors from '../../users/selectors';
import { Card, CardContent, CardMedia, Typography, Button, Box, Container, Alert, AlertTitle } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelIcon from '@mui/icons-material/Cancel';
import { Grid } from '@mui/material';
import { useNavigate } from "react-router-dom";

import {sourceImages} from '../../../helpers/sourceImages';
import {FormattedMessage} from "react-intl";

const QuestionDetails = ({ question, onAnswerSubmit }) => {
    const user = useSelector(userSelectors.getUser);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [backendErrors, setBackendErrors] = useState(null);
    const [success, setSuccess] = useState(null);
    const answers = useSelector(selectors.getAnswers);
    const quiz = useSelector(selectors.findQuiz);
    const [responseState, setResponseState] = useState({});
    const [totalScore, setTotalScore] = useState(0);
    const [showCorrectAnswer, setShowCorrectAnswer] = useState(false); // Nuevo estado para mostrar la respuesta correcta

    useEffect(() => {
        const questionId = Number(question.id);
        if (!Number.isNaN(questionId)) {
            dispatch(actions.getQuestionDetails(questionId, () => {}, () => {}));
            dispatch(actions.getAnswersForQuestion(questionId, ()=>{}, () => {}));
        }
    }, [question, dispatch]);

    if (!question) {
        return null;
    }

    const imagePath = `/static/${question.imagePath}`;

    const handleSelectAnswer = (answer) => {
        const questionId = Number(question.id);
        const quizId = Number(quiz);
        dispatch(actions.chooseAnswer(quizId, {
            questionId: questionId,
            userId: user.id,
            answerId: answer.id
        }, () => {}, () => {}, () => {}));

        // Marcar la respuesta como seleccionada temporalmente
        setResponseState(prevState => ({
            ...prevState,
            [answer.id]: { isSelected: true, isCorrect: answer.correct }
        }));

        // Si la respuesta es incorrecta, muestra la respuesta correcta
        if (!answer.correct) {
            setShowCorrectAnswer(true);
        }

        // Dentro de handleSelectAnswer:
        if (answer.correct) {
            setTotalScore(totalScore + 1);
        }

        // Cambiar el color del botón a verde y luego volver a su color original
        setTimeout(() => {
            setResponseState(prevState => ({
                ...prevState,
                [answer.id]: { isSelected: false }
            }));
            onAnswerSubmit(); // Llama a onAnswerSubmit para avanzar a la siguiente pregunta
            setShowCorrectAnswer(false); // Oculta la respuesta correcta después de un tiempo
        }, 2000); // Espera 2 segundos antes de llamar a onAnswerSubmit
    };

    return (
        <Container sx={{ marginTop: 0 }}>
            <Box my={0}>
                {backendErrors && (
                    <Alert severity="error" onClose={() => setBackendErrors(null)}>
                        <AlertTitle>Error</AlertTitle>
                        {backendErrors}
                    </Alert>
                )}
                {success && (
                    <Alert severity="success" onClose={() => setSuccess(null)}>
                        <AlertTitle>Success</AlertTitle>
                        {success}
                    </Alert>
                )}
                <Card>
                    <CardContent>
                        <Typography variant="h5" component="div" sx={{
                            fontSize: '2rem',
                            fontWeight: 'bold',
                            textTransform: 'uppercase',
                            color: 'text.primary',
                            marginTop: '1rem',
                            marginBottom: '1rem',
                        }}>
                            {question.name}
                        </Typography>
                        {question && question.imagePath ? (
                        <img
                            src={sourceImages(`./${question.imagePath}`)}
                            alt="Circuit Image"
                            style={{ width: '70%' }}
                        />
                    ) : (
                        <div></div>
                    )}

                    </CardContent>
                </Card>
                {answers && answers.length > 0? (
                    <Grid container direction="column" spacing={2}> {/* Añade un contenedor Grid */}
                        {answers.map((answer) => (
                            <Grid item xs={12}> {/* Cada respuesta ocupa toda la anchura disponible */}
                                <Button
                                    key={answer.id}
                                    variant="contained"
                                    className={`custom-button ${responseState[answer.id]?.isSelected === true && answer.correct? "correct-answer" : ""}`}
                                    onClick={() => handleSelectAnswer(answer)}
                                >
                                    <>
                                        {answer.name}
                                        {responseState[answer.id]?.isSelected === true && (
                                            <>
                                                {answer.correct? (
                                                    <CheckCircleOutlineIcon style={{ marginLeft: '8px', marginRight: '8px' }} />
                                                ) : (
                                                    <CancelIcon style={{ marginLeft: '8px', marginRight: '8px' }} />
                                                )}
                                            </>
                                        )}
                                    </>
                                    {showCorrectAnswer && !answer.correct && (
                                        <Typography variant="body2" color="textSecondary">
                                            <FormattedMessage id="project.entities.Quiz.Answers"></FormattedMessage>
                                        {answers.find(a => a.correct)?.name}
                                        </Typography>
                                    )}
                                </Button>
                            </Grid>
                        ))}
                    </Grid>
                ) : (
                    navigate('/')
                )}

                {totalScore? (
                    <Alert severity="success">
                        <AlertTitle>¡Excelente trabajo!</AlertTitle>
                        Has obtenido {totalScore} puntos.
                    </Alert>
                ) : (
                    <Alert severity="success">
                        <AlertTitle>Tu puntaje:</AlertTitle>
                        Has obtenido {totalScore} puntos.
                    </Alert>
                )}
            </Box>
        </Container>
    );
};

export default QuestionDetails;
