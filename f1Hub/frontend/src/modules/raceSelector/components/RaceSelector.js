import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import * as actions from '../actions';
import * as selectors from '../selectors';
import "./RaceSelector.css";

const RaceSelector = ({ onRaceSelected }) => {
  const dispatch = useDispatch();
  const years = useSelector(selectors.getYears);
  const grandsPrix = useSelector(selectors.getGrandsPrix);
  const sessions = useSelector(selectors.getSessions);

  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedRaceId, setSelectedRaceId] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);

  useEffect(() => {
    dispatch(actions.fetchYears());
  }, [dispatch]);

  const handleYearChange = e => {
    const year = parseInt(e.target.value);
    setSelectedYear(year);
    setSelectedRaceId(null);
    setSelectedSession(null);
    dispatch(actions.fetchGrandsPrix(year));
  };

  const handleGrandPrixChange = e => {
    const raceId = parseInt(e.target.value);
    setSelectedRaceId(raceId);
    setSelectedSession(null);
    dispatch(actions.fetchSessions(raceId));
  };

  const handleSessionChange = e => {
    setSelectedSession(e.target.value);
  };

  const handleSubmit = () => {
    if (selectedYear && selectedRaceId && selectedSession) {
      onRaceSelected({ raceId: selectedRaceId, session: selectedSession });
    }
  };


  return (
    <div className="race-selector">
      <select onChange={handleYearChange} value={selectedYear || ""} className={selectedYear ? "selected" : ""}>
        <option value="">Selecciona un año</option>
        {years.map(y => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>

      <select onChange={handleGrandPrixChange} value={selectedRaceId || ""} disabled={!selectedYear} className={selectedRaceId ? "selected" : ""}>
        <option value="">Selecciona GP</option>
        {grandsPrix.map(gp => (
          <option key={gp.raceId} value={gp.raceId}>
            {gp.name} — {gp.circuitName} ({gp.circuitCountry})
          </option>
        ))}
      </select>

      <select onChange={handleSessionChange} value={selectedSession || ""} disabled={!selectedRaceId} className={selectedSession ? "selected" : ""}>
        <option value="">Selecciona sesión</option>
        {sessions.map(session => (
          <option key={session} value={session}>{session}</option>
        ))}
      </select>

      <button
        onClick={handleSubmit}
        disabled={!selectedYear || !selectedRaceId || !selectedSession}
      >
        Ver resultados
      </button>
    </div>
  );
};

export default RaceSelector;
