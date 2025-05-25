package com.overcut.f1hub.model.entities;


import jakarta.persistence.*;
import lombok.*;

@Entity
@IdClass(PitStopId.class)
@Table(name = "pitstops")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PitStop {
    @Id
    private Long raceId;
    @Id
    private Long driverId;
    @Id
    private Integer stop;

    private Integer lap;
    private String time;
    private String duration;
    private Integer milliseconds;
}
