package overcut.model.entities;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CrosswordGameDao extends JpaRepository<CrosswordGame, Long> {
    @Query("SELECT g FROM CrosswordGame g WHERE g.id = :gameId")
    CrosswordGame findGameById(@Param("gameId") Long gameId);
}
