package es.udc.fic.tfg.rest.dtos;

import es.udc.fic.tfg.model.entities.Answer;
import es.udc.fic.tfg.model.entities.Award;

import java.util.List;
import java.util.stream.Collectors;

public class AwardConversor {
    private AwardConversor() {
        // Constructor privado para evitar instanciación
    }

    /**
     * Convierte un objeto Award en un objeto AwardDto.
     *
     * @param award el objeto Award a convertir
     * @return el objeto AwardDto resultante
     */
    public static AwardDto convertToAwardDto(Award award) {

        return new AwardDto(award.getId(), award.getPrize(),award.getRequiredPoints(),award.getUser().getId());
    }

    public static final List<AwardDto> toAwardDtos(List<Award> awards) {
        return awards.stream().map(AwardConversor::convertToAwardDto).collect(Collectors.toList());

    }
}
