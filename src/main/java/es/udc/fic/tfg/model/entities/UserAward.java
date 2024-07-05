package es.udc.fic.tfg.model.entities;

import jakarta.persistence.*;

@Entity
public class UserAward {

    private Long id;


    private User user;


    private Award award;

    public UserAward() {
    }
    public UserAward(User user, Award award) {
        this.user = user;
        this.award = award;
    }



    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "userId")
    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "awardId")
    public Award getAward() {
        return award;
    }

    public void setAward(Award award) {
        this.award = award;
    }
}
