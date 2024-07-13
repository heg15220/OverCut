package es.udc.fic.tfg.rest.controllers;

import es.udc.fic.tfg.model.common.exceptions.InstanceNotFoundException;
import es.udc.fic.tfg.model.entities.Circuit;
import es.udc.fic.tfg.model.entities.Podium;
import es.udc.fic.tfg.model.services.Block;
import es.udc.fic.tfg.model.services.HistoricService;
import es.udc.fic.tfg.model.services.PostService;
import es.udc.fic.tfg.rest.dtos.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/historic")
public class HistoricController {

    @Autowired
    private PostService postService;

    @Autowired
    private HistoricService historicService;

    @GetMapping("/{id}/circuits")
    public BlockDto<CircuitDto> getCircuits(@PathVariable("id") Long categoryId, @RequestParam(defaultValue = "0") int page)
            throws InstanceNotFoundException{
        Block<Circuit> foundCircuits = historicService.getCircuits(categoryId,page,30);
        return new BlockDto<>(CircuitDtoConversor.toCircuitDtos(foundCircuits.getItems()), foundCircuits.getExistMoreItems());
    }

    @GetMapping("/circuit/{id}/podiums")
    public  BlockDto<PodiumDto> getPodiumsByCircuit(@PathVariable("id") Long circuitId,
                                              @RequestParam(defaultValue = "0") int page)
            throws InstanceNotFoundException{
        Block<Podium> foundPodiums = historicService.getPodiumsByCircuit(circuitId,page,20);
        return new BlockDto<>(PodiumDtoConversor.toPodiumDtos(foundPodiums.getItems()), foundPodiums.getExistMoreItems());
    }

    @GetMapping("/circuits/circuit/{id}")
    public CircuitDto getCircuitDetails(@PathVariable("id") Long circuitId) throws InstanceNotFoundException{
        Circuit circuit = historicService.getCircuitDetails(circuitId);

        return CircuitDtoConversor.toCircuitDto(circuit);
    }

    @GetMapping("/circuit/podiums/podium/{id}")
    public PodiumDto getPodiumDetails(@PathVariable("id") Long podiumId) throws InstanceNotFoundException{
        Podium podium = historicService.getPodiumDetails(podiumId);

        return PodiumDtoConversor.toPodiumDto(podium);
    }

    @GetMapping("/teams/victories/count")
    public BlockDto<Map.Entry<String, Integer>> getTeamVictoriesCount() {
        List<Map<String, Integer>> victoriesByTeam = historicService.getTeamVictoriesCount();
        List<Map.Entry<String, Integer>> entries = victoriesByTeam.stream()
                .flatMap(map -> map.entrySet().stream())
                .collect(Collectors.toList());

        return new BlockDto<>(entries, entries.size() > 0);
    }


}
