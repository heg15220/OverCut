package com.overcut.predictions.model.dto;

public class StandingsEntryDTO {

    private Long entityId; // driverId o constructorId
    private Integer points;

    public StandingsEntryDTO() {}

    public StandingsEntryDTO(Long entityId, Integer points) {
        this.entityId = entityId;
        this.points = points;
    }

    public Long getEntityId() {
        return entityId;
    }

    public void setEntityId(Long entityId) {
        this.entityId = entityId;
    }

    public Integer getPoints() {
        return points;
    }

    public void setPoints(Integer points) {
        this.points = points;
    }
}
