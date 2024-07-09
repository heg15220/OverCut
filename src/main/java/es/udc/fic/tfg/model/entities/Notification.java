package es.udc.fic.tfg.model.entities;

import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.Date;
import java.util.List;

@Entity
public class Notification {
    private Long id;


    private String message;


    private Date createdAt;


    private Event event;
    private List<UserNotification> userNotificationList;

    public Notification(String message, Date createdAt, Event event) {
        this.message = message;
        this.createdAt = createdAt;
        this.event = event;
    }

    public Notification() {

    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public Date getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Date createdAt) {
        this.createdAt = createdAt;
    }

    @ManyToOne
    @JoinColumn(name = "eventId", referencedColumnName = "id")
    public Event getEvent() {
        return event;
    }

    public void setEvent(Event event) {
        this.event = event;
    }

    @OneToMany(mappedBy = "notification")
    public List<UserNotification> getUserNotificationList() {
        return userNotificationList;
    }

    public void setUserNotificationList(List<UserNotification> userNotificationList) {
        this.userNotificationList = userNotificationList;
    }
}
