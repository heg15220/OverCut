import React from 'react';
import { Routes, Route } from 'react-router-dom';

import HomePage from './HomePage';
import TableView from './TableView';
import GraphView from './GraphView';

const Body = () => {
  return (
    <main className="container" style={{ padding: "2rem" }}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/tables" element={<TableView />} />
        <Route path="/graphs" element={<GraphView />} />
      </Routes>
    </main>
  );
};

export default Body;
