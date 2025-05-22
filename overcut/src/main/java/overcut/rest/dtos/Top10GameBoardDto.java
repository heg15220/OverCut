package overcut.rest.dtos;

import java.util.List;

public class Top10GameBoardDto {
    private Long id;
    private Integer seasonYear;
    private String raceName;
    private List<GridSlotDto> grid;

    public Top10GameBoardDto(Long id, Integer seasonYear, String raceName, List<GridSlotDto> grid) {
        this.id = id;
        this.seasonYear = seasonYear;
        this.raceName = raceName;
        this.grid = grid;
    }

    public Long getId() {
        return id;
    }

    public Integer getSeasonYear() {
        return seasonYear;
    }

    public String getRaceName() {
        return raceName;
    }

    public List<GridSlotDto> getGrid() {
        return grid;
    }
}

