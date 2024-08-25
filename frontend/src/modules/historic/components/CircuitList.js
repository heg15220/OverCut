import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { getCircuitsByCategory, getGetCircuits } from '../selectors';
import { Grid, Paper, Typography, Button } from '@mui/material';
import { Pager } from '../../common';
import * as actions from "../actions";
import * as selectors from '../selectors';
import PostListItem from "../../posts/components/PostListItem";
import {FormattedMessage} from "react-intl";
import CircuitListItem from "./CircuitListItem";
import {Circuits} from "../index";

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
        <Paper sx={{ padding: 2, margin: 'auto', maxWidth: 2700, height: '60%' }}>
            <Typography variant="h4" align="center" style={{ fontStyle: 'italic' }}>
                <FormattedMessage id="project.entities.Circuits" />
            </Typography>
            <Grid container spacing={2} justifyContent="center" alignItems="center">
                <Grid item xs={12}> {/* Contenedor para los circuitos y la paginación */}
                    <Circuits circuits={circuits} />
                </Grid>
            </Grid>
        </Paper>
    );
};

export default CircuitList;
