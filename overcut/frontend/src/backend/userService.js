import {
    fetchConfig,
    appFetch,
    setServiceToken,
    getServiceToken,
    removeServiceToken,
    setReauthenticationCallback,
} from "./appFetch";

const processLoginSignUp = (authenticatedUser, reauthenticationCallback) => {
    setServiceToken(authenticatedUser.serviceToken);
    setReauthenticationCallback(reauthenticationCallback);
}

export const login = (
    email,
    password,
    onSuccess,
    onErrors,
    reauthenticationCallback
) =>
    appFetch(
        "/users/login",
        fetchConfig("POST", { email, password }),
        (authenticatedUser) => {
            processLoginSignUp(authenticatedUser, reauthenticationCallback);
            onSuccess(authenticatedUser);
        },
        onErrors
    );

export const tryLoginFromServiceToken = (
    onSuccess,
    reauthenticationCallback
) => {
    const serviceToken = getServiceToken();

    if (!serviceToken) {
        onSuccess();
        return;
    }

    setReauthenticationCallback(reauthenticationCallback);

    appFetch(
        "/users/loginFromServiceToken",
        fetchConfig("POST"),
        (authenticatedUser) => onSuccess(authenticatedUser),
        () => removeServiceToken()
    );
};

export const signUp = (user, onSuccess, onErrors) => {
    appFetch(
        "/users/signUp",
        fetchConfig("POST", user),
        () => onSuccess(), // ✅ no se pasa ningún parámetro
        onErrors
    );
};


export const logout = () => removeServiceToken();

export const updateProfile = (user, onSuccess, onErrors) =>
    appFetch(`/users/${user.id}`, fetchConfig("PUT", {
        id: user.id,
        userName: user.userName,
        firstName: user.firstName,
        lastName: user.lastName
    }), onSuccess, onErrors);


export const uploadUserImage = (user, file, onSuccess) =>
    appFetch(`/users/addImage/${user.id}`, fetchConfig("PUT", file), onSuccess);


export const changePassword = (
    id,
    oldPassword,
    newPassword,
    onSuccess,
    onErrors
) =>
    appFetch(
        `/users/${id}/changePassword`,
        fetchConfig("POST", { oldPassword, newPassword }),
        onSuccess,
        onErrors
    );

export const getUserPoints = (userId, onSuccess, onErrors) => {
    appFetch(
        `/users/${userId}/points`,
        fetchConfig("GET"),
        onSuccess,
        onErrors
    );
};

export const createJournalist = (user, onSuccess, onErrors) =>
    appFetch("/users/admin/createJournalist", fetchConfig("POST", user), onSuccess, onErrors);


export const getUserRanking = (onSuccess, onErrors) => {
  appFetch("/users/ranking", fetchConfig("GET"), onSuccess, onErrors);
};

export const requestPasswordChange = (
    id,
    oldPassword,
    newPassword,
    onSuccess,
    onErrors
) =>
    appFetch(
        `/users/${id}/request-password-change`,
        fetchConfig("POST", { oldPassword, newPassword }),
        onSuccess,
        onErrors
    );
