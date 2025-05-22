package overcut.model.entities;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;

public interface NotificationDao extends CrudRepository<Notification, Long> {

    @Query("SELECT n FROM Notification n WHERE n.id = ?1")
    Notification findNotificationById(Long notificationId);


}
