import { combineReducers } from 'redux';

import * as actionTypes from './actionTypes';

const initialState = {
    circuitDetails: null,
    podiumDetails: null,
    circuitsByCategory: null,
    podiumsByCircuit: null
};

// Manejo de detalles de circuitos y podios
const circuitDetails = (state = initialState.circuitDetails, action) => {
    switch (action.type) {
        case actionTypes.GET_CIRCUIT_DETAILS_COMPLETED:
            return action.circuitId; // O manejarlo como un objeto si contiene más información
        default:
            return state;
    }
}

const podiumDetails = (state = initialState.podiumDetails, action) => {
    switch (action.type) {
        case actionTypes.GET_PODIUM_DETAILS_COMPLETED:
            return action.podiumId; // O manejarlo como un objeto si contiene más información
        default:
            return state;
    }
}

const circuitsByCategory = (state = initialState.circuitsByCategory, action) => {
    switch (action.type) {
        case actionTypes.GET_CIRCUITS_BY_CATEGORY_COMPLETED:
            return action.circuits;
        default:
            return state;
    }
}

const podiumsByCircuit = (state = initialState.podiumsByCircuit, action) => {
    switch (action.type) {
        case actionTypes.GET_PODIUMS_BY_CIRCUIT_COMPLETED:
            return action.podiums;
        default:
            return state;
    }
}

const reducer = combineReducers({
    circuitDetails,
    podiumDetails,
    circuitsByCategory,
    podiumsByCircuit,
});

export default reducer;