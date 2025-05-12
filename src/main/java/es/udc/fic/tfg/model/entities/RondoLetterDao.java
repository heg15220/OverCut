package es.udc.fic.tfg.model.entities;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RondoLetterDao extends JpaRepository<RondoLetter, Long> {

    List<RondoLetter> findByGameIdOrderByLetterAsc(Long gameId);

    Optional<RondoLetter> findByGameIdAndLetter(Long gameId, char letter);
}

