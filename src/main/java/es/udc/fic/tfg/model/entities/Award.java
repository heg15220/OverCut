package es.udc.fic.tfg.model.entities;

import jakarta.persistence.*;

@Entity
public class Award {
    private Long id;

    private String award;

    private int requiredPoints;

    private User user;

    public Award(){

    }

    public Award(String award, int requiredPoints, User user) {
        this.award = award;
        this.requiredPoints = requiredPoints;
        this.user = user;
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getAward() {
        return award;
    }

    public void setAward(String award) {
        this.award = award;
    }

    public int getRequiredPoints() {
        return requiredPoints;
    }

    public void setRequiredPoints(int requiredPoints) {
        this.requiredPoints = requiredPoints;
    }

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "userId")
    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }
}
