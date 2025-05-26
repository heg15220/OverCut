import React from 'react';
import { Routes, Route } from 'react-router-dom';

import HomePage from './HomePage';
import StatisticsView from "../../statistics/components/StatisticsView";
import TableMenu from "../../f1hub/components/TableMenu";
import TableView from "../../f1hub/components/TableView";
import ChampionshipTrackingView from "../../championship/components/ChampionshipTrackingView";
import GraphView from "../../f1hub/components/GraphView";

import ChartsDashboard from "../../charts/components/ChartsDashboard";
import ChartSelector from "../../charts/components/ChartSelector";
import ChartModeSelector from "../../charts/components/ChartModeSelector";

const Body = () => {
  return (
    <main className="container" style={{ padding: "2rem" }}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/tables" element={<TableMenu />} />
        <Route path="/tables/grands-prix" element={<TableView />} />
        <Route path="/tables/championships" element={<StatisticsView />} />
        <Route path="/statistics" element={<StatisticsView />} />
        <Route path="/tracking" element={<ChampionshipTrackingView />} />
        <Route path="/graphs" element={<ChartModeSelector />}>
          <Route path="standard" element={<ChartsDashboard />} />
          <Route path="advanced" element={<ChartSelector />} />
        </Route>

      </Routes>
    </main>
  );
};


export default Body;
