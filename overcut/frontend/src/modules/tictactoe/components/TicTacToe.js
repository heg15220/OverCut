import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import * as actions from "../actions";
import { Container, Typography, Button, Stack } from "@mui/material";
import { motion } from "framer-motion";
import { translations } from "../../../i18n/tictactoe/translations";
import "./TicTacToe.css";
import MinigameTutorial from "../../common/components/MinigameTutorial";
import { sourceImages } from "../../../helpers/sourceMiniGamesImages";
import { tutorialTexts } from "../../../helpers/minigameTutorialTexts";

const TicTacToe = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const lang = navigator.language.startsWith("es") ? "es" : "en";
  const t = translations[lang];

  // ==========================================================
  // [CHANGED] Nuevo flujo:
  // step 0 = elegir tipo (normal vs teamsOnly)
  // step 1 = elegir modo (dynamic / 2000 / historic)
  // step 2 = elegir tipo partida (local / grid)
  // ==========================================================
  const [step, setStep] = useState(0);

  // ==========================================================
  // [NEW] Tipo de partida
  // ==========================================================
  const [gameType, setGameType] = useState("normal"); // "normal" | "teamsOnly"

  const [selectedMode, setSelectedMode] = useState(null);
  const [showTutorial, setShowTutorial] = useState(true);

  const tutorial = tutorialTexts["/minigames/tictactoe"][lang];

  // ==========================================================
  // [NEW] Paso 0: elegir tipo
  // ==========================================================
  const handleTypeSelect = (type) => {
    setGameType(type);
    setStep(1);
  };

  const handleModeSelect = (mode) => {
    setSelectedMode(mode);
    setStep(2);
  };

  const startGame = (vsBot, gridMode = false) => {
    const baseRequest = {
      playerX: "Jugador X",
      playerO: vsBot ? "BOT" : "Jugador O",
      vsBot,
      randomCriteria: false,
      useDynamicCriteria: false,
      modo2000Plus: false,
      historicRangeMode: false,
      gridMode,

      // ==========================================================
      // [NEW] Mandamos teamsOnlyMode al backend
      // ==========================================================
      teamsOnlyMode: gameType === "teamsOnly",
    };

    if (selectedMode === "classic") baseRequest.randomCriteria = true;
    if (selectedMode === "dynamic") baseRequest.useDynamicCriteria = true;
    if (selectedMode === "2000") baseRequest.modo2000Plus = true;
    if (selectedMode === "historic") baseRequest.historicRangeMode = true;

    if (gridMode) {
      baseRequest.playerO = "";
      baseRequest.vsBot = false;
    }

    dispatch(
      actions.createGame(
        baseRequest,
        (gameId) => navigate(`/minigames/tictactoe/game/${gameId}`),
        () => alert("Error creando partida")
      )
    );
  };

  if (showTutorial) {
    return (
      <MinigameTutorial
        title={tutorial.title}
        description={tutorial.description}
        image={sourceImages("./tictactoe.png")}
        onStart={() => setShowTutorial(false)}
        lang={lang}
      />
    );
  }

  return (
    <Container maxWidth="sm" className="tictactoe-container">
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* ==========================================================
            [NEW] STEP 0: Tipo de partida
           ========================================================== */}
        {step === 0 && (
          <>
            <Typography variant="h3" color="primary" gutterBottom>
              {t.selectGameType}
            </Typography>
            <Stack spacing={3} direction="column" alignItems="center">
              <Button
                variant="contained"
                color="error"
                onClick={() => handleTypeSelect("normal")}
              >
                {t.normalMode}
              </Button>

              <Button
                variant="contained"
                color="primary"
                onClick={() => handleTypeSelect("teamsOnly")}
              >
                {t.teamsOnlyMode}
              </Button>
            </Stack>
          </>
        )}

        {/* ==========================================================
            [CHANGED] STEP 1: Modos existentes
           ========================================================== */}
        {step === 1 && (
          <>
            <Typography variant="h3" color="primary" gutterBottom>
              {t.selectMode}
            </Typography>
            <Stack spacing={3} direction="column" alignItems="center">
              <Button
                variant="contained"
                color="error"
                onClick={() => handleModeSelect("dynamic")}
              >
                {t.dynamic}
              </Button>
              <Button
                variant="contained"
                color="error"
                onClick={() => handleModeSelect("2000")}
              >
                {t.mode2000}
              </Button>
              <Button
                variant="contained"
                color="error"
                onClick={() => handleModeSelect("historic")}
              >
                {t.historic}
              </Button>

              <Button variant="text" color="primary" onClick={() => setStep(0)}>
                {t.back}
              </Button>
            </Stack>
          </>
        )}

        {/* ==========================================================
            STEP 2: Local / Grid (como ya lo tenías)
           ========================================================== */}
        {step === 2 && (
          <>
            <Typography variant="h4" gutterBottom sx={{ mt: 2 }}>
              {t.whoPlay}
            </Typography>
            <Stack spacing={3} direction="column" alignItems="center">
              <Button variant="contained" color="success" onClick={() => startGame(false)}>
                {t.playLocal}
              </Button>

              <Button variant="contained" color="primary" onClick={() => startGame(false, true)}>
                {t.playGrid}
              </Button>

              <Button variant="text" color="primary" onClick={() => setStep(1)}>
                {t.back}
              </Button>
            </Stack>
          </>
        )}
      </motion.div>
    </Container>
  );
};

export default TicTacToe;
