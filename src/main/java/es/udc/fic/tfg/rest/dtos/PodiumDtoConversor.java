package es.udc.fic.tfg.rest.dtos;

import es.udc.fic.tfg.model.entities.Circuit;
import es.udc.fic.tfg.model.entities.Podium;

import java.util.List;
import java.util.stream.Collectors;

public class PodiumDtoConversor {
    private PodiumDtoConversor(){

    }


    public static final PodiumDto toPodiumDto(Podium podium) {
        return new PodiumDto(podium.getId(), podium.getWinner(), podium.getTeamWinner(), podium.getSecondPlace(),
                podium.getThirdPlace(), podium.getImage(), podium.getCircuit().getId());
    }

    public static final List<PodiumDto> toPodiumDtos(List<Podium> podiums) {
        return podiums.stream().map(PodiumDtoConversor::toPodiumDto).collect(Collectors.toList());
    }
}
