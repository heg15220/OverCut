package es.udc.fic.tfg.model.entities;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Slice;
import org.springframework.data.domain.SliceImpl;

import java.util.List;

public class CustomizedAssessmentDaoImpl implements CustomizedAssessmentDao{
    @PersistenceContext
    private EntityManager entityManager;

    @Override
    public Slice<Assessment> filterUserAssessmentsByUserId(Long userId, int page, int size) {
        String query = "SELECT a FROM Assessment a WHERE a.user.id = :userId";
        Query querySentence = entityManager.createQuery(query)
                .setParameter("userId", userId)
                .setFirstResult(page * size)
                .setMaxResults(size + 1);

        List<Assessment> assessments = querySentence.getResultList();
        boolean hasNextAssessment = assessments.size() == (size + 1);

        if (hasNextAssessment) {
            assessments.remove(assessments.size() - 1);
        }

        return new SliceImpl<>(assessments, PageRequest.of(page, size), hasNextAssessment);
    }
}
