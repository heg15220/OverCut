package es.udc.fic.tfg.model.entities;


import jakarta.persistence.*;

@Entity
public class TeamGuessClue {

    private Long id;
    private TeamGuessGame game;
    private Long driverId;
    private String driverName;
    private int clueOrder;

    public TeamGuessClue() {}

    public TeamGuessClue(Long id, TeamGuessGame game, Long driverId, String driverName, int clueOrder) {
        this.id = id;
        this.game = game;
        this.driverId = driverId;
        this.driverName = driverName;
        this.clueOrder = clueOrder;
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long getId() { return id; }

    public void setId(Long id) { this.id = id; }

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "gameId", nullable = false)
    public TeamGuessGame getGame() { return game; }

    public void setGame(TeamGuessGame game) { this.game = game; }

    public Long getDriverId() { return driverId; }

    public void setDriverId(Long driverId) { this.driverId = driverId; }

    public String getDriverName() { return driverName; }

    public void setDriverName(String driverName) { this.driverName = driverName; }

    public int getClueOrder() { return clueOrder; }

    public void setClueOrder(int clueOrder) { this.clueOrder = clueOrder; }
}
