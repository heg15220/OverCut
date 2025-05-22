package overcut.rest.dtos;

import overcut.model.entities.CareerPathClue;

public class CareerPathClueConversor {

    private CareerPathClueConversor() {}

    public static CareerPathClueDto toDto(CareerPathClue clue) {
        return new CareerPathClueDto(clue.getId(), clue.getTeamName(), clue.getClueOrder());
    }
}
