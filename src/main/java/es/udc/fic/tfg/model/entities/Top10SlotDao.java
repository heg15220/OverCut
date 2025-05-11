package es.udc.fic.tfg.model.entities;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface Top10SlotDao extends JpaRepository<Top10Slot, Long> {
    List<Top10Slot> findByGameId(Long gameId);
}
