package overcut.rest.dtos;

public class DriverInfo {
    private String pilotId;
    private String name;
    private String nationalityCode;

    public DriverInfo() {
    }


    public DriverInfo(String pilotId, String name, String nationalityCode) {
        this.pilotId = pilotId;
        this.name = name;
        this.nationalityCode = nationalityCode;
    }

    public String getPilotId() {
        return pilotId;
    }

    public String getName() {
        return name;
    }

    public String getNationalityCode() {
        return nationalityCode;
    }
}

