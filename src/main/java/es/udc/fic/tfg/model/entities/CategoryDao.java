package es.udc.fic.tfg.model.entities;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;


public interface CategoryDao extends JpaRepository<Category, Long> {
    @Query("SELECT c FROM Category c WHERE c.id =?1")
    Category findCategoryById(Long id);
}
