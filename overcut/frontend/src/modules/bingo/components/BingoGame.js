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

// (lo dejamos importado por compatibilidad / fallback legacy)
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

// ✅ Nacionalidad (drivers.nationality) -> ISO2
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

// ✅ Bandera EXTERNA (CDN)
const flagCdnUrl = (iso2) => {
  if (!iso2 || typeof iso2 !== "string" || iso2.length !== 2) return null;
  return `https://flagcdn.com/40x30/${iso2.toLowerCase()}.png`;
};

const flagCdnSrcSet = (iso2) => {
  if (!iso2 || typeof iso2 !== "string" || iso2.length !== 2) return null;
  const c = iso2.toLowerCase();
  return `https://flagcdn.com/40x30/${c}.png 1x, https://flagcdn.com/80x60/${c}.png 2x, https://flagcdn.com/120x90/${c}.png 3x`;
};

// ✅ derive nationality from code when backend doesn't send meta
// code example: "country_british", "country_new_zealander"
const codeToNationality = (code) => {
  const c = String(code || "");
  if (!c.startsWith("country_")) return null;
  const slug = c.replace(/^country_/, "");

  // convert slug -> "Title Case" keys used in NATIONALITY_TO_ISO2
  // e.g. "new_zealander" -> "New Zealander"
  const title = slug
    .split("_")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  // quick fix for GB variants if you ever generate "uk" / "great_britain" etc.
  if (title === "Uk" || title === "United Kingdom") return "British";

  return title;
};

/**
 * ✅ assets resolving (Webpack/CRA)
 * - Bingo images (decades + Winner): assets/images/bingo/*
 * - Tictactoe images (logos etc.): assets/images/tictactoe/*
 */
const bingoImagesCtx = require.context(
  "../../../assets/images/bingo",
  false,
  /\.(png|jpg|jpeg|svg)$/i
);

const tictactoeImagesCtx = require.context(
  "../../../assets/images/tictactoe",
  false,
  /\.(png|jpg|jpeg|svg)$/i
);

const resolveCellImageSrc = (file) => {
  if (!file) return null;

  // si backend te manda URL / path público
  if (
    typeof file === "string" &&
    (file.startsWith("http://") || file.startsWith("https://") || file.startsWith("/"))
  ) {
    return `${process.env.PUBLIC_URL || ""}${file}`;
  }

  const clean = String(file).replace(/^\.\/+/, "");

  try {
    return bingoImagesCtx(`./${clean}`);
  } catch (e) {
    try {
      return tictactoeImagesCtx(`./${clean}`);
    } catch (e2) {
      try {
        const legacy = getTictactoeImageSrc(clean);
        return legacy || null;
      } catch (e3) {
        return null;
      }
    }
  }
};

// ✅ detect your "1 GP win" category (ajusta si tu code real es otro)
const isOneGpWinCell = (cell) => {
  const code = String(cell?.code || "").toLowerCase();

  // Probables nombres según tu generator:
  // - "race_winner" / "race_winners" / "race_winners_1" / "one_race_winner"
  // Ajusta aquí si tu code final es distinto.
  if (code === "race_winner") return true;
  if (code === "race_winners") return true;
  if (code.includes("race_winner") && (code.includes("1") || code.includes("one"))) return true;

  // Fallback por description si no tienes claro el code (ES/EN)
  const desc = String(cell?.description || "").toLowerCase();
  if (desc.includes("han ganado 1 gran premio")) return true;
  if (desc.includes("won 1 grand prix")) return true;

  return false;
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

          // ✅ Country -> bandera (meta si existe; si no, derivar por code)
          const isCountryCell = String(cell.code || "").startsWith("country_");
          const nationality =
            cell?.meta?.nationality ||
            codeToNationality(cell.code) ||
            null;

          const iso2 = nationality ? NATIONALITY_TO_ISO2[nationality] : null;
          const flagSrc = isCountryCell ? flagCdnUrl(iso2) : null;
          const flagSrcSet = isCountryCell ? flagCdnSrcSet(iso2) : null;

          // ✅ "1 GP win" -> Winner.jpg (y sin texto)
          const oneGpWin = isOneGpWinCell(cell);

          // ✅ imágenes normales (decades / tictactoe) con resolver
          const imgFile = oneGpWin ? "Winner.jpg" : (cell.themeImage || cell.image || null);
          const imgSrc = !isCountryCell ? resolveCellImageSrc(imgFile) : null;

          const desc = String(cell.description || "");

          // ✅ reglas de texto:
          // - country: sin texto
          // - oneGpWin: sin texto
          // - decades: backend manda "" => no pinta texto
          const hasDesc = !isCountryCell && !oneGpWin && desc.trim().length > 0;

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
              aria-label={hasDesc ? desc : String(cell.code || "")}
              title={hasDesc ? desc : String(cell.code || "")}
            >
              <div className="bingo-cell__content">
                {/* ✅ country -> bandera externa */}
                {isCountryCell && flagSrc && (
                  <img
                    className="bingo-cell__img"
                    src={flagSrc}
                    srcSet={flagSrcSet || undefined}
                    width="40"
                    height="30"
                    alt={iso2 ? `Flag ${iso2}` : "Flag"}
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                )}

                {/* ✅ no-country -> imagen normal (incluye Winner.jpg y decades) */}
                {!isCountryCell && imgSrc && (
                  <img
                    className="bingo-cell__img"
                    src={imgSrc}
                    alt={hasDesc ? desc : ""}
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                )}

                {hasDesc && <div className="bingo-cell__desc">{desc}</div>}

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
