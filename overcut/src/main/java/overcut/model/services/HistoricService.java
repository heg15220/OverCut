package overcut.model.services;

import overcut.model.common.exceptions.InstanceNotFoundException;
import overcut.model.entities.*;

import java.util.List;
import java.util.Map;

public interface HistoricService {

    Block<Circuit> getCircuits(Long categoryId, int page, int size) throws InstanceNotFoundException;

    Block<Podium> getPodiumsByCircuit(Long circuitId, int page, int size) throws InstanceNotFoundException;

    Circuit getCircuitDetails(Long circuitId) throws InstanceNotFoundException;
    Podium getPodiumDetails(Long podiumId) throws InstanceNotFoundException;
    List<Map<String, Integer>> getTeamVictoriesCount();

    List<Circuit> getAllCircuits();

    Block<VictoryStats> getVictoriesPerCircuitAndTeam();
    Block<TeamVictoryStats> getTeamVictoriesByCircuitName(String circuitName) throws InstanceNotFoundException;
    Block<PilotVictoryStats> getPilotVictoriesByCircuitName(String circuitName) throws InstanceNotFoundException;

}
