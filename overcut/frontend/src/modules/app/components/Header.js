import React from "react";
import { Link } from 'react-router-dom';
import users from '../../users';
import { useSelector } from 'react-redux';
import { FormattedMessage } from 'react-intl';
import Notifications from "./Notifications";
import './App.css';
import UserAvatar from "../../users/components/UserAvatar";
import CreateJournalistButton from '../../users/components/CreateJournalistButton';
import {
  Lightbulb,
  Puzzle,
  GraphUp,
  Book,
  Trophy
} from 'react-bootstrap-icons';
import image from './Resources/LogoOverCut.png';
import UserDetailsLink from '../../users/components/UserDetailsLink';

const Header = () => {
  const isLogged = useSelector(users.selectors.isLoggedIn);
  const userName = useSelector(users.selectors.getUserName);
  const user = useSelector(users.selectors.getUser);

  return (
    <header className="header">
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
        <div className="container-fluid">

          {/* Brand center-aligned */}
          <Link className="navbar-brand mx-auto d-lg-none text-center" to="/">
            <img src={image} alt="OverCut Logo" height="90" className="d-inline-block align-top" />
            <span className="ms-2 overcut-text overcut-text-animation">OverCut</span>
          </Link>

          {/* Hamburger button */}
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarContent" aria-controls="navbarContent" aria-expanded="false" aria-label="Toggle navigation">
            <span className="navbar-toggler-icon"></span>
          </button>

          {/* Brand for desktop */}
          <Link className="navbar-brand d-none d-lg-flex align-items-center" to="/">
            <img src={image} alt="OverCut Logo" height="60" className="d-inline-block align-top" />
            <span className="ms-2 overcut-text overcut-text-animation">OverCut</span>
          </Link>

          <div className="collapse navbar-collapse" id="navbarContent">
            <ul className="navbar-nav ms-auto mb-2 mb-lg-0">

              {isLogged && (
                <>
                  <li className="nav-item">
                    <Link className="nav-link" to="/category/2">
                      <FormattedMessage id="project.app.Header.quiz" /> <Lightbulb size={16} />
                    </Link>
                  </li>

                  <li className="nav-item">
                    <Link className="nav-link" to="/minigames">
                      <FormattedMessage id="project.app.Header.minigames" /> <Puzzle size={16} />
                    </Link>
                  </li>
                </>
              )}

              <li className="nav-item">
                <a className="nav-link" href="http://localhost:8083/">
                  <FormattedMessage id="project.app.Header.f1hub" defaultMessage="F1Hub" /> <GraphUp size={16} />
                </a>
              </li>

              <li className="nav-item">
                <Link className="nav-link" to="/about">
                  <FormattedMessage id="project.app.Header.about" defaultMessage="¿Qué es OverCut?" /> <Book size={16} />
                </Link>
              </li>

              {isLogged && (
                <li className="nav-item">
                  <Link className="nav-link" to="/users/ranking">
                    <FormattedMessage id="project.app.Header.ranking" /> <Trophy size={16} />
                  </Link>
                </li>
              )}

              {isLogged && (
                <li className="nav-item dropdown">
                  <a
                    className="nav-link dropdown-toggle d-flex align-items-center"
                    href="#"
                    id="userMenu"
                    role="button"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    <UserAvatar image={user.image} userName={user.userName} size={42} />
                  </a>
                  <ul className="dropdown-menu dropdown-menu-end dropdown-custom shadow" aria-labelledby="userMenu">
                    <UserDetailsLink id={user.id} name={userName} />
                    <Link className="dropdown-item" to="/users/update-profile">
                      <FormattedMessage id="project.users.UpdateProfile.title" />
                    </Link>
                    <Link className="dropdown-item" to="/users/change-password">
                      <FormattedMessage id="project.users.ChangePassword.title" />
                    </Link>

                    {user.journalist && (
                      <>
                        <Link className="dropdown-item" to="/create-post">
                          <FormattedMessage id="project.users.CreatePost.title" />
                        </Link>
                        <Link className="dropdown-item" to="/post/my">
                          <FormattedMessage id="project.users.MyPosts.title" />
                        </Link>
                      </>
                    )}

                    {user.admin && <CreateJournalistButton />}

                    <li><hr className="dropdown-divider" /></li>
                    <Link className="dropdown-item" to="/users/logout">
                      <FormattedMessage id="project.app.Header.logout" />
                    </Link>
                  </ul>
                </li>
              )}

              {!isLogged && (
                <>
                  <li className="nav-item">
                    <Link className="nav-link" to="/users/login">
                      <FormattedMessage id="project.app.Header.login" />
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link className="nav-link" to="/users/signUp">
                      <FormattedMessage id="project.users.SignUp.title" />
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;
