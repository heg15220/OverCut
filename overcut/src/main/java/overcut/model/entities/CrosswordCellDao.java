package overcut.model.entities;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CrosswordCellDao extends JpaRepository<CrosswordCell, Long> {
    @Query("SELECT DISTINCT c FROM CrosswordCell c " +
            "JOIN c.wordLinks wl " +
            "JOIN wl.word w " +
            "WHERE w.game.id = :gameId")
    List<CrosswordCell> findCellsWithLinksByGameId(@Param("gameId") Long gameId);

    @Query("SELECT c FROM CrosswordCell c LEFT JOIN FETCH c.wordLinks WHERE c.id = :cellId")
    Optional<CrosswordCell> findCellWithLinksById(@Param("cellId") Long cellId);



}
