import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import * as actions from "../actions";
import * as selectors from "../selectors";
import { useMemo } from "react";
import "./DriversConnectionsGame.css";
import LoadingScreen from '../../common/components/LoadingScreen';
import AdPlaceholder from '../../common/components/AdPlaceholder';
import AdFloatingBottom from '../../common/components/AdFloatingBottom';

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
  const [partialMatchCount, setPartialMatchCount] = useState(null);
  const [retainSelection, setRetainSelection] = useState(false);

  const translations = {
    es: {
      title: "Drivers Connection",
      loading: "Cargando juego...",
      validate: "Validar Grupo",
      surrender: "Rendirse",
      backToHome: "🏁 Volver al inicio",
      correctGroup: "✅ ¡Grupo correcto!",
      incorrectGroup: "❌ Grupo incorrecto",
      correctMatches: "Coincidencias correctas"
    },
    en: {
      title: "Drivers Connection",
      loading: "Loading game...",
      validate: "Validate Group",
      surrender: "Give Up",
      backToHome: "🏁 Back to home",
      correctGroup: "✅ Correct group!",
      incorrectGroup: "❌ Incorrect group",
      correctMatches: "Correct matches"
    }
  };

  const lang = navigator.language.startsWith("es") ? "es" : "en";
  const t = translations[lang];


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
        setPartialMatchCount(null);
        setRetainSelection(false);
      } else if (isValidGroup === false) {
        const bestMatch = game.categories.reduce((max, cat) => {
          const pilotNames = cat.pilots.map(p => p.driverName);
          const matches = lastValidatedGroup.filter(d => pilotNames.includes(d)).length;
          return Math.max(max, matches);
        }, 0);
        setPartialMatchCount(bestMatch);
        setRetainSelection(true);
      }
    }
  }, [isValidGroup, selectedDrivers, lastValidatedGroup, game, solvedGroups]);

  useEffect(() => {
    if (retainSelection && isValidGroup === false) {
      const timeout = setTimeout(() => {
        setRetainSelection(false);
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [retainSelection, isValidGroup]);

  const allDrivers = useMemo(() => {
    if (!game) return [];

    return game.categories
      .flatMap(c => c.pilots)
      .filter(d => !solvedGroups.some(cat => cat.pilots.some(p => p.driverName === d.driverName)))
      .sort(() => Math.random() - 0.5);
  }, [game, solvedGroups]);

  if (!game) return <LoadingScreen lang={lang} text={t.loading} />;




  const getColorClass = (index) => `category-color-${index % categoryColors.length}`;

  const gameFinished = game.finished || solvedGroups.length === game.categories.length;

  return (
    <div className="drivers-connections-container">
        <AdPlaceholder position="left" />
        <AdPlaceholder position="right" />
        <AdFloatingBottom />
      <h2 className="connections-title">🏎️ {t.title} 🏎️</h2>

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
            <button className="validate-btn" onClick={handleValidate} disabled={selectedDrivers.length !== 4}>
              {t.validate}
            </button>
            <button className="reveal-btn" onClick={handleSurrender}>{t.surrender}</button>

          </>
        ) : (
          <button className="validate-btn" onClick={handleGoHome}>{t.backToHome}</button>
        )}
      </div>

      {isValidGroup === true && <div className="result-msg success">{t.correctGroup}</div>}

      {isValidGroup === false && (
        <div className="result-msg fail">
          {t.incorrectGroup}
          {partialMatchCount > 0 && (
            <div style={{ fontSize: "1rem", marginTop: "0.3rem" }}>
              {t.correctMatches}: {partialMatchCount} / 4
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DriversConnectionsGame;