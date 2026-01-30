package overcut.rest.dtos;

public class DriverStatsAnswersDto {
    private Integer wins;
    private Integer podiums;
    private Integer teams;
    private String racesBin;   // "200-249", "400+"
    private Integer titles;
    private String pointsBin;  // "1000-1499", "3000+"
    private Integer seasons;
    // getters/setters


    public Integer getWins() {
        return wins;
    }

    public void setWins(Integer wins) {
        this.wins = wins;
    }

    public Integer getPodiums() {
        return podiums;
    }

    public void setPodiums(Integer podiums) {
        this.podiums = podiums;
    }

    public Integer getTeams() {
        return teams;
    }

    public void setTeams(Integer teams) {
        this.teams = teams;
    }

    public String getRacesBin() {
        return racesBin;
    }

    public void setRacesBin(String racesBin) {
        this.racesBin = racesBin;
    }

    public Integer getTitles() {
        return titles;
    }

    public void setTitles(Integer titles) {
        this.titles = titles;
    }

    public String getPointsBin() {
        return pointsBin;
    }

    public void setPointsBin(String pointsBin) {
        this.pointsBin = pointsBin;
    }

    public Integer getSeasons() {
        return seasons;
    }

    public void setSeasons(Integer seasons) {
        this.seasons = seasons;
    }
}
