package com.overcut.f1hub.model.entities;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "constructorresults")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ConstructorResult {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long constructorResultsId;

    private Long raceId;
    private Long constructorId;
    private Double points;
    private String status;
}
