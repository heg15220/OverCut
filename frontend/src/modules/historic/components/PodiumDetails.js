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

import {sourceImages} from '../../../helpers/sourceImages';


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
        if(podium) {
            if (!Number.isNaN(podiumId)) {
                dispatch(actions.getPodiumDetails(id, () => {
                }));
            }
        }
    }, [id,podium,dispatch]);

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
                                        <TableCell><strong><FormattedMessage id="project.entities.PodiumDetails.date"></FormattedMessage></strong></TableCell>
                                        <TableCell>{podium.date}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell><strong><FormattedMessage id="project.entities.PodiumDetails.winner"></FormattedMessage></strong></TableCell>
                                        <TableCell>{podium.winner}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell><strong><FormattedMessage id="project.entities.PodiumDetails.TeamWinner"></FormattedMessage></strong></TableCell>
                                        <TableCell>{podium.teamWinner}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell><strong><FormattedMessage id="project.entities.PodiumDetails.second"></FormattedMessage></strong></TableCell>
                                        <TableCell>{podium.secondPlace}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell><strong><FormattedMessage id="project.entities.PodiumDetails.third"></FormattedMessage></strong></TableCell>
                                        <TableCell>{podium.thirdPlace}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        {podium && podium.image ? (
                                            <img
                                                src={sourceImages(`./${podium.image}`)}
                                                alt="Podium Image"
                                                style={{ width: '70%' }}
                                            />
                                        ) : (
                                            <div> No image</div>
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
