import React from "react";
import { Box, TextField } from "@mui/material";
import * as actions from "../actions";
import { useDispatch, useSelector } from "react-redux";
import * as selectors from "../selectors";

const CrosswordCell = ({ cell, row, col }) => {
    const dispatch = useDispatch();
    const cells = useSelector(selectors.getCrosswordCells);
    const wordValidation = useSelector(selectors.getWordValidation);
    const validation = wordValidation?.[cell?.wordId];

    if (!cell) {
        return <Box sx={{ width: 36, height: 36, background: "#ddd", border: "1px solid #ccc" }} />;
    }

    // 🔄 Usa el valor real actualizado desde Redux (no local)
    const updatedCell = cells?.find(c => c.id === cell.id) || cell;
    const value = updatedCell.userInput || "";

    let backgroundColor = "#fff";
    if (validation === "correct") backgroundColor = "#c8e6c9";
    else if (validation === "incorrect") backgroundColor = "#ffcdd2";

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
                dispatch(actions.checkWord(cell.wordId, userInput, () => {}, () => {}));
            }
        }));

    };

    return (
        <Box sx={{
            width: 36,
            height: 36,
            background: backgroundColor,
            border: "2px solid #1976d2",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
        }}>
            <TextField
                value={value}
                onChange={handleChange}
                inputProps={{
                    style: {
                        textAlign: "center",
                        textTransform: "uppercase",
                        fontWeight: "bold",
                        fontSize: 20,
                        width: 32,
                        height: 32,
                        padding: 0
                    },
                    maxLength: 1,
                }}
                variant="standard"
                sx={{ width: 36 }}
            />
        </Box>
    );
};

export default CrosswordCell;
