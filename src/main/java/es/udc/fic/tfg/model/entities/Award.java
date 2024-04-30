package es.udc.fic.tfg.model.entities;

import jakarta.persistence.*;

@Entity
public class Award {
    private Long id;

    private String prize;

    private int requiredPoints;

    private User user;

    public Award(){

    }

    public Award(String prize, int requiredPoints, User user) {
        this.prize = prize;
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

    public String getPrize() {
        return prize;
    }

    public void setPrize(String prize) {
        this.prize = prize;
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
