package es.udc.fic.tfg.model.services;

import es.udc.fic.tfg.model.common.exceptions.InstanceNotFoundException;
import es.udc.fic.tfg.model.entities.Event;
import es.udc.fic.tfg.model.entities.Notification;
import es.udc.fic.tfg.model.entities.UserNotification;

import java.time.LocalDateTime;
import java.util.Date;
import java.util.List;

public interface NotificationService {
    Notification saveNotification(Long userId, String message, Date createdAt, Long eventId) throws InstanceNotFoundException;
    void markAsRead(Long notificationId, Long userId) throws InstanceNotFoundException;
    Notification sendNotificationToUser(Long userId, Long notificationId) throws InstanceNotFoundException;
    Block<UserNotification> getNotificationsForUser(Long userId, int page, int size) throws InstanceNotFoundException;
}
