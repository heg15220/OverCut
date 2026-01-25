package overcut.rest.dtos;

public class TeamHistorySeasonDto {
    public Integer seasonYear;

    public Integer userGuess;
    public Boolean isCorrect;

    public Integer correctPosition; // solo si revealed

    public Integer getSeasonYear() {
        return seasonYear;
    }

    public void setSeasonYear(Integer seasonYear) {
        this.seasonYear = seasonYear;
    }

    public Integer getUserGuess() {
        return userGuess;
    }

    public void setUserGuess(Integer userGuess) {
        this.userGuess = userGuess;
    }

    public Boolean getCorrect() {
        return isCorrect;
    }

    public void setCorrect(Boolean correct) {
        isCorrect = correct;
    }

    public Integer getCorrectPosition() {
        return correctPosition;
    }

    public void setCorrectPosition(Integer correctPosition) {
        this.correctPosition = correctPosition;
    }
}
