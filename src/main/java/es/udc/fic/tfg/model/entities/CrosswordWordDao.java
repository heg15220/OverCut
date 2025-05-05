package es.udc.fic.tfg.model.entities;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface CrosswordWordDao extends JpaRepository<CrosswordWord, Long> {

    @Query("SELECT DISTINCT l.word FROM CrosswordCellWordLink l WHERE l.cell.id = :cellId")
    List<CrosswordWord> findAllByCrosswordCellId(@Param("cellId") Long cellId);
}