package overcut.model.entities;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
@Entity
public class F1AnagramsGame {

    private Long id;
    private Long userId;

    private LocalDateTime createdAt = LocalDateTime.now();
    private boolean finished = false;
    private Boolean successful;
    private int currentRound = 0;

    private List<F1AnagramsRound> rounds = new ArrayList<>();

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public boolean isFinished() { return finished; }
    public void setFinished(boolean finished) { this.finished = finished; }

    public Boolean getSuccessful() { return successful; }
    public void setSuccessful(Boolean successful) { this.successful = successful; }

    public int getCurrentRound() { return currentRound; }
    public void setCurrentRound(int currentRound) { this.currentRound = currentRound; }

    @OneToMany(mappedBy = "game", cascade = CascadeType.ALL, orphanRemoval = true)
    public List<F1AnagramsRound> getRounds() { return rounds; }
    public void setRounds(List<F1AnagramsRound> rounds) { this.rounds = rounds; }
}
