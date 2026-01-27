package overcutdebate.model.entities;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name="debate_room")
public class DebateRoom {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    private DebateScope scope;

    private String topic;

    @Enumerated(EnumType.STRING)
    private RoomStatus status;

    private Instant createdAt;
    private Instant joinDeadline;
    private Instant pollDeadline;
    private Instant liveDeadline;

    public DebateRoom() {}

    // getters/setters

    public Long getId() { return id; }

    public DebateScope getScope() { return scope; }
    public void setScope(DebateScope scope) { this.scope = scope; }

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
