package es.udc.fic.tfg.model.entities;

import jakarta.persistence.Entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
public class TeamGuessGame {

    private Long id;
    private Long teamId;
    private String teamName;
    private LocalDateTime createdAt = LocalDateTime.now();
    private boolean finished = false;
    private Boolean successful;
    private List<TeamGuessClue> clues = new ArrayList<>();

    public TeamGuessGame() {}

    public TeamGuessGame(Long teamId, String teamName, LocalDateTime createdAt,
                         boolean finished, Boolean successful, List<TeamGuessClue> clues) {
        this.teamId = teamId;
        this.teamName = teamName;
        this.createdAt = createdAt;
        this.finished = finished;
        this.successful = successful;
        this.clues = clues;
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long getId() { return id; }

    public void setId(Long id) { this.id = id; }

    public Long getTeamId() { return teamId; }

    public void setTeamId(Long teamId) { this.teamId = teamId; }

    public String getTeamName() { return teamName; }

    public void setTeamName(String teamName) { this.teamName = teamName; }

    public LocalDateTime getCreatedAt() { return createdAt; }

    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public boolean isFinished() { return finished; }

    public void setFinished(boolean finished) { this.finished = finished; }

    public Boolean getSuccessful() { return successful; }

    public void setSuccessful(Boolean successful) { this.successful = successful; }

    @OneToMany(mappedBy = "game", cascade = CascadeType.ALL, orphanRemoval = true)
    public List<TeamGuessClue> getClues() { return clues; }

    public void setClues(List<TeamGuessClue> clues) { this.clues = clues; }
}
