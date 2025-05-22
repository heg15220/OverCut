package overcut.rest.dtos;


import java.util.List;

public class GridGameBoardDto {
    private Long gameId;
    private Integer seasonYear;
    private List<GridSlotDto> grid;

    public GridGameBoardDto(Long gameId, Integer seasonYear, List<GridSlotDto> grid) {
        this.gameId = gameId;
        this.seasonYear = seasonYear;
        this.grid = grid;
    }

    public Long getGameId() {
        return gameId;
    }

    public Integer getSeasonYear() {
        return seasonYear;
    }

    public List<GridSlotDto> getGrid() {
        return grid;
    }
}

