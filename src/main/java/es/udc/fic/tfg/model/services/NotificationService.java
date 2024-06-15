package es.udc.fic.tfg.model.services;

import es.udc.fic.tfg.model.common.exceptions.InstanceNotFoundException;
import es.udc.fic.tfg.model.entities.Notification;

public interface NotificationService {
    void saveNotification(Notification notification);
    void markAsRead(Long notificationId, Long userId) throws InstanceNotFoundException;
}
