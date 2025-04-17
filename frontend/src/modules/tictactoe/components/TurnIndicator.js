import React from 'react';

const TurnIndicator = ({ currentTurn, onSwitch, onDraw }) => {
    return (
        <div className="turn-indicator">
            <p>Turno actual: <strong>{currentTurn === 'X' ? 'Jugador X' : 'Jugador O'}</strong></p>
            <button onClick={onSwitch}>Cambiar turno</button>
            <button onClick={onDraw}>Solicitar empate</button>
        </div>
    );
};

export default TurnIndicator;
