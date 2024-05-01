package es.udc.fic.tfg.rest.dtos;

import es.udc.fic.tfg.model.entities.Category;
import es.udc.fic.tfg.model.entities.Circuit;

import java.util.List;
import java.util.stream.Collectors;

public class CircuitDtoConversor {
    private CircuitDtoConversor(){

    }


    public static final CircuitDto toCircuitDto(Circuit circuit) {
        return new CircuitDto(circuit.getId(), circuit.getDistance(), circuit.getNumberLaps(), circuit.getTeamSuccess(),
                circuit.getImage(), circuit.getCategory().getId());
    }

    public static final List<CircuitDto> toCircuitDtos(List<Circuit> circuits) {
        return circuits.stream().map(CircuitDtoConversor::toCircuitDto).collect(Collectors.toList());
    }
}
