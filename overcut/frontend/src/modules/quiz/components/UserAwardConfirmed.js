import React, { useEffect, useState } from 'react';
import { Container, Typography, Box, Button, Grid } from '@mui/material';
import * as selectors from '../selectors';
import * as actions from '../actions';
import * as userSelectors from '../../users/selectors';
import { useDispatch, useSelector } from "react-redux";
import {useNavigate, useParams} from "react-router-dom";
import {FormattedMessage} from "react-intl";

const UserAwardConfirmed = () => {
    const dispatch = useDispatch();
    const {id} = useParams();
    const quizPoints = useSelector(selectors.getQuizPoints);
    const user = useSelector(userSelectors.getUser);
    const award = useSelector(selectors.getAward);
    const navigate = useNavigate();

    // Estado para controlar qué animación mostrar
    const [animationState, setAnimationState] = useState('');

    useEffect(() => {
        const awardId = Number(id);
        dispatch(actions.getAward(awardId, () => {}));
    }, [id,dispatch]);

    useEffect(() => {
        setAnimationState('success');
    });

    return (
        <Container maxWidth="sm" sx={{ mt: 8, mb: 4, height: '40vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <Grid container direction="column" alignItems="center">
                <Box sx={{ mb: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    {animationState === 'success' && (
                        <Box sx={{ mt: 4, textAlign: 'center' }}>
                            <Typography variant="h6" sx={{ color: 'green', fontStyle: 'italic'}}>
                                <FormattedMessage id="project.entities.Award.Result.Achieved"/>
                            </Typography>
                        </Box>
                    )}

                    <Typography variant="h5" component="div" sx={{
                        fontSize: '2rem',
                        fontWeight: '500',
                        fontStyle: 'italic',
                        textTransform: 'none',
                        color: 'text.primary',
                        marginBottom: '1rem',
                        maxWidth: '80%',
                        textAlign: 'center',
                    }}>
                        {award.name}
                    </Typography>

                    <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                        <Button variant="contained" color="primary" onClick={() => navigate('/user/awards')}>
                            <FormattedMessage id="project.entities.Award.Result.ButtonHome"/>
                        </Button>
                    </Box>
                </Box>
            </Grid>
        </Container>
    );
};

export default UserAwardConfirmed;
