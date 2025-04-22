import React from 'react';
import './PilotHelmet.css';
import { sourceTictactoeImages } from '../../../helpers/sourceTictactoeImages';

const PilotHelmet = ({ name, player }) => {
  const helmetSrc = player === 'X'
    ? sourceTictactoeImages('./helmet_blue.png')
    : sourceTictactoeImages('./helmet_white.png');

  return (
    <div className={`pilot-helmet ${player === 'X' ? 'helmet-x' : 'helmet-o'}`}>
      <img src={helmetSrc} alt="Helmet" className="helmet-image" />
      <div className="pilot-name">{name}</div>
    </div>
  );
};

export default PilotHelmet;
