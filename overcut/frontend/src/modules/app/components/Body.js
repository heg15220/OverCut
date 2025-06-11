import React from "react";
import { Route, Routes } from "react-router-dom";
import { useSelector } from 'react-redux';
import './App.css'

import users, { Login, SignUp, UpdateProfile, ChangePassword, UserDetails, Logout } from '../../users';
import RankingPage from '../../users/components/RankingPage';
import Home from "./Home";
import {Quiz} from "../../quiz";
import QuizList from "../../quiz/components/QuizList";
import QuestionDetails from "../../quiz/components/QuestionDetails";
import Awards from "../../quiz/components/Awards";
import AwardsList from "../../quiz/components/AwardsList";
import AwardsUserList from "../../quiz/components/AwardsUserList";
import MinigamesHome from "../../tictactoe/components/MinigamesHome";
import TicTacToe from "../../tictactoe/components/TicTacToe";
import TicTacToeGame from "../../tictactoe/components/TicTacToeGame";
import GridGamePage from "../../gridgame/components/GridGamePage";

import Crossword from "../../crossword/components/Crossword";

import GuessDriverGame from "../../guessDriver/components/GuessDriverGame";

import Top10GamePage from "../../top10game/components/Top10GamePage";

import DriversLinkGame from "../../driversLink/components/DriversLinkGame";

import RondoGame from "../../rondo/components/RondoGame";

import CareerPathGame from "../../careerPath/components/CareerPathGame";

import WordleGame from "../../wordle/components/WordleGame";

import TwoTeamsGame from "../../twoTeams/components/TwoTeamsGame";

import F1ImpostorGame from "../../f1impostor/components/F1ImpostorGame";

import TeamGuessGame from "../../teamGuess/components/TeamGuessGame";


import DriversConnectionsGame from "../../driversConnections/components/DriversConnectionsGame";

import OrderDriverGame from "../../orderDriver/components/OrderDriverGame";

import CategoryGame from "../../categoryGame/components/CategoryGame";


import WordSearchGame from '../../wordSearch/components/WordSearchGame';


import { AddImage, CreatePost, ModifyPost, PostDetails, UserPostList, PostSectionEditor,
 PostSectionModifier } from "../../posts";
import {
    Circuits,
    CircuitDetailsModal,
    CircuitDetails,
    CircuitList,
    AllCircuits,
    PodiumDetails,
    PodiumList
} from '../../historic';

import {MyCalendar} from "../../events";
import EventDetails from "../../events/components/EventDetails";
import CreateEventForm from "../../events/components/CreateEventForm";
import EventsList from "../../events/components/EventsList";
import MyCustomCalendar from "../../events/components/MyCustomCalendar";
import TeamsPage from "../../historic/components/TeamsPage";
import TeamsVictoriesCircuitBarChart from "../../historic/components/TeamsVictoriesCircuitBarChart";
import UserAwardConfirmed from "../../quiz/components/UserAwardConfirmed";




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
                    {loggedIn && <Route path="/users/ranking" element={<RankingPage />} />}
                    {loggedIn && <Route path="/user/user-details/:id" element={<UserDetails />} />}
                    {loggedIn && <Route path="/users/update-profile" element={<UpdateProfile />} />}
                    {loggedIn && <Route path="/users/change-password" element={<ChangePassword/>}/>}
                    <Route path="/post/post-details/:id" element={<PostDetails />} />
                    {loggedIn && <Route path="/post/createPost" element={<CreatePost/>}/>}
                    {loggedIn && <Route path="/create-post" element={<PostSectionEditor />} />}
                    {loggedIn && <Route path="/post/my" element={<UserPostList/>}/>}
                    {loggedIn && <Route path="/posts/:id" element={<PostSectionModifier/>}/>}
                    {loggedIn && <Route path="/posts/:id/add-image" element={<AddImage/>}/>}
                    {loggedIn && <Route path="/category/2" element={<Quiz />} />}
                    {loggedIn && <Route path="/quiz/quiz-list/:id" element={<QuizList />} />}
                    {loggedIn && <Route path="/question/question-details/:id" element={<QuestionDetails />} />}
                    {loggedIn && <Route path="/user/awards-user" element={<AwardsList />} />}
                    {loggedIn && <Route path="/award/award-details/:id" element={<Awards />} />}
                    {loggedIn && <Route path="/user/awards" element={<AwardsUserList />} />}
                    <Route path="/circuits" element={<Circuits />} />
                    <Route path="/historic/circuits/circuit/:id}" element={<CircuitDetailsModal />} />
                    <Route path="/circuits/category/:id" element={<CircuitList />} />
                    <Route path="/circuit/circuit-details/:id" element={<CircuitDetails />} />
                    <Route path="/circuits/category/3`" element={<AllCircuits />} />
                    <Route path='/circuit/circuit-details/:id' element={<CircuitDetails />} />
                    <Route path='/circuit/circuit-details/podium/podium-details/:id' element={<PodiumDetails />} />
                    <Route path='/circuit/:id/podiums' element={<PodiumList />} />
                    {loggedIn && <Route path="/events/create" element={<CreateEventForm/>}/>}
                    {loggedIn && <Route path="/events/event-list" element={<EventsList/>}/>}
                    <Route path="/calendar" element={<MyCustomCalendar />} />
                    <Route path="/event/event-details/:id" element={<EventDetails />} />
                    <Route path="/historic/stats" element={<TeamsPage />} />
                    <Route path="/circuit/:id/stats" element={<TeamsVictoriesCircuitBarChart />} />
                    {loggedIn && <Route path="/:id/user-award-confirmed" element={<UserAwardConfirmed />} />}
                    {loggedIn && <Route path="/minigames" element={<MinigamesHome />} />}
                    {loggedIn && <Route path="/minigames/tictactoe" element={<TicTacToe />} />}
                    {loggedIn && <Route path="/minigames/tictactoe/game/:id" element={<TicTacToeGame />} />}
                    {loggedIn && <Route path="/minigames/crossword" element={<Crossword />} />}
                    {loggedIn && <Route path="/minigames/gridgame" element={<GridGamePage />} />}
                    {loggedIn && <Route path="/minigames/guessDriver" element={<GuessDriverGame />} />}
                    {loggedIn && <Route path="/minigames/top10" element={<Top10GamePage />} />}
                    {loggedIn && <Route path="/minigames/driverslink" element={<DriversLinkGame />} />}
                    {loggedIn && <Route path="/minigames/rondo" element={<RondoGame />} />}
                    {loggedIn && <Route path="/minigames/careerPath" element={<CareerPathGame />} />}
                    {loggedIn && <Route path="/minigames/wordle" element={<WordleGame />} />}
                    {loggedIn && <Route path="/minigames/twoTeams" element={<TwoTeamsGame />} />}
                    {loggedIn && <Route path="/minigames/f1Impostor" element={<F1ImpostorGame />} />}
                    {loggedIn && <Route path="/minigames/teamGuess" element={<TeamGuessGame />} />}
                    {loggedIn && <Route path="/minigames/driversConnections" element={<DriversConnectionsGame />} />}
                    {loggedIn && <Route path="/minigames/orderDrivers" element={<OrderDriverGame />} />}
                    {loggedIn && <Route path="/minigames/categoryGame" element={<CategoryGame />} />}
                    <Route path="/minigames/wordSearch" element={<WordSearchGame />} />

                </Route>
            </Routes>
        </div>
    );
};

export default Body;
