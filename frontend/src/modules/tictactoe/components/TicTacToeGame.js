import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import * as actions from '../actions';
import * as selectors from '../selectors';
import { Container, Typography, Grid, Box, Paper, Dialog, DialogTitle, DialogContent, TextField, DialogActions, Button } from '@mui/material';
import { motion } from 'framer-motion';
import './TicTacToeGame.css';
import CriteriaBox from './CriteriaBox';


const TicTacToeGame = () => {
    const { id } = useParams();
    const dispatch = useDispatch();
    const game = useSelector(selectors.getGame);

    const [open, setOpen] = useState(false);
    const [selectedCell, setSelectedCell] = useState(null);
    const [pilotName, setPilotName] = useState("");
    const [moveStatus, setMoveStatus] = useState({});

    useEffect(() => {
        dispatch(actions.getGame(
            id,
            () => {},
            () => alert('Error cargando partida')
        ));
    }, [dispatch, id]);

    const handleCellClick = (idx) => {
        if (game.cells[idx].pilotName) return;
        setSelectedCell(idx);
        setOpen(true);
    };

    const handleConfirmPilot = () => {
        const row = Math.floor(selectedCell / 3) + 1;
        const column = (selectedCell % 3) + 1;
        const request = { row, column, piloto: pilotName };

        dispatch(actions.playMove(
            id,
            request,
            () => {
                setMoveStatus((prev) => ({ ...prev, [selectedCell]: 'success' }));
                setTimeout(() => setMoveStatus({}), 1000);
                setOpen(false);
                setPilotName("");
                dispatch(actions.getGame(id, () => {}, () => {}));
            },
            () => {
                setMoveStatus((prev) => ({ ...prev, [selectedCell]: 'error' }));
                setTimeout(() => setMoveStatus({}), 1000);
                setOpen(false);
            }
        ));
    };

    if (!game) return <p>Cargando...</p>;

    return (
        <Container maxWidth="md" className="game-container">

            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6 }}
            >
                <Typography variant="h3" className="tictactoe-title">
                    Tic Tac Toe F1
                </Typography>

                {game.status !== 'IN_PROGRESS' && (
                    <Typography variant="h5" color="secondary" className="tictactoe-result">
                        Resultado: {game.status.replace('_', ' ')}
                    </Typography>
                )}

                <Box className="game-layout">

                    {/* Column Criteria */}
                    <Box className="criteria-top">
                        {game.columnCriteria.map(c => (
                          <CriteriaBox key={c.code} criteria={c} />
                        ))}

                    </Box>

                    <Box className="board-row">
                        {/* Row Criteria */}
                        <Box className="criteria-left">
                            {game.rowCriteria.map(c => (
                              <CriteriaBox key={c.code} criteria={c} />
                            ))}

                        </Box>

                        {/* Board */}
                        <Box className="board">
                            {game.cells.map((cell, idx) => (
                                <Box
                                    key={idx}
                                    component={motion.div}
                                    className={`cell ${moveStatus[idx] === 'success' ? 'cell-success' : ''} ${moveStatus[idx] === 'error' ? 'cell-error' : ''}`}
                                    whileHover={{ scale: 1.1 }}
                                    onClick={() => handleCellClick(idx)}
                                    animate={moveStatus[idx] === 'error' ? { x: [-5, 5, -5, 5, 0] } : {}}
                                    transition={{ duration: 0.5 }}
                                >
                                    {cell.pilotName || '?'}
                                </Box>
                            ))}
                        </Box>
                    </Box>

                </Box>

            </motion.div>

            <Dialog open={open} onClose={() => setOpen(false)}>
                <DialogTitle>Introduce el piloto</DialogTitle>
                <DialogContent>
                    <TextField autoFocus fullWidth value={pilotName || ""} onChange={(e) => setPilotName(e.target.value)} />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen(false)}>Cancelar</Button>
                    <Button onClick={handleConfirmPilot} color="primary">Confirmar</Button>
                </DialogActions>
            </Dialog>

            <img src="/assets/images/f1_car.png" alt="F1 Car" className="car-f1" />

        </Container>
    );
};

export default TicTacToeGame;
