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

    const isEmpty = !filledPilot;
    const cleanCode = (nationalityCode || "").trim().toLowerCase();

    const nationalityColors = {
      british: "#001f5b",
      german: "#000000",
      italian: "#007b3a",
      french: "#0055a4",
      spanish: "#c60b1e",
      dutch: "#21468b",
      finnish: "#ffffff",
      brazilian: "#009739",
      argentine: "#74acdf",
      mexican: "#006847",
      canadian: "#d80621",
      austrian: "#ed2939",
      australian: "#012169",
      swiss: "#d52b1e",
      belgian: "#fdc300",
      swedish: "#005eb8",
      portuguese: "#006600",
      chilean: "#0033a0",
      american: "#3c3b6e",
      "new zealander": "#00247d",
      irish: "#169b62",
      "south african": "#007847",
      japanese: "#bc002d",
      russian: "#d52b1e",
      polish: "#dc143c",
      venezuelan: "#f4c300",
      colombian: "#ffe000",
      czech: "#11457e",
      hungarian: "#436f4d",
      monegasque: "#e60026",
      monacan: "#e60026", // alias of monegasque
      thai: "#2e2a87",
      chinese: "#de2910",
      indian: "#ff9933",
      malaysian: "#010066",
      indonesian: "#ff0000",
      dane: "#c60c30",
      danish: "#c60c30", // alias of dane
      estonian: "#0072ce",
      latvian: "#9e3039",
      uruguayan: "#0038a8",

      // fallback
      default: "#1e2f3f"
    };


    const backgroundColor = !isEmpty
      ? nationalityColors[cleanCode] || nationalityColors.default
      : undefined;


  return (
    <div
      className={`grid-slot ${isAnimated ? "animated-flip" : ""} ${isEmpty ? "empty" : ""}`}
      style={!isEmpty ? { backgroundColor } : {}}
    >
      <div className="slot-left">
        <div className="grid-slot-position">{position}.</div>
        <img
          className="grid-slot-flag"
          src={`https://flagcdn.com/w40/${getFlagCode(nationalityCode)}.png`}
          alt={nationalityCode}
        />
      </div>
      <div className="slot-right">
        <div className={`grid-slot-name ${filledPilot ? "filled" : ""}`}>
          {filledPilot || ""}
        </div>
      </div>
    </div>
  );

};

export default GridSlot;
