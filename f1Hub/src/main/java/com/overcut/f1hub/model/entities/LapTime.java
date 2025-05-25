package com.overcut.f1hub.model.entities;

import jakarta.persistence.*;
import lombok.*;

@Entity
@IdClass(LapTimeId.class)
@Table(name = "laptimes")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LapTime {
    @Id
    private Long raceId;
    @Id
    private Long driverId;
    @Id
    private Integer lap;

    private Integer position;
    private String time;
    private Integer milliseconds;
}
