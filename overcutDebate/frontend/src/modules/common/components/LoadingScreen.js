import React from "react";
import "./LoadingScreen.css";

export default function LoadingScreen() {
  return (
    <div className="loadingScreen">
      <div className="loadingScreen__spinner" />
      <div className="loadingScreen__text">Cargando...</div>
    </div>
  );
}
