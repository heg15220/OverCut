package es.udc.fic.tfg.rest.dtos;

import es.udc.fic.tfg.model.entities.CareerPathClue;

public class CareerPathClueConversor {

    private CareerPathClueConversor() {}

    public static CareerPathClueDto toDto(CareerPathClue clue) {
        return new CareerPathClueDto(clue.getId(), clue.getTeamName(), clue.getClueOrder());
    }
}
