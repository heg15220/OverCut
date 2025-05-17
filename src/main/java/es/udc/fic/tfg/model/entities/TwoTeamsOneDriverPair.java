package es.udc.fic.tfg.model.entities;

import jakarta.persistence.*;

@Entity
public class TwoTeamsOneDriverPair {

    private Long id;

    private TwoTeamsOneDriverGame game;

    private String teamA;
    private String teamB;
    private String guessedDriverName;
    private Boolean guessedCorrectly;
    private int pairOrder;

    public TwoTeamsOneDriverPair() {
    }

    public TwoTeamsOneDriverPair(TwoTeamsOneDriverGame game, String teamA, String teamB, String driverName,
                                 Boolean guessedCorrectly, int pairOrder) {
        this.game = game;
        this.teamA = teamA;
        this.teamB = teamB;
        this.guessedDriverName = driverName;
        this.guessedCorrectly = guessedCorrectly;
        this.pairOrder = pairOrder;
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    @ManyToOne
    @JoinColumn(name = "gameId")
    public TwoTeamsOneDriverGame getGame() {
        return game;
    }

    public void setGame(TwoTeamsOneDriverGame game) {
        this.game = game;
    }

    public String getTeamA() {
        return teamA;
    }

    public void setTeamA(String teamA) {
        this.teamA = teamA;
    }

    public String getTeamB() {
        return teamB;
    }

    public void setTeamB(String teamB) {
        this.teamB = teamB;
    }

    public String getGuessedDriverName() {
        return guessedDriverName;
    }

    public void setGuessedDriverName(String guessedDriverName) {
        this.guessedDriverName = guessedDriverName;
    }

    public Boolean getGuessedCorrectly() {
        return guessedCorrectly;
    }

    public void setGuessedCorrectly(Boolean guessedCorrectly) {
        this.guessedCorrectly = guessedCorrectly;
    }

    public int getPairOrder() {
        return pairOrder;
    }

    public void setPairOrder(int pairOrder) {
        this.pairOrder = pairOrder;
    }
}
