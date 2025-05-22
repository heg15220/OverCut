import React from "react";
import { Box } from "@mui/material";
import * as actions from "../actions";
import { useDispatch, useSelector } from "react-redux";
import * as selectors from "../selectors";
import "./CrosswordCell.css";

const CrosswordCell = ({ cell, row, col, language }) => {
  const dispatch = useDispatch();
  const cells = useSelector(selectors.getCrosswordCells);
  const wordValidation = useSelector(selectors.getWordValidation);

  if (!cell) {
    return <Box className="crossword-placeholder" />;
  }

  const updatedCell = cells?.find(c => c.id === cell.id) || cell;
  const value = updatedCell.userInput;

  // 🔄 Recoger todos los wordIds asociados a esta celda (puede haber más de uno)
  const wordIds = updatedCell.crosswordCellWordLinkDtoList?.map(link => link.wordId) || [];

  const showCorrect = updatedCell.modifiedByUser &&
    value && /^[A-Z]$/.test(value) &&
    wordIds.every(wordId => wordValidation[wordId] === "correct");

  const showIncorrect = updatedCell.modifiedByUser &&
    value && /^[A-Z]$/.test(value) &&
    wordIds.some(wordId => wordValidation[wordId] === "incorrect");


  const handleChange = (e) => {
    const raw = e.target.value.toUpperCase().slice(-1);
    const input = /^[A-Z\-]$/.test(raw) ? raw : "";
    dispatch(actions.updateCellUserInput(cell.id, input, () => {
      wordIds.forEach(wordId => {
        dispatch(actions.resetSingleWordValidation(wordId));
      });
    }));
  };



  let cellClass = "crossword-cell";
  if (showCorrect) cellClass += " correct";
  else if (showIncorrect) cellClass += " incorrect";

  return (
    <Box className={cellClass}>
      <input
        type="text"
        value={value || ""}
        onChange={handleChange}
        className="crossword-input"
        maxLength={1}
      />
    </Box>
  );
};

export default CrosswordCell;
