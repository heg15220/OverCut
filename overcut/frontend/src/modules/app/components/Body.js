import React from "react";
import { Route, Routes } from "react-router-dom";
import { useSelector } from 'react-redux';
import './App.css'

import users, { Login, SignUp, UpdateProfile, ChangePassword, Logout} from '../../users';
import RankingPage from '../../users/components/RankingPage';
import EmailVerificationPage from '../../users/components/EmailVerificationPage';
import EmailConfirmationPending from '../../users/components/EmailConfirmationPending';
import UserDetails from '../../users/components/UserDetails';
import UserDetailsLink from '../../users/components/UserDetailsLink';
import ConfirmPasswordChangePage from '../../users/components/ConfirmPasswordChangePage';
import PasswordChangeConfirmationPage from '../../users/components/PasswordChangeConfirmationPage';

import AboutOvercut from './AboutOvercut';
import Overcut from './Overcut';

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
import QuizWrapper from "../../quiz/components/Quiz";
import OvercutGamesInfo from '../../common/components/OvercutGamesInfo';
import AdVignetteLayout from '../../common/components/AdVignetteLayout';


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
import LegalNotice from "../../app/components/LegalNotice";
import TermsOfUse from "../../app/components/TermsOfUse";
import PrivacyPolicy from "../../app/components/PrivacyPolicy";
import CookiesPolicy from "../../app/components/CookiesPolicy";
import IntellectualProperty from "../../app/components/IntellectualProperty";
import LegalHub from "../../app/components/LegalHub";

const Body = () => {

    const loggedIn = useSelector(users.selectors.isLoggedIn);
    const withAdVignettes = (element, page, placement = "auto") => (
        <AdVignetteLayout page={page} placement={placement}>{element}</AdVignetteLayout>
    );

    return (
        <div className="Body">
            <Routes>
                <Route path="/">
                    <Route index exact element={<Home />} />
                    <Route path="/users/signUp" element={<SignUp />} />
                    <Route path="/users/login" element={<Login />} />
                    <Route path="/users/logout" element={<Logout />} />
                    {loggedIn && <Route path="/users/ranking" element={withAdVignettes(<RankingPage />, "ranking")} />}
                    {loggedIn && <Route path="/user/user-details/:id" element={<UserDetailsLink />} />}
                    {loggedIn && <Route path="/users/update-profile" element={<UpdateProfile />} />}
                    {loggedIn && <Route path="/users/change-password" element={<ChangePassword/>}/>}
                    <Route path="/post/post-details/:id" element={<PostDetails />} />
                    {loggedIn && <Route path="/post/createPost" element={<CreatePost/>}/>}
                    {loggedIn && <Route path="/create-post" element={<PostSectionEditor />} />}
                    {loggedIn && <Route path="/post/my" element={<UserPostList/>}/>}
                    {loggedIn && <Route path="/posts/:id" element={<PostSectionModifier/>}/>}
                    {loggedIn && <Route path="/posts/:id/add-image" element={<AddImage/>}/>}
                    {loggedIn && <Route path="/category/2" element={withAdVignettes(<QuizWrapper />, "quiz")} />}
                    {loggedIn && <Route path="/quiz/quiz-list/:id" element={withAdVignettes(<QuizList />, "quiz")} />}
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
                    {loggedIn && <Route path="/minigames/tictactoe" element={withAdVignettes(<TicTacToe />, "games")} />}
                    {loggedIn && <Route path="/minigames/tictactoe/game/:id" element={withAdVignettes(<TicTacToeGame />, "games")} />}
                    {loggedIn && <Route path="/minigames/crossword" element={withAdVignettes(<Crossword />, "games", "bottom")} />}
                    {loggedIn && <Route path="/minigames/gridgame" element={withAdVignettes(<GridGamePage />, "games", "bottom")} />}
                    {loggedIn && <Route path="/minigames/guessDriver" element={withAdVignettes(<GuessDriverGame />, "games")} />}
                    {loggedIn && <Route path="/minigames/top10" element={withAdVignettes(<Top10GamePage />, "games")} />}
                    {loggedIn && <Route path="/minigames/driverslink" element={withAdVignettes(<DriversLinkGame />, "games")} />}
                    {loggedIn && <Route path="/minigames/rondo" element={withAdVignettes(<RondoGame />, "games")} />}
                    {loggedIn && <Route path="/minigames/careerPath" element={withAdVignettes(<CareerPathGame />, "games")} />}
                    {loggedIn && <Route path="/minigames/wordle" element={withAdVignettes(<WordleGame />, "games")} />}
                    {loggedIn && <Route path="/minigames/twoTeams" element={withAdVignettes(<TwoTeamsGame />, "games")} />}
                    {loggedIn && <Route path="/minigames/f1Impostor" element={withAdVignettes(<F1ImpostorGame />, "games")} />}
                    {loggedIn && <Route path="/minigames/teamGuess" element={withAdVignettes(<TeamGuessGame />, "games")} />}
                    {loggedIn && <Route path="/minigames/driversConnections" element={withAdVignettes(<DriversConnectionsGame />, "games")} />}
                    {loggedIn && <Route path="/minigames/orderDrivers" element={withAdVignettes(<OrderDriverGame />, "games")} />}
                    {loggedIn && <Route path="/minigames/categoryGame" element={withAdVignettes(<CategoryGame />, "games")} />}
                    <Route path="/minigames/wordSearch" element={withAdVignettes(<WordSearchGame />, "games")} />
                    <Route path="/verify-email" element={<EmailVerificationPage />} />
                    <Route path="/email-confirmation" element={<EmailConfirmationPending />} />
                    {loggedIn && <Route path="/users/profile" element={<UserDetails />} />}
                    {loggedIn && <Route path="/confirm-password-change" element={<ConfirmPasswordChangePage />} />}
                    {loggedIn && <Route path="/password-change-confirmation" element={<PasswordChangeConfirmationPage />} />}
                    <Route path="/about_us" element={<AboutOvercut />} />
                    <Route path="/about" element={<Overcut />} />
                    <Route path="/overcutgames-info" element={<OvercutGamesInfo />} />
                    <Route path="/legal/notice" element={<LegalNotice />} />
                    <Route path="/legal/terms" element={<TermsOfUse />} />
                    <Route path="/legal/privacy" element={<PrivacyPolicy />} />
                    <Route path="/legal/cookies" element={<CookiesPolicy />} />
                    <Route path="/legal/intellectualProperty" element={<IntellectualProperty />} />
                    <Route path="/legal" element={<LegalHub />} />
                </Route>
            </Routes>
        </div>
    );
};

export default Body;
