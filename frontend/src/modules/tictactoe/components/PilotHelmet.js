import React from 'react';
import './PilotHelmet.css';
import { sourceImages } from '../../../helpers/sourceImages';

const PilotHelmet = ({ name, player }) => {
    let helmetImg;
    try {
        helmetImg = sourceImages('./helmet_profile.png'); // Ruta relativa desde /assets/images
    } catch {
        helmetImg = null;
    }

    return (
        <div className={`helmet-container ${player === 'X' ? 'blue-bg' : 'white-bg'}`}>
            {helmetImg && <img src={helmetImg} alt="helmet" className="helmet-image" />}
            <div className="pilot-name">{name}</div>
        </div>
    );
};

export default PilotHelmet;
