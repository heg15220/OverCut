import React, { useEffect, useState } from 'react';
import './AdPlaceholder.css';

const AdFloatingBottom = ({ targetClass = ".career-path-overlay" }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let retryCount = 0;

    const checkVisibility = () => {
      const footer = document.querySelector("footer");
      const target = document.querySelector(targetClass);

      if (!footer || !target) {
        if (retryCount < 5) {
          retryCount++;
          setTimeout(checkVisibility, 300); // reintenta tras 300ms
        } else {
          setIsVisible(true); // muestra por defecto si no encuentra nada
        }
        return;
      }

      const footerRect = footer.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      const hasEnoughSpace = footerRect.top - targetRect.bottom > 120;

      setIsVisible(hasEnoughSpace);
    };

    checkVisibility();
    window.addEventListener("resize", checkVisibility);
    window.addEventListener("scroll", checkVisibility);

    return () => {
      window.removeEventListener("resize", checkVisibility);
      window.removeEventListener("scroll", checkVisibility);
    };
  }, [targetClass]);

  return (
    <div className={`ad-floating-bottom ${isVisible ? 'visible' : ''}`}>
      <p>[Publicidad inferior flotante]</p>
    </div>
  );
};

export default AdFloatingBottom;
