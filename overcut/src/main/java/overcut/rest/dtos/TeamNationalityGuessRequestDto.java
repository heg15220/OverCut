package overcut.rest.dtos;

public class TeamNationalityGuessRequestDto {
    private Long gameId;
    private String driverName;
    public Long getGameId() { return gameId; }
    public void setGameId(Long gameId) { this.gameId = gameId; }
    public String getDriverName() { return driverName; }
    public void setDriverName(String driverName) { this.driverName = driverName; }
}
