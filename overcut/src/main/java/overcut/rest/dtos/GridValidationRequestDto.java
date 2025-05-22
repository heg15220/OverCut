package overcut.rest.dtos;

public class GridValidationRequestDto {
    private int position;
    private String pilotName;

    public int getPosition() {
        return position;
    }

    public void setPosition(int position) {
        this.position = position;
    }

    public String getPilotName() {
        return pilotName;
    }

    public void setPilotName(String pilotName) {
        this.pilotName = pilotName;
    }
}

