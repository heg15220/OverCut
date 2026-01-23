package overcut.rest.dtos;

public class BingoDriverDto {

    private int queueIndex;
    private Long driverId;
    private String driverName;

    public BingoDriverDto() {}

    public BingoDriverDto(int queueIndex, Long driverId, String driverName) {
        this.queueIndex = queueIndex;
        this.driverId = driverId;
        this.driverName = driverName;
    }

    public int getQueueIndex() { return queueIndex; }
    public void setQueueIndex(int queueIndex) { this.queueIndex = queueIndex; }

    public Long getDriverId() { return driverId; }
    public void setDriverId(Long driverId) { this.driverId = driverId; }

    public String getDriverName() { return driverName; }
    public void setDriverName(String driverName) { this.driverName = driverName; }
}
