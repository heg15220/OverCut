import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import * as actions from '../actions';
import PilotAutocomplete from './PilotAutoComplete';
import PilotHelmet from './PilotHelmet';
import TurnIndicator from './TurnIndicator';
import CriteriaBox from './CriteriaBox';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Snackbar, Alert } from '@mui/material';
import './GameBoard.css';
import { useParams, useNavigate } from 'react-router-dom';

const GameBoard = ({ gameData, onSwitchTurn, onDrawRequest }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [selectedCell, setSelectedCell] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [drawConfirm, setDrawConfirm] = useState(false);
  const [winner, setWinner] = useState(null);
  const [isDraw, setIsDraw] = useState(false);
  const [statusEvaluated, setStatusEvaluated] = useState(false);
  const [showInvalidPilot, setShowInvalidPilot] = useState(false);

  useEffect(() => {
    if (!statusEvaluated && (gameData.status === 'X_WINS' || gameData.status === 'O_WINS' || gameData.status === 'DRAW')) {
      setStatusEvaluated(true);
      setTimeout(() => {
        if (gameData.status === 'X_WINS' || gameData.status === 'O_WINS') {
          setWinner(gameData.status.startsWith('X') ? 'Jugador X' : 'Jugador O');
        } else if (gameData.status === 'DRAW') {
          setIsDraw(true);
        }
      }, 2000);
    }
  }, [gameData.status, statusEvaluated]);

  useEffect(() => {
    setWinner(null);
    setIsDraw(false);
    setStatusEvaluated(false);
    setShowInvalidPilot(false);
    setSelectedCell(null);
    setShowDialog(false);
    setDrawConfirm(false);
  }, [gameData.id]);


  const handleCellClick = (cell) => {
    if (cell.filledBy || winner || isDraw) return;
    setSelectedCell(cell);
    setShowDialog(true);
  };

  const handlePilotSelect = (pilotName) => {
    if (!selectedCell) return;

    const request = {
      row: selectedCell.rowGame,
      column: selectedCell.columnGame,
      piloto: pilotName
    };

    dispatch(actions.playMove(
      id,
      request,
      (res) => {
        if (!res.valid) {
          setShowInvalidPilot(true);
        }
        dispatch(actions.getGame(id, () => {}, () => {}));
      },
      () => {}
    ));

    setShowDialog(false);
  };

  const renderCellContent = (cell) => {
    if (cell.valid && cell.piloto) {
      return <PilotHelmet name={cell.piloto} player={cell.filledBy} />;
    }
    return null;
  };

  return (
    <div className="game-container">
      <div className="game-header">
        <TurnIndicator
          currentTurn={gameData.currentTurn}
          onSwitch={onSwitchTurn}
          onDraw={() => setDrawConfirm(true)}
        />
      </div>

      <div className="game-layout">
        <div className="criteria-top">
          {gameData.columnCriteria.map((crit, idx) => (
            <CriteriaBox key={idx} criteria={crit} />
          ))}
        </div>

        {Array.from({ length: 3 }).map((_, row) => (
          <div key={row} className="board-row">
            <div className="criteria-left">
              <CriteriaBox criteria={gameData.rowCriteria[row]} />
            </div>
            {gameData.cells.filter(c => c.rowGame === row + 1).map(cell => (
              <div
                key={`${cell.rowGame}-${cell.columnGame}`}
                className="cell"
                onClick={() => handleCellClick(cell)}
              >
                {renderCellContent(cell)}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Diálogo para autocompletar piloto */}
      <Dialog open={showDialog} onClose={() => setShowDialog(false)}>
        <DialogTitle>Selecciona un piloto</DialogTitle>
        <DialogContent className="dialog-content">
          <PilotAutocomplete onSelect={handlePilotSelect} />
        </DialogContent>
      </Dialog>

      {/* Modal de empate */}
      <Dialog open={drawConfirm} onClose={() => setDrawConfirm(false)}>
        <DialogTitle className="dialog-title">¿Confirmar empate?</DialogTitle>
        <DialogActions>
          <Button onClick={() => navigate('/minigames/tictactoe')}>Nueva partida</Button>
          <Button onClick={() => navigate('/minigames')}>Volver al inicio</Button>
        </DialogActions>
      </Dialog>

      {/* Modal de victoria */}
      <Dialog open={!!winner} onClose={() => setWinner(null)}>
        <DialogTitle className="dialog-title">🎉 ¡{winner} ha ganado la partida!</DialogTitle>
        <DialogActions>
          <Button onClick={() => navigate('/minigames')}>Volver al inicio</Button>
          <Button onClick={() => navigate('/minigames/tictactoe')}>Nueva partida</Button>
        </DialogActions>
      </Dialog>

      {/* Modal de empate automático */}
      <Dialog open={isDraw} onClose={() => setIsDraw(false)}>
        <DialogTitle className="dialog-title">🤝 ¡La partida ha terminado en empate!</DialogTitle>
        <DialogActions>
          <Button onClick={() => navigate('/minigames')}>Volver al inicio</Button>
          <Button onClick={() => navigate('/minigames/tictactoe')}>Nueva partida</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar de error */}
      <Snackbar
        open={showInvalidPilot}
        autoHideDuration={3000}
        onClose={() => setShowInvalidPilot(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={() => setShowInvalidPilot(false)}>
          Piloto incorrecto para esta celda. ¡Turno perdido!
        </Alert>
      </Snackbar>
    </div>
  );
};

export default GameBoard;