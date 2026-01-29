// src/main/java/overcut/rest/dtos/ValidateSevenCluesGuessRequest.java
package overcut.rest.dtos;

public class ValidateSevenCluesGuessRequest {

    private Long gameId;

    // Si en frontend usas autocomplete, puedes mandar driverId; si no, null.
    private Long driverId;

    // Texto introducido / seleccionado
    private String driverName;

    public ValidateSevenCluesGuessRequest() {}

    public ValidateSevenCluesGuessRequest(Long gameId, Long driverId, String driverName) {
        this.gameId = gameId;
        this.driverId = driverId;
        this.driverName = driverName;
    }

    public Long getGameId() { return gameId; }
    public void setGameId(Long gameId) { this.gameId = gameId; }

    public Long getDriverId() { return driverId; }
    public void setDriverId(Long driverId) { this.driverId = driverId; }

    public String getDriverName() { return driverName; }
    public void setDriverName(String driverName) { this.driverName = driverName; }
}
