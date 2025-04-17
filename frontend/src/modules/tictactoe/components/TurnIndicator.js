import React from 'react';
import * as actions from '../actions';
import { useDispatch, useSelector } from "react-redux";
import {Button} from '@mui/material';
import { useParams } from "react-router-dom";

const TurnIndicator = ({ currentTurn, onSwitch, onDraw }) => {
  const { id } = useParams();
  const dispatch = useDispatch();
    return (
        <div className="turn-indicator">
            <p>Turno actual: <strong>{currentTurn === 'X' ? 'Jugador X' : 'Jugador O'}</strong></p>
            <Button variant="outlined" color="warning" onClick={() =>
              dispatch(actions.skipTurn(id, () => {}, () => {}))
            }>
              Pasar turno
            </Button>

            <button onClick={onDraw}>Solicitar empate</button>
        </div>
    );
};

export default TurnIndicator;
