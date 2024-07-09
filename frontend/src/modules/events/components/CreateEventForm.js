import React, { useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { getEvents } from '../selectors';
import * as actions from '../actions';
import Container from "@mui/material/Container";
import CssBaseline from "@mui/material/CssBaseline";
import Box from "@mui/material/Box";
import Avatar from "@mui/material/Avatar";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import Typography from "@mui/material/Typography";
import {FormattedMessage} from "react-intl";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";

import { createTheme, ThemeProvider } from '@mui/material/styles';
import {useNavigate} from "react-router-dom";

const defaultTheme = createTheme();
const CreateEventForm = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [location, setLocation] = useState('');
    const [date, setDate] = useState('');
    const [backendErrors, setBackendErrors] = useState(null);
    const handleSubmit = event => {
        event.preventDefault();
        dispatch(actions.createEvent(
            {
                name: name.trim(),
                description: description.trim(),
                location: location.trim(),
                date: date.trim()
            },
            () => navigate('/'),
            errors => setBackendErrors(errors),
            () => {
                navigate('/');
            }
        ));
    }

    const handleChange = (e) => {
        const { name, value } = e.target;
        switch (name) {
            case 'name':
                setName(value);
                break;
            case 'description':
                setDescription(value);
                break;
            case 'location':
                setLocation(value);
                break;
            default:
                break;
        }
    };

    return (
        <ThemeProvider theme={defaultTheme}>
            <Container component="main" maxWidth="xs">
                <CssBaseline />
                <Box
                    sx={{
                        marginTop: 8,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                    }}
                >
                    <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
                        <LockOutlinedIcon />
                    </Avatar>
                    <Typography component="h1" variant="h5">
                        <FormattedMessage id="project.users.CreateEvent.title" />
                    </Typography>
                    <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <TextField
                                    autoComplete="name"
                                    name="name"
                                    required
                                    fullWidth
                                    id="userName"
                                    label={<FormattedMessage id="project.global.fields.event.name" />}
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    autoFocus
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    required
                                    fullWidth
                                    name="description"
                                    label={<FormattedMessage id="project.global.fields.event.description" />}
                                    type="description"
                                    id="description"
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    autoComplete="given-name"
                                    name="location"
                                    required
                                    fullWidth
                                    id="location"
                                    label={<FormattedMessage id="project.global.fields.events.location" />}
                                    value={location}
                                    onChange={e => setLocation(e.target.value)}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    required
                                    fullWidth
                                    name="date"
                                    label={<FormattedMessage id="project.global.fields.events.date" />}
                                    type="text"
                                    id="date"
                                    value={date}
                                    onChange={e => setDate(e.target.value)}
                                />
                            </Grid>
                        </Grid>
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            sx={{ mt: 3, mb: 2 }}
                        >
                            <FormattedMessage id="project.global.buttons.save" />
                        </Button>
                    </Box>
                </Box>
            </Container>
        </ThemeProvider>
    );
};

export default CreateEventForm;
