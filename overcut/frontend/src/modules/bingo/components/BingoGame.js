// BingoGame.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import * as actions from "../actions";
import * as selectors from "../selectors";
import "./BingoGame.css";

import { sourceImages } from "../../../helpers/sourceMiniGamesImages";
import LoadingScreen from "../../common/components/LoadingScreen";
import MinigameTutorial from "../../common/components/MinigameTutorial";
import { tutorialTexts } from "../../../helpers/minigameTutorialTexts";

import CooldownScreen from "../../cooldown/components/CooldownScreen";
import { getCooldownForGame } from "../../cooldown/selectors";
import { fetchCooldown } from "../../cooldown/actions";

// ✅ resolver src de imagen desde assets/tictactoe
import { getTictactoeImageSrc } from "../../../helpers/getTictactoeImageSrc";

const i18n = {
  title: { es: "Bingo", en: "Bingo" },
  subtitle: {
    es: "Completa las 9 casillas antes de que termine el tiempo.",
    en: "Fill all 9 cells before time runs out.",
  },
  back: { es: "Volver a OverCutGames", en: "Back to OverCutGames" },
  current: { es: "Piloto actual", en: "Current driver" },
  next: { es: "Siguiente", en: "Next" },
  time: { es: "Tiempo", en: "Time" },
  finished: { es: "Partida finalizada", en: "Game finished" },
  loading: { es: "Cargando juego...", en: "Loading game..." },
};

// ✅ Nacionalidad (drivers.nationality) -> ISO2 (para emoji bandera)
const NATIONALITY_TO_ISO2 = {
  British: "GB",
  English: "GB",
  Scottish: "GB",
  Welsh: "GB",
  Irish: "IE",
  Spanish: "ES",
  French: "FR",
  German: "DE",
  Italian: "IT",
  Dutch: "NL",
  Belgian: "BE",
  Austrian: "AT",
  Swiss: "CH",
  Swedish: "SE",
  Finnish: "FI",
  Danish: "DK",
  Norwegian: "NO",
  Portuguese: "PT",
  Polish: "PL",
  Czech: "CZ",
  Hungarian: "HU",
  Romanian: "RO",
  Russian: "RU",
  Ukrainian: "UA",
  Latvian: "LV",
  Lithuanian: "LT",
  Estonian: "EE",
  Bulgarian: "BG",
  Greek: "GR",
  Turkish: "TR",
  American: "US",
  Canadian: "CA",
  Mexican: "MX",
  Brazilian: "BR",
  Argentine: "AR",
  Colombian: "CO",
  Venezuelan: "VE",
  Chilean: "CL",
  Uruguayan: "UY",
  Australian: "AU",
  "New Zealander": "NZ",
  Japanese: "JP",
  Chinese: "CN",
  Thai: "TH",
  Indian: "IN",
  Malaysian: "MY",
  Singaporean: "SG",
  Indonesian: "ID",
  "South African": "ZA",
};

const iso2ToFlagEmoji = (iso2) => {
  if (!iso2 || typeof iso2 !== "string" || iso2.length !== 2) return null;
  const codePoints = [...iso2.toUpperCase()].map((c) => 127397 + c.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

const BingoGame = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const lang = navigator.language.startsWith("es") ? "es" : "en";

  const { canPlay, secondsRemaining, loading } = useSelector((state) =>
    getCooldownForGame(state, "Bingo")
  );

  const [showTutorial, setShowTutorial] = useState(true);
  const tutorial = tutorialTexts["/minigames/bingo"]?.[lang];

  const [lastShakeCellId, setLastShakeCellId] = useState(null);
  const [lastSuccessCellId, setLastSuccessCellId] = useState(null);

  const game = useSelector(selectors.getBingoGame);
  const filled = useSelector(selectors.getBingoFilled);
  const remainingSeconds = useSelector(selectors.getBingoRemainingSeconds);
  const queueIndex = useSelector(selectors.getBingoQueueIndex);
  const feedback = useSelector(selectors.getBingoFeedback);

  useEffect(() => {
    dispatch(fetchCooldown("Bingo"));
  }, [dispatch]);

  useEffect(() => {
    return () => {
      dispatch(actions.resetBingoState());
    };
  }, [dispatch]);

  useEffect(() => {
    if (!canPlay) return;
    if (showTutorial) return;
    if (!game) dispatch(actions.startBingoGame());
  }, [canPlay, showTutorial, dispatch, game]);

  useEffect(() => {
    if (!game || game.finished) return;

    if (remainingSeconds <= 0) {
      dispatch(actions.finishBingoGame(game.id));
      return;
    }

    const t = setInterval(() => dispatch(actions.tickBingoTimer()), 1000);
    return () => clearInterval(t);
  }, [dispatch, game, remainingSeconds]);

  const driversQueue = game?.driversQueue || [];

  const sortedQueue = useMemo(() => {
    return [...driversQueue].sort((a, b) => (a.queueIndex ?? 0) - (b.queueIndex ?? 0));
  }, [driversQueue]);

  const currentDriver = useMemo(() => {
    if (!sortedQueue.length) return null;
    return sortedQueue[queueIndex] || null;
  }, [sortedQueue, queueIndex]);

  const isLastDriver = useMemo(() => {
    const maxIdx = Math.max(0, sortedQueue.length - 1);
    return (queueIndex ?? 0) >= maxIdx;
  }, [sortedQueue.length, queueIndex]);

  const cells = useMemo(() => {
    const list = game?.cells || [];
    return [...list].sort((a, b) => (a.cellIndex ?? a.id ?? 0) - (b.cellIndex ?? b.id ?? 0));
  }, [game]);

  const completedCount = Object.keys(filled || {}).length;
  const isBoardCompleted = completedCount >= 9;

  useEffect(() => {
    if (game && !game.finished && isBoardCompleted) {
      dispatch(actions.finishBingoGame(game.id));
    }
  }, [game, isBoardCompleted, dispatch]);

  useEffect(() => {
    if (!feedback) return;
    const cellId = feedback?.cellId ?? null;

    if (feedback.type === "ok" && cellId) {
      setLastSuccessCellId(cellId);
      const t = setTimeout(() => setLastSuccessCellId(null), 650);
      return () => clearTimeout(t);
    }

    if ((feedback.type === "bad" || feedback.type === "error") && cellId) {
      setLastShakeCellId(cellId);
      const t = setTimeout(() => setLastShakeCellId(null), 650);
      return () => clearTimeout(t);
    }
  }, [feedback]);

  const onCellClick = (cell) => {
    if (!game || game.finished) return;
    if (!currentDriver) return;
    if (filled?.[String(cell.id)]) return;

    dispatch(
      actions.selectBingoCell(
        game.id,
        cell.id,
        currentDriver.driverId,
        currentDriver.driverName
      )
    );
  };

  const onNextDriver = () => {
    if (!game || game.finished) return;
    if (isLastDriver) return;
    dispatch(actions.nextBingoDriver());
  };

  if (loading) return <LoadingScreen lang={lang} text={i18n.loading[lang]} />;

  if (!canPlay) {
    return <CooldownScreen seconds={secondsRemaining} onBack={() => navigate("/minigames")} />;
  }

  if (showTutorial) {
    return (
      <MinigameTutorial
        title={tutorial?.title || i18n.title[lang]}
        description={tutorial?.description || i18n.subtitle[lang]}
        image={sourceImages(`./Bingo.png`)}
        onStart={() => setShowTutorial(false)}
        lang={lang}
      />
    );
  }

  if (!game) return <LoadingScreen lang={lang} text={i18n.loading[lang]} />;

  return (
    <div className="bingo-page">
      <div className="bingo-header">
        <h1 className="bingo-title">{i18n.title[lang]}</h1>
        <p className="bingo-subtitle">{i18n.subtitle[lang]}</p>
      </div>

      <div className="bingo-topbar">
        <div className="bingo-pill">
          <span className="bingo-pill__label">{i18n.time[lang]}</span>
          <span className={`bingo-pill__value ${remainingSeconds <= 10 ? "danger" : ""}`}>
            {remainingSeconds}s
          </span>
        </div>

        <div className="bingo-pill bingo-pill--driver">
          <span className="bingo-pill__label">{i18n.current[lang]}</span>

          <div className="bingo-pill__driverRight">
            <span className="bingo-pill__value">
              {game.finished ? "—" : currentDriver?.driverName || "—"}
            </span>

            <button
              type="button"
              className="bingo-nextDriverBtn"
              onClick={onNextDriver}
              disabled={game.finished || isLastDriver}
              aria-label={i18n.next[lang]}
              title={i18n.next[lang]}
            >
              ➜
            </button>
          </div>
        </div>

        <div className="bingo-pill">
          <span className="bingo-pill__label">Bingo</span>
          <span className="bingo-pill__value">{completedCount}/9</span>
        </div>
      </div>

      {feedback && <div className={`bingo-feedback ${feedback.type}`}>{feedback.text}</div>}

      <div className={`bingo-grid ${game.finished ? "disabled" : ""}`}>
        {cells.map((cell) => {
          const fillData = filled?.[String(cell.id)];
          const isFilled = !!fillData;

          const isWrongAnim = lastShakeCellId === cell.id;
          const isSuccessAnim = lastSuccessCellId === cell.id;

          // ✅ Country cell -> bandera (requiere backend: cell.meta.nationality)
          const isCountryCell = String(cell.code || "").startsWith("country_");
          const nationality = cell?.meta?.nationality || null;
          const iso2 = nationality ? NATIONALITY_TO_ISO2[nationality] : null;
          const flagEmoji = isCountryCell ? iso2ToFlagEmoji(iso2) : null;

          // ✅ Imagen normal para el resto
          const imgFile = cell.themeImage || cell.image || null;
          const imgSrc = !isCountryCell ? getTictactoeImageSrc(imgFile) : null;

          return (
            <button
              key={cell.id}
              className={[
                "bingo-cell",
                isFilled ? "bingo-cell--correct" : "",
                isWrongAnim ? "bingo-cell--wrong" : "",
                isSuccessAnim ? "bingo-cell--pop" : "",
              ].join(" ")}
              onClick={() => onCellClick(cell)}
              disabled={game.finished || isFilled}
              aria-label={cell.description}
              title={cell.description}
            >
              <div className="bingo-cell__content">
                {/* ✅ bandera si es country */}
                {flagEmoji && (
                  <div className="bingo-cell__flag" aria-hidden="true">
                    {flagEmoji}
                  </div>
                )}

                {/* ✅ imagen normal si NO es country */}
                {!flagEmoji && imgSrc && (
                  <img
                    className="bingo-cell__img"
                    src={imgSrc}
                    alt={cell.description}
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                )}

                <div className="bingo-cell__desc">{cell.description}</div>

                {isFilled && (
                  <div className="bingo-cell__answerOverlay">
                    <span className="bingo-cell__answerBadge">✅</span>
                    <span className="bingo-cell__answerName">{fillData?.driverName}</span>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {game.finished && (
        <div className="bingo-finish">
          <div className="bingo-finish__title">{i18n.finished[lang]}</div>
          <button
            className="bingo-btn"
            onClick={() => {
              dispatch(actions.resetBingoState());
              navigate("/minigames");
            }}
          >
            {i18n.back[lang]}
          </button>
        </div>
      )}
    </div>
  );
};

export default BingoGame;
