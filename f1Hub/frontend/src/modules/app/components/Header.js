import React from 'react';
import { Link } from 'react-router-dom';
import './Header.css';

const Header = () => {
  return (
    <header className="f1hub-header">
      <div className="f1hub-logo">F1<span>Hub</span></div>
      <nav className="f1hub-nav">
        <Link to="/">Inicio</Link>
        <Link to="/tables">Tablas</Link>
        <Link to="/graphs">Gráficas</Link>
      </nav>
    </header>
  );
};

export default Header;
