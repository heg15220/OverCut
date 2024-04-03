import React, { useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { FormattedMessage } from 'react-intl';
import { useNavigate } from 'react-router-dom';
import { Box, TextField, Button, Card, CardContent, Typography, Alert, AlertTitle } from '@mui/material';
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
    const formRef = useRef();

    const handleSubmit = event => {
        event.preventDefault();

        if (formRef.current.checkValidity() && checkConfirmNewPassword()) {
            dispatch(actions.changePassword(user.id, oldPassword, newPassword,
                () => navigate('/'),
                errors => setBackendErrors(errors)));
        } else {
            setBackendErrors(null);
            formRef.current.classList.add('was-validated');
        }
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

    return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', margin: 2 }}>
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
                            onChange={e => setOldPassword(e.target.value)}
                            autoFocus
                        />
                        <TextField
                            type="password"
                            label={<FormattedMessage id="project.users.ChangePassword.fields.newPassword" />}
                            variant="outlined"
                            fullWidth
                            margin="normal"
                            required
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
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
                            helperText={passwordsDoNotMatch ? <FormattedMessage id='project.global.validator.passwordsDoNotMatch' /> : <FormattedMessage id='project.global.validator.required' />}
                        />
                        <Button type="submit" variant="contained" color="primary" sx={{ marginTop: 2 }}>
                            <FormattedMessage id="project.global.buttons.save" />
                        </Button>
                    </form>
                    {backendErrors && (
                        <Alert severity="error" onClose={() => setBackendErrors(null)}>
                            <AlertTitle><FormattedMessage id="project.global.errors.title" /></AlertTitle>
                            {backendErrors.map((error, index) => (
                                <div key={index}>{error}</div>
                            ))}
                        </Alert>
                    )}
                </CardContent>
            </Card>
        </Box>
    );
};

export default ChangePassword;
