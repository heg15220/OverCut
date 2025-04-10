package es.udc.fic.tfg.model.entities;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TikiTakaCriteriaDao extends JpaRepository<TikiTakaCriteria, Long> {
    List<TikiTakaCriteria> findByAxis(String axis);

}
