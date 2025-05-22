package overcut.rest.dtos;

public class TwoTeamsOneDriverPairDto {
    private String teamA;
    private String teamB;
    private String driverName; // nombre escrito o null
    private Boolean guessedCorrectly;
    private int pairOrder;

    public TwoTeamsOneDriverPairDto() {
    }

    public TwoTeamsOneDriverPairDto(String teamA, String teamB, String driverName, Boolean guessedCorrectly, int pairOrder) {
        this.teamA = teamA;
        this.teamB = teamB;
        this.driverName = driverName;
        this.guessedCorrectly = guessedCorrectly;
        this.pairOrder = pairOrder;
    }

    public String getTeamA() {
        return teamA;
    }

    public void setTeamA(String teamA) {
        this.teamA = teamA;
    }

    public String getTeamB() {
        return teamB;
    }

    public void setTeamB(String teamB) {
        this.teamB = teamB;
    }

    public String getDriverName() {
        return driverName;
    }

    public void setDriverName(String driverName) {
        this.driverName = driverName;
    }

    public Boolean getGuessedCorrectly() {
        return guessedCorrectly;
    }

    public void setGuessedCorrectly(Boolean guessedCorrectly) {
        this.guessedCorrectly = guessedCorrectly;
    }

    public int getPairOrder() {
        return pairOrder;
    }

    public void setPairOrder(int pairOrder) {
        this.pairOrder = pairOrder;
    }
}

