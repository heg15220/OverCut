package com.overcut.f1hub.model.entities;

import lombok.*;
import java.io.Serializable;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LapTimeId implements Serializable {
    private Long raceId;
    private Long driverId;
    private Integer lap;
}

