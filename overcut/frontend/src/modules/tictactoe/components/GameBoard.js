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
  const [evaluatedGameId, setEvaluatedGameId] = useState(null);
  const [gridCompleted, setGridCompleted] = useState(false);

  const lang = navigator.language.startsWith("es") ? "es" : "en";

  const t = {
    es: {
      selectPilot: "Selecciona un piloto",
      cancel: "Cancelar",
      draw: "Empate",
      requestDraw: "Solicitar empate",
      newGame: "Nueva partida",
      backHome: "Volver al inicio",
      victory: (winner) => `🎉 ¡${winner} ha ganado la partida!`,
      autoDraw: "🤝 ¡La partida ha terminado en empate!",
      gridComplete: "✅ ¡Has completado el tablero!",
      invalid: "Piloto incorrecto para esta celda. ¡Turno perdido!",
    },
    en: {
      selectPilot: "Select a driver",
      cancel: "Cancel",
      draw: "Draw",
      requestDraw: "Request draw",
      newGame: "New game",
      backHome: "Back to home",
      victory: (winner) => `🎉 ${winner} has won the game!`,
      autoDraw: "🤝 The game has ended in a draw!",
      gridComplete: "✅ You completed the board!",
      invalid: "Invalid driver for this cell. Turn lost!",
    }
  }[lang];

  useEffect(() => {
    if (!gameData || !gameData.id) return;

    const isNewGame = gameData.status === 'IN_PROGRESS';
    const isAlreadyEvaluated = evaluatedGameId === gameData.id;

    if (isNewGame) {
      setWinner(null);
      setIsDraw(false);
      setStatusEvaluated(false);
      setEvaluatedGameId(null);
      return;
    }

    if (!statusEvaluated && !isAlreadyEvaluated) {
      setEvaluatedGameId(gameData.id);
      setStatusEvaluated(true);

      setTimeout(() => {
        if (gameData.status === 'X_WINS' || gameData.status === 'O_WINS') {
          const winnerLabel = gameData.status.startsWith('X')
            ? (lang === 'es' ? 'Jugador X' : 'Player X')
            : (lang === 'es' ? 'Jugador O' : 'Player O');
          setWinner(winnerLabel);
        } else if (gameData.status === 'DRAW') {
          setIsDraw(true);
        }
      }, 500); // tiempo reducido para UX fluida
    }
  }, [gameData, statusEvaluated, evaluatedGameId, lang]);





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

  useEffect(() => {
    if (gameData.gridMode) {
      const allFilled = gameData.cells.every(cell => cell.valid);
      if (allFilled) {
        setGridCompleted(true);
      }
    }
  }, [gameData.cells, gameData.gridMode]);




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
      <div className="game-grid-wrapper">
        {!gameData.gridMode && (
          <div className="turn-indicator-wrapper">
            <TurnIndicator
              currentTurn={gameData.currentTurn}
              onSwitch={onSwitchTurn}
              onDraw={handleDrawRequest}
            />
          </div>
        )}
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
            <h3 className="pilot-input-title">{t.selectPilot}</h3>
            <PilotAutocomplete onSelect={handlePilotSelect} />
            <div className="pilot-input-actions">
              <Button variant="outlined" color="error" onClick={() => setShowDialog(false)}>
                {t.cancel}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de empate solicitado */}
      <Dialog open={drawConfirm} onClose={() => setDrawConfirm(false)}>
        <DialogTitle className="dialog-title">🤝 {t.draw}</DialogTitle>
        <DialogActions>
          <Button onClick={() => confirmDraw('new')}>{t.newGame}</Button>
          <Button onClick={() => confirmDraw('home')}>{t.backHome}</Button>
        </DialogActions>
      </Dialog>

      {/* Modal de victoria */}
      <Dialog open={!!winner} onClose={() => setWinner(null)}>
        <DialogTitle className="dialog-title">{t.victory(winner)}</DialogTitle>
        <DialogActions>
          <Button onClick={() => navigate('/minigames')}>{t.backHome}</Button>
          <Button onClick={() => navigate('/minigames/tictactoe')}>{t.newGame}</Button>
        </DialogActions>
      </Dialog>

      {/* Modal de empate automático */}
      <Dialog open={isDraw} onClose={() => setIsDraw(false)}>
        <DialogTitle className="dialog-title">{t.autoDraw}</DialogTitle>
        <DialogActions>
          <Button onClick={() => navigate('/minigames')}>{t.backHome}</Button>
          <Button onClick={() => navigate('/minigames/tictactoe')}>{t.newGame}</Button>
        </DialogActions>
      </Dialog>

      {/* Modal al completar tablero */}
      <Dialog open={gridCompleted} onClose={() => setGridCompleted(false)}>
        <DialogTitle className="dialog-title">{t.gridComplete}</DialogTitle>
        <DialogActions>
          <Button onClick={() => navigate("/minigames")}>{t.backHome}</Button>
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
          {t.invalid}
        </Alert>
      </Snackbar>

    </div>
  );
};

export default GameBoard;