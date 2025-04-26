import React from "react";
import { Typography, List, ListItem, ListItemText, Chip } from "@mui/material";

const CrosswordClues = ({ words }) => {
    if (!words || words.length === 0) return null;

    // Ordenar pistas por posición
    const cluesHorizontal = words.filter(w => w.direction === "HORIZONTAL");
    const cluesVertical = words.filter(w => w.direction === "VERTICAL");

    return (
        <div>
            <Typography variant="h6" gutterBottom>
                Pistas Horizontales
            </Typography>
            <List dense>
                {cluesHorizontal.map((word, idx) => (
                    <ListItem key={word.id}>
                        <Chip label={`${word.row + 1},${word.col + 1}`} color="primary" size="small" sx={{ mr: 1 }} />
                        <ListItemText primary={word.clue} />
                    </ListItem>
                ))}
            </List>
            <Typography variant="h6" gutterBottom mt={2}>
                Pistas Verticales
            </Typography>
            <List dense>
                {cluesVertical.map((word, idx) => (
                    <ListItem key={word.id}>
                        <Chip label={`${word.row + 1},${word.col + 1}`} color="secondary" size="small" sx={{ mr: 1 }} />
                        <ListItemText primary={word.clue} />
                    </ListItem>
                ))}
            </List>
        </div>
    );
};

export default CrosswordClues;
