import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';
import { Errors } from '../../common';
import * as actions from '../actions';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Link from '@mui/material/Link';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import { createTheme, ThemeProvider } from '@mui/material/styles';

const defaultTheme = createTheme();

const SignUp = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [userName, setUserName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [backendErrors, setBackendErrors] = useState(null);
    const [passwordsDoNotMatch, setPasswordsDoNotMatch] = useState(false);
    const [journalist, setJournalist] = useState(false);

    const handleSubmit = event => {
        event.preventDefault();

        if (password !== confirmPassword) {
            setPasswordsDoNotMatch(true);
            return;
        }

        dispatch(actions.signUp(
            {
                userName: userName.trim(),
                password: password,
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                email: email.trim(),
                journalist: journalist
            },
            () => navigate('/'),
            errors => setBackendErrors(errors),
            () => {
                navigate('/');
                dispatch(actions.logout());
            }
        ));
    }

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
                        <FormattedMessage id="project.users.SignUp.title" />
                    </Typography>
                    <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <TextField
                                    autoComplete="username"
                                    name="userName"
                                    required
                                    fullWidth
                                    id="userName"
                                    label={<FormattedMessage id="project.global.fields.userName" />}
                                    value={userName}
                                    onChange={e => setUserName(e.target.value)}
                                    autoFocus
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    required
                                    fullWidth
                                    name="password"
                                    label={<FormattedMessage id="project.global.fields.password" />}
                                    type="password"
                                    id="password"
                                    autoComplete="new-password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    required
                                    fullWidth
                                    name="confirmPassword"
                                    label={<FormattedMessage id="project.users.SignUp.fields.confirmPassword" />}
                                    type="password"
                                    id="confirmPassword"
                                    autoComplete="new-password"
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    error={passwordsDoNotMatch}
                                    helperText={passwordsDoNotMatch ? <FormattedMessage id='project.global.validator.passwordsDoNotMatch' /> : null}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    autoComplete="given-name"
                                    name="firstName"
                                    required
                                    fullWidth
                                    id="firstName"
                                    label={<FormattedMessage id="project.global.fields.firstName" />}
                                    value={firstName}
                                    onChange={e => setFirstName(e.target.value)}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    required
                                    fullWidth
                                    name="lastName"
                                    label={<FormattedMessage id="project.global.fields.lastName" />}
                                    type="text"
                                    id="lastName"
                                    autoComplete="family-name"
                                    value={lastName}
                                    onChange={e => setLastName(e.target.value)}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    required
                                    fullWidth
                                    name="email"
                                    label={<FormattedMessage id='project.global.fields.email' />}
                                    type="email"
                                    id="email"
                                    autoComplete="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <FormControlLabel
                                    control={<Checkbox checked={journalist} onChange={(e) => setJournalist(e.target.checked)} />}
                                    label=<FormattedMessage id="project.entities.SignUp.Journalist" />
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
}

export default SignUp;
