package overcut.rest.dtos;


import java.util.List;

public class ValidateImpostorRequestDto {

    private Long gameId;
    private List<String> selectedPilotNames;

    public ValidateImpostorRequestDto() {}

    public ValidateImpostorRequestDto(Long gameId, List<String> selectedPilotNames) {
        this.gameId = gameId;
        this.selectedPilotNames = selectedPilotNames;
    }

    public Long getGameId() {
        return gameId;
    }

    public void setGameId(Long gameId) {
        this.gameId = gameId;
    }

    public List<String> getSelectedPilotNames() {
        return selectedPilotNames;
    }

    public void setSelectedPilotNames(List<String> selectedPilotNames) {
        this.selectedPilotNames = selectedPilotNames;
    }
}

