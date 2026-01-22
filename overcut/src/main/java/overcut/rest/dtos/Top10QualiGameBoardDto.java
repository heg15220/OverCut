package overcut.rest.dtos;

import java.util.List;

public class Top10QualiGameBoardDto {

    private Long gameId;
    private Integer seasonYear;
    private String raceName;
    private String sessionUsed; // "Q1" | "Q2" | "Q3"
    private List<QualiSlotDto> grid;

    public Top10QualiGameBoardDto() {
    }

    public Top10QualiGameBoardDto(Long gameId,
                                  Integer seasonYear,
                                  String raceName,
                                  String sessionUsed,
                                  List<QualiSlotDto> grid) {
        this.gameId = gameId;
        this.seasonYear = seasonYear;
        this.raceName = raceName;
        this.sessionUsed = sessionUsed;
        this.grid = grid;
    }

    public Long getGameId() {
        return gameId;
    }

    public void setGameId(Long gameId) {
        this.gameId = gameId;
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

    public String getSessionUsed() {
        return sessionUsed;
    }

    public void setSessionUsed(String sessionUsed) {
        this.sessionUsed = sessionUsed;
    }

    public List<QualiSlotDto> getGrid() {
        return grid;
    }

    public void setGrid(List<QualiSlotDto> grid) {
        this.grid = grid;
    }
}
