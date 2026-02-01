import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FormattedMessage } from "react-intl";
import { useSelector } from "react-redux";
import users from '../../users';
import { Lightbulb, Puzzle, GraphUp, Book, Trophy, List, X, PersonCircle, BoxArrowRight, PencilSquare } from "react-bootstrap-icons";
import "./MobileHeader.css";
import image from './Resources/LogoOverCut.png';

import { ChatDots } from "react-bootstrap-icons";
import { buildDebateUrl } from "../../../helpers/debateLink"; // ajusta ruta real


const MobileHeader = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  const isLogged = useSelector(users.selectors.isLoggedIn);
  const user = useSelector(users.selectors.getUser);

  const handleToggleMenu = () => setMenuOpen(!menuOpen);
  const handleCloseMenu = () => setMenuOpen(false);

  return (
    <>
      <header className="mobile-header">
        <button className="hamburger-button" onClick={handleToggleMenu} aria-label="Open menu">
          <List size={28} color="#fff" />
        </button>
        <Link to="/" className="mobile-header-logo" onClick={handleCloseMenu}>
          <img src={image} alt="OverCut Logo" />
        </Link>
      </header>

      {menuOpen && (
        <div className="mobile-header-menu">
          {/* Botón de cerrar */}
          <button className="close-button" onClick={handleCloseMenu} aria-label="Close menu">
            <X size={32} color="#fff" />
          </button>

          <nav>
            <ul>

            {isLogged && (
              <li>
                <a href={buildDebateUrl()} onClick={handleCloseMenu}>
                  Debate <ChatDots size={16} />
                </a>
              </li>
            )}


              {isLogged && (
                <li>
                  <Link to="/category/2" onClick={handleCloseMenu}>
                    <FormattedMessage id="project.app.Header.quiz" /> <Lightbulb size={16} />
                  </Link>
                </li>
              )}
              <li>
                <Link to={isLogged ? "/minigames" : "/overcutgames-info"} onClick={handleCloseMenu}>
                  <FormattedMessage id="project.app.Header.minigames" /> <Puzzle size={16} />
                </Link>
              </li>
              <li>
                <a href="http://localhost:8083/" onClick={handleCloseMenu}>
                  <FormattedMessage id="project.app.Header.f1hub" /> <GraphUp size={16} />
                </a>
              </li>
              <li>
                <Link to="/about" onClick={handleCloseMenu}>
                  <FormattedMessage id="project.app.Header.about" /> <Book size={16} />
                </Link>
              </li>
              {isLogged && (
                <li>
                  <Link to="/users/ranking" onClick={handleCloseMenu}>
                    <FormattedMessage id="project.app.Header.ranking" /> <Trophy size={16} />
                  </Link>
                </li>
              )}
            </ul>

            {isLogged && (
              <>
                <hr className="mobile-menu-divider" />
                <ul className="user-section">
                  <li className="user-greeting">
                    <PersonCircle size={20} /> {user.userName}
                  </li>
                  <li>
                    <Link to="/users/update-profile" onClick={handleCloseMenu}>
                      <FormattedMessage id="project.users.UpdateProfile.title" /> <PersonCircle size={16} />
                    </Link>
                  </li>
                  <li>
                    <Link to="/users/change-password" onClick={handleCloseMenu}>
                      <FormattedMessage id="project.users.ChangePassword.title" /> <PencilSquare size={16} />
                    </Link>
                  </li>
                  {user.journalist && (
                    <>
                      <li>
                        <Link to="/create-post" onClick={handleCloseMenu}>
                          <FormattedMessage id="project.users.CreatePost.title" /> <PencilSquare size={16} />
                        </Link>
                      </li>
                      <li>
                        <Link to="/post/my" onClick={handleCloseMenu}>
                          <FormattedMessage id="project.users.MyPosts.title" /> <PencilSquare size={16} />
                        </Link>
                      </li>
                    </>
                  )}
                  <li>
                    <Link to="/users/logout" onClick={handleCloseMenu}>
                      <FormattedMessage id="project.app.Header.logout" /> <BoxArrowRight size={16} />
                    </Link>
                  </li>
                </ul>
              </>
            )}

            {!isLogged && (
              <>
                <hr className="mobile-menu-divider" />
                <ul>
                  <li>
                    <Link to="/users/login" onClick={handleCloseMenu}>
                      <FormattedMessage id="project.app.Header.login" />
                    </Link>
                  </li>
                  <li>
                    <Link to="/users/signUp" onClick={handleCloseMenu}>
                      <FormattedMessage id="project.users.SignUp.title" />
                    </Link>
                  </li>
                </ul>
              </>
            )}
          </nav>
        </div>
      )}
    </>
  );
};

export default MobileHeader;
