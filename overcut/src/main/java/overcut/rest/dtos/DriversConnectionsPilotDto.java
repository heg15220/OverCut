package overcut.rest.dtos;


public class DriversConnectionsPilotDto {
    private Long id;
    private Long driverId;
    private String driverName;

    public DriversConnectionsPilotDto() {}

    public DriversConnectionsPilotDto(Long id, Long driverId, String driverName) {
        this.id = id;
        this.driverId = driverId;
        this.driverName = driverName;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getDriverId() {
        return driverId;
    }

    public void setDriverId(Long driverId) {
        this.driverId = driverId;
    }

    public String getDriverName() {
        return driverName;
    }

    public void setDriverName(String driverName) {
        this.driverName = driverName;
    }
}

