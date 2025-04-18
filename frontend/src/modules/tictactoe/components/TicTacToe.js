import React from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import * as actions from '../actions';
import { Container, Typography, Button, Stack } from '@mui/material';
import { motion } from 'framer-motion';
import './TicTacToe.css';

const TicTacToe = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const createGame = (randomCriteria, useDynamicCriteria, modo2000Plus) => {
        const request = {
            playerX: "Jugador X", // puedes reemplazarlo si es configurable
            playerO: "Jugador O",
            randomCriteria,
            useDynamicCriteria,
            modo2000Plus
        };

        dispatch(actions.createGame(
            request,
            (gameId) => navigate(`/minigames/tictactoe/game/${gameId}`),
            () => alert('Error creando partida')
        ));
    };

    return (
        <Container maxWidth="sm" className="tictactoe-container">
            <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <Typography variant="h3" color="primary" gutterBottom>
                    Tic Tac Toe F1
                </Typography>
                <Stack spacing={3} direction="column" alignItems="center">
                   <Button
                       variant="contained"
                       color="error"
                       size="large"
                       onClick={() => createGame(false, false, false)} // clásico
                   >
                       Modo Clásico
                   </Button>

                   <Button
                       variant="contained"
                       color="error"
                       size="large"
                       onClick={() => createGame(false, true, false)} // dinámico
                   >
                       Modo Dinámico
                   </Button>

                   <Button
                       variant="contained"
                       color="error"
                       size="large"
                       onClick={() => createGame(false, false, true)} // dinámico desde 2000
                   >
                       Modo 2000+
                   </Button>

                </Stack>
            </motion.div>
        </Container>
    );
};

export default TicTacToe;
