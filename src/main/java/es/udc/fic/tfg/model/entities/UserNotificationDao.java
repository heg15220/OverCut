package es.udc.fic.tfg.model.entities;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface UserNotificationDao extends CrudRepository<UserNotification, Long> {
    @Query("SELECT unn FROM UserNotification unn WHERE unn.user.id = :userId") // Ajusta la consulta para usar el ID del usuario
    Slice<UserNotification> findByUserId(@Param("userId") Long userId, Pageable pageable); // Cambia el nombre del método y el tipo del parámetro
}
