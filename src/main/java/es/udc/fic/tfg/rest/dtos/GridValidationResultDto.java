package es.udc.fic.tfg.rest.dtos;

public class GridValidationResultDto {
    private boolean valid;
    private String pilotName;

    public GridValidationResultDto(boolean valid, String pilotName) {
        this.valid = valid;
        this.pilotName = pilotName;
    }

    public boolean isValid() {
        return valid;
    }

    public String getPilotName() {
        return pilotName;
    }
}

