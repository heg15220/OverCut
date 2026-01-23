package overcut.model.entities;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
public class TowerAttempt {

    private Long id;
    private TowerGame game;
    private LocalDateTime createdAt = LocalDateTime.now();

    private Long driverId;
    private String driverName;
    private boolean valid;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "gameId", nullable = false)
    public TowerGame getGame() { return game; }
    public void setGame(TowerGame game) { this.game = game; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public Long getDriverId() { return driverId; }
    public void setDriverId(Long driverId) { this.driverId = driverId; }

    public String getDriverName() { return driverName; }
    public void setDriverName(String driverName) { this.driverName = driverName; }

    public boolean isValid() { return valid; }
    public void setValid(boolean valid) { this.valid = valid; }
}
