import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import * as actions from "../actions";
import * as selectors from "../selectors";
import "./OrderDriverGame.css";

const OrderDriverGame = () => {
  const dispatch = useDispatch();
  const game = useSelector(selectors.getOrderGame);
  const [allCandidates, setAllCandidates] = useState([]);
  const [ranking, setRanking] = useState([]);
  const [selected, setSelected] = useState(null);
  const navigate = useNavigate();
  const [surrendered, setSurrendered] = useState(false);

  const translations = {
    es: {
      loading: "Cargando...",
      empty: "Vacío",
      validate: "Validar Orden",
      surrender: "Rendirse",
      correct: "¡Correcto!",
      wrong: "❌ Orden incorrecto",
      reveal: "Mostrando el ranking correcto tras rendirse.",
      incomplete: "Completa todos los slots antes de validar.",
      back: "Volver al inicio"
    },
    en: {
      loading: "Loading...",
      empty: "Empty",
      validate: "Validate Order",
      surrender: "Give Up",
      correct: "Correct!",
      wrong: "❌ Incorrect order",
      reveal: "Showing correct ranking after surrender.",
      incomplete: "Please fill all slots before submitting.",
      back: "Back to home"
    }
  };

  const t = (key) => {
    const lang = navigator.language.startsWith("es") ? "es" : "en";
    return translations[lang][key] || key;
  };

  useEffect(() => {
    dispatch(actions.startOrderGame());
  }, [dispatch]);

  useEffect(() => {
    if (game) {
      // Barajar los candidatos aleatoriamente
      const shuffled = [...game.slots].sort(() => Math.random() - 0.5);
      setAllCandidates(shuffled);
      // Crear ranking del mismo tamaño que los candidatos
      setRanking(Array(game.slots.length).fill(null));
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
    if (orderedIds.includes(null)) {
      return alert(t("incomplete"));
    }
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

  if (!game) return <div className="order-driver-container">{t("loading")}</div>;

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
                {slot ? (
                  <div className="driver-name">{slot.driverName}</div>
                ) : (
                  <div className="placeholder">{t("empty")}</div>
                )}

              </div>
            ))}
          </div>

          {!surrendered && <div className="side-candidates" />}
        </div>

        {!game.finished && !surrendered && (
          <div className="button-row">
            <button className="validate-btn" onClick={onSubmit}>{t("validate")}</button>
            <button className="surrender-btn" onClick={onSurrender}>{t("surrender")}</button>
          </div>
        )}

        {game.finished && (
          <div className={`order-result ${game.successful ? "success" : "fail"}`}>
            {game.successful ? t("correct") : t("wrong")}
          </div>
        )}

        {surrendered && !game.finished && (
          <div className="order-result fail">{t("reveal")}</div>
        )}

        {(game.finished || surrendered) && (
          <div className="button-row">
            <button className="back-btn" onClick={() => navigate("/minigames")}>
              {t("back")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderDriverGame;
