package overcut.model.entities;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
public class BingoSelection {

    private Long id;
    private Long driverId;
    private String driverName;
    private LocalDateTime createdAt = LocalDateTime.now();

    private BingoGame game;
    private BingoCell cell;

    public BingoSelection() {}

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getDriverId() { return driverId; }
    public void setDriverId(Long driverId) { this.driverId = driverId; }

    public String getDriverName() { return driverName; }
    public void setDriverName(String driverName) { this.driverName = driverName; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "gameId")
    public BingoGame getGame() { return game; }
    public void setGame(BingoGame game) { this.game = game; }

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cellId")
    public BingoCell getCell() { return cell; }
    public void setCell(BingoCell cell) { this.cell = cell; }
}
