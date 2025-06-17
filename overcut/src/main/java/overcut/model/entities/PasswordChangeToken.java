package overcut.model.entities;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
public class PasswordChangeToken {

    private Long id;

    @Column(nullable = false, unique = true)
    private String token;

    @Column(nullable = false)
    private LocalDateTime expiration;

    @Column(nullable = false)
    private String newPassword;

    @Column(nullable = false)
    private boolean used = false;

    private User user;

    public PasswordChangeToken() {
    }

    public PasswordChangeToken(String token, LocalDateTime expiration, String newPassword, boolean used, User user) {
        this.token = token;
        this.expiration = expiration;
        this.newPassword = newPassword;
        this.used = used;
        this.user = user;
    }

    // Getters y setters


    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public LocalDateTime getExpiration() { return expiration; }
    public void setExpiration(LocalDateTime expiration) { this.expiration = expiration; }

    public String getNewPassword() { return newPassword; }
    public void setNewPassword(String newPassword) { this.newPassword = newPassword; }

    public boolean isUsed() { return used; }
    public void setUsed(boolean used) { this.used = used; }


    @ManyToOne(optional = false)
    @JoinColumn(name = "userId")
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
}
