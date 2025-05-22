package overcut.model.services;

import overcut.model.common.exceptions.InstanceNotFoundException;
import overcut.model.entities.Notification;
import overcut.model.entities.UserNotification;

import java.util.Date;

public interface NotificationService {
    Notification saveNotification(Long userId, String message, Date createdAt, Long eventId) throws InstanceNotFoundException;
    void markAsRead(Long notificationId, Long userId) throws InstanceNotFoundException;
    Notification sendNotificationToUser(Long userId, Long notificationId) throws InstanceNotFoundException;
    Block<UserNotification> getNotificationsForUser(Long userId, int page, int size) throws InstanceNotFoundException;
}
