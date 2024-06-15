package es.udc.fic.tfg.model.services;

import es.udc.fic.tfg.model.common.exceptions.InstanceNotFoundException;
import es.udc.fic.tfg.model.entities.Event;
import es.udc.fic.tfg.model.entities.Notification;

import java.time.LocalDateTime;

public interface NotificationService {
    Long saveNotification(String message, LocalDateTime createdAt,Long eventId);
    void markAsRead(Long notificationId, Long userId) throws InstanceNotFoundException;
    Notification sendNotificationToUser(Long userId, Long notificationId) throws InstanceNotFoundException;
}
