package es.udc.fic.tfg.model.entities;

import org.springframework.data.domain.Slice;

public interface CustomizedAssessmentDao {
    Slice<Assessment> filterUserAssessmentsByUserId(Long userId, int page, int size);
}
