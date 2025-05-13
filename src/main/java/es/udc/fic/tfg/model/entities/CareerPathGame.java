package es.udc.fic.tfg.model.entities;

import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
public class CareerPathGame {

    private Long id;
    private Long driverId;
    private String driverName;
    private LocalDateTime createdAt = LocalDateTime.now();
    private int currentClueIndex = 0;
    private boolean finished = false;
    private Boolean successful;

    private List<CareerPathClue> clues = new ArrayList<>();

    public CareerPathGame() {}

    public CareerPathGame(Long driverId, String driverName, LocalDateTime createdAt,
                          int currentClueIndex, boolean finished, Boolean successful, List<CareerPathClue> clues) {
        this.driverId = driverId;
        this.driverName = driverName;
        this.createdAt = createdAt;
        this.currentClueIndex = currentClueIndex;
        this.finished = finished;
        this.successful = successful;
        this.clues = clues;
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

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public int getCurrentClueIndex() {
        return currentClueIndex;
    }

    public void setCurrentClueIndex(int currentClueIndex) {
        this.currentClueIndex = currentClueIndex;
    }

    public boolean isFinished() {
        return finished;
    }

    public void setFinished(boolean finished) {
        this.finished = finished;
    }

    public Boolean getSuccessful() {
        return successful;
    }

    public void setSuccessful(Boolean successful) {
        this.successful = successful;
    }

    @OneToMany(mappedBy = "game", cascade = CascadeType.ALL, orphanRemoval = true)
    public List<CareerPathClue> getClues() {
        return clues;
    }

    public void setClues(List<CareerPathClue> clues) {
        this.clues = clues;
    }
}
