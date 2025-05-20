import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import * as actions from "../actions";
import * as selectors from "../selectors";
import "./OrderDriverGame.css";

const OrderDriverGame = () => {
  const dispatch = useDispatch();
  const game = useSelector(selectors.getOrderGame);
  const [allCandidates, setAllCandidates] = useState([]);
  const [ranking, setRanking] = useState(Array(10).fill(null));
  const [selected, setSelected] = useState(null);
  const [surrendered, setSurrendered] = useState(false);

  useEffect(() => {
    dispatch(actions.startOrderGame());
  }, [dispatch]);

  useEffect(() => {
    if (game) {
      setAllCandidates(game.slots);
    }
  }, [game]);

  const usedDriverIds = ranking.filter(Boolean).map(driver => driver.driverId);
  const availableCandidates = allCandidates.filter(driver => !usedDriverIds.includes(driver.driverId));

  const handleCandidateClick = (driver) => {
    setSelected(driver);
  };

  const handleSlotClick = (index) => {
    if (!selected) return;
    const alreadyUsed = ranking.find(slot => slot?.driverId === selected.driverId);
    if (alreadyUsed) return;
    const newRanking = [...ranking];
    newRanking[index] = selected;
    setRanking(newRanking);
    setSelected(null);
  };

  const onSubmit = () => {
    const orderedIds = ranking.map(s => s?.driverId || null);
    if (orderedIds.includes(null)) return alert("Completa todos los slots antes de validar.");
    dispatch(actions.submitDriverOrder(game.id, orderedIds));
  };

  const onSurrender = () => {
    const ordered = [...game.slots].sort((a, b) => a.correctOrder - b.correctOrder);
    setRanking(ordered);
    setSurrendered(true);
  };

const getCorrectDriverIdAt = (index) => {
  const correctSlot = game.slots.find(slot => slot.correctOrder === index);
  return correctSlot?.driverId;
};


  if (!game) return <div className="order-driver-container">Cargando...</div>;

  return (
  <div className="order-driver-page">
    <div className={`order-driver-container ${surrendered ? "surrendered-mode" : ""}`}>
      <h2 className="order-driver-title">{game.topic}</h2>

      <div className={`order-layout ${surrendered ? "centered" : ""}`}>
        {!surrendered && (
          <div className="side-candidates">
            {availableCandidates.map((driver) => (
              <div
                key={driver.driverId}
                className={`driver-card ${selected?.driverId === driver.driverId ? "selected" : ""}`}
                onClick={() => handleCandidateClick(driver)}
              >
                {driver.driverName}
              </div>
            ))}
          </div>
        )}

        <div className="ranking-slots">
          {ranking.map((slot, index) => (
            <div
              key={index}
              className={`ranking-slot ${
                (surrendered || game.finished)
                  ? slot?.driverId === getCorrectDriverIdAt(index)
                    ? 'success'
                    : 'fail'
                  : ''
              }`}
              onClick={() => handleSlotClick(index)}
            >

              <span className="position-number">{index + 1}</span>
              {slot ? <div className="driver-name">{slot.driverName}</div> : <div className="placeholder">Vacío</div>}
            </div>
          ))}
        </div>

        {!surrendered && <div className="side-candidates" />}
      </div>

      {!game.finished && !surrendered && (
        <>
          <div className="button-row">
            <button className="validate-btn" onClick={onSubmit}>Validar Orden</button>
            <button className="surrender-btn" onClick={onSurrender}>Rendirse</button>
          </div>

        </>
      )}

      {game.finished && (
        <div className={`order-result ${game.successful ? "success" : "fail"}`}>
          {game.successful ? "¡Correcto!" : "❌ Orden incorrecto"}
        </div>
      )}

      {surrendered && !game.finished && (
        <div className="order-result fail">Mostrando el ranking correcto tras rendirse.</div>
      )}
    </div>

    </div>
  );
};

export default OrderDriverGame;