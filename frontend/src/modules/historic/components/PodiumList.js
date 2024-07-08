import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { Grid, Paper, Typography, Button } from '@mui/material';
import { Pager } from '../../common';
import * as actions from "../actions";
import * as selectors from '../selectors';
import { FormattedMessage } from 'react-intl';
import Podiums from "./Podiums";

const PodiumList = () => {
    const dispatch = useDispatch();
    const { id } = useParams();
    const podiums = useSelector(selectors.getPodiums);
    const [page, setPage] = useState(0);
    const formRef = useRef(null);

    useEffect(() => {
        dispatch(actions.getPodiumsByCircuit(1, page, () => {
            // Actualiza el estado local con los nuevos podios
        }));
    }, [dispatch, page]);

    const handlePageChange = (newPage) => {
        setPage(newPage);
    };

    return (
        <Paper sx={{ padding: 2, margin: 'auto', maxWidth: 1200 }}>
            <Typography variant="h4" align="center"><FormattedMessage id="project.entities.Podiums"></FormattedMessage></Typography>
            <Grid container spacing={2} justifyContent="center" alignItems="center">
                <Grid item xs={12}> {/* Contenedor para los podios y la paginación */}
                    <Podiums podiums={podiums} />
                    <Grid container direction="column" alignItems="center" justifyContent="center" sx={{ mt: 2 }}> {/* Contenedor para la paginación */}
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
                </Grid>
            </Grid>
        </Paper>
    );
};

export default PodiumList;
