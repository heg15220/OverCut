package es.udc.fic.tfg.rest.dtos;

public class GridSlotReveal {
    private int position;
    private String nationalityCode;
    private String pilotName;

    public GridSlotReveal(int position, String nationalityCode, String pilotName) {
        this.position = position;
        this.nationalityCode = nationalityCode;
        this.pilotName = pilotName;
    }

    public int getPosition() {
        return position;
    }

    public void setPosition(int position) {
        this.position = position;
    }

    public String getNationalityCode() {
        return nationalityCode;
    }

    public void setNationalityCode(String nationalityCode) {
        this.nationalityCode = nationalityCode;
    }

    public String getPilotName() {
        return pilotName;
    }

    public void setPilotName(String pilotName) {
        this.pilotName = pilotName;
    }
}
