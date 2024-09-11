import { combineReducers } from 'redux';

import * as actionTypes from './actionTypes';

const initialState = {
    quiz: null,
    answer:null,
    questions: null,
    question: null,
    userAnswers: null,
    userAssessments: null,
    answers: null,
    awards:null,
    award:null,
    awardId: null,
    quizPoints: null,
    availableQuizPoints: null,
    userAward: null,
};

const quiz = (state = initialState.quiz, action) => {
    switch (action.type) {
        case actionTypes.CREATE_QUIZ_COMPLETED:
            return action.quiz;

        case actionTypes.FIND_QUIZ_BY_ID_COMPLETED:
            return action.quiz;
        default:
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

const answers = (state = initialState.answers, action) => {
    if (action.type === actionTypes.GET_ANSWERS_FOR_QUESTION_COMPLETED) {
        return action.answers;
    } else {
        return state;
    }
}
const awards = (state = initialState.awards, action) => {
    if (action.type === actionTypes.GET_AVAILABLE_AWARDS_COMPLETED) {
        return action.awards;
    } else {
        if(action.type === actionTypes.GET_AWARDS_SELECTED_BY_USER_COMPLETED){
            return action.awards;
        }else{
            return state;
        }
    }
}
const award = (state = initialState.award, action) => {
    if (action.type === actionTypes.GET_AWARD_COMPLETED) {
        return action.award;
    } else {
        return state;
    }
}

const awardId = (state = initialState.awardId, action) => {
    switch (action.type) {
        case actionTypes.CHOOSE_AWARD_COMPLETED:
            return action.awardId;
        default:
            return state;
    }
}

const quizPoints = (state = initialState.quizPoints, action) => {
    if (action.type === actionTypes.GET_QUIZ_POINTS_COMPLETED) {
        return action.quizPoints;
    } else {
        return state;
    }
}

const availableQuizPoints = (state = initialState.availableQuizPoints, action) => {
    if (action.type === actionTypes.GET_AVAILABLE_QUIZ_POINTS_COMPLETED) {
        return action.availableQuizPoints;
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
    answers,
    awards,
    award,
    awardId,
    quizPoints,
    availableQuizPoints,
});
export default reducer;