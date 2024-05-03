// Importaciones
import { fetchConfig, appFetch } from "./appFetch";

// Función para obtener detalles de un circuito
export const getCircuitDetails = (circuitId, onSuccess, onErrors) => {
    appFetch(
        `/circuits/circuit/${circuitId}`,
        fetchConfig("GET"),
        onSuccess,
        onErrors
    );
};

// Función para obtener detalles de un podio
export const getPodiumDetails = (podiumId, onSuccess, onErrors) => {
    appFetch(
        `/circuit/podiums/podium/${podiumId}`,
        fetchConfig("GET"),
        onSuccess,
        onErrors
    );
};

// Función para obtener circuitos por categoría
export const getCircuitsByCategory = (categoryId, page, onSuccess, onErrors) => {
    let url = `/${categoryId}/circuits?page=${page}`;

    appFetch(
        url,
        fetchConfig("GET"),
        onSuccess,
        onErrors
    );
};

// Función para obtener podios por circuito
export const getPodiumsByCircuit = (circuitId, page, onSuccess, onErrors) => {
    let url = `/circuit/${circuitId}/podiums?page=${page}`;

    appFetch(
        url,
        fetchConfig("GET"),
        onSuccess,
        onErrors
    );
};
