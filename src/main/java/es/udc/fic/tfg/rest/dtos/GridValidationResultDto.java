package es.udc.fic.tfg.rest.dtos;

import java.util.List;

public class GridValidationResultDto {
    private boolean valid;
    private String pilotName;
    private List<Integer> validPositions;

    public GridValidationResultDto(boolean valid, String pilotName, List<Integer> validPositions) {
        this.valid = valid;
        this.pilotName = pilotName;
        this.validPositions = validPositions;
    }

    public boolean isValid() {
        return valid;
    }

    public void setValid(boolean valid) {
        this.valid = valid;
    }

    public String getPilotName() {
        return pilotName;
    }

    public void setPilotName(String pilotName) {
        this.pilotName = pilotName;
    }

    public List<Integer> getValidPositions() {
        return validPositions;
    }

    public void setValidPositions(List<Integer> validPositions) {
        this.validPositions = validPositions;
    }

    // constructor, getters y setters
}

