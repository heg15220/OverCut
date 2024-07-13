package es.udc.fic.tfg.model.services;

import es.udc.fic.tfg.model.common.exceptions.InstanceNotFoundException;
import es.udc.fic.tfg.model.entities.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Slice;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class HistoricServiceImpl implements HistoricService{

    @Autowired
    private CategoryDao categoryDao;

    @Autowired
    private CircuitDao circuitDao;

    @Autowired
    private PodiumDao podiumDao;

    @Override
    @Transactional(readOnly = true)
    public Block<Circuit> getCircuits(Long categoryId, int page, int size)
            throws InstanceNotFoundException {

    if(categoryDao.findCategoryById(categoryId) == null){
        throw new InstanceNotFoundException("Category Historic not found",categoryId);
    }
    Slice<Circuit> circuits= circuitDao.findAllCircuitsOrderedByInsertion(page, size);

    return new Block<>(circuits.getContent(), circuits.hasNext());
    }


    @Override
    @Transactional(readOnly = true)
    public Block<Podium> getPodiumsByCircuit(Long circuitId, int page, int size) throws InstanceNotFoundException{
        Optional<Circuit> circuitOptional = circuitDao.findById(circuitId);
        if(!circuitOptional.isPresent()){
            throw new InstanceNotFoundException("Circuit not found", circuitId);
        }

        Slice<Podium> podiums = podiumDao.findPodiumsByCircuit(circuitId,page,size);

        return new Block<>(podiums.getContent(),podiums.hasNext());
    }

    @Override
    @Transactional(readOnly = true)

    public Circuit getCircuitDetails(Long circuitId) throws InstanceNotFoundException{
        Optional<Circuit> circuitOptional = circuitDao.findById(circuitId);
        if(circuitOptional.isEmpty()){
            throw new InstanceNotFoundException("Circuit not found", circuitId);
        }
        return circuitDao.findCircuitById(circuitId);
    }


    @Override
    @Transactional(readOnly = true)
    public Podium getPodiumDetails(Long podiumId) throws InstanceNotFoundException{
        Optional<Podium> podiumOptional = podiumDao.findById(podiumId);
        if(podiumOptional.isEmpty()){
            throw new InstanceNotFoundException("Podium not found", podiumId);
        }

        return podiumDao.findPodiumById(podiumId);
    }

    // En HistoricServiceImpl.java
    @Override
    @Transactional(readOnly = true)
    public List<Map<String, Integer>> getTeamVictoriesCount() {
        List<String> distinctTeamWinners = podiumDao.getDistinctTeamWinners();
        Map<String, Integer> victoriesByTeam = new HashMap<>();

        for (String teamWinner : distinctTeamWinners) {
            int victoryCount = podiumDao.countVictoriesByTeam(teamWinner);
            victoriesByTeam.put(teamWinner, victoryCount);
        }

        return List.of(victoriesByTeam);
    }

    // En HistoricServiceImpl.java
    @Override
    @Transactional(readOnly = true)
    public List<Circuit> getAllCircuits() {
        return (List<Circuit>) circuitDao.findAll();
    }


    @Override
    @Transactional(readOnly = true)
    public Block<VictoryStats> getVictoriesPerCircuitAndTeam() {
        List<Object[]> results = circuitDao.getVictoriesPerCircuitAndTeam();

        List<VictoryStats> victoriesData = new ArrayList<>();
        for (Object[] result : results) {
            long circuitId = (Long) result[0];
            String circuitName = (String) result[1];
            String teamWinner = (String) result[2];
            long victories = (long) result[3];

            VictoryStats stats = new VictoryStats(circuitId, circuitName,teamWinner, victories);
            victoriesData.add(stats);
        }


        // Construye el objeto Block con la lista de VictoryStats
        return new Block<>(victoriesData, !victoriesData.isEmpty());

    }




}
