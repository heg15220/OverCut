import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import * as userSelectors from '../selectors';
import { FormattedMessage } from 'react-intl';
import { Errors } from '../../common';
import * as actions from '../actions';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import { createTheme, ThemeProvider } from '@mui/material/styles';

const defaultTheme = createTheme();

const validatePassword = (password) => {
    const lengthCheck = password.length >= 8;
    const uppercaseCheck = /[A-Z]/.test(password);
    const numberCheck = /\d/.test(password);
    const specialCharCheck = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return {
        valid: lengthCheck && uppercaseCheck && numberCheck && specialCharCheck,
        lengthCheck,
        uppercaseCheck,
        numberCheck,
        specialCharCheck
    };
};

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
    const [passwordValidation, setPasswordValidation] = useState({
        valid: true,
        lengthCheck: true,
        uppercaseCheck: true,
        numberCheck: true,
        specialCharCheck: true
    });
    const [journalist, setJournalist] = useState(false);
    const isAdmin = useSelector(userSelectors.isAdmin);

    const handleSubmit = event => {
        event.preventDefault();

        const validation = validatePassword(password);
        if (!validation.valid) {
            setPasswordValidation(validation);
            return;
        }

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
            () => {
                if (!isAdmin && !journalist) {
                    navigate('/email-confirmation');
                } else {
                    navigate('/');
                }
            },
            errors => setBackendErrors(errors)
        ));

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
                                    onChange={e => {
                                        const newPass = e.target.value;
                                        setPassword(newPass);
                                        setPasswordValidation(validatePassword(newPass));
                                    }}
                                    error={!passwordValidation.valid}
                                    helperText={
                                        !passwordValidation.valid && (
                                            <ul style={{ margin: 0, paddingLeft: '20px', color: 'red' }}>
                                                {!passwordValidation.lengthCheck &&
                                                  <li><FormattedMessage id="validation.password.length" defaultMessage="Al menos 8 caracteres" /></li>}
                                                {!passwordValidation.uppercaseCheck &&
                                                  <li><FormattedMessage id="validation.password.uppercase" defaultMessage="Al menos una mayúscula" /></li>}
                                                {!passwordValidation.numberCheck &&
                                                  <li><FormattedMessage id="validation.password.number" defaultMessage="Al menos un número" /></li>}
                                                {!passwordValidation.specialCharCheck &&
                                                  <li><FormattedMessage id="validation.password.special" defaultMessage="Al menos un carácter especial" /></li>}
                                            </ul>
                                        )
                                    }
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
                            {isAdmin && (
                                <Grid item xs={12}>
                                    <FormControlLabel
                                        control={<Checkbox checked={journalist} onChange={(e) => setJournalist(e.target.checked)} />}
                                        label={<FormattedMessage id="project.entities.SignUp.Journalist" />}
                                    />
                                </Grid>
                            )}
                        </Grid>
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            sx={{ mt: 3, mb: 2 }}
                        >
                            <FormattedMessage id="project.global.buttons.save" />
                        </Button>
                        {backendErrors && <Errors errors={backendErrors} />}
                    </Box>
                </Box>
            </Container>
        </ThemeProvider>
    );
};

export default SignUp;
