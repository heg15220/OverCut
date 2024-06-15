package es.udc.fic.tfg.model.services;

import es.udc.fic.tfg.model.common.exceptions.InstanceNotFoundException;
import es.udc.fic.tfg.model.entities.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class NotificationServiceImpl implements NotificationService{

    @Autowired
    private NotificationDao notificationDao;

    @Autowired
    private UserNotificationDao userNotificationDao;

    @Autowired
    private UserDao userDao;
    @Override
    public void saveNotification(Notification notification) {
        notificationDao.save(notification);
    }

    @Override
    public void markAsRead(Long notificationId, Long userId) throws InstanceNotFoundException {
        if(userDao.findUserById(userId) == null) throw new InstanceNotFoundException("User not found", userId);
        User user = userDao.findUserById(userId);
        UserNotification userNotification = new UserNotification();
        userNotification.setNotification(new Notification());
        userNotification.setUser(user);
        userNotification.setRead(true);
        userNotificationDao.save(userNotification);
    }
}
