package es.udc.fic.tfg.rest.dtos;


import java.util.List;

public class ValidateGroupRequestDto {
    private Long gameId;
    private List<String> selectedDriverNames;

    public ValidateGroupRequestDto() {}

    public ValidateGroupRequestDto(Long gameId, List<String> selectedDriverNames) {
        this.gameId = gameId;
        this.selectedDriverNames = selectedDriverNames;
    }

    public Long getGameId() {
        return gameId;
    }

    public void setGameId(Long gameId) {
        this.gameId = gameId;
    }

    public List<String> getSelectedDriverNames() {
        return selectedDriverNames;
    }

    public void setSelectedDriverNames(List<String> selectedDriverNames) {
        this.selectedDriverNames = selectedDriverNames;
    }
}

