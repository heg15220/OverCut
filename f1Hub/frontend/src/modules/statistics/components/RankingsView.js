import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import * as statisticsActions from "../actions";
import * as statisticsSelectors from "../selectors";
import "./StatisticsTable.css";

const RankingsView = () => {
  const dispatch = useDispatch();
  const [mode, setMode] = useState("wins");

  const driverWins = useSelector(statisticsSelectors.getDriverWins);
  const driverPodiums = useSelector(statisticsSelectors.getDriverPodiums);
  const driverPoles = useSelector(statisticsSelectors.getDriverPoles);
  const driverGrandChelems = useSelector(statisticsSelectors.getDriverGrandChelems);

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

  const data =
    mode === "wins" ? driverWins :
    mode === "podiums" ? driverPodiums :
    mode === "poles" ? driverPoles :
    mode === "grand_chelems" ? driverGrandChelems :
    [];

  const getLabel = () => {
    switch (mode) {
      case "wins": return "Victorias";
      case "podiums": return "Podios";
      case "poles": return "Poles";
      case "grand_chelems": return "Grand Chelems";
      default: return "Valor";
    }
  };

  return (
    <div className="race-result-table">
      <h2 className="race-result-title">🏆 Rankings y Récords F1</h2>

      <div className="stat-controls">
        <select value={mode} onChange={e => setMode(e.target.value)}>
          <option value="wins">Victorias en F1</option>
          <option value="podiums">Podios en F1</option>
          <option value="poles">Poles desde 2003</option>
          <option value="grand_chelems">Grand Chelems</option>
        </select>
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
