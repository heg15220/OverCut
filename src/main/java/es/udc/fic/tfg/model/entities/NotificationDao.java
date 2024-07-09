package es.udc.fic.tfg.model.entities;

import org.aspectj.weaver.ast.Not;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface NotificationDao extends CrudRepository<Notification, Long> {

    @Query("SELECT n FROM Notification n WHERE n.id = ?1")
    Notification findNotificationById(Long notificationId);


}
