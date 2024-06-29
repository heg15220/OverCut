import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import * as actions from '../actions';
import * as selectors from '../selectors';
import * as userSelectors from '../../users/selectors';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardMedia, Typography, Button, Box, Container, Alert, AlertTitle } from '@mui/material';
import WebFont from 'webfontloader';



const QuestionDetails = ({question}) => {
    const { id } = question.id;
    const user = useSelector(userSelectors.getUser);
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [backendErrors, setBackendErrors] = useState(null);
    const [success, setSuccess] = useState(null);
    const formRef = useRef(null);
    const answers = useSelector(selectors.getAnswers);


    useEffect(() => {
        const questionId = Number(id);
        if (!Number.isNaN(questionId)) {
            dispatch(actions.getQuestionDetails(questionId));
            dispatch(actions.getAnswersForQuestion(questionId)); // Despacha la acción para obtener las respuestas
        }
    }, [id, dispatch]);


    useEffect(() => {
        WebFont.load({
            google: {
                families: ['Poppins:300,400,500,600,700']
            }
        });
    }, []);

    if (!question) {
        return null;
    }

    const srcImage = question.imagePath ? "data:image/jpg;base64," + question.imagePath : null;



    return (
        <Container sx={{ marginTop: 0 }}> {/* Reduce el margen superior del Container */}
            <Box my={0}> {/* Reduce el margen superior del Box */}
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
                            fontSize: '2rem', // Ajusta el tamaño de la fuente
                            fontWeight: 'bold', // Hace el texto en negrita
                            textTransform: 'uppercase', // Convierte el texto a mayúsculas
                            color: 'text.primary', // Asume que quieres el color primario del tema, ajusta según sea necesario
                            marginTop: '1rem', // Añade un margen superior
                            marginBottom: '1rem', // Añade un margen inferior
                        }}>
                            {question.name}
                        </Typography>
                        <CardMedia
                            component="img"
                            image={srcImage}
                            alt="Question Image"
                            sx={{
                                maxHeight: '500px', // Ajusta el tamaño máximo de la imagen
                                maxWidth: '80%', // Asegura que la imagen no exceda el ancho del contenedor
                                objectFit: 'cover', // Ajusta cómo se redimensiona la imagen
                                marginTop: 2, // Añade un margen en la parte superior para separar la imagen del subtítulo
                            }}
                        />
                    </CardContent>
                </Card>

                {answers && answers.length > 0? (
                    <Box mt={2}>
                        <h3>Respuestas</h3>
                        <ul>
                            {answers.map(answer => (
                                <li key={answer.id}>
                                    <span>{answer.name}</span>
                                    {answer.correct && <span>(Correcta)</span>}
                                </li>
                            ))}
                        </ul>
                    </Box>
                ) : (
                    <p>No hay respuestas disponibles.</p>
                )}
            </Box>
        </Container>
    );
};

export default QuestionDetails;
