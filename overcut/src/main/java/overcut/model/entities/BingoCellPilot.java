package overcut.model.entities;

import jakarta.persistence.*;

@Entity
public class BingoCellPilot {

    private Long id;
    private Long driverId;
    private String driverName;

    private BingoGame game;
    private BingoCell cell;

    public BingoCellPilot() {}

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getDriverId() { return driverId; }
    public void setDriverId(Long driverId) { this.driverId = driverId; }

    public String getDriverName() { return driverName; }
    public void setDriverName(String driverName) { this.driverName = driverName; }

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "gameId")
    public BingoGame getGame() { return game; }
    public void setGame(BingoGame game) { this.game = game; }

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cellId")
    public BingoCell getCell() { return cell; }
    public void setCell(BingoCell cell) { this.cell = cell; }
}
