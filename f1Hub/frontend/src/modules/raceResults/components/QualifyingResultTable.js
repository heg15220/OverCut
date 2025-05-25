import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import raceResults from "../index";
import backend from "../../../backend";
import "./RaceResultTable.css";

const QualifyingResultTable = ({ raceId }) => {
  const dispatch = useDispatch();
  const results = useSelector(raceResults.selectors.getQualifyingResults);
  const [raceInfo, setRaceInfo] = useState(null);

  useEffect(() => {
    if (raceId) {
      dispatch(raceResults.actions.fetchQualifyingResults(raceId));
      backend.raceResultService.getRaceInfo(raceId, setRaceInfo, () => {});
    }
  }, [dispatch, raceId]);



  return (
    <div className="race-result-table">
      <h2 className="race-result-title">
        {raceInfo ? (
          <>
            {raceInfo.name} <img src={`https://flagcdn.com/h24/${raceInfo.circuitCountryCode}.png`} alt={raceInfo.circuitCountry} className="flag" /> {raceInfo.round > 0 ? `(${raceInfo.round})` : ""} — {raceInfo.year}
          </>
        ) : (
          <>Resultados de Clasificación #{raceId}</>
        )}
      </h2>

      <div className="table-container">
        <table className="result-table">
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
                    {r.driverFlagUrl && (
                      <img src={r.driverFlagUrl} className="flag" alt={r.driverNationality} />
                    )}
                    <div className="pilot-info">
                      <span className="pilot-name">{r.driverName}</span>
                    </div>
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
    </div>
  );
};

export default QualifyingResultTable;
