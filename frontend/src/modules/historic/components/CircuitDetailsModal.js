import React, { useState, useEffect } from 'react';
import {Modal, Box, Typography, Button, Paper, Grid} from '@mui/material';
import {useDispatch, useSelector} from 'react-redux';
import * as actions from "../actions";
import * as CategoryActions from "../../posts/actions";
import * as selectors from "../selectors";
const CircuitDetailsModal = ({circuit}) => {
    const [open, setOpen] = useState(false);
    const [circuitDetails, setCircuitDetails] = useSelector(circuitDetails);
    const dispatch = useDispatch();


    useEffect(() => {
        dispatch(actions.fetchCircuitDetails(
            {
                id:circuit.id
            },
            () => { },
            () => { },
        ));
        dispatch(CategoryActions.getAllCategories(() => { }))
    }, [dispatch, circuit]);
    const handleClose = () => {
        setOpen(false);
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
                <Grid item xs={12} sm={6} md={4} key={circuit.id}>
                    <Paper sx={{ padding: 2, margin: 'auto', maxWidth: 300 }}>
                        <Typography variant="h6">{circuit.name}</Typography>
                        <Typography variant="body1">Imagen: {circuit.image}</Typography>
                        <Typography variant="body1">Nombre: {circuit.name}</Typography>
                        <Typography variant="body1">Fecha de Creación: {circuit.dateCreated}</Typography>
                        {/* Aquí puedes agregar más detalles del circuito */}
                    </Paper>
                </Grid>
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
