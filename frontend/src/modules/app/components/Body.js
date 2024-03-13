import React from "react";
import { Route, Routes } from "react-router-dom";
import {useSelector} from 'react-redux';
import './App.css'



import users, { Login, SignUp,UpdateProfile, ChangePassword, UserDetails } from '../../users';;



const Body = () => {

    const loggedIn = useSelector(users.selectors.isLoggedIn);

    return (
        <div className="Body">
            <Routes>
                <Route path="/">
                    <Route path="/users/signUp" element={<SignUp />} />
                    <Route path="/users/login" element={<Login />} />
                    {loggedIn && <Route path="/user/user-details/:id" element={<UserDetails />} />}
                    {loggedIn && <Route path="/users/update-profile" element={<UpdateProfile />} />}
                    {loggedIn && <Route path="/users/change-password" element={<ChangePassword/>}/>}
                </Route>
            </Routes>
        </div>
    );
};

export default Body;
