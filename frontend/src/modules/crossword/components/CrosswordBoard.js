import React from "react";
import { Paper, Grid } from "@mui/material";
import CrosswordCell from "./CrosswordCell";

const CrosswordBoard = ({ rows, cols, cells, words}) => {
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
                row = word.row;
                col = word.col + cell.positionCell;
            } else {
                row = word.row + cell.positionCell;
                col = word.col;
            }
            if (row >= 0 && col >= 0 && row < rows && col < cols) {
                board[row][col] = cell;
            }
        }
    });

    return (
        <Paper elevation={3} sx={{ overflowX: "auto", padding: 2, background: "#f5f6fa" }}>
            <Grid container spacing={0} columns={cols}>
                {board.map((rowCells, i) =>
                    rowCells.map((cell, j) => (
                        <Grid item key={`${i}-${j}`} xs={1}>
                            <CrosswordCell
                              cell={cell}
                              row={i}
                              col={j}
                            />

                        </Grid>
                    ))
                )}
            </Grid>
        </Paper>
    );
};

export default CrosswordBoard;
