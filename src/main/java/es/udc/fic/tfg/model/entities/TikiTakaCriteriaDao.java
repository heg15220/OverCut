package es.udc.fic.tfg.model.entities;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface TikiTakaCriteriaDao extends JpaRepository<TikiTakaCriteria, Long> {
    List<TikiTakaCriteria> findByAxis(String axis);

    @Query("SELECT t FROM TikiTakaCriteria t WHERE t.axis = :axis AND t.game.id = :gameId")
    List<TikiTakaCriteria> findByAxisAndGameId(@Param("axis") String axis, @Param("gameId") Long gameId);

}
