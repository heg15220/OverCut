package es.udc.fic.tfg.rest.dtos;


public class GridSlotDto {
    private int position;
    private String nationalityCode;
    private String filledByPilotId;

    public GridSlotDto(int position, String nationalityCode, String filledByPilotId) {
        this.position = position;
        this.nationalityCode = nationalityCode;
        this.filledByPilotId = filledByPilotId;
    }

    public int getPosition() {
        return position;
    }

    public String getNationalityCode() {
        return nationalityCode;
    }

    public String getFilledByPilotId() {
        return filledByPilotId;
    }
}

