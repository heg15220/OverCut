import backend from '../../backend';
import * as actionTypes from './actionTypes';

// Función para obtener detalles de un circuito
export const getCircuitDetails = (circuitId, onSuccess, onErrors) => {
    backend.historicService.getCircuitDetails(circuitId, (result) => {
        dispatch({ type: GET_CIRCUIT_DETAILS_COMPLETED, circuitId });
        onSuccess(result);
    }, onErrors);
};

// Función para obtener detalles de un podio
export const getPodiumDetails = (podiumId, onSuccess, onErrors) => {
    backend.historicService.getPodiumDetails(podiumId, (result) => {
        dispatch({ type: GET_PODIUM_DETAILS_COMPLETED, podiumId });
        onSuccess(result);
    }, onErrors);
};

// Función para obtener circuitos por categoría
export const getCircuitsByCategory = (categoryId, page, onSuccess, onErrors) => {
    backend.historicService.getCircuitsByCategory(categoryId, page, (result) => {
        dispatch({ type: GET_CIRCUITS_BY_CATEGORY_COMPLETED, circuits: result });
        onSuccess(result);
    }, onErrors);
};

// Función para obtener podios por circuito
export const getPodiumsByCircuit = (circuitId, page, onSuccess, onErrors) => {
    backend.historicService.getPodiumsByCircuit(circuitId, page, (result) => {
        dispatch({ type: GET_PODIUMS_BY_CIRCUIT_COMPLETED, podiums: result });
        onSuccess(result);
    }, onErrors);
};