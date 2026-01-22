import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import users from "../../users";
import { useSelector } from "react-redux";
import { FormattedMessage } from "react-intl";
import Notifications from "./Notifications";
import "./App.css";
import UserAvatar from "../../users/components/UserAvatar";
import CreateJournalistButton from "../../users/components/CreateJournalistButton";
import CreateJournalistDialog from "../../users/components/CreateJournalistDialog";
import {
  Lightbulb,
  Puzzle,
  GraphUp,
  Book,
  Trophy
} from "react-bootstrap-icons";
import image from "./Resources/LogoOverCut.png";
import UserDetailsLink from "../../users/components/UserDetailsLink";

// ✅ NUEVO
import InterstitialAdModal from "../../common/components/InterstitialAdModal";

const Header = () => {
  const navigate = useNavigate();

  const isLogged = useSelector(users.selectors.isLoggedIn);
  const userName = useSelector(users.selectors.getUserName);
  const user = useSelector(users.selectors.getUser);

  const [showDropdown, setShowDropdown] = useState(false);
  const [openCreateJournalist, setOpenCreateJournalist] = useState(false);

  // ✅ NUEVO: Interstitial state
  const [showInterstitial, setShowInterstitial] = useState(false);
  const [pendingNav, setPendingNav] = useState(null);

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

  // ✅ NUEVO: solo activa el interstitial cuando ResultsPage lo ha marcado
  const shouldShowResultsInterstitial = () =>
    sessionStorage.getItem("oc_interstitial_results_active") === "1";

  const openInterstitialAndNavigate = (nav) => {
    setPendingNav(nav);
    setShowInterstitial(true);
  };

  const closeInterstitial = () => {
    setShowInterstitial(false);

    if (pendingNav?.type === "internal") {
      navigate(pendingNav.to);
    } else if (pendingNav?.type === "external") {
      window.location.href = pendingNav.href;
    }

    setPendingNav(null);
  };

  const guardedInternalNav = (to) => (e) => {
    if (!shouldShowResultsInterstitial()) return; // deja navegar normal
    e.preventDefault();
    openInterstitialAndNavigate({ type: "internal", to });
  };

  const guardedExternalNav = (href) => (e) => {
    if (!shouldShowResultsInterstitial()) return;
    e.preventDefault();
    openInterstitialAndNavigate({ type: "external", href });
  };

  return (
    <>
      {/* ✅ Interstitial global del Header */}
      <InterstitialAdModal
        open={showInterstitial}
        onClose={closeInterstitial}
        closeDelayMs={window.innerWidth < 768 ? 3000 : 2500}
        closePosition={window.innerWidth < 768 ? "left" : "right"}
        title="AD"
        subtitle="Sponsored"
      />

      <header className="header">
        <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
          <div className="container-fluid">
            {/* Brand mobile */}
            <Link
              className="navbar-brand mx-auto d-lg-none text-center"
              to="/"
              onClick={guardedInternalNav("/")}
            >
              <img src={image} alt="OverCut Logo" className="header-logo" />
              <span className="ms-2 overcut-text overcut-text-animation">OverCut</span>
            </Link>

            {/* Hamburger */}
            <button
              className="navbar-toggler"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#navbarContent"
            >
              <span className="navbar-toggler-icon"></span>
            </button>

            {/* Brand desktop */}
            <Link
              className="navbar-brand d-none d-lg-flex align-items-center"
              to="/"
              onClick={guardedInternalNav("/")}
            >
              <img src={image} alt="OverCut Logo" className="header-logo" />
              <span className="ms-2 overcut-text overcut-text-animation">OverCut</span>
            </Link>

            <div className="collapse navbar-collapse" id="navbarContent">
              <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
                {isLogged && (
                  <li className="nav-item">
                    <Link
                      className="nav-link"
                      to="/category/2"
                      onClick={guardedInternalNav("/category/2")}
                    >
                      <FormattedMessage id="project.app.Header.quiz" />{" "}
                      <Lightbulb size={16} />
                    </Link>
                  </li>
                )}

                <li className="nav-item">
                  <Link
                    className="nav-link"
                    to={isLogged ? "/minigames" : "/overcutgames-info"}
                    onClick={guardedInternalNav(isLogged ? "/minigames" : "/overcutgames-info")}
                  >
                    <FormattedMessage id="project.app.Header.minigames" />{" "}
                    <Puzzle size={16} />
                  </Link>
                </li>

                <li className="nav-item">
                  <a
                    className="nav-link"
                    href="http://localhost:8083/"
                    onClick={guardedExternalNav("http://localhost:8083/")}
                  >
                    <FormattedMessage id="project.app.Header.f1hub" />{" "}
                    <GraphUp size={16} />
                  </a>
                </li>

                <li className="nav-item">
                  <Link
                    className="nav-link"
                    to="/about"
                    onClick={guardedInternalNav("/about")}
                  >
                    <FormattedMessage id="project.app.Header.about" />{" "}
                    <Book size={16} />
                  </Link>
                </li>

                {isLogged && (
                  <li className="nav-item">
                    <Link
                      className="nav-link"
                      to="/users/ranking"
                      onClick={guardedInternalNav("/users/ranking")}
                    >
                      <FormattedMessage id="project.app.Header.ranking" />{" "}
                      <Trophy size={16} />
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
                      <Link
                        className="nav-link"
                        to="/users/login"
                        onClick={guardedInternalNav("/users/login")}
                      >
                        <FormattedMessage id="project.app.Header.login" />
                      </Link>
                    </li>
                    <li className="nav-item">
                      <Link
                        className="nav-link"
                        to="/users/signUp"
                        onClick={guardedInternalNav("/users/signUp")}
                      >
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
            {/* OJO: aquí UserDetailsLink quizá devuelve un Link interno.
                Si quieres forzar interstitial también en este click,
                tendrías que modificar UserDetailsLink para aceptar onClick y to. */}
            <UserDetailsLink id={user.id} name={userName} onClick={handleDropdownClick} />

            <Link
              className="dropdown-item"
              to="/users/update-profile"
              onClick={(e) => {
                handleDropdownClick();
                guardedInternalNav("/users/update-profile")(e);
              }}
            >
              <FormattedMessage id="project.users.UpdateProfile.title" />
            </Link>

            <Link
              className="dropdown-item"
              to="/users/change-password"
              onClick={(e) => {
                handleDropdownClick();
                guardedInternalNav("/users/change-password")(e);
              }}
            >
              <FormattedMessage id="project.users.ChangePassword.title" />
            </Link>

            {user?.journalist && (
              <>
                <Link
                  className="dropdown-item"
                  to="/create-post"
                  onClick={(e) => {
                    handleDropdownClick();
                    guardedInternalNav("/create-post")(e);
                  }}
                >
                  <FormattedMessage id="project.users.CreatePost.title" />
                </Link>

                <Link
                  className="dropdown-item"
                  to="/post/my"
                  onClick={(e) => {
                    handleDropdownClick();
                    guardedInternalNav("/post/my")(e);
                  }}
                >
                  <FormattedMessage id="project.users.MyPosts.title" />
                </Link>
              </>
            )}

            {user?.admin && (
              <CreateJournalistButton openDialog={() => setOpenCreateJournalist(true)} />
            )}

            <li>
              <hr className="dropdown-divider" />
            </li>

            <Link
              className="dropdown-item"
              to="/users/logout"
              onClick={(e) => {
                handleDropdownClick();
                guardedInternalNav("/users/logout")(e);
              }}
            >
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
