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

  useEffect(() => {
    if (mode === "wins") {
      dispatch(statisticsActions.fetchDriverWins());
    } else if (mode === "podiums") {
      dispatch(statisticsActions.fetchDriverPodiums());
    }
  }, [dispatch, mode]);

  const data =
    mode === "wins" ? driverWins :
    mode === "podiums" ? driverPodiums :
    [];

  return (
    <div className="race-result-table">
      <h2 className="race-result-title">🏆 Rankings y Récords F1</h2>

      <div className="stat-controls">
        <select value={mode} onChange={e => setMode(e.target.value)}>
          <option value="wins">Pilotos con más Victorias</option>
          <option value="podiums">Pilotos con más Podios</option>
          {/* Podrás añadir más opciones: poles, vueltas rápidas... */}
        </select>
      </div>

      <div className="table-container">
        <table className="result-table">
          <thead>
            <tr>
              <th>Pos</th>
              <th>Piloto</th>
              <th>{mode === "wins" ? "Victorias" : "Podios"}</th>
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
