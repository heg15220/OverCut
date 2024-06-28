
const getModuleState = state => state.quiz;
export const getQuizQuestions = (state) => getModuleState(state).questions;
export const getUserAnswersForQuiz = (state) => getModuleState(state).userAnswers;
export const getUserAssessments = (state) => getModuleState(state).userAssessments;
export const getQuestionDetails = (state) => getModuleState(state).question;