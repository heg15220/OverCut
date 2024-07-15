package es.udc.fic.tfg.rest.dtos;

public class TeamVictoryStatsDto {
    private String teamName;
    private int victories;

    public TeamVictoryStatsDto() {
    }

    public TeamVictoryStatsDto(String teamName, int victories) {
        this.teamName = teamName;
        this.victories = victories;
    }

    public String getTeamName() {
        return teamName;
    }

    public void setTeamName(String teamName) {
        this.teamName = teamName;
    }

    public int getVictories() {
        return victories;
    }

    public void setVictories(int victories) {
        this.victories = victories;
    }

}
