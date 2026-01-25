package overcut.model.services;

import java.util.List;

public class TeamHistoryGeneratedData {
    public int constructorId;
    public String constructorName;
    public int maxPosition;
    public List<TeamHistoryGeneratedSeason> seasons;

    public int getConstructorId() {
        return constructorId;
    }

    public void setConstructorId(int constructorId) {
        this.constructorId = constructorId;
    }

    public String getConstructorName() {
        return constructorName;
    }

    public void setConstructorName(String constructorName) {
        this.constructorName = constructorName;
    }

    public int getMaxPosition() {
        return maxPosition;
    }

    public void setMaxPosition(int maxPosition) {
        this.maxPosition = maxPosition;
    }

    public List<TeamHistoryGeneratedSeason> getSeasons() {
        return seasons;
    }

    public void setSeasons(List<TeamHistoryGeneratedSeason> seasons) {
        this.seasons = seasons;
    }
}
