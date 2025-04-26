import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import * as selectors from "../selectors";
import * as actions from "../actions";
import { Button, Grid, Typography, Paper, Box } from "@mui/material";
import { motion } from "framer-motion";
import CrosswordBoard from "./CrosswordBoard";
import CrosswordClues from "./CrosswordClues";

const DEFAULT_ROWS = 10;
const DEFAULT_COLS = 10;

const Crossword = () => {
    const dispatch = useDispatch();
    const gameId = useSelector(selectors.createCrosswordGame);
    const game = useSelector(selectors.getCrosswordGame);
    const cells = useSelector(selectors.getCrosswordCells);
    const words = useSelector(selectors.getCrosswordWords);

    const [language, setLanguage] = useState("es");

    // Crear nueva partida al entrar
    useEffect(() => {
        if (!gameId) {
            dispatch(actions.createCrosswordGame({
                rows: DEFAULT_ROWS,
                cols: DEFAULT_COLS,
                language,
            }, (id) => {
                dispatch(actions.getCrosswordGame(id, () => {
                    dispatch(actions.getCrosswordCells(id, () => {}));
                    dispatch(actions.getCrosswordWords(id, () => {}));
                }));
            }));
        } else {
            dispatch(actions.getCrosswordGame(gameId, () => {
                dispatch(actions.getCrosswordCells(gameId, () => {}));
                dispatch(actions.getCrosswordWords(gameId, () => {}));
            }));
        }
        // eslint-disable-next-line
    }, [dispatch, gameId]);

    if (!game || !cells || !words) {
        return <Box mt={8}><Typography variant="h5" align="center">Cargando crucigrama...</Typography></Box>
    }

    return (
        <Box mt={4}>
            <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }}>
                <Typography variant="h4" align="center" gutterBottom>
                    Crucigrama de Fórmula 1
                </Typography>
                <Typography variant="subtitle1" align="center" color="textSecondary">
                    ¡Rellena todas las palabras usando tus conocimientos de F1!
                </Typography>
            </motion.div>
            <Grid container spacing={4} justifyContent="center" alignItems="flex-start" mt={2}>
                <Grid item xs={12} md={7}>
                    <CrosswordBoard rows={game.rows} cols={game.cols} cells={cells} words={words} />
                </Grid>
                <Grid item xs={12} md={5}>
                    <CrosswordClues words={words} />
                    <Button
                        variant="outlined"
                        color="primary"
                        sx={{ mt: 3 }}
                        onClick={() => dispatch(actions.resetCrosswordGame(gameId, () => {
                            dispatch(actions.getCrosswordCells(gameId, () => {}));
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
