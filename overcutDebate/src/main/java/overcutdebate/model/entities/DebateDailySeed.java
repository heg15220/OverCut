package overcutdebate.model.entities;

import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(
        name="debate_daily_seed",
        uniqueConstraints=@UniqueConstraint(
                name="uq_seed_day_scope",
                columnNames={"debate_day","scope"}
        )
)
public class DebateDailySeed {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    private DebateScope scope;

    @Column(name="debate_day", nullable=false)
    private LocalDate day;


    @Column(name="created_at", nullable=false)
    private Instant createdAt;

    public DebateDailySeed() {}

    public Long getId() { return id; }

    public DebateScope getScope() { return scope; }
    public void setScope(DebateScope scope) { this.scope = scope; }

    public LocalDate getDay() { return day; }
    public void setDay(LocalDate day) { this.day = day; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
