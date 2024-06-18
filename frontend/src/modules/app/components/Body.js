import React from "react";
import { Route, Routes } from "react-router-dom";
import {useSelector} from 'react-redux';
import './App.css'



import users, {Login, SignUp, UpdateProfile, ChangePassword, UserDetails, Logout} from '../../users';
import Home from "./Home";
import {AddImage, CreatePost, ModifyPost, PostDetails, UserPostList} from "../../posts";
import {MyCalendar} from "../../events";
import EventDetails from "../../events/components/EventDetails";
import CreateEventForm from "../../events/components/CreateEventForm";
import EventsList from "../../events/components/EventsList";




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
                    {loggedIn && <Route path="/events/event/create" element={<CreateEventForm/>}/>}
                    {loggedIn && <Route path="/events/event-list" element={<EventsList/>}/>}
                    <Route path="/calendar" element={<MyCalendar />} />
                    <Route path="/event/event-details/:id" element={<EventDetails />} />

                </Route>
            </Routes>
        </div>
    );
};

export default Body;
