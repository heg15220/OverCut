package overcut.model.entities;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
public class TeamNationalityAnswer {

    private Long id;
    private TeamNationalityGame game;

    private Long driverId;
    private String driverName;

    private boolean solved = true;
    private int answerOrder;
    private LocalDateTime solvedAt = LocalDateTime.now();

    public TeamNationalityAnswer() {}

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    @ManyToOne
    @JoinColumn(name = "gameId")
    public TeamNationalityGame getGame() { return game; }
    public void setGame(TeamNationalityGame game) { this.game = game; }

    public Long getDriverId() { return driverId; }
    public void setDriverId(Long driverId) { this.driverId = driverId; }

    public String getDriverName() { return driverName; }
    public void setDriverName(String driverName) { this.driverName = driverName; }

    public boolean isSolved() { return solved; }
    public void setSolved(boolean solved) { this.solved = solved; }

    public int getAnswerOrder() { return answerOrder; }
    public void setAnswerOrder(int answerOrder) { this.answerOrder = answerOrder; }

    public LocalDateTime getSolvedAt() { return solvedAt; }
    public void setSolvedAt(LocalDateTime solvedAt) { this.solvedAt = solvedAt; }
}
