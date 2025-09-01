// App.jsx
import React from "react";
import { HashRouter as Router } from "react-router-dom";
import { Helmet } from "react-helmet";
import Body from "./Body";
import Footer from "./Footer";
import Header from "./Header";
import MobileHeader from "./MobileHeader";

import { ConsentProvider } from "../../../cookies/ConsentContext"; // <-- importa tu provider
import CookiePanel from "../../../cookies/CookiePanel";           // <-- panel 2ª capa

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
      <Helmet><meta charSet="UTF-8" /></Helmet>
      <ConsentProvider>
        <div className="App">
          {isMobile ? <MobileHeader /> : <Header />}
          <Body />
          <Footer />
        </div>

        {/* El panel puede abrirse desde el footer en cualquier página */}
        <CookiePanel />
      </ConsentProvider>
    </Router>
  );
};

export default App;
