package com.overcut.f1hub.model.entities;

import jakarta.persistence.*;

import java.util.List;

@Entity
@Table(name = "status")
public class Status {


    @Column(name = "statusId")
    private Long statusId;
    private String status;
    private List<Result> resultList;

    public Status() {
    }

    public Status(String status, List<Result> resultList) {
        this.status = status;
        this.resultList = resultList;
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long getStatusId() {
        return statusId;
    }

    public void setStatusId(Long statusId) {
        this.statusId = statusId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    @OneToMany(mappedBy = "status")
    public List<Result> getResultList() {
        return resultList;
    }

    public void setResultList(List<Result> resultList) {
        this.resultList = resultList;
    }
}


