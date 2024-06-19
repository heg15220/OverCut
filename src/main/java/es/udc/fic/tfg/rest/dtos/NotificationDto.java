package es.udc.fic.tfg.rest.dtos;

import com.fasterxml.jackson.annotation.JsonFormat;
import es.udc.fic.tfg.model.entities.Event;

import java.time.LocalDateTime;

public class NotificationDto {
    private Long id;


    private String message;


    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss.SSSXXX", timezone = "UTC")
    private LocalDateTime createdAt;


    private Long eventId;

    public NotificationDto(Long id, String message, LocalDateTime createdAt, Long eventId) {
        this.id = id;
        this.message = message;
        this.createdAt = createdAt;
        this.eventId = eventId;
    }

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

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public Long getEventId() {
        return eventId;
    }

    public void setEventId(Long eventId) {
        this.eventId = eventId;
    }
}
