import React from 'react';
import './CriteriaBox.css';
import { sourceImages } from '../../../helpers/sourceImages';

const CriteriaBox = ({ criteria }) => {

  const getImageSrc = () => {
    // Si es era → Imagen local estática desde assets
    if (criteria.code.startsWith('era_')) {
      try {
        return sourceImages(`./era_f1.png`);
      } catch (error) {
        return null;
      }
    }

    // Imagen local para min_wins
    if (criteria.code.startsWith('min_') && criteria.code.includes('_wins')) {
      try {
        return sourceImages(`./trophy_1.png`);
      } catch (error) {
        return null;
      }
    }

    // Imagen local para min_podiums
    if (criteria.code.startsWith('min_') && criteria.code.includes('_podiums')) {
      try {
        return sourceImages(`./podium_plain.png`);
      } catch (error) {
        return null;
      }
    }

    // Si viene una URL externa
    if (criteria.imageUrl) {
      return criteria.imageUrl;
    }

    return null;
  };

  return (
    <div className="criteria-box">
      {getImageSrc() && (
        <img
          src={getImageSrc()}
          alt={criteria.description}
          className="criteria-logo"
          onError={(e) => { e.target.style.display = 'none' }}
        />
      )}
      <div className="criteria-description">
        {criteria.description}
      </div>
    </div>
  );
};

export default CriteriaBox;
