package overcut.model.entities;

import jakarta.persistence.*;

@Entity
public class DriversConnectionsPilot {

    private Long id;

    private Long driverId;
    private String driverName;

    private DriversConnectionsGame game;

    private DriversConnectionsCategory category;

    public DriversConnectionsPilot() {
    }

    public DriversConnectionsPilot(Long driverId, String driverName, DriversConnectionsGame game,
                                   DriversConnectionsCategory category) {
        this.driverId = driverId;
        this.driverName = driverName;
        this.game = game;
        this.category = category;
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getDriverId() {
        return driverId;
    }

    public void setDriverId(Long driverId) {
        this.driverId = driverId;
    }

    public String getDriverName() {
        return driverName;
    }

    public void setDriverName(String driverName) {
        this.driverName = driverName;
    }


    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "gameId")
    public DriversConnectionsGame getGame() {
        return game;
    }

    public void setGame(DriversConnectionsGame game) {
        this.game = game;
    }


    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "categoryId")
    public DriversConnectionsCategory getCategory() {
        return category;
    }

    public void setCategory(DriversConnectionsCategory category) {
        this.category = category;
    }
}
