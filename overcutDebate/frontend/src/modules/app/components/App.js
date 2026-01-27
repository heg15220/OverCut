// src/modules/app/components/App.jsx
import React from "react";
import { HashRouter as Router } from "react-router-dom";
import { Helmet } from "react-helmet";

import Body from "./Body";
import Footer from "./Footer";
import Header from "./Header";
import MobileHeader from "./MobileHeader";


import "./App.css";

const App = () => {
  const [width, setWidth] = React.useState(window.innerWidth);

  React.useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const isMobile = width <= 768;

  return (
    <Router>
      <Helmet>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Helmet>

        <div className="AppRoot">
          {isMobile ? <MobileHeader /> : <Header />}

          <main className="AppMain">
            <Body />
          </main>

          <Footer />
        </div>
    </Router>
  );
};

export default App;
