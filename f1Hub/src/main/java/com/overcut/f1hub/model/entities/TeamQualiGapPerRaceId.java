package com.overcut.f1hub.model.entities;

import jakarta.persistence.*;
import java.io.Serializable;
import java.util.Objects;

@Embeddable
public class TeamQualiGapPerRaceId implements Serializable {
    private Long raceId;
    private Long constructorId;

    public TeamQualiGapPerRaceId() {}
    public TeamQualiGapPerRaceId(Long raceId, Long constructorId) {
        this.raceId = raceId;
        this.constructorId = constructorId;
    }

    public Long getRaceId() { return raceId; }
    public Long getConstructorId() { return constructorId; }

    @Override public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof TeamQualiGapPerRaceId that)) return false;
        return Objects.equals(raceId, that.raceId) && Objects.equals(constructorId, that.constructorId);
    }
    @Override public int hashCode() { return Objects.hash(raceId, constructorId); }
}
