import { useEffect, useState } from "react";
import "./CooldownScreen.css"; // ⬅️ Para estilos opcionales

const CooldownScreen = ({ seconds, onBack, gameName }) => {
  const [timeLeft, setTimeLeft] = useState(seconds);

  const lang = navigator.language.startsWith("es") ? "es" : "en";

  const translations = {
    es: {
      title: (game) => `⏳ ¡Espera un poco antes de volver a jugar${game ? ` a ${game}` : ""}!`,
      description: "Este es un minijuego diario: solo puedes jugarlo una vez cada 12 horas. Podrás volver a intentarlo cuando termine la cuenta atrás. ¡Estate atento a cuando termina!",
      back: "Volver al inicio"
    },
    en: {
      title: (game) => `⏳ Hold on before playing${game ? ` ${game}` : ""} again!`,
      description: "This is a daily minigame: you can only play once every 12 hours. You'll be able to try again when the countdown ends. Keep an eye on when it finishes!",
      back: "Back to home"
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (secs) => {
    const hours = Math.floor(secs / 3600);
    const minutes = Math.floor((secs % 3600) / 60);
    const seconds = secs % 60;
    return `${hours > 0 ? hours + "h " : ""}${minutes}m ${seconds < 10 ? "0" : ""}${seconds}s`;
  };

  return (
    <div className="cooldown-container">
      <h2>{translations[lang].title(gameName)}</h2>
      <p>{translations[lang].description}</p>
      <div className="cooldown-timer">
        {formatTime(timeLeft)}
      </div>
      <button className="cooldown-back-button" onClick={onBack}>
        {translations[lang].back}
      </button>
    </div>
  );
};

export default CooldownScreen;
