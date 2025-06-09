import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import * as actions from '../actions';
import PilotAutocomplete from './PilotAutoComplete';
import PilotHelmet from './PilotHelmet';
import TurnIndicator from './TurnIndicator';
import CriteriaBox from './CriteriaBox';
import { sourceTictactoeImages } from '../../../helpers/sourceTictactoeImages';
import { Dialog, DialogTitle, DialogActions, Button, Snackbar, Alert } from '@mui/material';
import './GameBoard.css';
import './CriteriaBox.css';
import { useParams, useNavigate } from 'react-router-dom';

import AdPlaceholder from '../../common/components/AdPlaceholder';
import AdFloatingBottom from '../../common/components/AdFloatingBottom';



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
  const f1CarImage = sourceTictactoeImages(`./car_game.png`);

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
      piloto: pilotName,
    };

    setShowDialog(false);

    dispatch(actions.playMove(
      id,
      request,
      (res) => {
        if (!res.valid) {
          setShowInvalidPilot(true);
          onSwitchTurn(); // turno cambia aunque el piloto sea incorrecto
        }

        // Jugada válida: actualizar visualmente de inmediato
        dispatch(actions.getGame(id, () => {
          // Después de 2 segundos, si el bot debe jugar, esperamos y actualizamos el tablero
          setTimeout(() => {
            dispatch(actions.getGame(id, () => {}, () => {}));
          }, 2000);
        }, () => {}));
      },
      () => {}
    ));
  };



  const renderCellContent = (cell) => {
    if (cell.valid && cell.piloto) {
      return <PilotHelmet name={cell.piloto} player={cell.filledBy} />;
    }
    return null;
  };

const handleDrawRequest = () => {
  setDrawConfirm(true);
};

const confirmDraw = (mode) => {
  if (mode === 'home') {
    navigate("/minigames");
  } else if (mode === 'new') {
    dispatch(actions.forceDraw(id, () => {
      setTimeout(() => navigate('/minigames/tictactoe'), 1000);
    }, () => {}));
  }
  setDrawConfirm(false);
};



  return (
    <div className="game-container">
        <AdPlaceholder position="left" />
          <AdPlaceholder position="right" />
          <AdFloatingBottom />
      <div className="game-grid-wrapper">
        <div className="turn-indicator-wrapper">
          <TurnIndicator
            currentTurn={gameData.currentTurn}
            onSwitch={onSwitchTurn}
            onDraw={handleDrawRequest}
          />
        </div>
      </div>


      <div className="game-grid-wrapper">
        <div className="board-frame">
          <div className="game-layout-grid">
            <div className="empty-cell logo-cell">
              <img src={f1CarImage} alt="F1 Car" className="f1-car-logo" />
            </div>
            {gameData.columnCriteria.map((crit, idx) => (
              <CriteriaBox key={`col-${idx}`} criteria={crit} className="column-criteria" />
            ))}

            {Array.from({ length: 3 }).flatMap((_, row) => [
              <CriteriaBox key={`row-${row}`} criteria={gameData.rowCriteria[row]} />,
              ...gameData.cells
                .filter(c => c.rowGame === row + 1)
                .map(cell => (
                  <div
                    key={`${cell.rowGame}-${cell.columnGame}`}
                    className="cell grid-cell"
                    onClick={() => handleCellClick(cell)}
                  >
                    {renderCellContent(cell)}
                  </div>

                ))
            ])}
          </div>
        </div>
      </div>



      {/* Diálogo para autocompletar piloto */}
      {showDialog && (
        <div className="pilot-input-panel">
          <div className="pilot-input-content">
            <h3 className="pilot-input-title">Selecciona un piloto</h3>
            <PilotAutocomplete onSelect={handlePilotSelect} />
            <div className="pilot-input-actions">
              <Button variant="outlined" color="error" onClick={() => setShowDialog(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}



      {/* Modal de empate */}
      <Dialog open={drawConfirm} onClose={() => setDrawConfirm(false)}>
        <DialogTitle className="dialog-title">Empate</DialogTitle>
        <DialogActions>
          <Button onClick={() => confirmDraw('new')}>Nueva partida</Button>
          <Button onClick={() => confirmDraw('home')}>Volver al inicio</Button>
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