package overcut.rest.dtos;

public class BingoSelectRequestDto {
    private Long gameId;
    private Long cellId;
    private Long driverId;
    private String driverName;

    public Long getGameId() { return gameId; }
    public void setGameId(Long gameId) { this.gameId = gameId; }

    public Long getCellId() { return cellId; }
    public void setCellId(Long cellId) { this.cellId = cellId; }

    public Long getDriverId() { return driverId; }
    public void setDriverId(Long driverId) { this.driverId = driverId; }

    public String getDriverName() { return driverName; }
    public void setDriverName(String driverName) { this.driverName = driverName; }
}
