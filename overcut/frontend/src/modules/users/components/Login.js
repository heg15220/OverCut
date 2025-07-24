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
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import { createTheme, ThemeProvider } from '@mui/material/styles';

const defaultTheme = createTheme();

const Login = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [backendErrors, setBackendErrors] = useState(null);

    const handleSubmit = event => {
        event.preventDefault();

        if (event.currentTarget.checkValidity()) {
            dispatch(actions.login(
                email.trim(),
                password,
                () => navigate('/'),
                errors => setBackendErrors(errors),
                () => {
                    navigate('/users/login');
                    dispatch(actions.logout());
                }
            ));
        } else {
            setBackendErrors(null);
            event.currentTarget.classList.add('was-validated');
        }
    }

    return (
        <ThemeProvider theme={defaultTheme}>
          <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Container component="main" maxWidth="xs" sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CssBaseline />
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  width: '100%'
                }}
              >
                <Avatar sx={{ m: 1, bgcolor: 'primary.main' }}>
                  <LockOutlinedIcon />
                </Avatar>
                <Typography component="h1" variant="h5">
                  <FormattedMessage id="project.users.Login.title" defaultMessage="Iniciar sesión" />
                </Typography>
                <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1, width: '100%' }}>
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    id="email"
                    label={<FormattedMessage id="project.global.fields.email" defaultMessage="Correo electrónico" />}
                    name="email"
                    autoComplete="email"
                    autoFocus
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    name="password"
                    label={<FormattedMessage id="project.global.fields.password" defaultMessage="Contraseña" />}
                    type="password"
                    id="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    sx={{ mt: 3, mb: 2 }}
                  >
                    <FormattedMessage id="project.global.buttons.login" defaultMessage="Iniciar sesión" />
                  </Button>

                  <Grid container justifyContent="center">
                    <Grid item>
                      <Button
                        onClick={() => navigate('/users/signUp')}
                        sx={{ textTransform: 'none' }}
                      >
                        <FormattedMessage
                          id="project.users.Login.signUpPrompt"
                          defaultMessage="¿No tienes una cuenta? Regístrate"
                        />
                      </Button>
                    </Grid>
                  </Grid>

                  {backendErrors && <Errors errors={backendErrors} />}
                </Box>
              </Box>
            </Container>
          </Box>
        </ThemeProvider>

    );
}

export default Login;
