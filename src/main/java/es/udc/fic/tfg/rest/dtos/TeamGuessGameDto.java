package es.udc.fic.tfg.rest.dtos;


import java.time.LocalDateTime;
import java.util.List;

public class TeamGuessGameDto {

    private Long id;
    private Long teamId;
    private String teamName;
    private LocalDateTime createdAt;
    private boolean finished;
    private Boolean successful;
    private List<TeamGuessClueDto> clues;

    public TeamGuessGameDto() {}

    public TeamGuessGameDto(Long id, Long teamId, String teamName, LocalDateTime createdAt,
                            boolean finished, Boolean successful, List<TeamGuessClueDto> clues) {
        this.id = id;
        this.teamId = teamId;
        this.teamName = teamName;
        this.createdAt = createdAt;
        this.finished = finished;
        this.successful = successful;
        this.clues = clues;
    }

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

    public List<TeamGuessClueDto> getClues() { return clues; }
    public void setClues(List<TeamGuessClueDto> clues) { this.clues = clues; }
}

