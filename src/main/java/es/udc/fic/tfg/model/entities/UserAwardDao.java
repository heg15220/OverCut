package es.udc.fic.tfg.model.entities;

import org.springframework.data.domain.Slice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserAwardDao extends JpaRepository<UserAward, Long> {

}
