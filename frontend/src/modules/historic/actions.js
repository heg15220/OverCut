import backend from '../../backend';
import * as actionTypes from "../historic/actionTypes";

const circuitDetailsCompleted = (circuit)=> ({
    type: actionTypes.GET_CIRCUIT_DETAILS_COMPLETED,
    circuit
});

const getCircuitsCompleted = (circuits)=> ({
    type: actionTypes.GET_CIRCUITS_COMPLETED,
    circuits
});

const podiumDetailsCompleted = (podium)=> ({
    type: actionTypes.GET_PODIUM_DETAILS_COMPLETED,
    podium
});

const podiumsByCircuitCompleted = (podiums)=> ({
    type: actionTypes.GET_PODIUMS_BY_CIRCUIT_COMPLETED,
    podiums
});

const victoriesByTeamCompleted = (victoriesByTeam)=> ({
    type: actionTypes.GET_TEAM_VICTORIES_COUNT_COMPLETED,
    victoriesByTeam
});

const victoriesPerCircuitTeamCompleted = (victoriesCircuitsTeams)=> ({
    type: actionTypes.GET_VICTORIES_PER_CIRCUIT_AND_TEAM_COMPLETED,
    victoriesCircuitsTeams
});
// Función para obtener detalles de un circuito
export const fetchCircuitDetails  = (id, onSuccess) => dispatch =>
    backend.historicService.getCircuitDetails(id,circuit => {
        dispatch(circuitDetailsCompleted(circuit));
        onSuccess(circuit)
    },);

// Función para obtener detalles de un podio
export const getPodiumDetails = (id, onSuccess, onErrors) => dispatch =>
    backend.historicService.getPodiumDetails(id,podium =>{
        dispatch(podiumDetailsCompleted(podium));
        onSuccess(podium)
    },
        onErrors);



export const getCircuits = (id, page, onSuccess) => dispatch =>
    backend.historicService.getCircuits(id, page, circuits => {
        dispatch(getCircuitsCompleted(circuits));
        onSuccess(circuits);
    });



// Función para obtener podios por circuito
export const getPodiumsByCircuit = (id, page, onSuccess, onErrors) => dispatch =>
    backend.historicService.getPodiumsByCircuit(id,page, podiums => {
        dispatch(podiumsByCircuitCompleted(podiums));
        onSuccess(podiums)
    },
        onErrors);

export const getTeamVictoriesCount = (onSuccess) => dispatch =>
    backend.historicService.getTeamsVictoriesCount(victoriesByTeam => {
        dispatch(victoriesByTeamCompleted(victoriesByTeam));
        onSuccess(victoriesByTeam);
    });

export const getVictoriesPerCircuitAndTeam = (onSuccess) => dispatch =>
    backend.historicService.getVictoriesPerCircuitAndTeam(victoriesCircuitsTeams => {
        dispatch(victoriesPerCircuitTeamCompleted(victoriesCircuitsTeams));
        onSuccess(victoriesCircuitsTeams);
    });
