import * as actionTypes from './actionTypes';
import backend from '../../backend';

const signUpCompleted = authenticatedUser => ({
    type: actionTypes.SIGN_UP_COMPLETED,
    authenticatedUser
});

const getUserPointsCompleted = (points) => ({
    type:actionTypes.GET_USER_POINTS_COMPLETED,
    points
});

export const signUp = (user, onSuccess, onErrors, reauthenticationCallback) => dispatch =>
    backend.userService.signUp(user,
        authenticatedUser => {
            dispatch(signUpCompleted(authenticatedUser));
            onSuccess();
        },
        onErrors,
        reauthenticationCallback);

const loginCompleted = authenticatedUser => ({
    type: actionTypes.LOGIN_COMPLETED,
    authenticatedUser
});

export const login = (userName, password, onSuccess, onErrors, reauthenticationCallback) => dispatch =>
    backend.userService.login(userName, password,
        authenticatedUser => {
            dispatch(loginCompleted(authenticatedUser));
            onSuccess();
        },
        onErrors,
        reauthenticationCallback
    );

export const logout = () => {

    backend.userService.logout();

    return { type: actionTypes.LOGOUT };

};

export const updateProfileCompleted = user => ({
    type: actionTypes.UPDATE_PROFILE_COMPLETED,
    user
});

export const updateProfile = (user, onSuccess, onErrors) => dispatch =>
    backend.userService.updateProfile(user,
        user => {
            dispatch(updateProfileCompleted(user));
            onSuccess();
        },
        onErrors);

const addUserImageCompleted = (user) => ({
    type: actionTypes.ADD_IMAGE_COMPLETED,
    user
});

export const addUserImage = (user, file, onSuccess, onErrors) =>
    dispatch => {
        backend.userService.uploadUserImage(user, file, (result) => {
                dispatch(addUserImageCompleted(result));
                onSuccess();
            },
            onErrors);
    }
export const changePassword = (id, oldPassword, newPassword, onSuccess, onErrors) => dispatch =>
    backend.userService.changePassword(id, oldPassword, newPassword, onSuccess, onErrors);

export const getUserPoints = (userId, onSuccess, onErrors) => dispatch =>
    backend.userService.getUserPoints(userId, (points) => {
        dispatch(getUserPointsCompleted(points));
        onSuccess(points);
    },
        onErrors);