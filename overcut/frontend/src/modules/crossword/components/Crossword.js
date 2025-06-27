import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import * as selectors from "../selectors";
import * as actions from "../actions";
import { FormattedMessage } from 'react-intl';
import { Button, Grid, Typography, Paper, Box } from "@mui/material";
import { motion } from "framer-motion";
import "./Crossword.css";
import CrosswordBoard from "./CrosswordBoard";
import CrosswordClues from "./CrosswordClues";
import { useNavigate } from "react-router-dom";
import LoadingScreen from '../../common/components/LoadingScreen';

import MinigameTutorial from "../../common/components/MinigameTutorial"; // nuevo componente compartido
import { sourceImages } from "../../../helpers/sourceMiniGamesImages"; // ya lo usas en MinigamesHome
import { tutorialTexts } from "../../../helpers/minigameTutorialTexts"; // explicaciones por minijuego

import { getCooldownForGame } from "../../cooldown/selectors";
import { fetchCooldown } from "../../cooldown/actions";
import CooldownScreen from "../../cooldown/components/CooldownScreen";
import { getUser } from "../../users/selectors";

const DEFAULT_ROWS = 10;
const DEFAULT_COLS = 10;

const Crossword = () => {
    const dispatch = useDispatch();
    const game = useSelector(selectors.getCrosswordGame);
    const cells = useSelector(selectors.getCrosswordCells);
    const words = useSelector(selectors.getCrosswordWords);
    const browserLang = navigator.language.startsWith("es") ? "es" : "en";
    const [language, setLanguage] = useState(browserLang);
    const navigate = useNavigate();

    const lang = navigator.language.startsWith("es") ? "es" : "en";

   const [showTutorial, setShowTutorial] = useState(true);

   const tutorial = tutorialTexts["/minigames/crossword"][lang];

   const { canPlay, secondsRemaining } = useSelector(state =>
     getCooldownForGame(state, "Crossword")
   );
   const user = useSelector(getUser);

   useEffect(() => {
     dispatch(fetchCooldown("Crossword"));
   }, [dispatch]);

    // Crear nueva partida al entrar
    useEffect(() => {
      if (canPlay) {
        const browserLang = navigator.language.startsWith("es") ? "es" : "en";
        setLanguage(browserLang);
        dispatch(actions.resetWordValidation());
        dispatch(actions.createCrosswordGame({
          rows: DEFAULT_ROWS,
          cols: DEFAULT_COLS,
          language: browserLang,
        }, (id) => {
          dispatch(actions.getCrosswordGame(id, () => {
            dispatch(actions.getCrosswordCells(id, () => {}));
            dispatch(actions.getCrosswordWords(id, () => {}));
          }));
        }));
      }
    }, [canPlay, dispatch]);

    if (!canPlay) {
      return (
        <CooldownScreen
          seconds={secondsRemaining}
          onBack={() => navigate("/minigames")}
        />
      );
    }


    if (showTutorial) {
        return (
          <MinigameTutorial
            title={tutorial.title}
            description={tutorial.description}
            image={sourceImages("./crossword.png")}
            onStart={() => setShowTutorial(false)}
            lang={lang}
          />
        );
      }

    if (!game || !cells || !words) {
        return <LoadingScreen lang={language} text={language === 'es' ? 'Cargando crucigrama...' : 'Loading crossword...'} />;
    }


    return (
        <Box
          sx={{
            backgroundColor: "#000000",
            minHeight: "100vh",
            paddingTop: "2rem",
          }}
        >
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <Box
                sx={{
                  textAlign: "center",
                  mb: 4,
                  px: 2,
                }}
              >
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: "bold",
                    fontSize: { xs: "2rem", md: "3rem" },
                    color: "#e10600",
                    textShadow: "0 0 8px rgba(255, 0, 0, 0.6)",
                    letterSpacing: 1,
                    mb: 1,
                  }}
                >
                   <FormattedMessage id="crossword.title" />
                </Typography>

                <Typography
                  variant="subtitle1"
                  sx={{
                    fontSize: { xs: "1rem", md: "1.2rem" },
                    color: "#cccccc",
                    fontStyle: "italic",
                    maxWidth: "700px",
                    margin: "0 auto",
                    textShadow: "0 0 6px rgba(255, 255, 255, 0.2)",
                  }}
                >
                  <FormattedMessage id="crossword.subtitle" />
                </Typography>
              </Box>
            </motion.div>

            <Grid container spacing={4} justifyContent="center" alignItems="flex-start" mt={2}>
                <Grid item xs={12} md={7}>
                    <CrosswordBoard
                      rows={game.rows}
                      cols={game.cols}
                      cells={cells}
                      words={words}
                      language = {language}
                    />

                </Grid>
                <Grid item xs={12} md={5}>
                    <CrosswordClues words={words} language={language}/>
                    <Box sx={{ display: 'flex', gap: 2, mt: 3, flexWrap: 'wrap' }}>
                      <Button
                        variant="outlined"
                        color="primary"
                        onClick={() => dispatch(actions.resetCrosswordGame(game.id, () => {
                            dispatch(actions.getCrosswordCells(game.id, () => {}));
                        }))}
                      >
                        <FormattedMessage id="crossword.reset" />
                      </Button>

                      <Button
                        variant="contained"
                        color="secondary"
                        onClick={() => navigate('/minigames')}
                      >
                        {language === 'es' ? 'Volver al inicio' : 'Back home'}
                      </Button>
                    </Box>

                </Grid>
            </Grid>
        </Box>
    );
};

export default Crossword;
