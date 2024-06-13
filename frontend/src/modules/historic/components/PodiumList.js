import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom'; // Importa useParams
import { Grid, Paper, Typography, Button } from '@mui/material';
import { Pager } from '../../common';
import * as actions from "../actions";
import * as selectors from '../selectors';
import { FormattedMessage } from 'react-intl';
import Podiums from "./Podiums";

const PodiumList = () => {
    const dispatch = useDispatch();
    const { id } = useParams(); // Obtiene el ID del circuito de la URL
    const podiums = useSelector(selectors.getPodiums);
    const [page, setPage] = useState(0);
    const formRef = useRef(null);

    useEffect(() => {

            dispatch(actions.getPodiumsByCircuit(1, page, () => {
                // Actualiza el estado local con los nuevos podios
            }));

    }, [dispatch, page]); // Agrega id como dependencia

    const handlePageChange = (newPage) => {
        setPage(newPage);
    };

    return (
        <Paper sx={{ padding: 2, margin: 'auto', maxWidth: 1200 }}>
            <Typography variant="h4" align="center">Podios por Circuito</Typography>
            <Grid container spacing={2} justifyContent="center" alignItems="center">
                <Podiums podiums={podiums} />
                {podiums && (<Pager
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

export default PodiumList;
