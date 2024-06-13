import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import * as actions from '../actions';
import * as selectors from '../selectors';
import * as userSelectors from '../../users/selectors';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardMedia, Typography, Button, Box, Container, Alert, AlertTitle } from '@mui/material';
import { FormattedMessage } from 'react-intl';
import WebFont from 'webfontloader';
import TextField from "@mui/material/TextField";



const PodiumDetails = () => {
    const { id } = useParams();
    const podium = useSelector(selectors.getPodium);
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [backendErrors, setBackendErrors] = useState(null);
    const [success, setSuccess] = useState(null);
    const formRef = useRef(null);

    useEffect(() => {
        const podiumId = Number(id);
        if (!Number.isNaN(podiumId)) {
            dispatch(actions.getPodiumDetails(id, () => {}));
        }
    }, [id,dispatch]);

    useEffect(() => {
        WebFont.load({
            google: {
                families: ['Poppins:300,400,500,600,700']
            }
        });
    }, []);


    if (!podium) {
        return null;
    }

    const srcImage = podium.image ? "data:image/jpg;base64," + podium.image : null


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
                    <CardMedia>
                        <Typography variant="h5" component="div" sx={{
                            fontSize: '2rem', // Ajusta el tamaño de la fuente
                            fontWeight: 'bold', // Hace el texto en negrita
                            textTransform: 'uppercase', // Convierte el texto a mayúsculas
                            color: 'text.primary', // Asume que quieres el color primario del tema, ajusta según sea necesario
                            marginTop: '1rem', // Añade un margen superior
                            marginBottom: '1rem', // Añade un margen inferior
                        }}>
                            {podium.date}
                        </Typography>

                        <Typography variant="body2" color="text.secondary" sx={{
                            fontSize: '1.2rem', // Ajusta el tamaño de la fuente
                            fontStyle: 'italic', // Aplica estilo cursiva
                            fontWeight: 'bold', // Aplica negrita
                            color: '#333333', // Color de texto blanco
                            padding: '5px', // Espaciado interno
                            borderRadius: '5px', // Bordes redondeados
                            marginBottom: '10px', // Espacio debajo para separar del siguiente elemento
                            maxWidth: 'auto', // Permite que el ancho se adapte al contenido
                            display: 'inline-block', // Hace que el componente se ajuste al contenido
                            marginX: 'auto', // Centra horizontalmente el componente
                        }}>
                            {podium.winner}
                        </Typography>

                        <Typography variant="body2" color="text.secondary" sx={{
                            fontSize: '1.2rem', // Ajusta el tamaño de la fuente
                            fontStyle: 'italic', // Aplica estilo cursiva
                            fontWeight: 'bold', // Aplica negrita
                            color: '#333333', // Color de texto blanco
                            padding: '5px', // Espaciado interno
                            borderRadius: '5px', // Bordes redondeados
                            marginBottom: '10px', // Espacio debajo para separar del siguiente elemento
                            maxWidth: 'auto', // Permite que el ancho se adapte al contenido
                            display: 'inline-block', // Hace que el componente se ajuste al contenido
                            marginX: 'auto', // Centra horizontalmente el componente
                        }}>
                            {podium.teamWinner}
                        </Typography>

                        <Typography variant="body2" color="text.secondary" sx={{
                            fontSize: '1.2rem', // Ajusta el tamaño de la fuente
                            fontStyle: 'italic', // Aplica estilo cursiva
                            fontWeight: 'bold', // Aplica negrita
                            color: '#333333', // Color de texto blanco
                            padding: '5px', // Espaciado interno
                            borderRadius: '5px', // Bordes redondeados
                            marginBottom: '10px', // Espacio debajo para separar del siguiente elemento
                            maxWidth: 'auto', // Permite que el ancho se adapte al contenido
                            display: 'inline-block', // Hace que el componente se ajuste al contenido
                            marginX: 'auto', // Centra horizontalmente el componente
                        }}>
                            {podium.secondPlace}
                        </Typography>

                        <Typography variant="body2" color="text.secondary" sx={{
                            fontSize: '1.2rem', // Ajusta el tamaño de la fuente
                            fontStyle: 'italic', // Aplica estilo cursiva
                            fontWeight: 'bold', // Aplica negrita
                            color: '#333333', // Color de texto blanco
                            padding: '5px', // Espaciado interno
                            borderRadius: '5px', // Bordes redondeados
                            marginBottom: '10px', // Espacio debajo para separar del siguiente elemento
                            maxWidth: 'auto', // Permite que el ancho se adapte al contenido
                            display: 'inline-block', // Hace que el componente se ajuste al contenido
                            marginX: 'auto', // Centra horizontalmente el componente
                        }}>
                            {podium.thirdPlace}
                        </Typography>


                        <CardMedia
                            component="img"
                            image={podium.image}
                            alt="Circuit Image"
                            sx={{
                                maxHeight: '500px', // Ajusta el tamaño máximo de la imagen
                                maxWidth: '80%', // Asegura que la imagen no exceda el ancho del contenedor
                                objectFit: 'cover', // Ajusta cómo se redimensiona la imagen
                                marginTop: 2, // Añade un margen en la parte superior para separar la imagen del subtítulo
                            }}
                        />
                    </CardMedia>
                </Card>
            </Box>
        </Container>
    );
};

export default PodiumDetails;
