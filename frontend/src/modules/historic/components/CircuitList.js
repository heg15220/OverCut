import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { getCircuitsByCategory, getGetCircuits } from '../selectors';
import { Grid, Paper, Typography, Button } from '@mui/material';
import { Pager } from '../../common';
import * as actions from "../actions";
import * as selectors from '../selectors';

const CircuitList = () => {
    const dispatch = useDispatch();
    const circuits = useSelector(selectors.getCircuits);
    const [page, setPage] = useState(0);
    const formRef = useRef(null);

    useEffect(() => {
        dispatch(actions.getCircuits(2, page, () => {
            // Aquí puedes actualizar el estado local con los nuevos circuitos
            // Por ejemplo, si tienes un estado local para almacenar los circuitos, hazlo aquí
        }));
    }, [dispatch, page]);


    const handlePageChange = (newPage) => {
        setPage(newPage);
    };

    return (
        <Paper sx={{ padding: 2, margin: 'auto', maxWidth: 1200 }}>
            <Typography variant="h4" align="center">Circuitos por Categoría</Typography>
            <Grid container spacing={2} justifyContent="center" alignItems="center">
                {circuits && circuits.map(circuit => (
                    <Grid item xs={12} sm={6} md={4} key={circuit.id}>
                        <Paper sx={{ padding: 2, margin: 'auto', maxWidth: 300 }}>
                            <Typography variant="h6">{circuit.name}</Typography>
                            <Typography variant="body1">Imagen: {circuit.image}</Typography>
                            <Typography variant="body1">Nombre: {circuit.name}</Typography>
                            <Typography variant="body1">Fecha de Creación: {circuit.dateCreated}</Typography>
                            {/* Aquí puedes agregar más detalles del circuito */}
                        </Paper>
                    </Grid>
                ))}
            </Grid>
            <Pager
                back={{
                    enabled: page > 0,
                    onClick: () => handlePageChange(page - 1)
                }}
                next={{
                    enabled: true,
                    onClick: () => handlePageChange(page + 1)
                }}
            />
        </Paper>
    );
};

export default CircuitList;
