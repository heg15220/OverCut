package com.overcut.f1hub.model.entities;

import com.overcut.f1hub.rest.dtos.LocalDateAttributeConverter;
import jakarta.persistence.*;

import java.time.LocalDate;
import java.util.List;

@Entity
@Table(name = "drivers")
public class Driver {

    @Column(name = "driverId")
    private Long driverId;
    private String forename;
    private String surname;
    private String nationality;

    @Column(name = "dob")
    @Convert(converter = LocalDateAttributeConverter.class)
    private LocalDate dob;

    private List<Result> results;

    private List<SprintResult> sprintResults;

    public Driver() {
    }

    public Driver(String forename, String surname, String nationality, List<Result> results) {
        this.forename = forename;
        this.surname = surname;
        this.nationality = nationality;
        this.results = results;
    }

    public Driver(String forename, String surname, String nationality, LocalDate dob, List<Result> results) {
        this.forename = forename;
        this.surname = surname;
        this.nationality = nationality;
        this.dob = dob;
        this.results = results;
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long getDriverId() {
        return driverId;
    }

    public void setDriverId(Long driverId) {
        this.driverId = driverId;
    }

    public String getForename() {
        return forename;
    }

    public void setForename(String forename) {
        this.forename = forename;
    }

    public String getSurname() {
        return surname;
    }

    public void setSurname(String surname) {
        this.surname = surname;
    }

    public String getNationality() {
        return nationality;
    }

    public void setNationality(String nationality) {
        this.nationality = nationality;
    }

    @OneToMany(mappedBy = "driver")
    public List<Result> getResults() {
        return results;
    }

    public void setResults(List<Result> results) {
        this.results = results;
    }

    @OneToMany(mappedBy = "driver")
    public List<SprintResult> getSprintResults() {
        return sprintResults;
    }

    public void setSprintResults(List<SprintResult> sprintResults) {
        this.sprintResults = sprintResults;
    }

    public LocalDate getDob() {
        return dob;
    }

    public void setDob(LocalDate dob) {
        this.dob = dob;
    }
}
