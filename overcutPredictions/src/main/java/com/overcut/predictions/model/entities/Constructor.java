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

}
