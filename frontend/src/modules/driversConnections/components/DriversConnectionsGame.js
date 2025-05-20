import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import * as actions from "../actions";
import * as selectors from "../selectors";
import "./DriversConnectionsGame.css";

const categoryColors = [
  "#1e88e5", // Blue
  "#43a047", // Green
  "#fb8c00", // Orange
  "#8e24aa", // Purple
  "#d81b60", // Pink
  "#fdd835"  // Yellow
];

const DriversConnectionsGame = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const game = useSelector(selectors.getConnectionsGame);
  const isValidGroup = useSelector(selectors.getValidationResult);

  const [selectedDrivers, setSelectedDrivers] = useState([]);
  const [solvedGroups, setSolvedGroups] = useState([]);
  const [lastValidatedGroup, setLastValidatedGroup] = useState(null);

  useEffect(() => {
    dispatch(actions.startConnectionsGame());
  }, [dispatch]);

  const toggleDriver = (name) => {
    if (selectedDrivers.includes(name)) {
      setSelectedDrivers(prev => prev.filter(n => n !== name));
    } else {
      if (selectedDrivers.length < 4) {
        setSelectedDrivers(prev => [...prev, name]);
      }
    }
  };

  const handleValidate = () => {
    if (selectedDrivers.length === 4) {
      setLastValidatedGroup([...selectedDrivers]);
      dispatch(actions.validateGroup({
        gameId: game.id,
        selectedDriverNames: selectedDrivers
      }));
    }
  };

  const handleSurrender = () => {
    dispatch(actions.revealAnswers(game.id));
  };

  const handleGoHome = () => {
    navigate("/minigames");
  };

  useEffect(() => {
    if (lastValidatedGroup && selectedDrivers.length === 4) {
      if (isValidGroup === true) {
        const solved = game.categories.find(cat => {
          const pilotNames = cat.pilots.map(p => p.driverName);
          return lastValidatedGroup.every(d => pilotNames.includes(d));
        });
        if (solved && !solvedGroups.some(cat => cat.code === solved.code)) {
          setSolvedGroups(prev => [...prev, solved]);
        }
        setSelectedDrivers([]);
        setLastValidatedGroup(null);
      } else if (isValidGroup === false) {
        setTimeout(() => {
          setSelectedDrivers([]);
          setLastValidatedGroup(null);
        }, 1000);
      }
    }
  }, [isValidGroup, selectedDrivers, lastValidatedGroup, game, solvedGroups]);

  if (!game) return <div className="drivers-connections-container">Cargando juego...</div>;

  const allDrivers = game.categories
    .flatMap(c => c.pilots)
    .filter(d => !solvedGroups.some(cat => cat.pilots.some(p => p.driverName === d.driverName)));

  const getColorClass = (index) => `category-color-${index % categoryColors.length}`;

  const gameFinished = game.finished || solvedGroups.length === game.categories.length;

  return (
    <div className="drivers-connections-container">
      <h2 className="connections-title">🔗 Drivers Connections</h2>

     {!gameFinished && solvedGroups.length > 0 && (
       <div className="solved-grid">
         {solvedGroups.map((category, idx) => (
            <div key={idx} className={`solved-category ${getColorClass(idx)}`}>
              <h3 className="category-title" style={{ color: '#000', fontWeight: 'bold', letterSpacing: '0.5px' }}>{category.description}</h3>
              <div className="solved-row">
                {category.pilots.map((pilot, i) => (
                  <div key={i} className="solved-slot">
                    {pilot.driverName}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {!gameFinished && (
        <div className="grid-4x4">
          {allDrivers.map((driver) => (
            <div
              key={driver.id}
              className={`grid-cell ${selectedDrivers.includes(driver.driverName) ? 'selected' : ''}`}
              onClick={() => toggleDriver(driver.driverName)}
            >
              {driver.driverName}
            </div>
          ))}
        </div>
      )}

      {gameFinished && (
        <div className="solved-grid">
          {game.categories.map((category, idx) => (
            <div key={idx} className={`solved-category ${getColorClass(idx)}`}>
              <h3 className="category-title" style={{ color: '#000', fontWeight: 'bold', letterSpacing: '0.5px' }}>{category.description}</h3>
              <div className="solved-row">
                {category.pilots.map((pilot, i) => (
                  <div key={i} className="solved-slot">
                    {pilot.driverName}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="actions-row">
        {!gameFinished ? (
          <>
            <button className="validate-btn" onClick={handleValidate} disabled={selectedDrivers.length !== 4}>Validar Grupo</button>
            <button className="reveal-btn" onClick={handleSurrender}>Rendirse</button>
          </>
        ) : (
          <button className="validate-btn" onClick={handleGoHome}>🏁 Volver al inicio</button>
        )}
      </div>

      {isValidGroup === true && <div className="result-msg success">✅ ¡Grupo correcto!</div>}
      {isValidGroup === false && <div className="result-msg fail">❌ Grupo incorrecto</div>}
    </div>
  );
};

export default DriversConnectionsGame;