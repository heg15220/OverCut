package com.overcut.f1hub.model.entities;


import jakarta.persistence.*;

@Entity
@Table(name = "qualifying")
public class Qualifying {


    private Long qualifyId;


    private Race race;


    private Driver driver;


    private Constructor constructor;

    private Integer number;
    private Integer position;
    private String q1;
    private String q2;
    private String q3;

    public Qualifying() {
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long getQualifyId() {
        return qualifyId;
    }

    public void setQualifyId(Long qualifyId) {
        this.qualifyId = qualifyId;
    }

    @ManyToOne
    @JoinColumn(name = "raceId", nullable = false)
    public Race getRace() {
        return race;
    }

    public void setRace(Race race) {
        this.race = race;
    }

    @ManyToOne
    @JoinColumn(name = "driverId", nullable = false)
    public Driver getDriver() {
        return driver;
    }

    public void setDriver(Driver driver) {
        this.driver = driver;
    }

    @ManyToOne
    @JoinColumn(name = "constructorId", nullable = false)
    public Constructor getConstructor() {
        return constructor;
    }

    public void setConstructor(Constructor constructor) {
        this.constructor = constructor;
    }

    public Integer getNumber() {
        return number;
    }

    public void setNumber(Integer number) {
        this.number = number;
    }

    public Integer getPosition() {
        return position;
    }

    public void setPosition(Integer position) {
        this.position = position;
    }

    public String getQ1() {
        return q1;
    }

    public void setQ1(String q1) {
        this.q1 = q1;
    }

    public String getQ2() {
        return q2;
    }

    public void setQ2(String q2) {
        this.q2 = q2;
    }

    public String getQ3() {
        return q3;
    }

    public void setQ3(String q3) {
        this.q3 = q3;
    }
}
