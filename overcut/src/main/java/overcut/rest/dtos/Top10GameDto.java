package overcut.rest.dtos;

public class Top10GameDto {
    private Long id;
    private Integer seasonYear;
    private String raceName;

    public Top10GameDto(Long id, Integer seasonYear, String raceName) {
        this.id = id;
        this.seasonYear = seasonYear;
        this.raceName = raceName;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Integer getSeasonYear() {
        return seasonYear;
    }

    public void setSeasonYear(Integer seasonYear) {
        this.seasonYear = seasonYear;
    }

    public String getRaceName() {
        return raceName;
    }

    public void setRaceName(String raceName) {
        this.raceName = raceName;
    }
}
