import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import raceResults from "../index"; // usa el mismo módulo
import "./RaceResultTable.css";

const QualifyingResultTable = ({ raceId }) => {
  const dispatch = useDispatch();
  const results = useSelector(raceResults.selectors.getQualifyingResults);

  useEffect(() => {
    if (raceId) {
      dispatch(raceResults.actions.fetchQualifyingResults(raceId));
    }
  }, [dispatch, raceId]);

  return (
    <div className="race-result-table">
      <h2 className="race-result-title">Resultados de Clasificación #{raceId}</h2>
      <table>
        <thead>
          <tr>
            <th>Pos</th>
            <th>Piloto</th>
            <th>Equipo</th>
            <th>Q1</th>
            <th>Q2</th>
            <th>Q3</th>
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
              <td>{r.q1 || "—"}</td>
              <td>{r.q2 || "—"}</td>
              <td>{r.q3 || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default QualifyingResultTable;
