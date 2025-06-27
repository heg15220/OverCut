import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import * as actions from "../actions";
import * as selectors from "../selectors";
import "./OrderDriverGame.css";
import LoadingScreen from '../../common/components/LoadingScreen';
import MinigameTutorial from "../../common/components/MinigameTutorial"; // nuevo componente compartido
import { sourceImages } from "../../../helpers/sourceMiniGamesImages"; // ya lo usas en MinigamesHome
import { tutorialTexts } from "../../../helpers/minigameTutorialTexts"; // explicaciones por minijuego
import CooldownScreen from "../../cooldown/components/CooldownScreen";
import { getCooldownForGame } from "../../cooldown/selectors";
import { fetchCooldown } from "../../cooldown/actions";
import { getUser } from "../../users/selectors";



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

  const [showTutorial, setShowTutorial] = useState(true);
  const lang = navigator.language.startsWith('es') ? 'es' : 'en';

  const tutorial = tutorialTexts["/minigames/orderDrivers"][lang];

  const { canPlay, secondsRemaining, loading } = useSelector(state =>
    getCooldownForGame(state, "OrderDriver")
  );

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
      dispatch(fetchCooldown("OrderDriver"));
    }, [dispatch]);

    useEffect(() => {
      if (canPlay) {
        dispatch(actions.startOrderGame());
      }
    }, [canPlay, dispatch]);


  useEffect(() => {
    if (game) {
      const shuffled = [...game.slots].sort(() => Math.random() - 0.5);
      setAllCandidates(shuffled);
      setRanking(Array(game.slots.length).fill(null));
      setCorrectSlots(Array(game.slots.length).fill(false));
    }
  }, [game]);

    if (loading) {
      return <LoadingScreen lang={navigator.language.startsWith("es") ? "es" : "en"} text={t("loading")} />;
    }

    if (!canPlay) {
      return (
        <CooldownScreen
          seconds={secondsRemaining}
          onBack={() => navigate("/minigames")}
        />
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



  const usedDriverIds = ranking.filter(Boolean).map(driver => driver.driverId);
  const availableCandidates = allCandidates.filter(driver => !usedDriverIds.includes(driver.driverId));

  const handleCandidateClick = (driver) => {
    setSelected(driver);
  };

  const handleSlotClick = (index) => {
    if (!selected || correctSlots[index]) return;

    const alreadyUsed = ranking.find(slot => slot?.driverId === selected.driverId);
    if (alreadyUsed) return;

    const newRanking = [...ranking];
    newRanking[index] = selected;

    setRanking(newRanking);
    setSelected(null);
  };



  const onSubmit = () => {
    const newCorrectSlots = ranking.map((driver, index) => {
      const correctId = getCorrectDriverIdAt(index);
      return driver?.driverId === correctId;
    });

    setCorrectSlots(newCorrectSlots);

    // Separar los que están bien y los que no
    const updatedRanking = ranking.map((driver, index) => {
      return newCorrectSlots[index] ? driver : null;
    });

    const incorrectDrivers = ranking
      .map((driver, index) => (!newCorrectSlots[index] && driver ? driver : null))
      .filter(Boolean);

    // Devolver los incorrectos a la lista
    const updatedCandidates = [...allCandidates, ...incorrectDrivers];
    const deduplicatedCandidates = updatedCandidates.filter(
      (driver, index, self) =>
        self.findIndex(d => d.driverId === driver.driverId) === index
    );

    setRanking(updatedRanking);
    setAllCandidates(deduplicatedCandidates);

    const allCorrect = newCorrectSlots.every(val => val);
    const allFilled = updatedRanking.every(slot => slot !== null);

    if (allCorrect && allFilled) {
      const orderedIds = updatedRanking.map(s => s.driverId);
      dispatch(actions.submitDriverOrder(game.id, orderedIds));
    }

    if (allFilled) {
      setFinished(true);
    }

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

  if (!game) return <LoadingScreen lang={navigator.language.startsWith("es") ? "es" : "en"} text={t("loading")} />;

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
                  surrendered || finished
                    ? slot?.driverId === getCorrectDriverIdAt(index)
                      ? 'success'
                      : 'fail'
                    : correctSlots[index]
                      ? 'success'
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

        {!finished && !surrendered && (
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

        {(finished || surrendered) && (
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
