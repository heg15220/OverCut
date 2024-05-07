import React, { useState, useEffect } from 'react';
import { Modal, Box, Typography, Button } from '@mui/material';
import {useDispatch, useSelector} from 'react-redux';
import * as actions from "../actions";
import * as CategoryActions from "../../posts/actions";

const CircuitDetailsModal = ({ circuitId, onClose }) => {
    const [open, setOpen] = useState(false);
    const [circuitDetails, setCircuitDetails] = useSelector(circuitDetails);
    const dispatch = useDispatch();


    useEffect(() => {
        dispatch(actions.fetchCircuitDetails(
            {
                id:circuitId
            },
            () => { },
            () => { },
        ));
        dispatch(CategoryActions.getAllCategories(() => { }))
    }, [dispatch, circuitId]);
    const handleClose = () => {
        setOpen(false);
        onClose();
    };

    return (
        <Modal
            open={open}
            onClose={handleClose}
            aria-labelledby="circuit-details-title"
            aria-describedby="circuit-details-description"
        >
            <Box sx={{...style, width: 500 }}>
                <Typography id="circuit-details-title" variant="h6" component="h2">
                    Detalles del Circuito
                </Typography>
                <Typography id="circuit-details-description" sx={{ mt: 2 }}>
                    {/* Aquí se mostrarán los detalles del circuito */}
                    {circuitDetails && (
                        <>
                            <p><strong>Imagen:</strong>{circuitDetails.image}</p>
                            <p><strong>Nombre:</strong> {circuitDetails.name}</p>
                            <p><strong>Distancia:</strong> {circuitDetails.distance} km</p>
                            <p><strong>Laps:</strong> {circuitDetails.numberLaps}</p>
                            {/* Agrega más detalles según sea necesario */}
                        </>
                    )}
                </Typography>
                <Button onClick={handleClose}>Cerrar</Button>
            </Box>
        </Modal>
    );
};

const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4,
};

export default CircuitDetailsModal;
