package com.overcut.f1hub.model.entities;


import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "driverstandings")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DriverStanding {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long driverStandingsId;

    private Long raceId;
    private Long driverId;
    private Double points;
    private Integer position;
    private String positionText;
    private Integer wins;
}
