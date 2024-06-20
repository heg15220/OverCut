import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import * as actions from '../actions';
import * as selectors from '../selectors';
import * as userSelectors from '../../users/selectors';
import {Link, useNavigate, useParams} from 'react-router-dom';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, Box, Container, Alert, AlertTitle } from '@mui/material';
import { FormattedMessage } from 'react-intl';
import WebFont from 'webfontloader';
import { saveNotification } from '../../events/actions';
import {Events} from "../index";
import Notifications from "../../app/components/Notifications"; // Asegúrate de que esta ruta sea correcta

const EventDetails = () => {
    const { id } = useParams();
    const event = useSelector(selectors.getEventDetails);
    const user = useSelector(userSelectors.getUser);
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [backendErrors, setBackendErrors] = useState(null);
    const [success, setSuccess] = useState(null);
    const formRef = useRef(null);


    useEffect(() => {
        const eventId = Number(id);
        if (!Number.isNaN(eventId)) {
            dispatch(actions.getEventDetails(id, () => {}));
        }
    }, [id, user, dispatch]);

    useEffect(() => {
        WebFont.load({
            google: {
                families: ['Poppins:300,400,500,600,700']
            }
        });
    }, []);


    const handleCreateNotificationClick = () => {
        const message = event.name; // Puedes modificar esto según sea necesario
        const notificationData = {
            userId: user.id,
            message: message,
            eventId: id,
            createdAt: new Date(event.date).toLocaleDateString('default', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            })
        };

        dispatch(actions.saveNotification(notificationData, () => {
            // Navega a la página principal después de crear la notificación exitosamente
            navigate('/');
        }, (error) => {
            console.error('Error creating notification:', error);
            // Maneja errores aquí si es necesario
        }));
    };

    if (!event) {
        return null;
    }

    const srcImage = event.imageUrl? "data:image/jpg;base64," + event.imageUrl : null;

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
                <TableContainer>
                    <Table aria-label="simple table">
                        <TableHead>
                            <TableRow>
                                <TableCell><strong>Evento:</strong></TableCell>
                                <TableCell>{event.name}</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            <TableRow>
                                <TableCell><strong>Descripcion:</strong></TableCell>
                                <TableCell>{event.description}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell><strong>Localizacion:</strong></TableCell>
                                <TableCell>{event.location}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell><strong>Fecha:</strong></TableCell>
                                <TableCell>
                                    {new Date(event.date).toLocaleDateString('default', {
                                        day: 'numeric',
                                        month: 'short',
                                        year: 'numeric'
                                    })}
                                </TableCell>
                            </TableRow>

                            <TableRow>
                                <TableCell><strong>Imagen:</strong></TableCell>
                                <TableCell>
                                    <img src={srcImage} alt="Circuit Image" style={{ width: '100%' }} />
                                </TableCell>
                            </TableRow>
                            <div>
                                {/* Otros elementos del detalle del evento */}
                                <button onClick={handleCreateNotificationClick}>Crear Notificación</button>
                            </div>
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>
        </Container>
    );
};


export default EventDetails;