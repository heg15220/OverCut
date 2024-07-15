// Importaciones
import { fetchConfig, appFetch } from "./appFetch";

// Función para obtener detalles de un circuito
export const getCircuitDetails = (id, onSuccess) => {
    appFetch(
        `/historic/circuits/circuit/${id}`,
        fetchConfig("GET"),
        onSuccess
    );
};



// Función para obtener detalles de un podio
export const getPodiumDetails = (id, onSuccess, onErrors) => {
    appFetch(
        `/historic/circuit/podiums/podium/${id}`,
        fetchConfig("GET"),
        onSuccess,
        onErrors
    );
};

// Función para obtener circuitos por categoría
export const getCircuits = (id, page, onSuccess) => {
    appFetch(`/historic/${id}/circuits?page=${page}`, fetchConfig("GET"), onSuccess);
};



// Función para obtener podios por circuito
export const getPodiumsByCircuit = (id, page, onSuccess, onErrors) => {
    let url = `/historic/circuit/${id}/podiums?page=${page}`;

    appFetch(
        url,
        fetchConfig("GET"),
        onSuccess,
        onErrors
    );
};

export const getTeamsVictoriesCount = (onSuccess) => {
    appFetch(`/historic/teams/victories/count`, fetchConfig("GET"), onSuccess);
};

export const getVictoriesPerCircuitAndTeam = (onSuccess) => {
    appFetch(`/historic/circuits/victories/count`, fetchConfig("GET"), onSuccess);
};

export const getTeamVictoriesByCircuitName = (circuitName, onSuccess) => {
    appFetch(`/circuits/${circuitName}/teams/victories`, fetchConfig("GET"), onSuccess);
};