import React, {useState, useEffect, useRef} from 'react';
import { useSelector, useDispatch } from 'react-redux';
import * as actions from '../actions';
import * as selectors from '../selectors';
import * as userSelectors from '../../users/selectors';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardMedia, Typography, Button, Box, Container, Alert, AlertTitle } from '@mui/material';
import WebFont from 'webfontloader';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelIcon from '@mui/icons-material/Cancel';
import { Grid } from '@mui/material';



const QuestionDetails = () => {
    const { id } = useParams();
    const question = useSelector(selectors.getQuestionDetails);
    const user = useSelector(userSelectors.getUser);
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [backendErrors, setBackendErrors] = useState(null);
    const [success, setSuccess] = useState(null);
    const formRef = useRef(null);
    const answers = useSelector(selectors.getAnswers);
    const quiz = useSelector(selectors.findQuiz);
    const [responseState, setResponseState] = useState({});

    useEffect(() => {
        const questionId = Number(id);
        if (!Number.isNaN(questionId)) {
            dispatch(actions.getQuestionDetails(questionId, () => {}, () => {}));
            dispatch(actions.getAnswersForQuestion(questionId, ()=>{}, () => {}));
        }
    }, [id, dispatch]);

    if (!question) {
        return null;
    }

    const srcImage = question.imagePath? "data:image/jpg;base64," + question.imagePath : null;

    const handleSelectAnswer = (answer) => {
        const questionId = Number(id);
        const quizId = Number(quiz);
        dispatch(actions.chooseAnswer(quizId,{
            questionId: questionId,
            userId: user.id,
            answerId: answer.id
        }, () => {}, () => {}, () => {}));

        // Marcar la respuesta como seleccionada temporalmente
        setResponseState(prevState => ({
            ...prevState,
            [answer.id]: { isSelected: true, isCorrect: answer.correct }
        }));

        // Cambiar el color del botón a verde y luego volver a su color original
        setTimeout(() => {
            setResponseState(prevState => ({
                ...prevState,
                [answer.id]: { isSelected: false }
            }));
            navigate(`/quiz/quiz-list/${quiz}`);
        }, 2000); // Espera 2 segundos antes de navegar
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
                            {question.question.name}
                        </Typography>
                        <CardMedia
                            component="img"
                            image={srcImage}
                            alt="Question Image"
                            sx={{
                                maxHeight: '500px',
                                maxWidth: '80%',
                                objectFit: 'cover',
                                marginTop: 2,
                            }}
                        />
                    </CardContent>
                </Card>
                {answers && answers.length > 0? (
                    <Grid container direction="column" spacing={2}> {/* Añade un contenedor Grid */}
                        <h3>Respuestas</h3>
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
                                </Button>
                            </Grid>
                        ))}
                    </Grid>
                ) : (
                    <p>No hay respuestas disponibles.</p>
                )}

            </Box>
        </Container>
    );
};

export default QuestionDetails;
