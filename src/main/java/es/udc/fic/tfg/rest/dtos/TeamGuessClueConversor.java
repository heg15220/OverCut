package es.udc.fic.tfg.rest.dtos;


import es.udc.fic.tfg.model.entities.TeamGuessClue;

public class TeamGuessClueConversor {

    private TeamGuessClueConversor() {}

    public static TeamGuessClueDto toDto(TeamGuessClue clue) {
        return new TeamGuessClueDto(clue.getId(), clue.getDriverName(), clue.getClueOrder());
    }
}
