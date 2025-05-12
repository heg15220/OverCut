package es.udc.fic.tfg.rest.dtos;

import java.time.LocalDateTime;
import java.util.List;

public class DriversLinkGameDto {
    private Long id;
    private Long driverId;
    private String driverName;
    private LocalDateTime createdAt;
    private int currentClueIndex;
    private boolean finished;
    private Boolean successful;
    private List<DriversLinkClueDto> clues;

    public DriversLinkGameDto() {}

    public DriversLinkGameDto(Long id, Long driverId, String driverName, LocalDateTime createdAt,
                              int currentClueIndex, boolean finished, Boolean successful, List<DriversLinkClueDto> clues) {
        this.id = id;
        this.driverId = driverId;
        this.driverName = driverName;
        this.createdAt = createdAt;
        this.currentClueIndex = currentClueIndex;
        this.finished = finished;
        this.successful = successful;
        this.clues = clues;
    }

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

    public List<DriversLinkClueDto> getClues() {
        return clues;
    }

    public void setClues(List<DriversLinkClueDto> clues) {
        this.clues = clues;
    }
}
