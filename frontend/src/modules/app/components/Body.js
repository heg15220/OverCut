import React from "react";
import { Route, Routes } from "react-router-dom";
import { useSelector } from 'react-redux';
import './App.css'

import users, { Login, SignUp, UpdateProfile, ChangePassword, UserDetails, Logout } from '../../users';
import Home from "./Home";
import { AddImage, CreatePost, ModifyPost, PostDetails, UserPostList } from "../../posts";
import { Circuits, CircuitDetailsModal } from '../../historic';
import {CircuitList} from "../../historic"; // Asegúrate de que esta ruta sea correcta





const Body = () => {

    const loggedIn = useSelector(users.selectors.isLoggedIn);

    return (
        <div className="Body">
            <Routes>
                <Route path="/">
                    <Route index exact element={<Home />} />
                    <Route path="/users/signUp" element={<SignUp />} />
                    <Route path="/users/login" element={<Login />} />
                    <Route path="/users/logout" element={<Logout />} />
                    {loggedIn && <Route path="/user/user-details/:id" element={<UserDetails />} />}
                    {loggedIn && <Route path="/users/update-profile" element={<UpdateProfile />} />}
                    {loggedIn && <Route path="/users/change-password" element={<ChangePassword/>}/>}
                    <Route path="/post/post-details/:id" element={<PostDetails />} />
                    {loggedIn && <Route path="/post/createPost" element={<CreatePost/>}/>}
                    {loggedIn && <Route path="/post/my" element={<UserPostList/>}/>}
                    {loggedIn && <Route path="/posts/:id" element={<ModifyPost/>}/>}
                    {loggedIn && <Route path="/posts/:id/add-image" element={<AddImage/>}/>}
                    <Route path="/circuits" element={<Circuits />} />
                    <Route path="/historic/circuits/circuit/:id}" element={<CircuitDetailsModal />} />
                    <Route path="/circuits/category/:id" element={<CircuitList />} />


                </Route>
            </Routes>
        </div>
    );
};

export default Body;
