package es.udc.fic.tfg.model.entities;

import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
public class F1WordleGame {

    private Long id;

    private Long driverId;
    private String surname;
    private LocalDateTime createdAt = LocalDateTime.now();
    private boolean finished = false;
    private Boolean successful;

    private List<F1WordleAttempt> attempts = new ArrayList<>();

    public F1WordleGame() {
    }

    public F1WordleGame(Long driverId, String surname, LocalDateTime createdAt, boolean finished,
                        Boolean successful, List<F1WordleAttempt> attempts) {
        this.driverId = driverId;
        this.surname = surname;
        this.createdAt = createdAt;
        this.finished = finished;
        this.successful = successful;
        this.attempts = attempts;
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

    public String getSurname() {
        return surname;
    }

    public void setSurname(String surname) {
        this.surname = surname;
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

    public Boolean getSuccessful() {
        return successful;
    }

    public void setSuccessful(Boolean successful) {
        this.successful = successful;
    }


    @OneToMany(mappedBy = "game", cascade = CascadeType.ALL, orphanRemoval = true)
    public List<F1WordleAttempt> getAttempts() {
        return attempts;
    }

    public void setAttempts(List<F1WordleAttempt> attempts) {
        this.attempts = attempts;
    }
}
