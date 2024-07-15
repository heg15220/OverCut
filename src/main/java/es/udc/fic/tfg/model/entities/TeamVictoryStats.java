package es.udc.fic.tfg.model.entities;

public class TeamVictoryStats {
    private String teamName;
    private int victories;

    public TeamVictoryStats(String teamName, int victories) {
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
