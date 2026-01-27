package overcutdebate.model.entities;

import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(
        name = "debate_opinion",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_opinion_day_user_scope",
                columnNames = {"debate_day", "user_id", "scope"}
        )
)
public class DebateOpinion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DebateScope scope;

    @Column(name = "debate_day", nullable = false)
    private LocalDate debateDay;

    @Column(name="user_id", nullable=false)
    private Long userId;



    @Column(name="user_name", nullable=false, length=60)
    private String userName;

    @Column(length = 500, nullable = false)
    private String text;

    @Column(name="created_at", nullable=false)
    private Instant createdAt;

    public DebateOpinion() {}

    public Long getId() { return id; }

    public DebateScope getScope() { return scope; }
    public void setScope(DebateScope scope) { this.scope = scope; }

    public LocalDate getDebateDay() { return debateDay; }
    public void setDebateDay(LocalDate debateDay) { this.debateDay = debateDay; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }

    public String getText() { return text; }
    public void setText(String text) { this.text = text; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
