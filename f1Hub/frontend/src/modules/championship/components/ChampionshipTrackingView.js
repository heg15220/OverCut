import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import * as actions from "../actions";
import * as selectors from "../selectors";
import * as raceSelectorActions from "../../raceSelector/actions";
import * as raceSelectorSelectors from "../../raceSelector/selectors";
import "./ChampionshipTrackingView.css";

const ChampionshipTrackingView = () => {
  const dispatch = useDispatch();
  const years = useSelector(raceSelectorSelectors.getYears);
  const tracking = useSelector(selectors.getTracking);
  const [year, setYear] = useState(null);
  const races = useSelector(raceSelectorSelectors.getGrandsPrix);

  useEffect(() => {
    dispatch(raceSelectorActions.fetchYears());
  }, [dispatch]);


  useEffect(() => {
    if (year) {
      dispatch(actions.fetchTracking(year));
      dispatch(raceSelectorActions.fetchGrandsPrix(year));
    }
  }, [dispatch, year]);


  const getRaceHeader = (race) => {
    const abbr = race.name
      .replace("Grand Prix", "")
      .replace("Grand Prix*", "")
      .trim()
      .split(" ")
      .map(w => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 3);

    return (
      <th key={race.raceId} title={`${race.name} (${race.circuitCountry})`}>
        <div className="race-header-cell">
          <img
            src={`https://flagcdn.com/h24/${race.circuitCountryCode?.toLowerCase()}.png`}
            alt={race.circuitCountry}
            className="flag"
          />
          <div className="race-abbr">{race.gpAbbreviation}</div>
        </div>
      </th>
    );
  };


  return (
    <div className="championship-tracking">
      <h2 className="championship-title">Seguimiento del Campeonato</h2>

      <div className="stat-controls">
        <select onChange={e => setYear(Number(e.target.value))} value={year || ""}>
          <option value="">Selecciona un año</option>
          {years.map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {tracking.length > 0 && (
        <div className="table-container">
          <table className="result-table">
            <thead>
              <tr>
                <th>Piloto</th>
                {races.map(getRaceHeader)}
              </tr>
            </thead>
            <tbody>
              {tracking.map((row, i) => (
                <tr key={i}>
                  <td>
                    <div className="pilot-cell">
                      <img src={row.flagUrl} className="flag" alt={row.driverNationality} />
                      <span className="pilot-name">
                        {row.finalPosition}º — {row.driverName}
                      </span>
                    </div>
                  </td>
                  {races.map(race => (
                    <td key={race.raceId}>
                      {row.roundPoints[race.round] || "—"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ChampionshipTrackingView;
