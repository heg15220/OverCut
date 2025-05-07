package es.udc.fic.tfg.rest.dtos;

public class GridGameDto {
    private Long id;
    private Integer seasonYear;

    public GridGameDto(Long id, Integer seasonYear) {
        this.id = id;
        this.seasonYear = seasonYear;
    }

    public Long getId() {
        return id;
    }

    public Integer getSeasonYear() {
        return seasonYear;
    }
}

