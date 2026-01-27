package overcutdebate.model.entities;

import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "debate_room")
public class DebateRoom {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    private DebateScope scope;

    @Column(name = "debate_day", nullable = false)
    private LocalDate debateDay;

    @Column(name="opinion_id", nullable=false)
    private Long opinionId;

    private String topic;

    @Enumerated(EnumType.STRING)
    private RoomStatus status;


    @Column(name="created_at", nullable=false)
    private Instant createdAt;

    @Column(name="join_deadline", nullable=false)
    private Instant joinDeadline;

    @Column(name="poll_deadline")
    private Instant pollDeadline;

    @Column(name="live_deadline")
    private Instant liveDeadline;

    public DebateRoom() {}

    public Long getId() { return id; }

    public DebateScope getScope() { return scope; }
    public void setScope(DebateScope scope) { this.scope = scope; }

    public LocalDate getDebateDay() {
        return debateDay;
    }

    public void setDebateDay(LocalDate debateDay) {
        this.debateDay = debateDay;
    }

    public Long getOpinionId() { return opinionId; }
    public void setOpinionId(Long opinionId) { this.opinionId = opinionId; }

    public String getTopic() { return topic; }
    public void setTopic(String topic) { this.topic = topic; }

    public RoomStatus getStatus() { return status; }
    public void setStatus(RoomStatus status) { this.status = status; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getJoinDeadline() { return joinDeadline; }
    public void setJoinDeadline(Instant joinDeadline) { this.joinDeadline = joinDeadline; }

    public Instant getPollDeadline() { return pollDeadline; }
    public void setPollDeadline(Instant pollDeadline) { this.pollDeadline = pollDeadline; }

    public Instant getLiveDeadline() { return liveDeadline; }
    public void setLiveDeadline(Instant liveDeadline) { this.liveDeadline = liveDeadline; }
}
