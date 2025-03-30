package es.udc.fic.tfg.model.entities;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface QuizTypeDao extends JpaRepository<QuizType, Long> {
    Optional<QuizType> findByCode(QuizTypeCode code);
}
