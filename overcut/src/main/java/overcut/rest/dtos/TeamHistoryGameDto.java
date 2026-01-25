package overcut.rest.dtos;

import java.util.List;

public class TeamHistoryGameDto {
    public Long gameId;
    public Integer maxPosition;

    public String constructorName; // null hasta reveal
    public boolean revealed;
    public boolean completed;

    public List<TeamHistorySeasonDto> seasons;


    public Long getGameId() {
        return gameId;
    }

    public void setGameId(Long gameId) {
        this.gameId = gameId;
    }

    public Integer getMaxPosition() {
        return maxPosition;
    }

    public void setMaxPosition(Integer maxPosition) {
        this.maxPosition = maxPosition;
    }

    public String getConstructorName() {
        return constructorName;
    }

    public void setConstructorName(String constructorName) {
        this.constructorName = constructorName;
    }

    public boolean isRevealed() {
        return revealed;
    }

    public void setRevealed(boolean revealed) {
        this.revealed = revealed;
    }

    public boolean isCompleted() {
        return completed;
    }

    public void setCompleted(boolean completed) {
        this.completed = completed;
    }

    public List<TeamHistorySeasonDto> getSeasons() {
        return seasons;
    }

    public void setSeasons(List<TeamHistorySeasonDto> seasons) {
        this.seasons = seasons;
    }
}
