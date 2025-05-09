import React, { useEffect, useState } from "react";
import { getFlagCode } from "./getCountryCode";
import { getHueFromName } from "./colorFromName";

const GridSlot = ({ position, nationalityCode, filledPilot }) => {
  const [isAnimated, setIsAnimated] = useState(false);

  useEffect(() => {
    if (filledPilot) {
      setIsAnimated(true);
      const timer = setTimeout(() => setIsAnimated(false), 700); // limpiar clase tras animación
      return () => clearTimeout(timer);
    }
  }, [filledPilot]);

  const nationalityColors = {
    Spanish: "#c60b1e",
    Italian: "#007b3a",
    French: "#0055a4",
    German: "#000000",
    British: "#00247d",
    Brazilian: "#009739",
    Argentine: "#74acdf",
    American: "#3c3b6e",
    Dutch: "#21468b",
    Finnish: "#003580",
    Australian: "#012169",
    Canadian: "#d80621",
    Japanese: "#bc002d",
    Swedish: "#005eb8",
    Mexican: "#006847",
    Belgian: "#fdc300",
    default: "#1e2f3f"
  };


  const cleanCode = (nationalityCode || "").trim();
  const backgroundColor = filledPilot
    ? nationalityColors[cleanCode] || nationalityColors.default
    : "transparent";


  return (
    <div
      className={`grid-slot ${isAnimated ? "animated-flip" : ""}`}
      style={{ backgroundColor, transition: "background-color 0.6s ease" }}
    >
      <div className="grid-slot-position">{position}.</div>
      <img
        className="grid-slot-flag"
        src={`https://flagcdn.com/w40/${getFlagCode(nationalityCode)}.png`}
        alt={nationalityCode}
      />
      {filledPilot && <div className="grid-slot-name">{filledPilot}</div>}
    </div>
  );
};

export default GridSlot;
