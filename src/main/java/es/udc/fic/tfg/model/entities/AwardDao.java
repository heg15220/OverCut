package es.udc.fic.tfg.model.entities;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface AwardDao extends CrudRepository<Award, Long> {
    @Query("SELECT a FROM Award a WHERE a.id = :id")
    Award findAwardById(@Param("id") Long id);

    @Query("SELECT a FROM Award a WHERE a.user.id = :userId AND :totalPoints >= a.requiredPoints")
    Slice<Award> findAwardsAvailableForUser(@Param("userId") Long userId, @Param("totalPoints") int totalPoints, Pageable pageable);

    @Query("SELECT a FROM Award a WHERE a.user.id = :userId")
    Slice<Award> findAllAwardsForUser(@Param("userId") Long userId, Pageable pageable);

    @Query("SELECT a from Award a")
    List<Award> findAllAwards();
    @Query("SELECT a FROM Award a JOIN FETCH a.user u WHERE a.user.id = u.id AND u.points >= a.requiredPoints")
    Slice<Award> findAwardsAvailableForUserByPoints(@Param("userId") Long userId, Pageable pageable);

    @Query("SELECT a FROM Award a WHERE a.user.id = :userId")
    Slice<Award> getAwardsSelectedByUser(@Param("userId") Long userId, Pageable pageable);

    @Query("SELECT DISTINCT a FROM Award a JOIN UserAward ua ON a.id = ua.award.id WHERE ua.user.id = :userId")
    Slice<Award> findByUserId(@Param("userId") Long userId, Pageable pageable);
}
