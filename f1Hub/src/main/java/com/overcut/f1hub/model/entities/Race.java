package com.overcut.f1hub.model.entities;

import jakarta.persistence.*;

import java.sql.Date;
import java.sql.Time;
import java.util.List;

@Entity
@Table(name = "races")
@Access(AccessType.PROPERTY)
public class Race {

    private Long raceId;
    private Integer year;
    private String name;
    private Integer round;
    private Circuit circuit;
    private Date date;
    private Time time;
    private String url;

    private Date fp1Date;
    private Time fp1Time;
    private Date fp2Date;
    private Time fp2Time;
    private Date fp3Date;
    private Time fp3Time;
    private Date qualiDate;
    private Time qualiTime;
    private Date sprintDate;
    private Time sprintTime;

    private List<Result> resultList;

    private List<SprintResult> sprintResults;

    public Race() {
    }

    public Race(Integer year, String name, Integer round, List<Result> resultList) {
        this.year = year;
        this.name = name;
        this.round = round;
        this.resultList = resultList;
    }

    public Race(Integer year, String name, Integer round, Date fp1Date, Date fp2Date, Date fp3Date,
                Date qualiDate, Date sprintDate, List<Result> resultList) {
        this.year = year;
        this.name = name;
        this.round = round;
        this.fp1Date = fp1Date;
        this.fp2Date = fp2Date;
        this.fp3Date = fp3Date;
        this.qualiDate = qualiDate;
        this.sprintDate = sprintDate;
        this.resultList = resultList;
    }

    public Race(Integer year, String name, Integer round, Circuit circuit, Date date, Time time, String url,
                Date fp1Date, Time fp1Time, Date fp2Date, Time fp2Time, Date fp3Date, Time fp3Time,
                Date qualiDate, Time qualiTime, Date sprintDate, Time sprintTime, List<Result> resultList) {
        this.year = year;
        this.name = name;
        this.round = round;
        this.circuit = circuit;
        this.date = date;
        this.time = time;
        this.url = url;
        this.fp1Date = fp1Date;
        this.fp1Time = fp1Time;
        this.fp2Date = fp2Date;
        this.fp2Time = fp2Time;
        this.fp3Date = fp3Date;
        this.fp3Time = fp3Time;
        this.qualiDate = qualiDate;
        this.qualiTime = qualiTime;
        this.sprintDate = sprintDate;
        this.sprintTime = sprintTime;
        this.resultList = resultList;
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "raceId")
    public Long getRaceId() {
        return raceId;
    }

    public void setRaceId(Long raceId) {
        this.raceId = raceId;
    }

    // ==== Básicos ====

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

    @Column(name = "round")
    public Integer getRound() {
        return round;
    }

    public void setRound(Integer round) {
        this.round = round;
    }

    // ==== Circuit ====

    @ManyToOne
    @JoinColumn(name = "circuitId")
    public Circuit getCircuit() {
        return circuit;
    }

    public void setCircuit(Circuit circuit) {
        this.circuit = circuit;
    }

    public Date getDate() {
        return date;
    }

    public void setDate(Date date) {
        this.date = date;
    }

    public Time getTime() {
        return time;
    }

    public void setTime(Time time) {
        this.time = time;
    }

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    // ==== FP1 ====

    @Column(name = "fp1_date")
    public Date getFp1Date() {
        return fp1Date;
    }

    public void setFp1Date(Date fp1Date) {
        this.fp1Date = fp1Date;
    }

    @Column(name = "fp1_time")
    public Time getFp1Time() {
        return fp1Time;
    }

    public void setFp1Time(Time fp1Time) {
        this.fp1Time = fp1Time;
    }

    // ==== FP2 ====

    @Column(name = "fp2_date")
    public Date getFp2Date() {
        return fp2Date;
    }

    public void setFp2Date(Date fp2Date) {
        this.fp2Date = fp2Date;
    }

    @Column(name = "fp2_time")
    public Time getFp2Time() {
        return fp2Time;
    }

    public void setFp2Time(Time fp2Time) {
        this.fp2Time = fp2Time;
    }

    // ==== FP3 ====

    @Column(name = "fp3_date")
    public Date getFp3Date() {
        return fp3Date;
    }

    public void setFp3Date(Date fp3Date) {
        this.fp3Date = fp3Date;
    }

    @Column(name = "fp3_time")
    public Time getFp3Time() {
        return fp3Time;
    }

    public void setFp3Time(Time fp3Time) {
        this.fp3Time = fp3Time;
    }

    // ==== Quali ====

    @Column(name = "quali_date")
    public Date getQualiDate() {
        return qualiDate;
    }

    public void setQualiDate(Date qualiDate) {
        this.qualiDate = qualiDate;
    }

    @Column(name = "quali_time")
    public Time getQualiTime() {
        return qualiTime;
    }

    public void setQualiTime(Time qualiTime) {
        this.qualiTime = qualiTime;
    }

    // ==== Sprint ====

    @Column(name = "sprint_date")
    public Date getSprintDate() {
        return sprintDate;
    }

    public void setSprintDate(Date sprintDate) {
        this.sprintDate = sprintDate;
    }

    @Column(name = "sprint_time")
    public Time getSprintTime() {
        return sprintTime;
    }

    public void setSprintTime(Time sprintTime) {
        this.sprintTime = sprintTime;
    }

    // ==== Relación con Result ====

    @OneToMany(mappedBy = "race")
    public List<Result> getResultList() {
        return resultList;
    }

    public void setResultList(List<Result> resultList) {
        this.resultList = resultList;
    }

    @OneToMany(mappedBy = "race")
    public List<SprintResult> getSprintResults() {
        return sprintResults;
    }

    public void setSprintResults(List<SprintResult> sprintResults) {
        this.sprintResults = sprintResults;
    }
}
