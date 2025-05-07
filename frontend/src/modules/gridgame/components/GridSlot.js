import React, { useState } from "react";
import AutoSuggestInput from "./AutoSuggestInput";
import { useDispatch, useSelector } from "react-redux";
import { validateGridSlot } from "../actions";
import { getGameId } from "../selectors";
import { motion } from "framer-motion";
import { getHueFromName } from "./colorFromName";
import { getFlagCode } from "./getCountryCode"; // ajusta path según estructura


const GridSlot = ({ position, nationalityCode, filledPilot }) => {
    const [open, setOpen] = useState(false);
    const dispatch = useDispatch();
    const gameId = useSelector(getGameId);

    const onPilotSelected = (pilotName) => {
        dispatch(validateGridSlot(gameId, position, pilotName, () => setOpen(false)));
    };

    const carHue = filledPilot ? getHueFromName(filledPilot) : 0;

    return (
        <div className="grid-slot">
            <div className="grid-slot-position">{position}</div>
            <img
              className="grid-slot-flag"
              src={`https://flagcdn.com/24x18/${getFlagCode(nationalityCode)}.png`}
              alt={nationalityCode}
            />


            {filledPilot ? (
                <motion.div
                    className="grid-slot-car"
                    initial={{ opacity: 0, scale: 0.6, y: -20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                >
                    <img
                        src="/assets/images/f1car-colored.png"
                        alt="F1 Car"
                        className="car-image colorized"
                        style={{ filter: `hue-rotate(${carHue}deg)` }}
                    />
                    <motion.div
                        className="grid-slot-name"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                    >
                        {filledPilot}
                    </motion.div>
                </motion.div>
            ) : (
                <>
                    <button className="grid-slot-button" onClick={() => setOpen(true)}>Elegir piloto</button>
                    {open && (
                        <AutoSuggestInput onSelect={onPilotSelected} />
                    )}
                </>
            )}
        </div>
    );
};

export default GridSlot;
