// src/f1hub/components/TableMenu.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import "./TableMenu.css";

const TableMenu = () => {
  const navigate = useNavigate();

  return (
    <div className="table-menu">
      <h2 className="table-menu-title">Selecciona tipo de tabla</h2>
      <div className="table-menu-options">
        <button onClick={() => navigate("/tables/grands-prix")}>🏁 Grandes Premios</button>
        <button onClick={() => navigate("/tables/championships")}>🏆 Campeonatos</button>
        <button onClick={() => navigate("/tracking")}>📊 Seguimiento Campeonato</button>
        <button onClick={() => navigate("/tables/rankings")}>📈 Rankings y Récords</button>
      </div>
    </div>
  );
};

export default TableMenu;
