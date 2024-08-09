import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { Grid, Paper, Typography, Button } from '@mui/material';
import { Pager } from '../../common';
import * as actions from "../actions";
import * as selectors from '../selectors';
import {Events} from "../index";
import {Link} from "react-router-dom";
import {FormattedMessage} from "react-intl";
import "../../app/components/App.css";

const EventsList = () => {
    const dispatch = useDispatch();
    const events = useSelector(selectors.getEvents);
    const [page, setPage] = useState(0);
    const formRef = useRef(null);

    useEffect(() => {
        dispatch(actions.getEvents(page, () => {
            // Aquí puedes actualizar el estado local con los nuevos circuitos
            // Por ejemplo, si tienes un estado local para almacenar los circuitos, hazlo aquí
        }));
    }, [dispatch, page]);

    const handlePageChange = (newPage) => {
        setPage(newPage);
    };

    return (
        <Paper sx={{ padding: 2, margin: 'auto', maxWidth: 1200 }}>
            <Typography variant="h4" align="center"><FormattedMessage id = "project.entities.Events"/></Typography>
            <Grid container spacing={2} justifyContent="center" alignItems="center">
                <Grid item xs={12}> {/* Contenedor para los circuitos y la paginación */}
                    <Events events={events} />
                    <Grid container direction="column" alignItems="center" justifyContent="center" sx={{ mt: 2 }}> {/* Contenedor para la paginación */}
                        {events && (<Pager
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

export default EventsList;