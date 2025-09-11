import React from 'react';
import { Link } from 'react-router-dom';
import './Header.css';
import translations from '../../../i18n/translations';

const lang = navigator.language.startsWith('es') ? 'es' : 'en';
const t = translations[lang];

const Header = () => {
  return (
    <header className="f1hub-header">
      <div className="f1hub-logo">F1<span>Hub</span></div>
      <nav className="f1hub-nav">
        <Link to="/">{t.headerHome}</Link>
        <Link to="/tables">{t.headerTables}</Link>
        <Link to="/graphs">{t.headerCharts}</Link>
        <a href="/">{t.headerOvercut}</a> {/* 🔗 Aquí el acceso a OverCut */}
      </nav>
    </header>
  );
};

export default Header;
