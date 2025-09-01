package overcut.model.entities;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
public class CookieConsent {

    private Long id;


    private User user; // opcional (null si anónimo)

    private String consentId; // UUID anónimo, viene de cookie oc_cid

    private boolean preferences;
    private boolean analytics;
    private boolean ads;

    private String country;
    private Boolean dnt; // Do Not Track recibido

    @Lob
    private String tcfString;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        createdAt = LocalDateTime.now();
        updatedAt = createdAt;
        if (dnt == null) dnt = false;            // <-- AÑADIDO
        // por si acaso quieres blindar también:
        // preferences, analytics, ads ya son primitivos y valen false por defecto
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
        if (dnt == null) dnt = false;            // <-- AÑADIDO
    }

    public CookieConsent() {
    }

    public CookieConsent(User user, String consentId, boolean preferences, boolean analytics, boolean ads, String country, Boolean dnt, String tcfString, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.user = user;
        this.consentId = consentId;
        this.preferences = preferences;
        this.analytics = analytics;
        this.ads = ads;
        this.country = country;
        this.dnt = dnt;
        this.tcfString = tcfString;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "userId", unique = true)
    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    @Column(name="consentId", unique = true)
    public String getConsentId() {
        return consentId;
    }

    public void setConsentId(String consentId) {
        this.consentId = consentId;
    }

    public boolean isPreferences() {
        return preferences;
    }

    public void setPreferences(boolean preferences) {
        this.preferences = preferences;
    }

    public boolean isAnalytics() {
        return analytics;
    }

    public void setAnalytics(boolean analytics) {
        this.analytics = analytics;
    }

    public boolean isAds() {
        return ads;
    }

    public void setAds(boolean ads) {
        this.ads = ads;
    }

    public String getCountry() {
        return country;
    }

    public void setCountry(String country) {
        this.country = country;
    }

    @Column(nullable = false)
    public Boolean getDnt() {
        return dnt;
    }

    public void setDnt(Boolean dnt) {
        this.dnt = dnt;
    }

    public String getTcfString() {
        return tcfString;
    }

    public void setTcfString(String tcfString) {
        this.tcfString = tcfString;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
