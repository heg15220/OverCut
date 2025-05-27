package com.overcut.f1hub.model.entities;


import jakarta.persistence.*;
import java.util.*;

@Entity
@Table(name = "results")
@Access(AccessType.FIELD)
public class Result {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "resultId")  // Coincide 100% con la tabla
    private Long resultId;


    @ManyToOne
    @JoinColumn(name = "raceId")
    private Race race;


    @ManyToOne
    @JoinColumn(name = "driverId")
    private Driver driver;

    @ManyToOne
    @JoinColumn(name = "constructorId")
    private Constructor constructor;


    @ManyToOne
    @JoinColumn(name = "statusId")
    private Status status;

    private Integer number;
    private Integer grid;
    private Integer positionOrder;
    private Integer laps;
    private String time;
    private Double points;

    @Column(name = "milliseconds")
    private Integer milliseconds;

    public Result() {
    }

    public Result(Race race, Driver driver, Constructor constructor, Status status,
                  Integer number, Integer grid, Integer positionOrder, Integer laps, String time, Double points) {
        this.race = race;
        this.driver = driver;
        this.constructor = constructor;
        this.status = status;
        this.number = number;
        this.grid = grid;
        this.positionOrder = positionOrder;
        this.laps = laps;
        this.time = time;
        this.points = points;
    }

    public Result(Race race, Driver driver, Constructor constructor, Status status, Integer number, Integer grid,
                  Integer positionOrder, Integer laps, String time, Double points, Integer milliseconds) {
        this.race = race;
        this.driver = driver;
        this.constructor = constructor;
        this.status = status;
        this.number = number;
        this.grid = grid;
        this.positionOrder = positionOrder;
        this.laps = laps;
        this.time = time;
        this.points = points;
        this.milliseconds = milliseconds;
    }

    public Long getResultId() {
        return resultId;
    }

    public void setResultId(Long resultId) {
        this.resultId = resultId;
    }


    public Race getRace() {
        return race;
    }

    public void setRace(Race race) {
        this.race = race;
    }


    public Driver getDriver() {
        return driver;
    }

    public void setDriver(Driver driver) {
        this.driver = driver;
    }


    public Constructor getConstructor() {
        return constructor;
    }

    public void setConstructor(Constructor constructor) {
        this.constructor = constructor;
    }


    public Status getStatus() {
        return status;
    }

    public void setStatus(Status status) {
        this.status = status;
    }

    public Integer getNumber() {
        return number;
    }

    public void setNumber(Integer number) {
        this.number = number;
    }

    public Integer getGrid() {
        return grid;
    }

    public void setGrid(Integer grid) {
        this.grid = grid;
    }

    public Integer getPositionOrder() {
        return positionOrder;
    }

    public void setPositionOrder(Integer positionOrder) {
        this.positionOrder = positionOrder;
    }

    public Integer getLaps() {
        return laps;
    }

    public void setLaps(Integer laps) {
        this.laps = laps;
    }

    public String getTime() {
        return time;
    }

    public void setTime(String time) {
        this.time = time;
    }

    public Double getPoints() {
        return points;
    }

    public void setPoints(Double points) {
        this.points = points;
    }

    public Integer getMilliseconds() {
        return milliseconds;
    }

    public void setMilliseconds(Integer milliseconds) {
        this.milliseconds = milliseconds;
    }
}

