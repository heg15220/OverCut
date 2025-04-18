import React from 'react';
import './CriteriaBox.css';
import { sourceImages } from '../../../helpers/sourceImages';
import { sourceTictactoeImages } from '../../../helpers/sourceTictactoeImages';


const CriteriaBox = ({ criteria }) => {

  const getImageSrc = () => {
    // Era
    if (criteria.code.startsWith('era_')) {
      try {
        return sourceImages(`./era_f1.png`);
      } catch (error) {
        return null;
      }
    }

    // Min wins
    if (criteria.code.startsWith('min_') && criteria.code.includes('_wins')) {
      try {
        return sourceImages(`./trophy_1.png`);
      } catch (error) {
        return null;
      }
    }

    // Min podiums
    if (criteria.code.startsWith('min_') && criteria.code.includes('_podiums')) {
      try {
        return sourceImages(`./podium_plain.png`);
      } catch (error) {
        return null;
      }
    }

    // Modo 2000+ → imagen local en tictactoe
    if (criteria.imageUrl && criteria.imageUrl.startsWith('/assets/images/tictactoe/')) {
      try {
        const fileName = criteria.imageUrl.split('/tictactoe/')[1];
        return sourceTictactoeImages(`./${fileName}`);
      } catch (error) {
        return null;
      }
    }

    // URL externa (ej: banderas)
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
