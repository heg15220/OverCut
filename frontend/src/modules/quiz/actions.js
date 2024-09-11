import backend from "../../backend";
import {appFetch, fetchConfig} from "../../backend/appFetch";
import * as actionTypes from "../quiz/actionTypes";
import awards from "./components/Awards";


const createQuizCompleted = (quiz) => ({
    type: actionTypes.CREATE_QUIZ_COMPLETED,
    quiz
});


const chooseAnswerCompleted = (answer) => ({
    type: actionTypes.CHOOSE_ANSWER_COMPLETED,
    answer
});


const getQuizQuestionsCompleted = (questions) => ({
    type: actionTypes.GET_QUIZ_QUESTIONS_COMPLETED,
    questions
});

const getQuestionDetailsCompleted = (question) => ({
    type: actionTypes.GET_QUESTION_DETAILS_COMPLETED,
    question
});

const getUserAnswersCompleted = (userAnswers) => ({
    type: actionTypes.GET_USER_ANSWERS_FOR_QUIZ_COMPLETED,
    userAnswers
});

const getUserAssessmentsCompleted = (userAssessments) => ({
    type: actionTypes.GET_USER_ASSESSMENTS_COMPLETED,
    userAssessments
});

const getAnswersForQuestionCompleted = (answers) => ({
    type: actionTypes.GET_ANSWERS_FOR_QUESTION_COMPLETED,
    answers
});

const findQuizByIdCompleted = (quiz) => ({
    type: actionTypes.FIND_QUIZ_BY_ID_COMPLETED,
    quiz
})

const getAvailableAwardsCompleted = (awards) => ({
    type: actionTypes.GET_AVAILABLE_AWARDS_COMPLETED,
    awards
});

const getAwardCompleted = (award) => ({
    type:actionTypes.GET_AWARD_COMPLETED,
    award
});

const chooseAwardCompleted = (awardId) => ({
    type:actionTypes.CHOOSE_AWARD_COMPLETED,
    awardId
});

const getAwardsSelectedByUserCompleted = (awards) => ({
    type:actionTypes.GET_AWARDS_SELECTED_BY_USER_COMPLETED,
    awards
});

const getQuizPointsCompleted = (quizPoints) => ({
    type:actionTypes.GET_QUIZ_POINTS_COMPLETED,
    quizPoints
});

const getAvailableQuizPointsCompleted = (availableQuizPoints) => ({
    type:actionTypes.GET_AVAILABLE_QUIZ_POINTS_COMPLETED,
    availableQuizPoints
});

export const createQuiz = (userId, onSuccess, onErrors) => dispatch =>
    backend.quizService.createQuiz(userId, quiz => {
            dispatch(createQuizCompleted(quiz));
            onSuccess(quiz);
        },
        onErrors);

export const chooseAnswer = (quizId,answer, onSuccess, onErrors) => dispatch =>
    backend.quizService.chooseAnswer(quizId,answer, answer => {
            dispatch(chooseAnswerCompleted(answer));
            onSuccess(answer);
        },
        onErrors);

export const getQuizQuestions = (quiz,onSuccess, onErrors) => dispatch =>
    backend.quizService.getQuizQuestions(quiz, questions => {
            dispatch(getQuizQuestionsCompleted(questions));
            onSuccess(questions);
        },
        onErrors);


export const getQuestionDetails = (questionId,onSuccess, onErrors) => dispatch =>
    backend.quizService.getQuestionDetails(questionId, question => {
            dispatch(getQuestionDetailsCompleted(question));
            onSuccess(question);
        },
        onErrors);

export const getUserAnswersForQuiz = (userAnswers,onSuccess, onErrors) => dispatch =>
    backend.quizService.getUserAnswersForQuiz(userAnswers, userAnswers => {
            dispatch(getUserAnswersCompleted(userAnswers));
            onSuccess(userAnswers);
        },
        onErrors);

export const getUserAssessments = (userAssessments,onSuccess, onErrors) => dispatch =>
    backend.quizService.getUserAssessments(userAssessments, userAssessments => {
            dispatch(getUserAssessmentsCompleted(userAssessments));
            onSuccess(userAssessments);
        },
        onErrors);

export const getAnswersForQuestion = (questionId,onSuccess, onErrors) => dispatch =>
    backend.quizService.getAnswersForQuiz(questionId, answers => {
            dispatch(getAnswersForQuestionCompleted(answers));
            onSuccess(answers);
        },
        onErrors);
export const findQuizById = (quizId, onSuccess,onErrors) => dispatch =>
    backend.quizService.findQuizById(quizId, quiz => {
        dispatch(findQuizByIdCompleted(quiz));
        onSuccess(quiz);
    },
        onErrors);

export const getAvailableAwards = (awards, onSuccess,onErrors) => dispatch =>
    backend.quizService.getAvailableAwards(awards, awards => {
            dispatch(getAvailableAwardsCompleted(awards));
            onSuccess(awards);
        },
        onErrors);

export const getAward = (award, onSuccess,onErrors) => dispatch =>
    backend.quizService.getAward(award, award => {
            dispatch(getAwardCompleted(award));
            onSuccess(award);
        },
        onErrors);

export const chooseAward = (award, onSuccess,onErrors) => dispatch =>
    backend.quizService.chooseAward(award, awardId => {
            dispatch(chooseAwardCompleted(awardId));
            onSuccess(awardId);
        },
        onErrors);

export const getAwardsSelectedByUser = (userAwards, onSuccess, onErrors) => dispatch =>
    backend.quizService.getAwardsSelectedByUser(userAwards,awards => {
        dispatch(getAwardsSelectedByUserCompleted(awards));
        onSuccess(awards);
    },
        onErrors);

export const getQuizPoints = (quizPoints, onSuccess) => dispatch =>
    backend.quizService.getQuizPoints(quizPoints, quizPoints => {
        dispatch(getQuizPointsCompleted(quizPoints));
        onSuccess(quizPoints);
    });

export const getAvailableQuizPoints = (quizId, onSuccess) => dispatch =>
    backend.quizService.getAvailableQuizPoints(quizId, availableQuizPoints => {
        dispatch(getAvailableQuizPointsCompleted(availableQuizPoints));
        onSuccess(availableQuizPoints);
    });
