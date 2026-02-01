package overcut.model.entities;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
public class AbbreviationsAnswer {

    private Long id;
    private AbbreviationsGame game;

    private Long driverId;
    private String driverName;   // "Forename Surname"
    private String abbr;         // 3 letras
    private boolean solved = false;
    private int answerOrder;
    private LocalDateTime solvedAt;

    public AbbreviationsAnswer() {}

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    @ManyToOne
    @JoinColumn(name = "gameId")
    public AbbreviationsGame getGame() { return game; }
    public void setGame(AbbreviationsGame game) { this.game = game; }

    public Long getDriverId() { return driverId; }
    public void setDriverId(Long driverId) { this.driverId = driverId; }

    public String getDriverName() { return driverName; }
    public void setDriverName(String driverName) { this.driverName = driverName; }

    public String getAbbr() { return abbr; }
    public void setAbbr(String abbr) { this.abbr = abbr; }

    public boolean isSolved() { return solved; }
    public void setSolved(boolean solved) { this.solved = solved; }

    public int getAnswerOrder() { return answerOrder; }
    public void setAnswerOrder(int answerOrder) { this.answerOrder = answerOrder; }

    public LocalDateTime getSolvedAt() { return solvedAt; }
    public void setSolvedAt(LocalDateTime solvedAt) { this.solvedAt = solvedAt; }
}
