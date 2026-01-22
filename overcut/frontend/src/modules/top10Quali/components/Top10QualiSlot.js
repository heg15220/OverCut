import React, { useEffect, useState } from "react";
import { getFlagCode } from "./getCountryCode";
import "./Top10QualiGame.css";

const Top10QualiSlot = ({ position, nationalityCode, filledPilot, qualiTime }) => {
  const [isAnimated, setIsAnimated] = useState(false);

  useEffect(() => {
    if (filledPilot) {
      setIsAnimated(true);
      const timer = setTimeout(() => setIsAnimated(false), 700);
      return () => clearTimeout(timer);
    }
  }, [filledPilot]);

  const slotClasses = [
    "top10-slot",
    filledPilot ? "filled" : "empty",
    isAnimated ? "animate__animated" : ""
  ].join(" ");

  return (
    <div className={slotClasses}>
      <div className="top10-slot-position">{position}.</div>

      {nationalityCode && (
        <img
          className="top10-slot-flag"
          src={`https://flagcdn.com/w40/${getFlagCode(nationalityCode)}.png`}
          alt={nationalityCode}
        />
      )}

      {/* ✅ Nombre a la izquierda del tiempo */}
      {filledPilot && (
        <div className="top10-slot-name filled">{filledPilot}</div>
      )}

      {/* ✅ Tiempo siempre al final (por margin-left:auto en CSS) */}
      <div className="top10-slot-time">{qualiTime}</div>
    </div>
  );
};

export default Top10QualiSlot;
