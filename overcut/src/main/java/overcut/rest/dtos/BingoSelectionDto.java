package overcut.rest.dtos;

public class BingoSelectionDto {

    private Long cellId;
    private Long driverId;
    private String driverName;

    public BingoSelectionDto() {}

    public BingoSelectionDto(Long cellId, Long driverId, String driverName) {
        this.cellId = cellId;
        this.driverId = driverId;
        this.driverName = driverName;
    }

    public Long getCellId() { return cellId; }
    public void setCellId(Long cellId) { this.cellId = cellId; }

    public Long getDriverId() { return driverId; }
    public void setDriverId(Long driverId) { this.driverId = driverId; }

    public String getDriverName() { return driverName; }
    public void setDriverName(String driverName) { this.driverName = driverName; }
}
