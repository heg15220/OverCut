package es.udc.fic.tfg.model.entities;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;

public interface AwardDao extends CrudRepository<Award, Long> {
    @Query("SELECT a FROM Award a WHERE a.id = :id")
    Award findAwardById(@Param("id") Long id);

    @Query("SELECT a FROM Award a WHERE a.user.id = :userId AND :userPoints >= a.requiredPoints")
    Slice<Award> findAwardsAvailableForUser(@Param("userId") Long userId, @Param("userPoints") int userPoints, Pageable pageable);

}
