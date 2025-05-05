import React from 'react';
import { Typography, List, ListItem, ListItemText, Chip, Button, Fade, Box } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import * as actions from "../actions";
import * as selectors from "../selectors";
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import "./CrosswordClues.css";

const CrosswordClues = ({ words, language }) => {
  const dispatch = useDispatch();
  const cells = useSelector(selectors.getCrosswordCells);
  const gameId = useSelector(selectors.createCrosswordGame);
  const wordValidation = useSelector(selectors.getWordValidation) || {};

  const getUserInputForWord = (word) => {
    if (!cells) return "";
    const wordLinks = word.cellLinks || [];
    const wordCells = wordLinks
      .sort((a, b) => a.positionCell - b.positionCell)
      .map(link => cells.find(c => c.id === link.cellId))
      .filter(c => c !== undefined);

    return wordCells.map(c => c.userInput ? c.userInput.toUpperCase() : "").join("");
  };

  const isWordReadyToValidate = (word) => {
    if (!cells) return false;
    const wordLinks = word.cellLinks || [];
    const wordCells = wordLinks
      .sort((a, b) => a.positionCell - b.positionCell)
      .map(link => cells.find(c => c.id === link.cellId))
      .filter(c => c !== undefined);

    if (wordCells.length !== word.word.length) return false;

    return wordCells.every(cell => /^[A-Z]$/.test(cell.userInput));
  };

  const renderClue = (word, idx, color) => {
    const userInput = getUserInputForWord(word);
    const validationResult = wordValidation[word.id]; // "correct", "incorrect", undefined
    const alreadyChecked = validationResult !== undefined;

    return (
      <ListItem
        key={word.id}
        className="crossword-clue-item"
        sx={{ flexDirection: "column", alignItems: "flex-start" }}
      >
        <Box display="flex" alignItems="center" width="100%">
          <Chip
            label={`${word.row + 1},${word.col + 1}`}
            color={color}
            size="small"
            sx={{ mr: 1 }}
          />
          <ListItemText primary={word.clue} />
          <Fade in={alreadyChecked}>
            <span style={{ marginLeft: 10 }}>
              {validationResult === "correct" && (
                <CheckCircleIcon sx={{ color: "green" }} />
              )}
              {validationResult === "incorrect" && (
                <CancelIcon sx={{ color: "red" }} />
              )}
            </span>
          </Fade>
        </Box>
        <Button
          onClick={() =>
            dispatch(
              actions.checkWord(word.id, userInput, language, () => {
                dispatch(actions.getCrosswordCells(gameId, () => {}, () => {}));
              }, () => {})
            )
          }
          variant="contained"
          disabled={
            !isWordReadyToValidate(word) ||
            alreadyChecked
          }
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
