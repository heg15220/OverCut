package com.overcut.f1hub.model.entities;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "constructorstandings")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ConstructorStanding {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long constructorStandingsId;

    private Long raceId;
    private Long constructorId;
    private Double points;
    private Integer position;
    private String positionText;
    private Integer wins;
}
