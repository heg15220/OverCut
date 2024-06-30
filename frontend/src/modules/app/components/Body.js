import React from "react";
import { Route, Routes } from "react-router-dom";
import {useSelector} from 'react-redux';
import './App.css'



import users, {Login, SignUp, UpdateProfile, ChangePassword, UserDetails, Logout} from '../../users';
import Home from "./Home";
import {AddImage, CreatePost, ModifyPost, PostDetails, UserPostList} from "../../posts";
import {Quiz} from "../../quiz";
import QuizList from "../../quiz/components/QuizList";




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
                    {loggedIn && <Route path="/category/2" element={<Quiz />} />}
                    {loggedIn && <Route path="/quiz/quiz-list/:id" element={<QuizList />} />}
                </Route>
            </Routes>
        </div>
    );
};

export default Body;
