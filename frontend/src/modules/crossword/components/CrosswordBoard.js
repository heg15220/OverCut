import React from "react";
import { Paper, Grid } from "@mui/material";
import CrosswordCell from "./CrosswordCell";
import "./CrosswordBoard.css"; // Importa los estilos

const CrosswordBoard = ({ rows, cols, cells, words, language }) => {
  // Crear una matriz vacía del tamaño del tablero
  const board = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => null)
  );

  // Coloca las letras en su posición (solo la letra si ya rellenada)
  cells.forEach(cell => {
    const word = words.find(w => w.id === cell.wordId);
    if (word) {
      let row = word.row;
      let col = word.col;
      if (word.direction === "HORIZONTAL") {
        col = word.col + cell.positionCell;
      } else {
        row = word.row + cell.positionCell;
      }
      if (row >= 0 && col >= 0 && row < rows && col < cols) {
        board[row][col] = cell;
      }
    }
  });

  return (
    <Paper elevation={6} className="crossword-container">
      <Grid container spacing={0} columns={cols}>
        {board.map((rowCells, i) =>
          rowCells.map((cell, j) => (
            <Grid item key={`${i}-${j}`} xs={1}>
              <CrosswordCell cell={cell} row={i} col={j} language={language} />
            </Grid>
          ))
        )}
      </Grid>
    </Paper>
  );
};

export default CrosswordBoard;
