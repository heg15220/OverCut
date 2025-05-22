// ButtonAddEvent.js
import React from 'react';

const ButtonAddEvent = ({ onClick }) => {
    return (
        <button onClick={onClick} style={{ marginLeft: '10px' }}>Agregar Evento</button>
    );
};

export default ButtonAddEvent;
