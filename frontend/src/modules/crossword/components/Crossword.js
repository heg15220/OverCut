import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import * as selectors from "../selectors";
import * as actions from "../actions";
import { Button, Grid, Typography, Paper, Box } from "@mui/material";
import { motion } from "framer-motion";
import "./Crossword.css";
import { sourceImages } from "../../../helpers/sourceImages";
import CrosswordBoard from "./CrosswordBoard";
import CrosswordClues from "./CrosswordClues";

const DEFAULT_ROWS = 10;
const DEFAULT_COLS = 10;

const Crossword = () => {
    const dispatch = useDispatch();
    const game = useSelector(selectors.getCrosswordGame);
    const cells = useSelector(selectors.getCrosswordCells);
    const words = useSelector(selectors.getCrosswordWords);
    const browserLang = navigator.language.startsWith("es") ? "es" : "en";
    const [language, setLanguage] = useState(browserLang);


    // Crear nueva partida al entrar
    useEffect(() => {
      const browserLang = navigator.language.startsWith("es") ? "es" : "en";
      setLanguage(browserLang); // actualiza el estado
      dispatch(actions.createCrosswordGame({
        rows: DEFAULT_ROWS,
        cols: DEFAULT_COLS,
        language: browserLang, // <- idioma enviado al backend
      }, (id) => {
        dispatch(actions.getCrosswordGame(id, () => {
          dispatch(actions.getCrosswordCells(id, () => {}));
          dispatch(actions.getCrosswordWords(id, () => {}));
        }));
      }));
    }, [dispatch]);



    if (!game || !cells || !words) {
        return <Box mt={8}><Typography variant="h5" align="center">Cargando crucigrama...</Typography></Box>
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
                  Crucigrama de Fórmula 1
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
                  Rellena todas las palabras y demuestra que conoces cada rincón del paddock.
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
                    <Button
                        variant="outlined"
                        color="primary"
                        sx={{ mt: 3 }}
                        onClick={() => dispatch(actions.resetCrosswordGame(game.id, () => {
                            dispatch(actions.getCrosswordCells(game.id, () => {}));
                        }))}
                    >
                        Reiniciar crucigrama
                    </Button>
                </Grid>
            </Grid>
        </Box>
    );
};

export default Crossword;
