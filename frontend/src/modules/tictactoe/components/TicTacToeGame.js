import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import * as actions from '../actions';
import * as selectors from '../selectors';
import GameBoard from './GameBoard';
import './TicTacToeGame.css';

const TicTacToeGame = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const game = useSelector(selectors.getGame);

  useEffect(() => {
    dispatch(actions.getGame(id, () => {}, () => alert('Error cargando partida')));
  }, [dispatch, id]);

  const handleSwitchTurn = () => {
    // Implementación futura si el turno se modifica manualmente
  };

  const handleDrawRequest = (mode) => {
    if (mode === 'home') {
      window.location.href = "/minigames";
    } else {
      window.location.reload();
    }
  };

  if (!game) return <p>Cargando...</p>;

  return (
    <GameBoard
      gameData={game}
      onSwitchTurn={handleSwitchTurn}
      onDrawRequest={handleDrawRequest}
    />
  );
};

export default TicTacToeGame;
