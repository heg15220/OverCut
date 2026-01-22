package overcut.rest.dtos;

public class Top10QualiGameDto {
    private Long id;
    private Integer seasonYear;
    private String raceName;
    private String sessionUsed;

    public Top10QualiGameDto(Long id, Integer seasonYear, String raceName, String sessionUsed) {
        this.id = id;
        this.seasonYear = seasonYear;
        this.raceName = raceName;
        this.sessionUsed = sessionUsed;
    }

    public Long getId() { return id; }
    public Integer getSeasonYear() { return seasonYear; }
    public String getRaceName() { return raceName; }
    public String getSessionUsed() { return sessionUsed; }

    public void setId(Long id) { this.id = id; }
    public void setSeasonYear(Integer seasonYear) { this.seasonYear = seasonYear; }
    public void setRaceName(String raceName) { this.raceName = raceName; }
    public void setSessionUsed(String sessionUsed) { this.sessionUsed = sessionUsed; }
}
