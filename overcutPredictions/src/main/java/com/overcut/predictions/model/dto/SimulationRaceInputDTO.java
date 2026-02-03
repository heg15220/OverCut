package com.overcut.predictions.model.dto;

import com.fasterxml.jackson.annotation.JsonAlias;

import java.util.List;

public class SimulationRaceInputDTO {

    private Long raceId;     // opcional (si existe en BD)
    private Integer round;   // ✅ necesario para custom seasons

    @JsonAlias({"finishingOrderDriverIds"})
    private List<Long> orderedDriverIds;

    public Long getRaceId() { return raceId; }
    public void setRaceId(Long raceId) { this.raceId = raceId; }

    public Integer getRound() { return round; }
    public void setRound(Integer round) { this.round = round; }

    public List<Long> getOrderedDriverIds() { return orderedDriverIds; }
    public void setOrderedDriverIds(List<Long> orderedDriverIds) { this.orderedDriverIds = orderedDriverIds; }
}
