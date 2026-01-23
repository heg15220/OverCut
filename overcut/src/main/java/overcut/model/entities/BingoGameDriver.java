package overcut.model.entities;

import jakarta.persistence.*;

@Entity
public class BingoGameDriver {

    private Long id;
    private int queueIndex;
    private Long driverId;
    private String driverName;
    private BingoGame game;

    public BingoGameDriver() {}

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public int getQueueIndex() { return queueIndex; }
    public void setQueueIndex(int queueIndex) { this.queueIndex = queueIndex; }

    public Long getDriverId() { return driverId; }
    public void setDriverId(Long driverId) { this.driverId = driverId; }

    public String getDriverName() { return driverName; }
    public void setDriverName(String driverName) { this.driverName = driverName; }

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "gameId")
    public BingoGame getGame() { return game; }
    public void setGame(BingoGame game) { this.game = game; }
}
