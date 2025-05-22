import React, { useEffect, useState } from 'react';
import { sourceTictactoeImages } from '../../../helpers/sourceTictactoeImages';
import './CareerPathGame.css';

const TeamLogo = ({ teamName }) => {
  const [src, setSrc] = useState(null);

  useEffect(() => {
    const normalized = teamName.replace(/ /g, "_");
    const extensions = ['.png', '.svg', '.jpg'];
    let found = false;

    for (const ext of extensions) {
      const path = `./${normalized}${ext}`;
      if (sourceTictactoeImages.keys().includes(path)) {
        const image = sourceTictactoeImages(path);
        setSrc(image);
        found = true;
        break;
      }
    }

    if (!found) {
      setSrc(null); // o setSrc(defaultImage) si tienes una por defecto
    }
  }, [teamName]);

  if (!src) return null;

  return <img src={src} alt={teamName} className="team-logo" />;
};

export default TeamLogo;
