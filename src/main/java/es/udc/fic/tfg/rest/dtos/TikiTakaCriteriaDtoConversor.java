package es.udc.fic.tfg.rest.dtos;

import es.udc.fic.tfg.model.entities.TikiTakaCriteria;
import es.udc.fic.tfg.model.entities.TikiTakaGame;

import java.util.List;
import java.util.stream.Collectors;

public class TikiTakaCriteriaDtoConversor {

    private TikiTakaCriteriaDtoConversor(){

    }

    public static final TikiTakaCriteriaDto toTikiTakaCriteriaDto(TikiTakaCriteria tikiTakaCriteria) {
        return new TikiTakaCriteriaDto(tikiTakaCriteria.getId(), tikiTakaCriteria.getAxis(),
                tikiTakaCriteria.getPositionGame(), tikiTakaCriteria.getDescription(), tikiTakaCriteria.getCode());
    }

    public static final List<TikiTakaCriteriaDto> toTikiTakaCriteriaDtos(List<TikiTakaCriteria> tikiTakaCriterias) {
        return tikiTakaCriterias.stream().map(TikiTakaCriteriaDtoConversor::toTikiTakaCriteriaDto).collect(Collectors.toList());
    }
}
