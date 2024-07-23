package es.udc.fic.tfg.model.entities;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;

public interface UserNotificationDao extends CrudRepository<UserNotification, Long> {
    @Query("SELECT unn FROM UserNotification unn WHERE unn.user.id = :userId") // Ajusta la consulta para usar el ID del usuario
    Slice<UserNotification> findByUserId(@Param("userId") Long userId, Pageable pageable); // Cambia el nombre del método y el tipo del parámetro

    @Query("SELECT unn FROM UserNotification unn JOIN unn.notification n WHERE unn.user.id = :userId AND unn.read = false AND n.createdAt >= CURRENT_DATE")
    Slice<UserNotification> findUnreadByUserIdAndDate(@Param("userId") Long userId, Pageable pageable);


    @Query("SELECT unn FROM UserNotification unn WHERE unn.user.id = :userId AND unn.notification.id = :notificationId")
    UserNotification findByIdAndUserId(@Param("userId") Long userId, @Param("notificationId") Long notificationId);
}
