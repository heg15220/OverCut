package com.overcut.f1hub.model.entities;

import jakarta.persistence.*;

@Entity
@Table(name = "team_quali_gap_per_race")
public class TeamQualiGapPerRace {

    @EmbeddedId
    private TeamQualiGapPerRaceId id;

    @Column(name = "avgQualiGapMs", nullable = false)
    private Double avgQualiGapMs;

    public TeamQualiGapPerRaceId getId() { return id; }
    public Double getAvgQualiGapMs() { return avgQualiGapMs; }
}
