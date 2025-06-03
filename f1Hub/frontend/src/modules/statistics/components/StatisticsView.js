import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import * as statisticsActions from "../actions";
import * as statisticsSelectors from "../selectors";
import * as raceSelectorActions from "../../raceSelector/actions";
import * as raceSelectorSelectors from "../../raceSelector/selectors";
import "./StatisticsTable.css";

const StatisticsView = () => {
  const dispatch = useDispatch();
  const years = useSelector(raceSelectorSelectors.getYears);

  const [year, setYear] = useState(null);
  const [mode, setMode] = useState("drivers");

  const driverStandings = useSelector(statisticsSelectors.getDriverStandings);
  const constructorStandings = useSelector(statisticsSelectors.getConstructorStandings);

  useEffect(() => {
    dispatch(raceSelectorActions.fetchYears());
  }, [dispatch]);

  useEffect(() => {
    if (mode === "drivers" && year) {
      dispatch(statisticsActions.fetchDriverStandings(year));
    } else if (mode === "constructors" && year) {
      dispatch(statisticsActions.fetchConstructorStandings(year));
    }
  }, [dispatch, year, mode]);

  const data = mode === "drivers" ? driverStandings : constructorStandings;

  return (
    <div className="race-result-table">
      <h2 className="race-result-title">Estadísticas F1</h2>

      <div className="stat-controls">
        <select value={mode} onChange={e => setMode(e.target.value)}>
          <option value="drivers">Clasificación Pilotos</option>
          <option value="constructors">Clasificación Constructores</option>
        </select>

        <select onChange={e => setYear(Number(e.target.value))} value={year || ""}>
          <option value="">Selecciona un año</option>
          {years.map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      <div className="table-container">
        <table className="result-table">
          <thead>
            <tr>
              <th>Pos</th>
              <th>{mode === "constructors" ? "Equipo" : "Piloto"}</th>
              <th>Puntos</th>
            </tr>
          </thead>
          <tbody>
            {(data || []).map((item, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>
                  <div className="pilot-cell">
                    {item.teamColor && (
                      <span className="pilot-bar" style={{ backgroundColor: item.teamColor }} />
                    )}
                    {item.flagUrl && (
                      <img src={item.flagUrl} className="flag" alt={item.nationality} />
                    )}
                    <span className="pilot-name">{item.driverName || item.constructorName}</span>
                  </div>
                </td>
                <td>{item.totalPoints}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StatisticsView;