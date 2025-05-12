package es.udc.fic.tfg.rest.dtos;

import es.udc.fic.tfg.model.entities.DriversLinkClue;

public class DriversLinkClueConversor {

    private DriversLinkClueConversor() {}

    public static DriversLinkClueDto toDto(DriversLinkClue clue) {
        DriversLinkClueDto dto = new DriversLinkClueDto();
        dto.setId(clue.getId());
        dto.setTeammateName(clue.getTeammateName());
        dto.setClueOrder(clue.getClueOrder());
        return dto;
    }
}
