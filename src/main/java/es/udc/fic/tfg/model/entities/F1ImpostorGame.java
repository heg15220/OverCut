package es.udc.fic.tfg.model.entities;

import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
public class F1ImpostorGame {
    private Long id;
    private LocalDateTime createdAt = LocalDateTime.now();
    private String category;
    private String themeDescription;
    private boolean finished = false;
    private Boolean won;
    private List<F1ImpostorPilot> pilots = new ArrayList<>();

    public F1ImpostorGame() {
    }

    public F1ImpostorGame(LocalDateTime createdAt, String category, String themeDescription,
                          boolean finished, Boolean won, List<F1ImpostorPilot> pilots) {
        this.createdAt = createdAt;
        this.category = category;
        this.themeDescription = themeDescription;
        this.finished = finished;
        this.won = won;
        this.pilots = pilots;
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

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getThemeDescription() {
        return themeDescription;
    }

    public void setThemeDescription(String themeDescription) {
        this.themeDescription = themeDescription;
    }

    public boolean isFinished() {
        return finished;
    }

    public void setFinished(boolean finished) {
        this.finished = finished;
    }

    public Boolean getWon() {
        return won;
    }

    public void setWon(Boolean won) {
        this.won = won;
    }

    @OneToMany(mappedBy = "game", cascade = CascadeType.ALL, orphanRemoval = true)
    public List<F1ImpostorPilot> getPilots() {
        return pilots;
    }

    public void setPilots(List<F1ImpostorPilot> pilots) {
        this.pilots = pilots;
    }
}
