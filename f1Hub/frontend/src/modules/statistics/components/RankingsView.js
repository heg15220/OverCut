import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import * as statisticsActions from "../actions";
import * as statisticsSelectors from "../selectors";
import * as raceSelectorActions from "../../raceSelector/actions";
import * as raceSelectorSelectors from "../../raceSelector/selectors";
import "./StatisticsTable.css";

const RankingsView = () => {
  const dispatch = useDispatch();

  const [mode, setMode] = useState("wins");
  const [team, setTeam] = useState("");

  // Datos globales
  const constructors = useSelector(statisticsSelectors.getConstructors);

  // Rankings generales
  const wins = useSelector(statisticsSelectors.getDriverWins);
  const podiums = useSelector(statisticsSelectors.getDriverPodiums);
  const poles = useSelector(statisticsSelectors.getDriverPoles);
  const grandChelems = useSelector(statisticsSelectors.getDriverGrandChelems);

  // Rankings por equipo
  const winsByTeam = useSelector(statisticsSelectors.getDriverWinsByTeam);
  const podiumsByTeam = useSelector(statisticsSelectors.getDriverPodiumsByTeam);
  const polesByTeam = useSelector(statisticsSelectors.getDriverPolesByTeam);

  const showTeamSelector = ["wins_team", "podiums_team", "poles_team"].includes(mode);

  // Cargar equipos dinámicamente
  useEffect(() => {
    dispatch(statisticsActions.fetchConstructors());
  }, [dispatch]);

  // Cargar ranking general
  useEffect(() => {
    switch (mode) {
      case "wins":
        dispatch(statisticsActions.fetchDriverWins());
        break;
      case "podiums":
        dispatch(statisticsActions.fetchDriverPodiums());
        break;
      case "poles":
        dispatch(statisticsActions.fetchDriverPoles());
        break;
      case "grand_chelems":
        dispatch(statisticsActions.fetchDriverGrandChelems());
        break;
      default:
        break;
    }
  }, [dispatch, mode]);

  // Cargar ranking por equipo
  useEffect(() => {
    if (!team) return;

    switch (mode) {
      case "wins_team":
        dispatch(statisticsActions.fetchDriverWinsByTeam(team));
        break;
      case "podiums_team":
        dispatch(statisticsActions.fetchDriverPodiumsByTeam(team));
        break;
      case "poles_team":
        dispatch(statisticsActions.fetchDriverPolesByTeam(team));
        break;
      default:
        break;
    }
  }, [dispatch, team, mode]);

  const data =
    mode === "wins" ? wins :
    mode === "podiums" ? podiums :
    mode === "poles" ? poles :
    mode === "grand_chelems" ? grandChelems :
    mode === "wins_team" ? winsByTeam :
    mode === "podiums_team" ? podiumsByTeam :
    mode === "poles_team" ? polesByTeam :
    [];

  const getLabel = () => {
    if (mode.includes("wins")) return "Victorias";
    if (mode.includes("podiums")) return "Podios";
    if (mode.includes("poles")) return "Poles";
    if (mode.includes("grand_chelems")) return "Grand Chelems";
    return "Valor";
  };

  return (
    <div className="race-result-table">
      <h2 className="race-result-title">📈 Rankings y Récords</h2>

      <div className="stat-controls">
        <select value={mode} onChange={e => { setMode(e.target.value); setTeam(""); }}>
          <option value="wins">Pilotos con más Victorias</option>
          <option value="podiums">Pilotos con más Podios</option>
          <option value="poles">Pilotos con más Poles (desde 2003)</option>
          <option value="grand_chelems">Pilotos con más Grand Chelems</option>
          <option value="wins_team">Victorias por Equipo</option>
          <option value="podiums_team">Podios por Equipo</option>
          <option value="poles_team">Poles por Equipo (desde 2003)</option>
        </select>

        {showTeamSelector && (
          <select value={team} onChange={e => setTeam(e.target.value)}>
            <option value="">Selecciona equipo</option>
            {constructors.map(c => (
              <option key={c.constructorId} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="table-container">
        <table className="result-table">
          <thead>
            <tr>
              <th>Pos</th>
              <th>Piloto</th>
              <th>{getLabel()}</th>
            </tr>
          </thead>
          <tbody>
            {(data || []).map((item, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>
                  <div className="pilot-cell">
                    {item.flagUrl && (
                      <img src={item.flagUrl} className="flag" alt={item.nationality} />
                    )}
                    <span className="pilot-name">{item.driverName}</span>
                  </div>
                </td>
                <td>{item.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RankingsView;
