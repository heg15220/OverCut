package es.udc.fic.tfg.model.entities;

import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
public class GridGame {

    private Long id;

    private Integer seasonYear;

    private LocalDateTime createdAt = LocalDateTime.now();


    private List<GridSlot> gridSlots = new ArrayList<>();

    public GridGame() {
    }

    public GridGame(Integer seasonYear) {
        this.seasonYear = seasonYear;
        this.createdAt = LocalDateTime.now();
        this.gridSlots = new ArrayList<>();
    }


    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Integer getSeasonYear() {
        return seasonYear;
    }

    public void setSeasonYear(Integer seasonYear) {
        this.seasonYear = seasonYear;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    @OneToMany(mappedBy = "game", cascade = CascadeType.ALL, orphanRemoval = true)
    public List<GridSlot> getGridSlots() {
        return gridSlots;
    }

    public void setGridSlots(List<GridSlot> gridSlots) {
        this.gridSlots = gridSlots;
    }
}
