package es.udc.fic.tfg.model.entities;

import jakarta.persistence.*;

@Entity
public class OrderDriverSlot {
    private Long id;
    private OrderDriverGame game;
    private Long driverId;
    private String driverName;
    private int correctOrder;

    public OrderDriverSlot() {
    }

    public OrderDriverSlot(OrderDriverGame game, Long driverId, String driverName, int correctOrder) {
        this.game = game;
        this.driverId = driverId;
        this.driverName = driverName;
        this.correctOrder = correctOrder;
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "gameId", nullable = false)
    public OrderDriverGame getGame() { return game; }
    public void setGame(OrderDriverGame game) { this.game = game; }

    public Long getDriverId() { return driverId; }
    public void setDriverId(Long driverId) { this.driverId = driverId; }

    public String getDriverName() { return driverName; }
    public void setDriverName(String driverName) { this.driverName = driverName; }

    public int getCorrectOrder() { return correctOrder; }
    public void setCorrectOrder(int correctOrder) { this.correctOrder = correctOrder; }
}
