import {
    fetchConfig,
    appFetch,
} from "./appFetch";

export const createQuiz = (userId, lang, onSuccess, onErrors) => {
    appFetch(
        `/quiz/create?lang=${lang}`,
        fetchConfig("POST", userId),
        onSuccess,
        onErrors
    );
};

export const getQuizQuestionsType = (quizId,lang, onSuccess, onErrors) => {

    appFetch(
        `/quiz/${quizId}/quizType?lang=${lang}`,
        fetchConfig("GET"),
        onSuccess,
        onErrors
    );
};

export const getQuizQuestionsCategory = (quizId, lang, onSuccess, onErrors) => {

    appFetch(
        `/quiz/${quizId}/quizCategory?lang=${lang}`,
        fetchConfig("GET"),
        onSuccess,
        onErrors
    );
};

// Seleccionar una respuesta para una pregunta específica en un cuestionario
export const chooseAnswer = (quizId, answerParams, onSuccess, onErrors) => {
    appFetch(
        `/quiz/${quizId}/answer`,
        fetchConfig("POST", answerParams),
        onSuccess,
        onErrors
    );
};

// Obtener preguntas de un cuestionario específico
export const getQuizQuestions = ({ quizId, page },onSuccess, onErrors) => {
    appFetch(
        `/quiz/${quizId}/questions?page=${page}`,
        fetchConfig("GET"),
        onSuccess,
        onErrors
    );
};

// Obtener detalles de una pregunta específica
export const getQuestionDetails = (questionId, onSuccess, onErrors) => {
    appFetch(
        `/quiz/question/${questionId}`,
        fetchConfig("GET"),
        onSuccess,
        onErrors
    );
};

// Obtener resultados de respuestas de un usuario para un cuestionario específico
export const getUserAnswersForQuiz = ({quizId, userId, page}, onSuccess, onErrors) => {
    appFetch(
        `/quiz/${quizId}/user/results?page=${page}`,
        fetchConfig("GET", userId),
        onSuccess,
        onErrors
    );
};

// Obtener evaluaciones de un usuario
export const getUserAssessments = ({ userId, page }, onSuccess,onErrors) => {
    appFetch(
        `/quiz/user/assessments?page=${page}`,
        fetchConfig("GET", userId ),
        onSuccess,
        onErrors
    );
};

export const getAnswersForQuiz = (questionId,onSuccess, onErrors) => {
    appFetch(
        `/quiz/${questionId}/answers`,
        fetchConfig("GET"),
        onSuccess,
        onErrors
    );
};
export const findQuizById = (quizId, onSuccess, onErrors) => {
    appFetch(`/quiz/${quizId}`, fetchConfig("GET"), onSuccess, onErrors);
};

export const getAvailableAwards = ({userId,page},onSuccess, onErrors) => {
    appFetch(
        `/quiz/${userId}/awards?page=${page}`,
        fetchConfig("GET"),
        onSuccess,
        onErrors
    );
}

export const getAward = (awardId,onSuccess, onErrors) => {
    appFetch(
        `/quiz/award/${awardId}`,
        fetchConfig("GET"),
        onSuccess,
        onErrors
    );
};

export const chooseAward = ({awardId,userId},onSuccess, onErrors) => {
    appFetch(
        `/quiz/awards/award/${awardId}?userId=${userId}`,
        fetchConfig("GET"),
        onSuccess,
        onErrors
    );
};

export const getAwardsSelectedByUser = ({ userId, page }, onSuccess,onErrors) => {
    appFetch(
        `/quiz/user/${userId}/userAwards?page=${page}`,
        fetchConfig("GET"),
        onSuccess,
        onErrors
    );
};

export const getQuizPoints = ({ quizId, userId }, onSuccess) => {
    appFetch(
        `/quiz/${quizId}/user/${userId}/points`,
        fetchConfig("GET"),
        onSuccess
    );
};

export const getAvailableQuizPoints = (quizId, onSuccess) => {
    appFetch(
        `/quiz/${quizId}/points`,
        fetchConfig("GET"),
        onSuccess
    );
};
