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
  const validation = wordValidation?.[cell?.wordId];

  if (!cell) {
    return <Box className="crossword-placeholder" />;
  }

  const updatedCell = cells?.find(c => c.id === cell.id) || cell;
  const value = updatedCell.userInput;

  const handleChange = (e) => {
    const input = e.target.value.toUpperCase().slice(-1);
    dispatch(actions.updateCellUserInput(cell.id, input, () => {
      const wordCells = cells
        .filter(c => c.wordId === cell.wordId)
        .map(c => ({
          ...c,
          userInput: c.id === cell.id ? input : c.userInput
        }))
        .sort((a, b) => a.positionCell - b.positionCell);

      const allFilled = wordCells.every(c =>
        typeof c.userInput === "string" &&
        c.userInput.trim() !== "" &&
        /^[A-Z]$/.test(c.userInput)
      );

      const userInput = wordCells.map(c =>
        c.userInput ? c.userInput.toUpperCase() : ""
      ).join("");

      if (
        allFilled &&
        userInput.length === wordCells.length &&
        !wordValidation?.[cell.wordId]
      ) {
        dispatch(actions.checkWord(cell.wordId, userInput, language, () => {
          // validación completada
        }, () => {}));
      }
    }));
  };

  let cellClass = "crossword-cell";
  if (validation === "correct") cellClass += " correct";
  else if (validation === "incorrect") cellClass += " incorrect";


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
