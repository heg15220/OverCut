// ============================
// OrderDriverGame.jsx (UPDATED)
// ============================
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import * as actions from "../actions";
import * as selectors from "../selectors";
import "./OrderDriverGame.css";
import LoadingScreen from "../../common/components/LoadingScreen";
import MinigameTutorial from "../../common/components/MinigameTutorial";
import { sourceImages } from "../../../helpers/sourceMiniGamesImages";
import { tutorialTexts } from "../../../helpers/minigameTutorialTexts";
import CooldownScreen from "../../cooldown/components/CooldownScreen";
import { getCooldownForGame } from "../../cooldown/selectors";
import { fetchCooldown } from "../../cooldown/actions";
import { getUser } from "../../users/selectors";

import AdWindows, { AdInline } from "../../../ads/AdWindows";

const OrderDriverGame = () => {
  const dispatch = useDispatch();
  const game = useSelector(selectors.getOrderGame);

  const [allCandidates, setAllCandidates] = useState([]);
  const [ranking, setRanking] = useState([]);
  const [selected, setSelected] = useState(null);

  const navigate = useNavigate();

  const [surrendered, setSurrendered] = useState(false);
  const [correctSlots, setCorrectSlots] = useState([]);
  const [finished, setFinished] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [draggedIndex, setDraggedIndex] = useState(null);

  const [showTutorial, setShowTutorial] = useState(true);
  const lang = navigator.language.startsWith("es") ? "es" : "en";

  const tutorial = tutorialTexts["/minigames/orderDrivers"][lang];

  const { canPlay, secondsRemaining, loading } = useSelector((state) =>
    getCooldownForGame(state, "OrderDriver")
  );

  // (No lo usa ahora mismo, pero lo mantenemos por consistencia y por si luego registras por user)
  const user = useSelector(getUser);

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
      back: "Volver al inicio",
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
      back: "Back to home",
    },
  };

  const t = (key) => translations[lang][key] || key;

  useEffect(() => {
    dispatch(fetchCooldown("OrderDriver"));
  }, [dispatch]);

  useEffect(() => {
    if (canPlay) {
      dispatch(actions.startOrderGame());
      // ✅ reset UI states
      setSurrendered(false);
      setFinished(false);
      setErrorMessage("");
      setSelected(null);
      setDraggedIndex(null);
    }
  }, [canPlay, dispatch]);

  useEffect(() => {
    if (game) {
      const shuffled = [...game.slots].sort(() => Math.random() - 0.5);
      setAllCandidates(shuffled);
      setRanking(Array(game.slots.length).fill(null));
      setCorrectSlots(Array(game.slots.length).fill(false));
      setSurrendered(false);
      setFinished(false);
      setErrorMessage("");
      setSelected(null);
      setDraggedIndex(null);
    }
  }, [game]);

  const usedDriverIds = ranking.filter(Boolean).map((driver) => driver.driverId);
  const availableCandidates = allCandidates.filter(
    (driver) => !usedDriverIds.includes(driver.driverId)
  );

  const handleCandidateClick = (driver) => {
    if (surrendered || finished) return;
    setSelected(driver);
  };

  const handleSlotClick = (index) => {
    if (!selected || correctSlots[index] || surrendered || finished) return;

    const alreadyUsed = ranking.find((slot) => slot?.driverId === selected.driverId);
    if (alreadyUsed) return;

    const newRanking = [...ranking];
    newRanking[index] = selected;

    setRanking(newRanking);
    setSelected(null);
    setErrorMessage("");
  };

  const handleSwap = (targetIndex) => {
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    const newRanking = [...ranking];
    const temp = newRanking[draggedIndex];
    newRanking[draggedIndex] = newRanking[targetIndex];
    newRanking[targetIndex] = temp;

    setRanking(newRanking);
    setDraggedIndex(null);
  };

  const getCorrectDriverIdAt = (index) => {
    // correctOrder es 0-based en tu lógica (index)
    const correctSlot = game.slots.find((slot) => slot.correctOrder === index);
    return correctSlot?.driverId;
  };

  const onSubmit = () => {
    if (ranking.some((slot) => slot === null)) {
      setErrorMessage(t("incomplete"));
      return;
    }

    const newCorrectSlots = ranking.map((driver, index) => {
      const correctId = getCorrectDriverIdAt(index);
      return driver?.driverId === correctId;
    });

    setCorrectSlots(newCorrectSlots);
    setFinished(true);

    const allCorrect = newCorrectSlots.every((val) => val);

    if (allCorrect) {
      const orderedIds = ranking.map((s) => s.driverId);
      dispatch(actions.submitDriverOrder(game.id, orderedIds));
    }
  };

  const onSurrender = () => {
    const ordered = [...game.slots].sort((a, b) => a.correctOrder - b.correctOrder);
    setRanking(ordered);
    setSurrendered(true);
    setFinished(true);
    setSelected(null);
    setDraggedIndex(null);
    setErrorMessage("");
  };

  if (loading) {
    return <LoadingScreen lang={lang} text={t("loading")} />;
  }

  if (!canPlay) {
    return (
      <CooldownScreen seconds={secondsRemaining} onBack={() => navigate("/minigames")} />
    );
  }

  if (showTutorial) {
    return (
      <MinigameTutorial
        title={tutorial.title}
        description={tutorial.description}
        image={sourceImages("./OrderDriversGame.png")}
        onStart={() => setShowTutorial(false)}
        lang={lang}
      />
    );
  }

  if (!game) return <LoadingScreen lang={lang} text={t("loading")} />;

  return (
    <AdWindows placeholders={true} enableTabletSide={false} showBottomOnDesktop={false}>
      <div className="order-driver-page">
        <div className={`order-driver-container ${surrendered ? "surrendered-mode" : ""}`}>
          <h2 className="order-driver-title">{game.topic}</h2>


          {errorMessage && <div className="error-message">{errorMessage}</div>}

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
                    surrendered
                      ? slot?.driverId === getCorrectDriverIdAt(index)
                        ? "success"
                        : "fail"
                      : finished
                        ? correctSlots[index]
                          ? "success"
                          : "fail"
                        : ""
                  }`}
                  draggable={!surrendered && !finished && slot !== null}
                  onDragStart={() => setDraggedIndex(index)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleSwap(index)}
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

          {!finished && !surrendered && (
            <div className="button-row">
              <button className="validate-btn" onClick={onSubmit}>
                {t("validate")}
              </button>
              <button className="surrender-btn" onClick={onSurrender}>
                {t("surrender")}
              </button>
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

          {(finished || surrendered) && (
            <div className="button-row">
              <button className="back-btn" onClick={() => navigate("/minigames")}>
                {t("back")}
              </button>
            </div>
          )}
        </div>
      </div>
    </AdWindows>
  );
};

export default OrderDriverGame;
