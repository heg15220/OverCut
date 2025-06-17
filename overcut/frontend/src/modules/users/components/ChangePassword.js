import React, { useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { FormattedMessage } from 'react-intl';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Card,
  CardContent,
  Typography,
  Alert,
  AlertTitle
} from '@mui/material';
import * as actions from '../actions';
import * as selectors from '../selectors';

const ChangePassword = () => {
  const user = useSelector(selectors.getUser);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [backendErrors, setBackendErrors] = useState(null);
  const [passwordsDoNotMatch, setPasswordsDoNotMatch] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState({
    valid: true,
    lengthCheck: true,
    uppercaseCheck: true,
    numberCheck: true,
    specialCharCheck: true
  });

  const [incorrectOldPassword, setIncorrectOldPassword] = useState(false);


  const formRef = useRef();

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

  const checkConfirmNewPassword = () => {
    if (newPassword !== confirmNewPassword) {
      setPasswordsDoNotMatch(true);
      return false;
    } else {
      setPasswordsDoNotMatch(false);
      return true;
    }
  };

  const handleSubmit = event => {
    event.preventDefault();

    const validation = validatePassword(newPassword);
    const passwordsMatch = checkConfirmNewPassword();

    if (!validation.valid || !passwordsMatch) {
      setPasswordValidation(validation);
      return;
    }

    dispatch(
      actions.changePassword(
        user.id,
        oldPassword,
        newPassword,
        () => navigate('/'),
        errors => {
          // Si es string único (por ejemplo, devuelto por ErrorsDto), conviértelo en array para .map()
          const errorList = Array.isArray(errors) ? errors : [errors];

          setBackendErrors(errorList);

          const hasIncorrectPassword = errorList.some(error =>
            typeof error === 'string' &&
            error.toLowerCase().includes('incorrect') &&
            error.toLowerCase().includes('password')
          );

          setIncorrectOldPassword(hasIncorrectPassword);
        }

      )
    );

  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        margin: 2
      }}
    >
      <Card sx={{ width: '80%', maxWidth: 500 }}>
        <CardContent>
          <Typography variant="h5" component="div" align="center">
            <FormattedMessage id="project.users.ChangePassword.title" />
          </Typography>
          <form ref={formRef} onSubmit={handleSubmit}>
            <TextField
              type="password"
              label={<FormattedMessage id="project.users.ChangePassword.fields.oldPassword" />}
              variant="outlined"
              fullWidth
              margin="normal"
              required
              value={oldPassword}
              onChange={e => {
                setOldPassword(e.target.value);
                setIncorrectOldPassword(false); // limpiar error si escribe de nuevo
              }}
              autoFocus
              error={incorrectOldPassword}
              helperText={
                incorrectOldPassword && (
                  <FormattedMessage
                    id="project.exceptions.IncorrectPasswordException"
                    defaultMessage="Incorrect current password."
                  />
                )
              }
            />


            <TextField
              type="password"
              label={<FormattedMessage id="project.users.ChangePassword.fields.newPassword" />}
              variant="outlined"
              fullWidth
              margin="normal"
              required
              value={newPassword}
              onChange={e => {
                const value = e.target.value;
                setNewPassword(value);
                setPasswordValidation(validatePassword(value));
              }}
              error={!passwordValidation.valid}
              helperText={
                !passwordValidation.valid && (
                  <ul style={{ margin: 0, paddingLeft: '20px', color: 'red' }}>
                    {!passwordValidation.lengthCheck && (
                      <li>
                        <FormattedMessage id="validation.password.length" defaultMessage="At least 8 characters" />
                      </li>
                    )}
                    {!passwordValidation.uppercaseCheck && (
                      <li>
                        <FormattedMessage id="validation.password.uppercase" defaultMessage="At least one uppercase letter" />
                      </li>
                    )}
                    {!passwordValidation.numberCheck && (
                      <li>
                        <FormattedMessage id="validation.password.number" defaultMessage="At least one number" />
                      </li>
                    )}
                    {!passwordValidation.specialCharCheck && (
                      <li>
                        <FormattedMessage id="validation.password.special" defaultMessage="At least one special character" />
                      </li>
                    )}
                  </ul>
                )
              }
            />

            <TextField
              type="password"
              label={<FormattedMessage id="project.users.ChangePassword.fields.confirmNewPassword" />}
              variant="outlined"
              fullWidth
              margin="normal"
              required
              value={confirmNewPassword}
              onChange={e => setConfirmNewPassword(e.target.value)}
              error={passwordsDoNotMatch}
              helperText={
                passwordsDoNotMatch && (
                  <FormattedMessage id="project.global.validator.passwordsDoNotMatch" />
                )
              }
            />

            <Button type="submit" variant="contained" color="primary" sx={{ marginTop: 2 }}>
              <FormattedMessage id="project.global.buttons.save" />
            </Button>
          </form>

          {backendErrors && (
            <Alert severity="error" onClose={() => setBackendErrors(null)} sx={{ marginTop: 2 }}>
              <AlertTitle>
                <FormattedMessage id="project.global.errors.title" />
              </AlertTitle>

              {Array.isArray(backendErrors) ? (
                backendErrors.map((error, index) => (
                  <div key={index}>{String(error)}</div>
                ))
              ) : typeof backendErrors === 'string' ? (
                <div>{backendErrors}</div>
              ) : backendErrors.globalError ? (
                <div>{backendErrors.globalError}</div>
              ) : (
                <div>{JSON.stringify(backendErrors)}</div> // fallback seguro
              )}
            </Alert>
          )}

        </CardContent>
      </Card>
    </Box>
  );
};

export default ChangePassword;
