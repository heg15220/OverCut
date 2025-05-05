import React, { useEffect } from 'react';
import { Typography, List, ListItem, ListItemText, Chip, Button, Fade, Box } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import * as actions from "../actions";
import * as selectors from "../selectors";
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import "./CrosswordClues.css"; // Importa los estilos

const CrosswordClues = ({ words, language }) => {
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

  useEffect(() => {
    if (!cells || !words) return;

    words.forEach(word => {
      const wordCells = cells
        .filter(c => c.wordId === word.id)
        .sort((a, b) => a.positionCell - b.positionCell);

      const userInputArray = wordCells.map(c => c.userInput);
      const atLeastOneNonEmpty = userInputArray.some(l => typeof l === "string" && l.trim().length === 1);

      if (!atLeastOneNonEmpty) return;

      const normalizedInput = userInputArray.map(l => (typeof l === "string" ? l.toUpperCase() : ""));
      const allFilled = normalizedInput.every(l => /^[A-Z]$/.test(l));
      const input = normalizedInput.join("");
      const expectedLength = word.word.length;

      if (
        allFilled &&
        input.length === expectedLength &&
        wordValidation[word.id] === undefined
      ) {
        dispatch(actions.checkWord(word.id, input, language, () => {
          dispatch(actions.getCrosswordCells(gameId, () => {}, () => {}));
        }, () => {}));
      }
    });
  }, [cells, words, wordValidation, dispatch]);

  const isWordReadyToValidate = (word) => {
    const wordCells = cells
      .filter(c => c.wordId === word.id)
      .sort((a, b) => a.positionCell - b.positionCell);

    if (wordCells.length !== word.word.length) return false;

    return wordCells.every((cell, i) => {
      if (!cell.userInput) return false;
      const expectedChar = word.word[i]?.toUpperCase();
      const userChar = cell.userInput.toUpperCase();
      return /^[A-Z]$/.test(userChar) && userChar === expectedChar;
    });
  };


  const renderClue = (word, idx, color) => {
    const userInput = getUserInputForWord(word);
    const expectedLength = word.word.length;
    const alreadyChecked = !!wordValidation[word.id];

    return (
      <ListItem key={word.id} className="crossword-clue-item" sx={{ flexDirection: "column", alignItems: "flex-start" }}>
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
        <Button
          onClick={() =>
            dispatch(actions.checkWord(word.id, userInput, language, () => {
              dispatch(actions.getCrosswordCells(gameId, () => {}, () => {}));
            }, () => {}))
          }
          variant="contained"
          disabled={!isWordReadyToValidate(word) || wordValidation[word.id] !== undefined}
          className="crossword-restart-button"
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
      <Typography variant="h6" className="crossword-clues-title">
        Pistas Horizontales
      </Typography>
      <List dense>
        {cluesHorizontal.map((word, idx) => renderClue(word, idx, "primary"))}
      </List>
      <Typography variant="h6" className="crossword-clues-title">
        Pistas Verticales
      </Typography>
      <List dense>
        {cluesVertical.map((word, idx) => renderClue(word, idx, "secondary"))}
      </List>
    </div>
  );
};

export default CrosswordClues;
