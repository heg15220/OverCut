import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import * as selectors from '../selectors';
import * as actions from '../actions';
import * as UserSelector from '../../users/selectors';
import QuizList from "./QuizList";
import {useNavigate} from "react-router-dom";

const Quiz = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const user = useSelector(UserSelector.getUser);

    useEffect(() => {
        if (user.id) {
            dispatch(actions.createQuiz(user.id, (quiz) =>  navigate(`/quiz/quiz-list/${quiz}`), () => {}));
        }
    }, [dispatch, user]);
};

export default Quiz;
