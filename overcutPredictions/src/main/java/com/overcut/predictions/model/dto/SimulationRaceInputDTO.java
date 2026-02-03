package com.overcut.predictions.model.dto;

import com.fasterxml.jackson.annotation.JsonAlias;

import java.util.List;

public class SimulationRaceInputDTO {

    private Long raceId;

    /**
     * Ordered list of driverIds.
     * Index 0 = P1, index 1 = P2, etc.
     */
    @JsonAlias({"finishingOrderDriverIds"})
    private List<Long> orderedDriverIds;

    public Long getRaceId() {
        return raceId;
    }

    public void setRaceId(Long raceId) {
        this.raceId = raceId;
    }

    public List<Long> getOrderedDriverIds() {
        return orderedDriverIds;
    }

    public void setOrderedDriverIds(List<Long> orderedDriverIds) {
        this.orderedDriverIds = orderedDriverIds;
    }
}
