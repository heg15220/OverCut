import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import raceResults from "../index";
import backend from "../../../backend";
import translations from "../../../i18n/translations";
import "./RaceResultTable.css";

const RaceResultTable = ({ raceId }) => {
  const dispatch = useDispatch();
  const results = useSelector(raceResults.selectors.getRaceResults);
  const [raceInfo, setRaceInfo] = useState(null);
  const lang = navigator.language.startsWith("es") ? "es" : "en";
  const t = translations[lang];

  useEffect(() => {
    if (raceId) {
      dispatch(raceResults.actions.fetchRaceResults(raceId));
      backend.raceResultService.getRaceInfo(raceId, setRaceInfo, () => {});
    }
  }, [dispatch, raceId]);

  return (
    <div className="race-result-table">
      <h2 className="race-result-title">
        {raceInfo ? (
          <>
            {raceInfo.name} <img src={`https://flagcdn.com/h24/${raceInfo.circuitCountryCode?.toLowerCase()}.png`} alt={raceInfo.circuitCountry} className="flag inline-flag" /> {raceInfo.round > 0 ? `(${raceInfo.round})` : ""} — {raceInfo.year}
          </>
        ) : (
          <>{t.raceResults} #{raceId}</>
        )}
      </h2>

      <div className="table-container">
        <table className="result-table">
          <thead>
            <tr>
              <th>{t.position}</th>
              <th>{t.driver}</th>
              <th>{t.team}</th>
              <th>{t.grid}</th>
              <th>{t.laps}</th>
              <th>{t.time}</th>
              <th>{t.points}</th>
              <th>{t.status}</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(results) && results.map((r, i) => (
              <tr key={i}>
                <td>{r.position}</td>
                <td>
                  <div className="pilot-cell">
                      <span className="pilot-bar" style={{ background: r.teamColor }} />
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
                    <span className="team-bar" style={{ background: r.teamColor }} />
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
    </div>
  );
};

export default RaceResultTable;
