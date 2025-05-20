import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import * as actions from "../actions";
import * as selectors from "../selectors";
import "./DriversConnectionsGame.css";

const DriversConnectionsGame = () => {
  const dispatch = useDispatch();
  const game = useSelector(selectors.getConnectionsGame);
  const isValidGroup = useSelector(selectors.getValidationResult);

  const [selectedDrivers, setSelectedDrivers] = useState([]);
  const [solvedGroups, setSolvedGroups] = useState([]);

  useEffect(() => {
    dispatch(actions.startConnectionsGame());
  }, [dispatch]);

  const toggleDriver = (name) => {
    setSelectedDrivers(prev =>
      prev.includes(name)
        ? prev.filter(n => n !== name)
        : prev.length < 4
          ? [...prev, name]
          : prev
    );
  };

  const handleValidate = () => {
    if (selectedDrivers.length === 4) {
      dispatch(actions.validateGroup({
        gameId: game.id,
        selectedDriverNames: selectedDrivers
      }));
    }
  };

  const handleSurrender = () => {
    dispatch(actions.revealAnswers(game.id));
  };

  useEffect(() => {
    if (isValidGroup === true && selectedDrivers.length === 4) {
      const solved = game.categories.find(cat => {
        const pilotNames = cat.pilots.map(p => p.driverName);
        return selectedDrivers.every(d => pilotNames.includes(d));
      });
      if (solved && !solvedGroups.some(cat => cat.code === solved.code)) {
        setSolvedGroups([...solvedGroups, solved]);
      }
      setSelectedDrivers([]);
    }
    if (isValidGroup === false) {
      setSelectedDrivers([]);
    }
  }, [isValidGroup, selectedDrivers, game, solvedGroups]);

  if (!game) return <div className="drivers-connections-container">Cargando juego...</div>;

  const allDrivers = game.categories
    .flatMap(c => c.pilots)
    .filter(d => !solvedGroups.some(cat => cat.pilots.some(p => p.driverName === d.driverName)));

  return (
    <div className="drivers-connections-container">
      <h2 className="connections-title">🔗 Drivers Connections</h2>

      {solvedGroups.length > 0 && (
        <div className="solved-grid">
          {solvedGroups.map((category, idx) => (
            <div key={idx} className="solved-category">
              <h3 className="category-title">{category.description}</h3>
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

      {!game.finished && (
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

      {game.finished && (
        <div className="solved-grid">
          {game.categories.map((category, idx) => (
            <div key={idx} className="solved-category">
              <h3 className="category-title">{category.description}</h3>
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
        <button className="validate-btn" onClick={handleValidate} disabled={selectedDrivers.length !== 4}>Validar Grupo</button>
        <button className="reveal-btn" onClick={handleSurrender}>Rendirse</button>
      </div>

      {isValidGroup === true && <div className="result-msg success">✅ ¡Grupo correcto!</div>}
      {isValidGroup === false && <div className="result-msg fail">❌ Grupo incorrecto</div>}
    </div>
  );
};

export default DriversConnectionsGame;
