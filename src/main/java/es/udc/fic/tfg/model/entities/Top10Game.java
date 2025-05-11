package es.udc.fic.tfg.model.entities;

import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
public class Top10Game {


    private Long id;

    private Integer seasonYear;

    private Integer raceId;

    private String raceName;

    private LocalDateTime createdAt = LocalDateTime.now();


    private List<Top10Slot> slots = new ArrayList<>();

    public Top10Game() {
    }

    public Top10Game(Integer seasonYear, Integer raceId, String raceName, LocalDateTime createdAt, List<Top10Slot> slots) {
        this.seasonYear = seasonYear;
        this.raceId = raceId;
        this.raceName = raceName;
        this.createdAt = createdAt;
        this.slots = slots;
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

    public Integer getRaceId() {
        return raceId;
    }

    public void setRaceId(Integer raceId) {
        this.raceId = raceId;
    }

    public String getRaceName() {
        return raceName;
    }

    public void setRaceName(String raceName) {
        this.raceName = raceName;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    @OneToMany(mappedBy = "game", cascade = CascadeType.ALL, orphanRemoval = true)
    public List<Top10Slot> getSlots() {
        return slots;
    }

    public void setSlots(List<Top10Slot> slots) {
        this.slots = slots;
    }

    // Getters y setters...
}
