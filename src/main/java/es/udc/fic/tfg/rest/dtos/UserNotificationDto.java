package es.udc.fic.tfg.rest.dtos;

import es.udc.fic.tfg.model.entities.Event;
import es.udc.fic.tfg.model.entities.Notification;
import es.udc.fic.tfg.model.entities.User;

import java.util.Date;

public class UserNotificationDto {
    private Long id;


    private Long notificationId;


    private Long userId;


    private Boolean read;

    private Long eventId;

    private Date date;
    private String message;

    public UserNotificationDto(Long id, Long notificationId, Long userId, Boolean read, Long eventId, Date date, String message) {
        this.id = id;
        this.notificationId = notificationId;
        this.userId = userId;
        this.read = read;
        this.eventId = eventId;
        this.date = date;
        this.message = message;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getNotificationId() {
        return notificationId;
    }

    public void setNotificationId(Long notificationId) {
        this.notificationId = notificationId;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public Boolean getRead() {
        return read;
    }

    public void setRead(Boolean read) {
        this.read = read;
    }

    public Long getEventId() {
        return eventId;
    }

    public Date getDate() {
        return date;
    }

    public void setDate(Date date) {
        this.date = date;
    }

    public void setEventId(Long eventId) {
        this.eventId = eventId;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
