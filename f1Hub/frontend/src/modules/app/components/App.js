import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { Helmet } from 'react-helmet';

import Header from './Header';
import Footer from './Footer';
import Body from './Body';

const App = () => {
  return (
    <Router basename={process.env.NODE_ENV === "production" ? "/f1hub" : ""}>
      <Helmet>
        <meta charSet="UTF-8" />
        <title>F1Hub - Big Data F1</title>
      </Helmet>
      <div className="app">
        <Header />
        <Body />
        <Footer />
      </div>
    </Router>
  );
};

export default App;
