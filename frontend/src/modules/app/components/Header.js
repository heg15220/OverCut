import React from "react";
import { Link } from 'react-router-dom';
import users from '../../users';
import { useSelector } from 'react-redux';
import { FormattedMessage } from 'react-intl';

import image from './Resources/logo.svg';
import UserDetailsLink from '../../users/components/UserDetailsLink';


const Header = () => {
    const isLogged = useSelector(users.selectors.isLoggedIn);
    const userName = useSelector(users.selectors.getUserName);
    const user = useSelector(users.selectors.getUser);

    return (
        <header>
            <nav className="navbar navbar-dark bg-dark ml-auto">
                <a className="navbar-brand d-inline-block align-top" href="/">
                    <img className="App-logo mx-3" src={image} alt="App Logo" height="65" width="65"></img>
                    <Link className="text-light h4 " style={{ textDecoration: 'none' }} to="/overcut/">
                        OverCut
                    </Link>
                </a>
                <ul className="nav pull-xs-right">

                    {isLogged &&
                        <li className="nav-item dropstart">

                            <a id="loginName" className="dropdown-toggle nav-link" href="/"
                               data-bs-toggle="dropdown" style={{ color: '#9900FF' }}>
                                <span className="fa-solid fa-user"></span>&nbsp;
                                {userName}
                            </a>
                            <div className="dropdown-menu">
                                <UserDetailsLink id={user.id} name={userName} />
                                <Link className="dropdown-item" to="/users/update-profile">
                                    <FormattedMessage id="project.users.UpdateProfile.title" />
                                </Link>
                                <Link className="dropdown-item" to="/users/change-password">
                                    <FormattedMessage id="project.users.ChangePassword.title" />
                                </Link>
                                <div className="dropdown-divider"></div>
                                <Link className="dropdown-item" to="/post/createPost" id="createPost">
                                    <FormattedMessage id="project.users.CreatePost.title" />
                                </Link>
                                <Link className="dropdown-item" to="/post/my" id="myPosts">
                                    <FormattedMessage id="project.users.MyPosts.title" />
                                </Link>
                                <div className="dropdown-divider"></div>
                                <Link className="dropdown-item" to="/users/logout">
                                    <FormattedMessage id="project.app.Header.logout" />
                                </Link>
                            </div>

                        </li>
                    }
                    {isLogged &&
                        <li className="nav-item dropstart">
                            {user.image && <img src={"data:image/jpg;base64," + user.image} className="rounded-circle" width="42px" height="42px" alt="Avatar" />}
                            &nbsp;&nbsp;&nbsp;
                        </li>}
                    {!isLogged &&
                        <li className="nav-item">
                            <Link className="nav-link" color="purple" to="/users/login" id="login" data-testid="login-button">
                                <font color="#9900FF">
                                    <FormattedMessage id="project.app.Header.login" />
                                </font>
                            </Link>

                        </li>
                    }
                    {!isLogged &&
                        <li className="nav-item">
                            <Link className="nav-link" to="/users/signUp" id="singUp">
                                <font color="#9900FF"><FormattedMessage id="project.users.SignUp.title" /></font>
                            </Link >
                        </li >
                    }
                </ul >
            </nav >
        </header >
    );
};

export default Header;
