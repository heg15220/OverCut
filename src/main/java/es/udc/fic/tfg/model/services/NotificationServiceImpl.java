package es.udc.fic.tfg.model.services;

import es.udc.fic.tfg.model.common.exceptions.InstanceNotFoundException;
import es.udc.fic.tfg.model.entities.*;
import org.aspectj.weaver.ast.Not;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Slice;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class NotificationServiceImpl implements NotificationService{

    @Autowired
    private NotificationDao notificationDao;

    @Autowired
    private UserNotificationDao userNotificationDao;

    @Autowired
    private EventDao eventDao;

    @Autowired
    private UserDao userDao;
    @Override
    public Long saveNotification(String message, LocalDateTime createdAt, Long eventId) {
        Event event = eventDao.findEventById(eventId);
        Notification notification = new Notification(message,createdAt,event);
        notificationDao.save(notification);
        return notification.getId();
    }

    @Override
    public void markAsRead(Long notificationId, Long userId) throws InstanceNotFoundException {
        if(userDao.findUserById(userId) == null) throw new InstanceNotFoundException("User not found", userId);
        User user = userDao.findUserById(userId);
        Notification notification = notificationDao.findNotificationById(notificationId);
        UserNotification userNotification = new UserNotification();
        userNotification.setNotification(notification);
        userNotification.setUser(user);
        userNotification.setRead(true);
        userNotification.setEvent(notification.getEvent());
        userNotificationDao.save(userNotification);
    }

    @Override
    public Notification sendNotificationToUser(Long userId, Long notificationId) throws InstanceNotFoundException {
        if(userDao.findUserById(userId) == null) throw new InstanceNotFoundException("User not found", userId);
        if(notificationDao.findNotificationById(notificationId) == null) throw new InstanceNotFoundException("Notification" +
                " not found", notificationId);
        Notification notification = notificationDao.findNotificationById(notificationId);
        return notification;
    }

    @Override
    public Block<UserNotification> getNotificationsForUser(Long userId, int page, int size) throws InstanceNotFoundException {
        User user = userDao.findUserById(userId);
        if (user == null) {
            throw new InstanceNotFoundException("User not found", userId);
        }

        Slice<UserNotification> userNotifications = userNotificationDao.findByUser(user, PageRequest.of(page,size));
        return new Block<>(userNotifications.getContent(),userNotifications.hasNext());
    }
}
