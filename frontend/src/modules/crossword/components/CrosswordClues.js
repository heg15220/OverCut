import React, { useEffect } from 'react';
import { Typography, List, ListItem, ListItemText, Chip, Button, Fade, Box } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import * as actions from "../actions";
import * as selectors from "../selectors";
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

const CrosswordClues = ({ words }) => {
    const dispatch = useDispatch();
    const cells = useSelector(selectors.getCrosswordCells);
    const gameId = useSelector(selectors.createCrosswordGame);
    const wordValidation = useSelector(selectors.getWordValidation) || {};

    const getUserInputForWord = (word) => {
        const wordCells = cells
            .filter(c => c.wordId === word.id)
            .sort((a, b) => a.positionCell - b.positionCell);
        return wordCells.map(c => c.userInput ? c.userInput.toUpperCase() : "").join("");
    };

    // 🧠 Detecta automáticamente cuando el usuario ha completado la palabra
    useEffect(() => {
        words.forEach(word => {
            const wordCells = cells
                .filter(c => c.wordId === word.id)
                .sort((a, b) => a.positionCell - b.positionCell);

            const allFilled = wordCells.every(c => typeof c.userInput === "string" && c.userInput.trim() !== "");

            const input = wordCells.map(c => (c.userInput ? c.userInput.toUpperCase() : "")).join("");

            if (
                allFilled &&
                input.trim().length >= 3 && // evita validar palabras demasiado cortas
                wordValidation[word.id] === undefined
            ) {
                dispatch(actions.checkWord(word.id, input, () => {
                    dispatch(actions.getCrosswordCells(gameId, () => {}, () => {}));
                }, () => {}));
            }

        });
    }, [cells, words, wordValidation, dispatch]);


   const renderClue = (word, idx, color) => {
       const userInput = getUserInputForWord(word);
       const expectedLength = word.word.length;
       const alreadyChecked = !!wordValidation[word.id];



       return (
           <ListItem key={word.id} sx={{ flexDirection: "column", alignItems: "flex-start" }}>
               <Box display="flex" alignItems="center" width="100%">
                   <Chip label={`${word.row + 1},${word.col + 1}`} color={color} size="small" sx={{ mr: 1 }} />
                   <ListItemText primary={word.clue} />
                   <Fade in={alreadyChecked}>
                       <span style={{ marginLeft: 10 }}>
                           {wordValidation[word.id] === "correct" && <CheckCircleIcon sx={{ color: "green" }} />}
                           {wordValidation[word.id] === "incorrect" && <CancelIcon sx={{ color: "red" }} />}
                       </span>
                   </Fade>
               </Box>
               {/* Botón opcional solo visible si el usuario quiere volver a validar manualmente */}
               <Button
                   onClick={() =>
                       dispatch(actions.checkWord(word.id, userInput, () => {
                           dispatch(actions.getCrosswordCells(gameId, () => {}, () => {}));
                       }, () => {}))
                   }
                   variant="outlined"
                   color="primary"
                   disabled={userInput.length !== expectedLength || /[^A-Z]/.test(userInput)}
                   sx={{ mt: 1, ml: 4 }}
               >
                   Validar palabra
               </Button>

           </ListItem>
       );
   };

    if (!words || words.length === 0) return null;

    const cluesHorizontal = words.filter(w => w.direction === "HORIZONTAL");
    const cluesVertical = words.filter(w => w.direction === "VERTICAL");

    return (
        <div>
            <Typography variant="h6" gutterBottom>
                Pistas Horizontales
            </Typography>
            <List dense>
                {cluesHorizontal.map((word, idx) => renderClue(word, idx, "primary"))}
            </List>
            <Typography variant="h6" gutterBottom mt={2}>
                Pistas Verticales
            </Typography>
            <List dense>
                {cluesVertical.map((word, idx) => renderClue(word, idx, "secondary"))}
            </List>
        </div>
    );
};

export default CrosswordClues;
