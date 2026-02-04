import React, { useState, useRef, useEffect } from "react";
import { Link } from 'react-router-dom';
import users from '../../users';
import { useSelector } from 'react-redux';
import { FormattedMessage } from 'react-intl';
import Notifications from "./Notifications";
import './App.css';
import UserAvatar from "../../users/components/UserAvatar";
import CreateJournalistButton from '../../users/components/CreateJournalistButton';
import CreateJournalistDialog from "../../users/components/CreateJournalistDialog";
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

  const [showDropdown, setShowDropdown] = useState(false);
  const [openCreateJournalist, setOpenCreateJournalist] = useState(false); // ⬅️ nuevo estado global

  const handleToggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  const handleDropdownClick = () => {
    setShowDropdown(false);
  };

  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <>
      <header className="header">
        <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
          <div className="container-fluid">

            {/* Brand mobile */}
            <Link className="navbar-brand mx-auto d-lg-none text-center" to="/">
              <img src={image} alt="OverCut Logo" className="header-logo" />
              <span className="ms-2 overcut-text overcut-text-animation">OverCut</span>
            </Link>

            {/* Hamburger */}
            <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarContent">
              <span className="navbar-toggler-icon"></span>
            </button>

            {/* Brand desktop */}
            <Link className="navbar-brand d-none d-lg-flex align-items-center" to="/">
              <img src={image} alt="OverCut Logo" className="header-logo" />
              <span className="ms-2 overcut-text overcut-text-animation">OverCut</span>
            </Link>

            <div className="collapse navbar-collapse" id="navbarContent">
              <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
                {isLogged && (
                  <li className="nav-item">
                    <Link className="nav-link" to={isLogged ? "/category/2" : "/quiz-info"}>
                      <FormattedMessage id="project.app.Header.quiz" /> <Lightbulb size={16} />
                    </Link>
                  </li>
                )}

                <li className="nav-item">
                  <Link
                    className="nav-link"
                    to={isLogged ? "/minigames" : "/overcutgames-info"}
                  >
                    <FormattedMessage id="project.app.Header.minigames" /> <Puzzle size={16} />
                  </Link>
                </li>

                <li className="nav-item">
                  <a className="nav-link" href="http://localhost:8083/">
                    <FormattedMessage id="project.app.Header.f1hub" /> <GraphUp size={16} />
                  </a>
                </li>

                <li className="nav-item">
                  <Link className="nav-link" to="/about">
                    <FormattedMessage id="project.app.Header.about" /> <Book size={16} />
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
                  <li className="nav-item">
                    <button
                      className="avatar-button"
                      onClick={handleToggleDropdown}
                      aria-label="User Menu"
                    >
                      <UserAvatar image={user.image} userName={user.userName} size={42} />
                    </button>
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

      {/* ✅ Dropdown */}
      {isLogged && showDropdown && (
        <div className="user-dropdown-container" ref={dropdownRef}>
          <ul className="dropdown-custom shadow">
            <UserDetailsLink id={user.id} name={userName} onClick={handleDropdownClick} />

            <Link className="dropdown-item" to="/users/update-profile" onClick={handleDropdownClick}>
              <FormattedMessage id="project.users.UpdateProfile.title" />
            </Link>
            <Link className="dropdown-item" to="/users/change-password" onClick={handleDropdownClick}>
              <FormattedMessage id="project.users.ChangePassword.title" />
            </Link>

            {user.journalist && (
              <>
                <Link className="dropdown-item" to="/create-post" onClick={handleDropdownClick}>
                  <FormattedMessage id="project.users.CreatePost.title" />
                </Link>
                <Link className="dropdown-item" to="/post/my" onClick={handleDropdownClick}>
                  <FormattedMessage id="project.users.MyPosts.title" />
                </Link>
              </>
            )}

            {user.admin && (
              <CreateJournalistButton openDialog={() => setOpenCreateJournalist(true)} />
            )}

            <li><hr className="dropdown-divider" /></li>
            <Link className="dropdown-item" to="/users/logout" onClick={handleDropdownClick}>
              <FormattedMessage id="project.app.Header.logout" />
            </Link>
          </ul>
        </div>
      )}

      {/* ✅ Diálogo montado fuera del dropdown */}
      <CreateJournalistDialog
        open={openCreateJournalist}
        onClose={() => setOpenCreateJournalist(false)}
      />
    </>
  );
};

export default Header;
