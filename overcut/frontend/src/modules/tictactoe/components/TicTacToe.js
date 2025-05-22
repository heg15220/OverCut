import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import * as actions from '../actions';
import { Container, Typography, Button, Stack } from '@mui/material';
import { motion } from 'framer-motion';
import { translations } from '../../../i18n/tictactoe/translations';
import './TicTacToe.css';

const TicTacToe = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const lang = navigator.language.startsWith("es") ? "es" : "en";
  const t = translations[lang];

  const [step, setStep] = useState(1);
  const [selectedMode, setSelectedMode] = useState(null);

  const handleModeSelect = (mode) => {
    setSelectedMode(mode);
    setStep(2);
  };

  const startGame = (vsBot) => {
    const baseRequest = {
      playerX: "Jugador X",
      playerO: vsBot ? "BOT" : "Jugador O",
      vsBot,
      randomCriteria: false,
      useDynamicCriteria: false,
      modo2000Plus: false,
      historicRangeMode: false
    };

    if (selectedMode === 'classic') baseRequest.randomCriteria = true;
    if (selectedMode === 'dynamic') baseRequest.useDynamicCriteria = true;
    if (selectedMode === '2000') baseRequest.modo2000Plus = true;
    if (selectedMode === 'historic') baseRequest.historicRangeMode = true;

    dispatch(actions.createGame(
      baseRequest,
      (gameId) => navigate(`/minigames/tictactoe/game/${gameId}`),
      () => alert('Error creando partida')
    ));
  };

  return (
    <Container maxWidth="sm" className="tictactoe-container">
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {step === 1 && (
          <>
            <Typography variant="h3" color="primary" gutterBottom>
              {t.selectMode}
            </Typography>
            <Stack spacing={3} direction="column" alignItems="center">
              <Button variant="contained" color="error" onClick={() => handleModeSelect("classic")}>
                {t.classic}
              </Button>
              <Button variant="contained" color="error" onClick={() => handleModeSelect("dynamic")}>
                {t.dynamic}
              </Button>
              <Button variant="contained" color="error" onClick={() => handleModeSelect("2000")}>
                {t.mode2000}
              </Button>
              <Button variant="contained" color="error" onClick={() => handleModeSelect("historic")}>
                {t.historic}
              </Button>
            </Stack>
          </>
        )}

        {step === 2 && (
          <>
            <Typography variant="h4" gutterBottom sx={{ mt: 2 }}>
              {t.whoPlay}
            </Typography>
            <Stack spacing={3} direction="column" alignItems="center">
              <Button variant="contained" color="success" onClick={() => startGame(false)}>
                {t.playLocal}
              </Button>
              <Button variant="contained" color="info" onClick={() => startGame(true)}>
                {t.playBot}
              </Button>
              <Button variant="text" color="secondary" onClick={() => setStep(1)}>
                {t.back}
              </Button>
            </Stack>
          </>
        )}
      </motion.div>
    </Container>
  );
};

export default TicTacToe
