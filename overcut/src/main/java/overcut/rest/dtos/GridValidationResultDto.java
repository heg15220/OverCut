package overcut.rest.dtos;

import java.util.List;

public class GridValidationResultDto {
    private boolean valid;
    private String pilotName;
    private String nationalityCode;
    private List<Integer> validPositions;

    public GridValidationResultDto() {
    }

    public GridValidationResultDto(boolean valid, String pilotName, String nationalityCode, List<Integer> validPositions) {
        this.valid = valid;
        this.pilotName = pilotName;
        this.nationalityCode = nationalityCode;
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

    public String getNationalityCode() {
        return nationalityCode;
    }

    public void setNationalityCode(String nationalityCode) {
        this.nationalityCode = nationalityCode;
    }

    public List<Integer> getValidPositions() {
        return validPositions;
    }

    public void setValidPositions(List<Integer> validPositions) {
        this.validPositions = validPositions;
    }
}

