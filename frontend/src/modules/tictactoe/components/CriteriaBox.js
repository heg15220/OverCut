import React from 'react';
import './CriteriaBox.css';

const CriteriaBox = ({ criteria }) => {
  return (
    <div className="criteria-box">
      {criteria.imageUrl && (
        <img
          src={criteria.imageUrl}
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
