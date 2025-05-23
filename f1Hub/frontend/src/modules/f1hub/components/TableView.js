// === src/modules/f1hub/components/TableView.jsx ===
import React from "react";
import RaceResultTable from "../../raceResults/components/RaceResultTable";

const TableView = () => {
  // Aquí usas un ID fijo (por ejemplo: 1), luego lo harás dinámico con selector o filtro
  return (
    <div>
      <RaceResultTable raceId={1} />
    </div>
  );
};

export default TableView;
