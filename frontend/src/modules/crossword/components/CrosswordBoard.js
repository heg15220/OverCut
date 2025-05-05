// ✅ CrosswordBoard.jsx actualizado
import React from "react";
import { Paper, Grid, Box } from "@mui/material";
import CrosswordCell from "./CrosswordCell";
import "./CrosswordBoard.css";

const CrosswordBoard = ({ rows, cols, cells, words, language }) => {
  const board = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => null)
  );

  cells.forEach(cell => {
    const links = cell.crosswordCellWordLinkDtoList || []; // 🛡️ Evita crash si undefined
    links.forEach(link => {
      const word = words.find(w => w.id === link.wordId);
      if (!word) return;

      let row = word.row;
      let col = word.col;

      if (word.direction === "HORIZONTAL") {
        col += link.positionCell;
      } else {
        row += link.positionCell;
      }

      if (row >= 0 && col >= 0 && row < rows && col < cols) {
        board[row][col] = cell;
      }
    });
  });


  return (
    <Paper elevation={6} className="crossword-container">
      <Grid container spacing={0} columns={cols}>
        {board.map((rowCells, i) =>
          rowCells.map((cell, j) => (
            <Grid item key={`${i}-${j}`} xs={1}>
              {cell ? (
                <CrosswordCell cell={cell} row={i} col={j} language={language} />
              ) : (
                <Box className="crossword-placeholder" />
              )}
            </Grid>
          ))
        )}
      </Grid>
    </Paper>
  );
};

export default CrosswordBoard;
