import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import * as actions from '../actions';
import * as selectors from '../selectors';
import * as userSelectors from '../../users/selectors';
import { Card, CardContent, CardMedia, Typography, Button, Box, Container, Alert, AlertTitle } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelIcon from '@mui/icons-material/Cancel';
import { Grid } from '@mui/material';
import {useNavigate, useParams} from "react-router-dom";
import {FormattedMessage} from "react-intl";
import {sourceImages} from "../../../helpers/sourceImages";

const Awards = () => {
    const {id} = useParams();
    const user = useSelector(userSelectors.getUser);
    const dispatch = useDispatch();
    const [backendErrors, setBackendErrors] = useState(null);
    const award = useSelector(selectors.getAward);
    const [success, setSuccess] = useState(null);
    const navigate = useNavigate();
    const [imageRef, setImageRef] = useState(null);
    const[requierdPoints, setRequieredPoints] = useState(null);

    useEffect(() => {
        const awardId = Number(id);
        if (!Number.isNaN(awardId) && awardId !== "undefined") {
            dispatch(actions.getAward(awardId, () => {}, () => {}));
        }
    }, [id, dispatch]);

    const handleChooseAward = (award) => {
        const awardId = Number(award.id);
        const userId = Number(user.id); // Asumiendo que 'user' es el estado actual del usuario
        dispatch(actions.chooseAward({
            awardId: awardId,
            userId: userId
        }, () => {
            navigate('/');
        }, () => {
            setBackendErrors('Hubo un error al seleccionar el premio.');
        }));
    };


    if (!award) {
        return null;
    }

    return (
        <Container sx={{ marginTop: 0 }}>
            <Box my={0}>
                {backendErrors && (
                    <Alert severity="error" onClose={() => setBackendErrors(null)}>
                        <AlertTitle>Error</AlertTitle>
                        {backendErrors}
                    </Alert>
                )}
                {success && (
                    <Alert severity="success" onClose={() => setSuccess(null)}>
                        <AlertTitle>Success</AlertTitle>
                        {success}
                    </Alert>
                )}
                <Card>
                    <Box
                        sx={{
                            width: '100%',
                            height: '80vh',
                            overflow: 'hidden',
                            position: 'relative',
                        }}
                    >
                        <img
                            ref={setImageRef}
                            className="image-hover-target"
                            src={sourceImages(`./${award.image}`)}
                            alt="Award Image"
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                            sx={{
                                transition: 'transform 0.6s ease-in-out, box-shadow 0.6s ease-in-out',
                            }}
                        />
                    </Box>
                    <CardContent>
                        <Typography variant="h5" component="div" sx={{
                            fontSize: '2rem',
                            fontWeight: 'bold',
                            textTransform: 'uppercase',
                            color: 'text.primary',
                            marginTop: '1rem',
                            marginBottom: '1rem',
                        }}>
                            {award.award}
                        </Typography>

                        <Typography variant="h5" component="div" sx={{
                            fontSize: '2rem',
                            fontWeight: 'bold',
                            textTransform: 'uppercase',
                            color: 'text.primary',
                            marginTop: '1rem',
                            marginBottom: '1rem',
                        }}>
                            <FormattedMessage id="project.entities.AwardDetails.Points"></FormattedMessage>
                            {award.requiredPoints}
                        </Typography>

                        <Typography variant="h5" component="div" sx={{
                            fontSize: '2rem',
                            fontWeight: 'bold',
                            textTransform: 'uppercase',
                            color: 'text.primary',
                            marginTop: '1rem',
                            marginBottom: '1rem',
                        }}>
                            <FormattedMessage id="project.entities.User.Points"></FormattedMessage>
                            {user.points}
                        </Typography>
                        <Button
                            key={award.id}
                            variant="contained"
                            onClick={() => handleChooseAward(award)}
                        >
                            <FormattedMessage id="project.entities.AwardDetails.Button"> </FormattedMessage>
                        </Button>

                    </CardContent>
                </Card>
            </Box>
        </Container>
    );
};

export default Awards;