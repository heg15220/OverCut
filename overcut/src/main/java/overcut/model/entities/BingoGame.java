package overcut.model.entities;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
public class BingoGame {

    private Long id;
    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime startedAt;
    private boolean finished;
    private int durationSeconds = 60;

    private List<BingoCell> cells = new ArrayList<>();
    private List<BingoGameDriver> driversQueue = new ArrayList<>();
    private List<BingoSelection> selections = new ArrayList<>();

    public BingoGame() {}

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getStartedAt() { return startedAt; }
    public void setStartedAt(LocalDateTime startedAt) { this.startedAt = startedAt; }

    public boolean isFinished() { return finished; }
    public void setFinished(boolean finished) { this.finished = finished; }

    public int getDurationSeconds() { return durationSeconds; }
    public void setDurationSeconds(int durationSeconds) { this.durationSeconds = durationSeconds; }

    @OneToMany(mappedBy = "game", cascade = CascadeType.ALL, orphanRemoval = true)
    public List<BingoCell> getCells() { return cells; }
    public void setCells(List<BingoCell> cells) { this.cells = cells; }

    @OneToMany(mappedBy = "game", cascade = CascadeType.ALL, orphanRemoval = true)
    public List<BingoGameDriver> getDriversQueue() { return driversQueue; }
    public void setDriversQueue(List<BingoGameDriver> driversQueue) { this.driversQueue = driversQueue; }

    @OneToMany(mappedBy = "game", cascade = CascadeType.ALL, orphanRemoval = true)
    public List<BingoSelection> getSelections() { return selections; }
    public void setSelections(List<BingoSelection> selections) { this.selections = selections; }
}
