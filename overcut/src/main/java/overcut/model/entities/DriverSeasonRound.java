package overcut.model.entities;
import jakarta.persistence.*;

@Entity
public class DriverSeasonRound {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "roundId")
    private Long roundId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "gameId", nullable = false)
    private DriverSeasonGame game;

    private Integer raceId;

    private Integer roundNumber;

    private String country;

    private String raceNameEn;

    private String raceNameEs;

    private Integer finishingPosition;

    private Integer userGuess;

    private Boolean isCorrect;

    public Long getRoundId() { return roundId; }
    public DriverSeasonGame getGame() { return game; }
    public void setGame(DriverSeasonGame game) { this.game = game; }
    public Integer getRaceId() { return raceId; }
    public void setRaceId(Integer raceId) { this.raceId = raceId; }
    public Integer getRoundNumber() { return roundNumber; }
    public void setRoundNumber(Integer roundNumber) { this.roundNumber = roundNumber; }
    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }
    public String getRaceNameEn() { return raceNameEn; }
    public void setRaceNameEn(String raceNameEn) { this.raceNameEn = raceNameEn; }
    public String getRaceNameEs() { return raceNameEs; }
    public void setRaceNameEs(String raceNameEs) { this.raceNameEs = raceNameEs; }
    public Integer getFinishingPosition() { return finishingPosition; }
    public void setFinishingPosition(Integer finishingPosition) { this.finishingPosition = finishingPosition; }
    public Integer getUserGuess() { return userGuess; }
    public void setUserGuess(Integer userGuess) { this.userGuess = userGuess; }
    public Boolean getIsCorrect() { return isCorrect; }
    public void setIsCorrect(Boolean isCorrect) { this.isCorrect = isCorrect; }
}
