package overcut.model.entities;

import jakarta.persistence.*;

import java.util.ArrayList;
import java.util.List;

@Entity
public class F1AnagramsRound {

    private Long id;
    private F1AnagramsGame game;

    private int roundOrder;
    private Long driverId;
    private String surname;
    private String scrambled;

    private boolean finished = false;
    private Boolean successful;

    private List<F1AnagramsAttempt> attempts = new ArrayList<>();

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "gameId", nullable = false)
    public F1AnagramsGame getGame() { return game; }
    public void setGame(F1AnagramsGame game) { this.game = game; }

    public int getRoundOrder() { return roundOrder; }
    public void setRoundOrder(int roundOrder) { this.roundOrder = roundOrder; }

    public Long getDriverId() { return driverId; }
    public void setDriverId(Long driverId) { this.driverId = driverId; }

    public String getSurname() { return surname; }
    public void setSurname(String surname) { this.surname = surname; }

    public String getScrambled() { return scrambled; }
    public void setScrambled(String scrambled) { this.scrambled = scrambled; }

    public boolean isFinished() { return finished; }
    public void setFinished(boolean finished) { this.finished = finished; }

    public Boolean getSuccessful() { return successful; }
    public void setSuccessful(Boolean successful) { this.successful = successful; }

    @OneToMany(mappedBy = "round", cascade = CascadeType.ALL, orphanRemoval = true)
    public List<F1AnagramsAttempt> getAttempts() { return attempts; }
    public void setAttempts(List<F1AnagramsAttempt> attempts) { this.attempts = attempts; }
}
