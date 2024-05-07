import { combineReducers } from 'redux';

import * as actionTypes from './actionTypes';

const initialState = {
    circuit: null,
    podium: null,
    circuits: null,
    podiums: null
};

// Manejo de detalles de circuitos y podios
const circuit = (state = initialState.circuit, action) => {
    switch (action.type) {
        case actionTypes.GET_CIRCUIT_DETAILS_COMPLETED:
            return action.circuit; // Cambiado de action.circuitId a action.circuit
        default:
            return state;
    }
}

const podium = (state = initialState.podium, action) => {
    switch (action.type) {
        case actionTypes.GET_PODIUM_DETAILS_COMPLETED:
            return action.podium; // Cambiado de action.podiumId a action.podium
        default:
            return state;
    }
}

// reducer.js
const circuits = (state = initialState.circuits, action) => {
    switch (action.type) {
        case actionTypes.GET_CIRCUITS_COMPLETED:
            return action.circuits;
        default:
            return state;
    }
};


const podiums = (state = initialState.podiums, action) => {
    switch (action.type) {
        case actionTypes.GET_PODIUMS_BY_CIRCUIT_COMPLETED:
            return action.podiums; // Asegúrate de que esto coincida con la acción despachada
        default:
            return state;
    }
}

const reducer = combineReducers({
    circuit,
    podium,
    circuits,
    podiums,
});


export default reducer;