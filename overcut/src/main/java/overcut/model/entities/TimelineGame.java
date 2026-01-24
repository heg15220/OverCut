package overcut.model.entities;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
public class TimelineGame {

    private Long id;
    private LocalDateTime createdAt = LocalDateTime.now();
    private boolean finished;
    private int attempts;

    private List<TimelineEvent> events = new ArrayList<>();

    public TimelineGame() {}

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public boolean isFinished() { return finished; }
    public void setFinished(boolean finished) { this.finished = finished; }

    public int getAttempts() { return attempts; }
    public void setAttempts(int attempts) { this.attempts = attempts; }

    @OneToMany(mappedBy = "game", cascade = CascadeType.ALL, orphanRemoval = true)
    public List<TimelineEvent> getEvents() { return events; }
    public void setEvents(List<TimelineEvent> events) { this.events = events; }
}
