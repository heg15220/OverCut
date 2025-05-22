package overcut.rest.dtos;


import overcut.model.entities.TeamGuessClue;

public class TeamGuessClueConversor {

    private TeamGuessClueConversor() {}

    public static TeamGuessClueDto toDto(TeamGuessClue clue) {
        return new TeamGuessClueDto(clue.getId(), clue.getDriverName(), clue.getClueOrder());
    }
}
