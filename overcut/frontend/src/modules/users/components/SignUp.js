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
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import Checkbox from '@mui/material/Checkbox';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Link from '@mui/material/Link';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CookieIntroModal from "../../../cookies/CookieIntroModal"; // ajusta la ruta

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

  // Idioma
  const isSpanish =
    typeof navigator !== 'undefined' &&
    navigator.language &&
    navigator.language.toLowerCase().startsWith('es');

  // Aceptación de términos/privacidad
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptTermsError, setAcceptTermsError] = useState(false);

  // Modal resumen protección de datos
  const [dpDialogOpen, setDpDialogOpen] = useState(false);

  const isAdmin = useSelector(userSelectors.isAdmin);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = event => {
    event.preventDefault();

    setBackendErrors(null);
    setPasswordsDoNotMatch(false);
    setAcceptTermsError(false);

    if (!acceptTerms) {
      setAcceptTermsError(true);
      return;
    }

    const validation = validatePassword(password);
    if (!validation.valid) {
      setPasswordValidation(validation);
      return;
    }

    if (password !== confirmPassword) {
      setPasswordsDoNotMatch(true);
      return;
    }

    setIsSubmitting(true);

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
        setIsSubmitting(false);
        if (!isAdmin && !journalist) {
          navigate('/email-confirmation');
        } else {
          navigate('/');
        }
      },
      errors => {
        setIsSubmitting(false);
        setBackendErrors(errors);
      }
    ));
  };

  // Rutas legales (coinciden con tus <Route/>)
  const termsHref = '/legal/terms';
  const privacyHref = '/legal/privacy';

  return (
    <ThemeProvider theme={defaultTheme}>
      <CookieIntroModal />
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
          <Avatar sx={{ m: 1, bgcolor: 'primary.main' }}>
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

              {/* SOLO ADMIN: marcar periodista */}
              {isAdmin && (
                <Grid item xs={12}>
                  <FormControlLabel
                    control={<Checkbox checked={journalist} onChange={(e) => setJournalist(e.target.checked)} />}
                    label={<FormattedMessage id="project.entities.SignUp.Journalist" />}
                  />
                </Grid>
              )}

              {/* AVISO RGPD / LOPDGDD */}
              <Grid item xs={12}>
                <Alert severity="info" sx={{ alignItems: 'flex-start' }}>
                  <AlertTitle>
                    <strong>
                      {isSpanish
                        ? 'Protección de datos de carácter personal (RGPD 2016/679 y LOPDGDD 3/2018)'
                        : 'Personal data protection (GDPR 2016/679 & Spanish LOPDGDD 3/2018)'}
                    </strong>
                  </AlertTitle>

                  <Typography variant="body2" component="div" sx={{ mb: 1 }}>
                    {isSpanish ? (
                      <>
                        <strong>RESPONSABLE:</strong> OVERCUT. <strong>FINALIDAD:</strong> Crear una cuenta de usuario
                        registrado para que tenga acceso a los productos y servicios de OVERCUT y pueda modificar/añadir
                        información. <strong>DESTINATARIOS:</strong> No se cederán datos a terceros. <strong>DERECHOS E
                        INFORMACIÓN ADICIONAL:</strong> Se permite el ejercicio de los derechos de acceso, rectificación o
                        supresión, entre otros. Toda la información se encuentra accesible en la información detallada de
                        nuestra{' '}
                        <Link component="button" underline="hover" onClick={() => navigate(privacyHref)} sx={{ p: 0 }}>
                          Política de Privacidad
                        </Link>.
                      </>
                    ) : (
                      <>
                        <strong>CONTROLLER:</strong> OVERCUT. <strong>PURPOSE:</strong> To create a registered user account
                        so you can access OVERCUT products/services and modify/add information. <strong>RECIPIENTS:</strong> No
                        data will be disclosed to third parties. <strong>RIGHTS & ADDITIONAL INFO:</strong> You may exercise
                        your rights of access, rectification or erasure, among others. Full details are available in our{' '}
                        <Link component="button" underline="hover" onClick={() => navigate(privacyHref)} sx={{ p: 0 }}>
                          Privacy Policy
                        </Link>.
                      </>
                    )}
                  </Typography>

                  <Button
                    variant="text"
                    size="small"
                    onClick={() => setDpDialogOpen(true)}
                    sx={{ p: 0, minWidth: 0 }}
                  >
                    {isSpanish ? 'Ver resumen de protección de datos' : 'View data protection summary'}
                  </Button>
                </Alert>
              </Grid>

              {/* Aceptación Condiciones + Privacidad */}
              <Grid item xs={12}>
                <FormControl required error={acceptTermsError} component="fieldset" variant="standard">
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={acceptTerms}
                        onChange={(e) => {
                          setAcceptTerms(e.target.checked);
                          if (acceptTermsError) setAcceptTermsError(false);
                        }}
                        name="acceptTerms"
                        color="primary"
                        inputProps={{ 'aria-required': true }}
                      />
                    }
                    label={
                      <Typography variant="body2">
                        {isSpanish ? 'He leído, comprendido y acepto las ' : 'I have read, understood and accept the '}
                        <Link component="button" underline="hover" onClick={() => navigate(termsHref)} sx={{ p: 0 }}>
                          {isSpanish ? 'Condiciones de Uso' : 'Terms of Use'}
                        </Link>
                        {isSpanish ? ' y la ' : ' and the '}
                        <Link component="button" underline="hover" onClick={() => navigate(privacyHref)} sx={{ p: 0 }}>
                          {isSpanish ? 'Política de Privacidad' : 'Privacy Policy'}
                        </Link>
                        .
                      </Typography>
                    }
                  />
                  {acceptTermsError && (
                    <FormHelperText>
                      {isSpanish
                        ? 'Debes aceptar las Condiciones de Uso y la Política de Privacidad para registrarte.'
                        : 'You must accept the Terms of Use and the Privacy Policy to sign up.'}
                    </FormHelperText>
                  )}
                </FormControl>
              </Grid>
            </Grid>

            {/* Botón Guardar y errores backend */}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              disabled={isSubmitting || !acceptTerms}
            >
              {isSubmitting ? (
                <>
                  <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
                  <Typography variant="button">
                    <FormattedMessage id="project.global.buttons.pleaseWait" defaultMessage="Please wait..." />
                  </Typography>
                </>
              ) : (
                <FormattedMessage id="project.global.buttons.save" defaultMessage="Save" />
              )}
            </Button>

            {backendErrors && <Errors errors={backendErrors} />}
          </Box>
        </Box>
      </Container>

      {/* Modal resumen protección de datos — fuera del Container */}
      <Dialog open={dpDialogOpen} onClose={() => setDpDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {isSpanish ? 'Resumen de protección de datos' : 'Data protection summary'}
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" paragraph>
            <strong>{isSpanish ? 'Responsable' : 'Controller'}:</strong> OVERCUT.
          </Typography>
          <Typography variant="body2" paragraph>
            <strong>{isSpanish ? 'Finalidad' : 'Purpose'}:</strong>{' '}
            {isSpanish
              ? 'Crear una cuenta de usuario registrado para que tenga acceso a los productos y servicios de OVERCUT y pueda modificar/añadir información.'
              : 'To create a registered user account so you can access OVERCUT products/services and modify/add information.'}
          </Typography>
          <Typography variant="body2" paragraph>
            <strong>{isSpanish ? 'Destinatarios' : 'Recipients'}:</strong>{' '}
            {isSpanish ? 'No se cederán datos a terceros.' : 'No data will be disclosed to third parties.'}
          </Typography>
          <Typography variant="body2" paragraph>
            <strong>{isSpanish ? 'Derechos e información adicional' : 'Rights & additional information'}:</strong>{' '}
            {isSpanish
              ? 'Puede ejercer los derechos de acceso, rectificación, supresión, limitación, oposición y portabilidad. Toda la información detallada está disponible en la '
              : 'You may exercise your rights of access, rectification, erasure, restriction, objection and portability. Full details are available in the '}
            <Link component="button" underline="hover" onClick={() => navigate(privacyHref)} sx={{ p: 0 }}>
              {isSpanish ? 'Política de Privacidad' : 'Privacy Policy'}
            </Link>.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDpDialogOpen(false)}>
            {isSpanish ? 'Cerrar' : 'Close'}
          </Button>
          <Button variant="contained" onClick={() => navigate(privacyHref)}>
            {isSpanish ? 'Ver Política de Privacidad' : 'View Privacy Policy'}
          </Button>
        </DialogActions>
      </Dialog>
    </ThemeProvider>
  );
};

export default SignUp;
