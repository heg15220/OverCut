// src/components/TeamLogo.js
import React, { useEffect, useState } from 'react';
import { sourceTictactoeImages } from '../../../helpers/sourceTictactoeImages'; // Ajusta el path si es necesario
import './TeamGuessGame.css';

const TeamLogo = ({ teamName }) => {
  const [src, setSrc] = useState(null);

  useEffect(() => {
    const normalized = teamName.replace(/ /g, "_");
    const extensions = ['.png', '.svg', '.jpg'];

    for (const ext of extensions) {
      const path = `./${normalized}${ext}`;
      if (sourceTictactoeImages.keys().includes(path)) {
        setSrc(sourceTictactoeImages(path));
        return;
      }
    }

    // setSrc(defaultLogo); // O deja como null si prefieres no mostrar nada por defecto
  }, [teamName]);

  if (!src) return null;

  return <img src={src} alt={teamName} className="team-logo" />;
};

export default TeamLogo;
