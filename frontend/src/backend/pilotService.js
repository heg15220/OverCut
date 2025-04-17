import {
    fetchConfig,
    appFetch,
} from "./appFetch";


export const autocomplete = (name, onSuccess, onErrors) => {
  appFetch(`/pilots/autocomplete?name=${name}`,
    fetchConfig('GET'), onSuccess, onErrors);
};
