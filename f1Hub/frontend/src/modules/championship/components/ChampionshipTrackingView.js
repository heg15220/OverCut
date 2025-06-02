import React, { useEffect, useState, useRef } from "react";
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
  const topScrollRef = useRef(null);
  const bottomScrollRef = useRef(null);
  const tableScrollRef = useRef(null);


  useEffect(() => {
    dispatch(raceSelectorActions.fetchYears());
  }, [dispatch]);


  useEffect(() => {
    if (year) {
      dispatch(actions.fetchTracking(year));
      dispatch(raceSelectorActions.fetchGrandsPrix(year));
    }
  }, [dispatch, year]);

useEffect(() => {
  const top = topScrollRef.current;
  const bottom = bottomScrollRef.current;
  const table = tableScrollRef.current;

  if (!top || !bottom || !table) return;

  const sync = (source, target1, target2) => {
    source.addEventListener("scroll", () => {
      const scrollLeft = source.scrollLeft;
      target1.scrollLeft = scrollLeft;
      target2.scrollLeft = scrollLeft;
    });
  };

  sync(top, bottom, table);
  sync(bottom, top, table);
  sync(table, top, bottom);

  // Limpieza
  return () => {
    top?.removeEventListener("scroll", () => {});
    bottom?.removeEventListener("scroll", () => {});
    table?.removeEventListener("scroll", () => {});
  };
}, []);


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

const getScoringSystem = (year) => {
  if (year >= 2010) {
    return { first: 25, second: 18, third: 15 };
  } else if (year >= 2003) {
    return { first: 10, second: 8, third: 6 };
  } else if (year >= 1991) {
    return { first: 10, second: 6, third: 4 };
  } else if (year >= 1961) {
    return { first: 9, second: 6, third: 4 };
  } else {
    return { first: 8, second: 6, third: 4 };
  }
};

const getRaceClass = (racePoints, year) => {
  const { first, second, third } = getScoringSystem(year);

  if (racePoints === first + 1) return "race-bonus"; // victoria + FL
  if (racePoints === first) return "race-winner";
  if (racePoints === second) return "race-second";
  if (racePoints === third) return "race-third";
  if (racePoints > 0) return "race-other-points";
  return "race-other-zero";
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
        <div className="scroll-wrapper">
          <div className="scroll-top" />
          <div className="table-scroll">
            <table className="result-table">
              <thead>
                <tr>
                  <th className="pilot-col">Piloto</th>
                  {races.map(getRaceHeader)}
                </tr>
              </thead>
              <tbody>
                {tracking.map((row, i) => (
                  <tr key={i}>
                    <td className="pilot-col">
                      <div className="pilot-cell">
                        <img src={row.flagUrl} className="flag" alt={row.driverNationality} />
                        <span className="pilot-name">{row.finalPosition}º — {row.driverName}</span>
                      </div>
                    </td>
                    {races.map(race => {
                      const pointEntry = row.roundPoints[race.round];
                      if (!pointEntry) return <td key={race.raceId}>—</td>;

                      const { sprintPoints, racePoints, status } = pointEntry;

                      if (status === "DNF" || status === "DNS") {
                        return <td key={race.raceId} className="status-cell">{status}</td>;
                      }

                      const showSprint = sprintPoints > 0;



                      const raceClass = getRaceClass(racePoints, year); // ← esta línea faltaba

                      return (
                        <td key={race.raceId}>
                          {showSprint && <span className="sprint-points">{sprintPoints}</span>}
                          {showSprint && <span className="plus-separator"> + </span>}
                          <span className={`race-points ${raceClass}`}>{racePoints}</span>
                        </td>
                      );
                    })}

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="scroll-bottom" />
        </div>
      )}
    </div>

  );
};

export default ChampionshipTrackingView;
