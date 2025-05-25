package com.overcut.f1hub.model.entities;


import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "seasons")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Season {
    @Id
    private Integer year;
    private String url;
}
