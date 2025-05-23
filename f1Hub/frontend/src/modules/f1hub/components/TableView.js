import React, { useState } from "react";
import RaceSelector from "../../raceSelector/components/RaceSelector";
import RaceResultTable from "../../raceResults/components/RaceResultTable";
import QualifyingResultTable from "../../raceResults/components/QualifyingResultTable";
import SprintResultTable from "../../raceResults/components/SprintResultTable";

const TableView = () => {
  const [selectedRace, setSelectedRace] = useState(null);

  const handleSelection = (selection) => {
    setSelectedRace(selection);
  };

  return (
    <div>
      <h2 style={{ textAlign: "center", color: "#ffcc00" }}>Visualización de Resultados</h2>

      <RaceSelector onRaceSelected={handleSelection} />

      {selectedRace?.session === "QUALI" && (
        <QualifyingResultTable raceId={selectedRace.raceId} />
      )}

      {selectedRace?.session === "RACE" && (
        <RaceResultTable raceId={selectedRace.raceId} />
      )}
      {selectedRace?.session === "SPRINT" && (
        <SprintResultTable raceId={selectedRace.raceId} />
      )}
    </div>
  );
};

export default TableView;