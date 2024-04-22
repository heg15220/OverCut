package es.udc.fic.tfg.model.entities;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Slice;
import org.springframework.data.domain.SliceImpl;

import java.util.List;

public class CustomizedUserAnswerDaoImpl implements CustomizedUserAnswerDao{
    @PersistenceContext
    private EntityManager entityManager;

    @Override
    public Slice<UserAnswer> filterByUserIdAndQuizId(Long userId, Long quizId, int page, int size) {
        String query = "SELECT ua FROM UserAnswer ua WHERE ua.user.id = :userId AND ua.quiz.id = :quizId";
        Query querySentence = entityManager.createQuery(query)
                .setParameter("userId", userId)
                .setParameter("quizId", quizId)
                .setFirstResult(page * size)
                .setMaxResults(size + 1);

        List<UserAnswer> userAnswers = querySentence.getResultList();
        boolean hasNext = userAnswers.size() == (size + 1);

        if (hasNext) {
            userAnswers.remove(userAnswers.size() - 1);
        }

        return new SliceImpl<>(userAnswers, PageRequest.of(page, size), hasNext);
    }
}
