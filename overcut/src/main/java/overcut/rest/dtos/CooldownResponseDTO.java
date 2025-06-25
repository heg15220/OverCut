package overcut.rest.dtos;

public class CooldownResponseDTO {
    private String gameType;
    private long secondsRemaining;

    public CooldownResponseDTO() {}
    public CooldownResponseDTO(String gameType, long secondsRemaining) {
        this.gameType = gameType;
        this.secondsRemaining = secondsRemaining;
    }

    public String getGameType() { return gameType; }
    public void setGameType(String gameType) { this.gameType = gameType; }

    public long getSecondsRemaining() { return secondsRemaining; }
    public void setSecondsRemaining(long secondsRemaining) { this.secondsRemaining = secondsRemaining; }
}
