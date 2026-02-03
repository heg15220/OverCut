import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { Helmet } from "react-helmet";

import Header from "./Header";
import Footer from "./Footer";
import Body from "./Body";

const App = () => {
  // ✅ App independiente: decide su basename propio
  const baseName = process.env.NODE_ENV === "production" ? "/overcutPredictions" : "";

  return (
    <Router basename={baseName}>
      <Helmet>
        <meta charSet="UTF-8" />
        <title>OverCut Predictions</title>
      </Helmet>

      <div className="ocp-app">
        <Header />
        <Body />
        <Footer />
      </div>
    </Router>
  );
};

export default App;
