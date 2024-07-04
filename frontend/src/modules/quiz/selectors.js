
const getModuleState = state => state.quiz;
export const getQuizQuestions = (state) => getModuleState(state).questions;
export const getUserAnswersForQuiz = (state) => getModuleState(state).userAnswers;
export const getUserAssessments = (state) => getModuleState(state).userAssessments;
export const getQuestionDetails = (state) => getModuleState(state).question;
export const findQuiz = (state) => getModuleState(state).quiz;
export const getAnswers = (state) => getModuleState(state).answers;
export const getAnswer = (state) => getModuleState(state).answer;
export const getAvailableAwards = (state) => getModuleState(state).awards;
export const getAward = (state) => getModuleState(state).award;