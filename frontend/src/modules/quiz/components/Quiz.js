import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import * as selectors from '../selectors';
import * as actions from '../actions';
import * as UserSelector from '../../users/selectors';
import QuizQuestions from "./QuizQuestions";
import QuizList from "./QuizList";

const Quiz = () => {
    const dispatch = useDispatch();
    const user = useSelector(UserSelector.getUser);
    const quiz = useSelector(selectors.findQuiz);
    useEffect(() => {
        if (user.id) {
            dispatch(actions.createQuiz(user.id, () => {}, () => {}));
        }
    }, [dispatch, user]);

    useEffect(() => {
        // Verifica si 'quiz' existe antes de intentar acceder a 'quiz.id'
        if (quiz && quiz.id) {
            dispatch(actions.findQuizById(quiz.id, () => {}, () => {}));
        }
    }, [dispatch, quiz]); // Incluye 'quiz' en la lista de dependencias

    return (
        <QuizList key={quiz.id} />
    );
};

export default Quiz;
