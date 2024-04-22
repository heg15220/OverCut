package es.udc.fic.tfg.model.entities;

import org.springframework.data.domain.Slice;

public interface CustomizedUserAnswerDao {
    Slice<UserAnswer> filterByUserIdAndQuizId(Long userId, Long quizId, int page, int size);
}
