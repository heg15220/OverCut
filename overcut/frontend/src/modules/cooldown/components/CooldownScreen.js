import { useEffect, useState } from "react";
import "./CooldownScreen.css"; // ⬅️ Para estilos opcionales

const CooldownScreen = ({ seconds, onBack, gameName }) => {
  const [timeLeft, setTimeLeft] = useState(seconds);


  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = secs => {
    const hours = Math.floor(secs / 3600);
    const minutes = Math.floor((secs % 3600) / 60);
    const seconds = secs % 60;
    return `${hours > 0 ? hours + "h " : ""}${minutes}m ${seconds < 10 ? "0" : ""}${seconds}s`;
  };

  return (
    <div className="cooldown-container">
      <h2>⏳ Aún no puedes jugar {gameName ? `a ${gameName}` : "este juego"}</h2>
      <p>Debes esperar <strong>{formatTime(timeLeft)}</strong> para volver a intentarlo.</p>
      <button className="cooldown-back-button" onClick={onBack}>
        Volver al menú
      </button>
    </div>
  );
};

export default CooldownScreen;
