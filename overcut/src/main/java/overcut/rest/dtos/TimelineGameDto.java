package overcut.rest.dtos;

import java.time.LocalDateTime;
import java.util.List;

public class TimelineGameDto {
    private Long id;
    private LocalDateTime createdAt;
    private boolean finished;
    private int attempts;
    private List<TimelineEventDto> events;

    public TimelineGameDto() {}

    public TimelineGameDto(Long id, LocalDateTime createdAt, boolean finished, int attempts, List<TimelineEventDto> events) {
        this.id = id;
        this.createdAt = createdAt;
        this.finished = finished;
        this.attempts = attempts;
        this.events = events;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public boolean isFinished() { return finished; }
    public void setFinished(boolean finished) { this.finished = finished; }

    public int getAttempts() { return attempts; }
    public void setAttempts(int attempts) { this.attempts = attempts; }

    public List<TimelineEventDto> getEvents() { return events; }
    public void setEvents(List<TimelineEventDto> events) { this.events = events; }
}
