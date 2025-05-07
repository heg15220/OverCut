package es.udc.fic.tfg.model.entities;


import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GridSlotDao extends JpaRepository<GridSlot, Long> {
    List<GridSlot> findByGameId(Long gameId);
}

