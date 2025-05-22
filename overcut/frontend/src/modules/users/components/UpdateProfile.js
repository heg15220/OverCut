import React, { useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { FormattedMessage } from 'react-intl';
import { useNavigate } from 'react-router-dom';
import { Box, TextField, Button, Card, CardContent, Typography, Alert, AlertTitle } from '@mui/material';
import { useForm } from 'react-hook-form';
import * as actions from '../actions';
import * as selectors from '../selectors';

import image from './Resources/logo2.svg';

const UpdateProfile = () => {
    const user = useSelector(selectors.getUser);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { register, handleSubmit, formState: { errors } } = useForm();
    const [backendErrors, setBackendErrors] = useState(null);
    const [completedImage, setCompletedImage] = useState('');
    const formImageRef = useRef();

    const onSubmit = data => {
        dispatch(actions.updateProfile(
            {
                id: user.id,
                firstName: data.firstName.trim(),
                lastName: data.lastName.trim(),
                email: data.email.trim(),
            },
            () => navigate('/'),
            errors => setBackendErrors(errors)
        ));
    };

    const uploadUserImage = event => {
        event.preventDefault();
        setCompletedImage(null);

        if (formImageRef.current.checkValidity()) {
            const formData = new FormData(formImageRef.current);
            dispatch(actions.addUserImage(user, formData, () => {
                    setCompletedImage(srcImage);
                },
                errors => setBackendErrors(errors)));
        } else {
            setBackendErrors(null);
            formImageRef.current.classList.add('was-validated');
        }
    };

    let srcImage = user.image ? "data:image/jpg;base64," + user.image : image;

    return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', margin: 2 }}>
            <Card sx={{ width: '80%', maxWidth: 500 }}>
                <CardContent>
                    <Typography variant="h5" component="div" align="center">
                        <FormattedMessage id="project.users.UpdateProfile.title" />
                    </Typography>
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <TextField
                            {...register("firstName", { required: true })}
                            label={<FormattedMessage id="project.global.fields.firstName" />}
                            variant="outlined"
                            fullWidth
                            margin="normal"
                            error={errors.firstName}
                            helperText={errors.firstName && <FormattedMessage id='project.global.validator.required' />}
                        />
                        <TextField
                            {...register("lastName", { required: true })}
                            label={<FormattedMessage id="project.global.fields.lastName" />}
                            variant="outlined"
                            fullWidth
                            margin="normal"
                            error={errors.lastName}
                            helperText={errors.lastName && <FormattedMessage id='project.global.validator.required' />}
                        />
                        <TextField
                            {...register("email", { required: true })}
                            label={<FormattedMessage id="project.global.fields.email" />}
                            variant="outlined"
                            fullWidth
                            margin="normal"
                            error={errors.email}
                            helperText={errors.email && <FormattedMessage id='project.global.validator.email' />}
                        />
                        <Button type="submit" variant="contained" color="primary" sx={{ marginTop: 2 }}>
                            <FormattedMessage id="project.global.buttons.UpdateProfile" />
                        </Button>
                    </form>
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: 2 }}>
                        <img src={srcImage} alt="Foto" style={{ maxHeight: '350px', maxWidth: '350px' }} />
                    </Box>
                    <form ref={formImageRef} encType="multipart/form-data" onSubmit={uploadUserImage} style={{ marginTop: 2 }}>
                        <input type="file" name="file" accept="image/jpeg" id="userPhoto" required />
                        <Button type="submit" variant="contained" color="secondary" sx={{ marginTop: 2 }}>
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
                    {completedImage && (
                        <Alert severity="success" onClose={() => setCompletedImage(null)}>
                            <FormattedMessage id="project.user.addImage" />
                        </Alert>
                    )}
                </CardContent>
            </Card>
        </Box>
    );
};

export default UpdateProfile;
