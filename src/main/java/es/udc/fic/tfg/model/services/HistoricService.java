package es.udc.fic.tfg.model.services;

import es.udc.fic.tfg.model.common.exceptions.InstanceNotFoundException;
import es.udc.fic.tfg.model.entities.Circuit;
import es.udc.fic.tfg.model.entities.Podium;

import java.util.List;
import java.util.Map;

public interface HistoricService {

    Block<Circuit> getCircuits(Long categoryId, int page, int size) throws InstanceNotFoundException;

    Block<Podium> getPodiumsByCircuit(Long circuitId, int page, int size) throws InstanceNotFoundException;

    Circuit getCircuitDetails(Long circuitId) throws InstanceNotFoundException;
    Podium getPodiumDetails(Long podiumId) throws InstanceNotFoundException;
    List<Map<String, Integer>> getTeamVictoriesCount();


}
