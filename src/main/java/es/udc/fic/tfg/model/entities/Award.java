package es.udc.fic.tfg.model.entities;

import jakarta.persistence.*;

@Entity
public class Award {
    private Long id;

    private String award;

    private int requiredPoints;

    private String image;
    private User user;

    public Award(){

    }

    public Award(String award, int requiredPoints, String image,User user) {
        this.award = award;
        this.requiredPoints = requiredPoints;
        this.image = image;
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

    public String getImage() {
        return image;
    }

    public void setImage(String image) {
        this.image = image;
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
