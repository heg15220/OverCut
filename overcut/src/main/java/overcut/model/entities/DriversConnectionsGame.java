package overcut.model.entities;

import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
public class DriversConnectionsGame {


    private Long id;

    private LocalDateTime createdAt = LocalDateTime.now();

    private boolean finished;

    private List<DriversConnectionsCategory> categories = new ArrayList<>();



    public DriversConnectionsGame() {
    }

    public DriversConnectionsGame(LocalDateTime createdAt, boolean finished, List<DriversConnectionsCategory> categories) {
        this.createdAt = createdAt;
        this.finished = finished;
        this.categories = categories;
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public boolean isFinished() {
        return finished;
    }

    public void setFinished(boolean finished) {
        this.finished = finished;
    }


    @OneToMany(mappedBy = "game", cascade = CascadeType.ALL, orphanRemoval = true)
    public List<DriversConnectionsCategory> getCategories() {
        return categories;
    }

    public void setCategories(List<DriversConnectionsCategory> categories) {
        this.categories = categories;
    }
}
