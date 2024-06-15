package es.udc.fic.tfg.model.entities;

import org.aspectj.weaver.ast.Not;
import org.springframework.data.repository.CrudRepository;

public interface NotificationDao extends CrudRepository<Notification, Long> {
}
