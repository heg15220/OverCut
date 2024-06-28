import { combineReducers } from 'redux';

import * as actionTypes from './actionTypes';

const initialState = {
    quiz: null,
    answer:null,
    questions: null,
    question: null,
    userAnswers: null,
    userAssessments: null,
};

const quiz = (state = initialState.quiz, action) => {
    if (action.type === actionTypes.CREATE_QUIZ_COMPLETED) {
        return action.quiz;
    } else {
        return state;
    }
}

const answer = (state = initialState.answer, action) => {
    if (action.type === actionTypes.CHOOSE_ANSWER_COMPLETED) {
        return action.answer;
    } else {
        return state;
    }
}

const questions = (state = initialState.questions, action) => {
    if (action.type === actionTypes.GET_QUIZ_QUESTIONS_COMPLETED) {
        return action.questions;
    } else {
        return state;
    }
}

const question = (state = initialState.question, action) => {
    if (action.type === actionTypes.GET_QUESTION_DETAILS_COMPLETED) {
        return action.question;
    } else {
        return state;
    }
}

const userAnswers = (state = initialState.userAnswers, action) => {
    if (action.type === actionTypes.GET_USER_ANSWERS_FOR_QUIZ_COMPLETED) {
        return action.userAnswers;
    } else {
        return state;
    }
}

const userAssessments = (state = initialState.userAssessments, action) => {
    if (action.type === actionTypes.GET_USER_ASSESSMENTS_COMPLETED) {
        return action.userAssessments;
    } else {
        return state;
    }
}

const reducer = combineReducers({
    quiz,
    answer,
    questions,
    question,
    userAnswers,
    userAssessments,
});
export default reducer;