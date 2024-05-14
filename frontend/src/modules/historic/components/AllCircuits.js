import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import * as selectors from '../selectors';
import * as actions from '../actions';
import { Pager } from '../../common';
import { FormattedMessage } from 'react-intl';
import {TextField, Select, MenuItem, Button, Box, FormControl, InputLabel, Paper} from '@mui/material';
import Grid from "@mui/material/Grid";
import CircuitList from "./CircuitList";

const AllCircuits = () => {
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
                <Box sx={{ width: '100%', p: 5 }}>
                    <CircuitList circuits={circuits} />
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
                </Box>
        </Paper>
    );
}

export default AllCircuits;
