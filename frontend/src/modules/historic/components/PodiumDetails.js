import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import * as actions from '../actions';
import * as selectors from '../selectors';
import * as userSelectors from '../../users/selectors';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableRow,
    Paper,
    Typography,
    Button,
    Box,
    Container,
    Alert,
    AlertTitle,
    Card, // Agrega esta línea
    CardContent, // Agrega esta línea
    CardMedia
} from '@mui/material'; // No olvides incluir Card y CardContent aquí
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

    const srcImage = podium.image? "data:image/jpg;base64," + podium.image : null;

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
                        <TableContainer component={Paper}>
                            <Table aria-label="simple table">
                                <TableBody>
                                    <TableRow>
                                        <TableCell><strong>Fecha del Evento</strong></TableCell>
                                        <TableCell>{podium.date}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell><strong>Ganador</strong></TableCell>
                                        <TableCell>{podium.winner}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell><strong>Equipo Ganador</strong></TableCell>
                                        <TableCell>{podium.teamWinner}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell><strong>Segundo Lugar</strong></TableCell>
                                        <TableCell>{podium.secondPlace}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell><strong>Tercer Lugar</strong></TableCell>
                                        <TableCell>{podium.thirdPlace}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                    {srcImage && (
                                        <CardMedia
                                            component="img"
                                            image={srcImage}
                                            alt="Podium Image"
                                            sx={{
                                                maxHeight: '500px',
                                                maxWidth: '80%',
                                                objectFit: 'cover',
                                                marginTop: 2,
                                            }}
                                        />
                                    )}
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </CardContent>
                </Card>
            </Box>
        </Container>
    );
};

export default PodiumDetails;
