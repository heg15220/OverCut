package overcut.rest.dtos;

import java.util.List;

public class GridBulkValidationResultDto {
    private List<Integer> validPositions;

    public GridBulkValidationResultDto(List<Integer> validPositions) {
        this.validPositions = validPositions;
    }

    public List<Integer> getValidPositions() {
        return validPositions;
    }

    public void setValidPositions(List<Integer> validPositions) {
        this.validPositions = validPositions;
    }
}
