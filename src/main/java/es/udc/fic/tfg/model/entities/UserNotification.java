package es.udc.fic.tfg.model.entities;

import jakarta.persistence.*;

@Entity
public class UserNotification {

    private Long id;


    private Notification notification;


    private User user;


    private Boolean read;

    private Event event;

    public UserNotification(Notification notification, User user, Boolean read, Event event) {
        this.notification = notification;
        this.user = user;
        this.read = read;
        this.event = event;
    }

    public UserNotification() {

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
    @JoinColumn(name = "notificationId")
    public Notification getNotification() {
        return notification;
    }

    public void setNotification(Notification notification) {
        this.notification = notification;
    }

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "userId")
    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public Boolean getRead() {
        return read;
    }

    public void setRead(Boolean read) {
        this.read = read;
    }

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "eventId")
    public Event getEvent() {
        return event;
    }

    public void setEvent(Event event) {
        this.event = event;
    }
}
