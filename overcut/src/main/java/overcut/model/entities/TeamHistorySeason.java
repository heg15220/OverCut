package overcut.model.entities;

import jakarta.persistence.*;

@Entity
public class TeamHistorySeason {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "seasonId")
    private Long seasonId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "gameId", nullable = false)
    private TeamHistoryGame game;

    private Integer seasonYear;
    private Integer finishingPosition;

    private Integer userGuess;
    private Boolean isCorrect;

    public Long getSeasonId() { return seasonId; }

    public TeamHistoryGame getGame() { return game; }
    public void setGame(TeamHistoryGame game) { this.game = game; }

    public Integer getSeasonYear() { return seasonYear; }
    public void setSeasonYear(Integer seasonYear) { this.seasonYear = seasonYear; }

    public Integer getFinishingPosition() { return finishingPosition; }
    public void setFinishingPosition(Integer finishingPosition) { this.finishingPosition = finishingPosition; }

    public Integer getUserGuess() { return userGuess; }
    public void setUserGuess(Integer userGuess) { this.userGuess = userGuess; }

    public Boolean getIsCorrect() { return isCorrect; }
    public void setIsCorrect(Boolean isCorrect) { this.isCorrect = isCorrect; }
}
