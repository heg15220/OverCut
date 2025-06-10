package overcut.model.entities;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
public class EmailVerificationToken {


    private Long id;

    private String token;


    private User user;

    private LocalDateTime expiration;

    public EmailVerificationToken() {
    }

    public EmailVerificationToken(String token, User user, LocalDateTime expiration) {
        this.token = token;
        this.user = user;
        this.expiration = expiration;
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    @OneToOne
    @JoinColumn(name = "userId", unique = true)
    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public LocalDateTime getExpiration() {
        return expiration;
    }

    public void setExpiration(LocalDateTime expiration) {
        this.expiration = expiration;
    }
}
