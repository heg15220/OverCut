import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import raceResults from "../index"; // importa tu módulo de Redux (raceResults)
import "./RaceResultTable.css"; // reutiliza el estilo

const SprintResultTable = ({ raceId }) => {
  const dispatch = useDispatch();
  const results = useSelector(raceResults.selectors.getSprintResults);

  useEffect(() => {
    if (raceId) {
      dispatch(raceResults.actions.fetchSprintResults(raceId));
    }
  }, [dispatch, raceId]);

  return (
    <div className="race-result-table">
      <h2 className="race-result-title">Resultados del Sprint #{raceId}</h2>
      <table>
        <thead>
          <tr>
            <th>Pos</th>
            <th>Piloto</th>
            <th>Equipo</th>
            <th>Grid</th>
            <th>Vueltas</th>
            <th>Tiempo</th>
            <th>Puntos</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {Array.isArray(results) && results.map((r, i) => (
            <tr key={i}>
              <td>{r.position}</td>
              <td>
                <div className="pilot-cell">
                  <span className="pilot-bar" style={{ backgroundColor: r.teamColor }} />
                  <img src={r.driverFlagUrl} alt={r.driverNationality} className="flag" />
                  <span>{r.driverName}</span>
                </div>
              </td>
              <td>
                <div className="team-cell">
                  <span className="team-bar" style={{ backgroundColor: r.teamColor }} />
                  <span>{r.constructorName}</span>
                </div>
              </td>
              <td>{r.grid}</td>
              <td>{r.laps}</td>
              <td>{r.time || "—"}</td>
              <td>{r.points}</td>
              <td>{r.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SprintResultTable;
