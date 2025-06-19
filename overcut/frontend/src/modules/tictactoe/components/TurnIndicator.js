import React from 'react';
import * as actions from '../actions';
import { useDispatch, useSelector } from "react-redux";
import { Button } from '@mui/material';
import { useParams } from "react-router-dom";
import * as selectors from '../selectors';

const TurnIndicator = ({ currentTurn, onSwitch, onDraw }) => {
  const { id } = useParams();
  const dispatch = useDispatch();

  const gameData = useSelector(selectors.getGame); // <== Accedemos al game actual

  if (gameData?.gridMode) return null;

  return (
    <div className="turn-indicator">
      <p>
        Turno actual: <strong>{currentTurn === 'X' ? 'Jugador X' : 'Jugador O'}</strong>
      </p>

      {gameData?.playerO === "BOT" && (
        <div className="bot-info">
          🤖 Estás jugando contra un bot inteligente
        </div>
      )}

      <Button
        variant="outlined"
        color="warning"
        onClick={() => dispatch(actions.skipTurn(id, () => {}, () => {}))}
      >
        Pasar turno
      </Button>

      <button onClick={onDraw}>Solicitar empate</button>
    </div>
  );
};

export default TurnIndicator;
