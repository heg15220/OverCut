package es.udc.fic.tfg.model.services;

import es.udc.fic.tfg.model.common.exceptions.InstanceNotFoundException;
import es.udc.fic.tfg.model.entities.*;
import org.aspectj.weaver.ast.Not;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Slice;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Date;
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

    public static Date localDateTimeToDate(LocalDateTime localDateTime) {
        // Convierte LocalDateTime a Instant en UTC
        Instant instant = localDateTime.atZone(ZoneId.systemDefault()).toInstant();

        // Crea un objeto Date a partir del Instant
        Date date = Date.from(instant);

        return date;
    }
    @Override
    public Notification saveNotification(Long userId,String message, Date createdAt, Long eventId) throws InstanceNotFoundException {
        Event event = eventDao.findEventById(eventId);
        User user = userDao.findUserById(userId);
        Notification notification = new Notification(message,createdAt,event);
        notificationDao.save(notification);
        UserNotification userNotification= new UserNotification(notification,user,false,event);
        userNotificationDao.save(userNotification);
        return notification;
    }

    @Override
    public void markAsRead(Long notificationId, Long userId) throws InstanceNotFoundException {
        if(userDao.findUserById(userId) == null) throw new InstanceNotFoundException("User not found", userId);
        User user = userDao.findUserById(userId);
        UserNotification userNotification = userNotificationDao.findByIdAndUserId(userId,notificationId);
        userNotification.setRead(true);
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

        Slice<UserNotification> userNotifications = userNotificationDao.findUnreadByUserId(userId, PageRequest.of(page,size));
        return new Block<>(userNotifications.getContent(),userNotifications.hasNext());
    }
}
