import React from 'react';
import * as actions from '../actions';
import { useDispatch, useSelector } from "react-redux";
import { Button } from '@mui/material';
import { useParams } from "react-router-dom";
import * as selectors from '../selectors';

const translations = {
  es: {
    currentTurn: "Turno actual",
    playerX: "Jugador X",
    playerO: "Jugador O",
    botInfo: "🤖 Estás jugando contra un bot inteligente",
    skipTurn: "Pasar turno",
    requestDraw: "Solicitar empate"
  },
  en: {
    currentTurn: "Current turn",
    playerX: "Player X",
    playerO: "Player O",
    botInfo: "🤖 You're playing against a smart bot",
    skipTurn: "Skip turn",
    requestDraw: "Request draw"
  }
};

const TurnIndicator = ({ currentTurn, onSwitch, onDraw }) => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const gameData = useSelector(selectors.getGame);

  if (gameData?.gridMode) return null;

  const lang = navigator.language.startsWith("es") ? "es" : "en";
  const t = translations[lang];

  return (
    <div className="turn-indicator">
      <p>
        {t.currentTurn}: <strong>{currentTurn === 'X' ? t.playerX : t.playerO}</strong>
      </p>

      {gameData?.playerO === "BOT" && (
        <div className="bot-info">
          {t.botInfo}
        </div>
      )}

      <Button
        variant="outlined"
        color="warning"
        onClick={() => dispatch(actions.skipTurn(id, () => {}, () => {}))}
      >
        {t.skipTurn}
      </Button>

      <button onClick={onDraw}>{t.requestDraw}</button>
    </div>
  );
};

export default TurnIndicator;
