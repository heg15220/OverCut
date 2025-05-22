import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import * as actions from '../actions';
import * as selectors from '../selectors';
import * as userSelectors from '../../users/selectors';
import {Link, useNavigate, useParams} from 'react-router-dom';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, Box, Container, Alert, AlertTitle } from '@mui/material';
import { FormattedMessage } from 'react-intl';
import WebFont from 'webfontloader';
import "../../app/components/App.css";
import TextField from "@mui/material/TextField";
import PodiumList from "./PodiumList";


import {sourceImages} from '../../../helpers/sourceImages';
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faChartPie} from "@fortawesome/free-solid-svg-icons";

const CircuitDetails = () => {
    const { id } = useParams();
    const circuit = useSelector(selectors.getCircuit);
    const user = useSelector(userSelectors.getUser);
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [backendErrors, setBackendErrors] = useState(null);
    const [success, setSuccess] = useState(null);
    const formRef = useRef(null);

    useEffect(() => {
        const circuitId = Number(id);
        if (!Number.isNaN(circuitId)) {
            dispatch(actions.fetchCircuitDetails(id, () => {}));
        }
    }, [id, user, dispatch]);

    useEffect(() => {
        WebFont.load({
            google: {
                families: ['Poppins:300,400,500,600,700']
            }
        });
    }, []);

    if (!circuit) {
        return null;
    }

    const imagePath = `/static/${circuit.image}`;

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
                                <TableCell><strong>
                                    <FormattedMessage id="project.Circuit.Details.Name"></FormattedMessage>
                                </strong></TableCell>
                                <TableCell>{circuit.name}</TableCell>
                        </TableRow>
                        </TableHead>
                        <TableBody>
                            <TableRow>
                                <TableCell><strong><FormattedMessage id="project.Circuit.Details.Distance"></FormattedMessage></strong></TableCell>
                                <TableCell>{circuit.distance}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell><strong><FormattedMessage id="project.Circuit.Details.Laps"></FormattedMessage></strong></TableCell>
                                <TableCell>{circuit.numberLaps}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell><strong><FormattedMessage id="project.Circuit.Details.Image"></FormattedMessage></strong></TableCell>
                                <TableCell>
                                    <img
                                        src={sourceImages(`./${circuit.image}`)}
                                        alt= "Circuit Image"
                                        style={{ width: '60%' }}
                                    />
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell><strong><FormattedMessage id="project.Circuit.Details.Team"></FormattedMessage></strong></TableCell>
                                <TableCell>{circuit.teamSuccess}</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </TableContainer>

            </Box>
        </Container>
    );
};


export default CircuitDetails;
