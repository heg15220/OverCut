import { combineReducers } from 'redux';

import * as actionTypes from './actionTypes';

const initialState = {
    circuit: null,
    podium: null,
    circuits: null,
    podiums: null,
    victoriesByTeam: null ,
    victoriesCircuitsTeams: null,
    teamVictoriesCircuit: null,
    driversVictoriesCircuit: null,
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

const victoriesByTeam = (state = initialState.victoriesByTeam, action) => {
    switch (action.type) {
        case actionTypes.GET_TEAM_VICTORIES_COUNT_COMPLETED:
            return action.victoriesByTeam;
        default:
            return state;
    }
};

const victoriesCircuitsTeams = (state = initialState.victoriesCircuitsTeams, action) => {
    switch (action.type) {
        case actionTypes.GET_VICTORIES_PER_CIRCUIT_AND_TEAM_COMPLETED:
            return action.victoriesCircuitsTeams;
        default:
            return state;
    }
};

const teamVictoriesCircuit = (state = initialState.teamVictoriesCircuit, action) => {
    switch (action.type) {
        case actionTypes.GET_TEAMS_VICTORIES_BY_CIRCUIT_COMPLETED:
            return action.teamVictoriesCircuit;
        default:
            return state;
    }
};


const driversVictoriesCircuit = (state = initialState.driversVictoriesCircuit, action) => {
    switch (action.type) {
        case actionTypes.GET_DRIVERS_VICTORIES_BY_CIRCUIT_COMPLETED:
            return action.driversVictoriesCircuit;
        default:
            return state;
    }
};
const reducer = combineReducers({
    circuit,
    podium,
    circuits,
    podiums,
    victoriesByTeam,
    victoriesCircuitsTeams,
    teamVictoriesCircuit,
    driversVictoriesCircuit,
});


export default reducer;