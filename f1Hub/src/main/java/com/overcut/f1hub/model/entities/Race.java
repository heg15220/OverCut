package com.overcut.f1hub.model.entities;

import jakarta.persistence.*;

import java.util.List;

@Entity
@Table(name = "races")
public class Race {

    @Column(name = "raceId")
    private Long raceId;
    private Integer year;
    private String name;
    private List<Result> resultList;

    public Race() {
    }

    public Race(Integer year, String name, List<Result> resultList) {
        this.year = year;
        this.name = name;
        this.resultList = resultList;
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long getRaceId() {
        return raceId;
    }

    public void setRaceId(Long raceId) {
        this.raceId = raceId;
    }

    public Integer getYear() {
        return year;
    }

    public void setYear(Integer year) {
        this.year = year;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    @OneToMany(mappedBy = "race")
    public List<Result> getResultList() {
        return resultList;
    }

    public void setResultList(List<Result> resultList) {
        this.resultList = resultList;
    }
}
