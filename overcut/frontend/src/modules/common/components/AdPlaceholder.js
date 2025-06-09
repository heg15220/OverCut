import React from 'react';
import './AdPlaceholder.css';

const AdPlaceholder = ({ position = "bottom" }) => {
  return (
    <div className={`ad-placeholder ad-${position}`}>
      <p>[Publicidad {position}]</p>
    </div>
  );
};

export default AdPlaceholder;
