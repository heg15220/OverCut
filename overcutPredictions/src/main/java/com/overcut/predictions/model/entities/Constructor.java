package com.overcut.predictions.model.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "constructors")
public class Constructor {

    @Id
    @Column(name = "constructorId")
    private Long constructorId;

    @Column(name = "name")
    private String name;

    @Column(name = "nationality")
    private String nationality;

    public Constructor() {}

    public Long getConstructorId() {
        return constructorId;
    }

    public void setConstructorId(Long constructorId) {
        this.constructorId = constructorId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getNationality() {
        return nationality;
    }

    public void setNationality(String nationality) {
        this.nationality = nationality;
    }
}
