import React, { useEffect, useState } from 'react';
import { sourceTictactoeImages } from '../../../helpers/sourceTictactoeImages';

const TeamLogo = ({ teamName }) => {
  const [src, setSrc] = useState(null);

  useEffect(() => {
    const normalized = teamName.replace(/ /g, "_").replace(/\W/g, '');
    const extensions = ['.png', '.svg', '.jpg'];

    for (const ext of extensions) {
      const path = `./${normalized}${ext}`;
      if (sourceTictactoeImages.keys().includes(path)) {
        setSrc(sourceTictactoeImages(path));
        return;
      }
    }

    setSrc(null); // imagen por defecto si no se encuentra
  }, [teamName]);

  if (!src) return null;

  return (
    <img
      src={src}
      alt={teamName}
      className="team-logo"
      style={{ width: 48, height: 48, objectFit: 'contain', borderRadius: 8 }}
    />
  );
};

export default TeamLogo;
