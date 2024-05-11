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
    const [title, setTitle] = useState("");
    const [categoryId, setCategoryId] = useState(2);
    const [criteria, setCriteria] = useState(null);
    const [order, setOrder] = useState(false);
    const formRef = useRef(null);

    const handleSubmit = event => {
        event.preventDefault();
        if (formRef.current?.checkValidity()) {
            dispatch(actions.getCircuits(
                {
                    categoryId
                },
                0,
                () => { },
            ));
        } else {
            formRef.current?.classList.add('was-validated');
        }
    }

    useEffect(() => {
        dispatch(actions.getCircuits(
            {
               categoryId
            },
            0,
            () => { },
        ));
    }, [dispatch, categoryId]);

    return (
        <Paper sx={{ padding: 2, margin: 'auto', maxWidth: 1200 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Grid container spacing={2} justifyContent="center" alignItems="center" sx={{ mb: 2 }}>
                    <Grid item xs={12} sm={6} md={4}>
                        <TextField
                            label="Title"
                            variant="outlined"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            fullWidth
                        />
                    </Grid>
                </Grid>
                <Box sx={{ width: '100%', p: 5 }}>
                    <CircuitList circuits={circuits} />
                    {circuits && (
                        <Pager
                            back={{
                          }}
                            next={{
                            }}
                        />
                    )}
                </Box>
            </Box>
        </Paper>
    );
}

export default AllCircuits;
