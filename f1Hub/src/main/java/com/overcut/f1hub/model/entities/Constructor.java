package com.overcut.f1hub.model.entities;

import jakarta.persistence.*;

import java.util.List;

@Entity
@Table(name = "constructors")
public class Constructor {


    @Column(name = "constructorId")
    private Long constructorId;
    private String constructorRef;
    private String name;
    private List<Result> resultList;
    private List<SprintResult> sprintResults;

    public Constructor() {
    }

    public Constructor(String constructorRef, String name, List<Result> resultList) {
        this.constructorRef = constructorRef;
        this.name = name;
        this.resultList = resultList;
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long getConstructorId() {
        return constructorId;
    }

    public void setConstructorId(Long constructorId) {
        this.constructorId = constructorId;
    }

    public String getConstructorRef() {
        return constructorRef;
    }

    public void setConstructorRef(String constructorRef) {
        this.constructorRef = constructorRef;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    @OneToMany(mappedBy = "constructor")
    public List<Result> getResultList() {
        return resultList;
    }

    public void setResultList(List<Result> resultList) {
        this.resultList = resultList;
    }

    @OneToMany(mappedBy = "constructor")
    public List<SprintResult> getSprintResults() {
        return sprintResults;
    }

    public void setSprintResults(List<SprintResult> sprintResults) {
        this.sprintResults = sprintResults;
    }
}
