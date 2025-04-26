import React, { useState } from "react";
import { Box, TextField } from "@mui/material";
import { useDispatch } from "react-redux";
import * as actions from "../actions";

const CrosswordCell = ({ cell, row, col }) => {
    const dispatch = useDispatch();
    const [value, setValue] = useState(cell?.userInput || "");

    if (!cell) {
        return <Box sx={{ width: 36, height: 36, background: "#ddd", border: "1px solid #ccc" }} />;
    }

    const handleChange = (e) => {
        const input = e.target.value.toUpperCase().slice(-1);
        setValue(input);
        if (input) {
            dispatch(actions.updateCellUserInput(cell.id, input, () => {}));
        }
    };

    return (
        <Box sx={{
            width: 36,
            height: 36,
            background: cell.filled ? "#c8e6c9" : "#fff",
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
