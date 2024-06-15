package es.udc.fic.tfg.model.entities;

import jakarta.persistence.*;

import java.util.Date;
import java.util.List;

@Entity
public class Event {

    private Long id;


    private String name;

    private String description;

    private Date date;

    private String location;

    private String imageUrl;

    private List<Notification> notifications;


    public Event(String name, String description, Date date, String location, String imageUrl) {
        this.name = name;
        this.description = description;
        this.date = date;
        this.location = location;
        this.imageUrl = imageUrl;
    }

    public Event() {

    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Date getDate() {
        return date;
    }

    public void setDate(Date date) {
        this.date = date;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    @OneToMany(mappedBy = "event")
    public List<Notification> getNotifications() {
        return notifications;
    }

    public void setNotifications(List<Notification> notifications) {
        this.notifications = notifications;
    }
}
