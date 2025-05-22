package overcut.rest.dtos;


public class F1ImpostorPilotDto {

    private String pilotName;
    private boolean valid; // Solo visible al finalizar
    private boolean selectedByUser;

    public F1ImpostorPilotDto() {}

    public F1ImpostorPilotDto(String pilotName, boolean valid, boolean selectedByUser) {
        this.pilotName = pilotName;
        this.valid = valid;
        this.selectedByUser = selectedByUser;
    }

    public String getPilotName() {
        return pilotName;
    }

    public void setPilotName(String pilotName) {
        this.pilotName = pilotName;
    }

    public boolean isValid() {
        return valid;
    }

    public void setValid(boolean valid) {
        this.valid = valid;
    }

    public boolean isSelectedByUser() {
        return selectedByUser;
    }

    public void setSelectedByUser(boolean selectedByUser) {
        this.selectedByUser = selectedByUser;
    }
}
