package com.overcut.predictions.model.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "results")
public class Result {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "resultId")
    private Long resultId;

    @Column(name = "raceId")
    private Long raceId;

    @Column(name = "driverId")
    private Long driverId;

    @Column(name = "constructorId")
    private Long constructorId;

    // ✅ en tu DDL es positionOrder
    @Column(name = "positionOrder")
    private Integer positionOrder;

    // ✅ en tu DDL es DOUBLE
    @Column(name = "points")
    private Double points;


    public Result() {}

    public Long getResultId() {
        return resultId;
    }

    public void setResultId(Long resultId) {
        this.resultId = resultId;
    }

    public Long getRaceId() {
        return raceId;
    }

    public void setRaceId(Long raceId) {
        this.raceId = raceId;
    }

    public Long getDriverId() {
        return driverId;
    }

    public void setDriverId(Long driverId) {
        this.driverId = driverId;
    }

    public Long getConstructorId() {
        return constructorId;
    }

    public void setConstructorId(Long constructorId) {
        this.constructorId = constructorId;
    }

    public Integer getPositionOrder() {
        return positionOrder;
    }

    public void setPositionOrder(Integer positionOrder) {
        this.positionOrder = positionOrder;
    }

    public Double getPoints() {
        return points;
    }

    public void setPoints(Double points) {
        this.points = points;
    }
}
