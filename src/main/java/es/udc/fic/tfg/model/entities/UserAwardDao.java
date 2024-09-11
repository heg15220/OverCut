package es.udc.fic.tfg.model.entities;

import org.springframework.data.domain.Slice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Set;

public interface UserAwardDao extends JpaRepository<UserAward, Long> {
    @Query("SELECT u FROM UserAward u WHERE u.id = :id")
    UserAward findUserAwardById(@Param("id") Long id);

    @Query("SELECT ua.award.id FROM UserAward ua WHERE ua.user.id = :userId")
    Set<Long> findClaimedAwardIds(@Param("userId") Long userId);
}
