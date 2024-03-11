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
    userName,
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

export const signUp = (user, onSuccess, onErrors, reauthenticationCallback) => {
    appFetch(
        "/users/signUp",
        fetchConfig("POST", user),
        (authenticatedUser) => {
            processLoginSignUp(authenticatedUser, reauthenticationCallback);
            onSuccess(authenticatedUser)
        },
        onErrors
    );
};

export const logout = () => removeServiceToken();


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
