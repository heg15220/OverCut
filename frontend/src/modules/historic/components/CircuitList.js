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
        <Paper sx={{ padding: 2, margin: 'auto', maxWidth: 1200 }}>
            <Typography variant="h4" align="center">Circuitos por Categoría</Typography>
            <Grid container spacing={2} justifyContent="center" alignItems="center">
                <Circuits circuits={circuits} />
                {circuits && (<Pager
                    back={{
                        enabled: page > 0,
                        onClick: () => handlePageChange(page - 1)
                    }}
                    next={{
                        enabled: true,
                        onClick: () => handlePageChange(page + 1)
                    }}
                />)}
            </Grid>
        </Paper>

    );

};

export default CircuitList;
