package es.udc.fic.tfg.model.entities;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.repository.CrudRepository;

public interface CommentDao extends CrudRepository<Comment, Long> {
    /**
     * Get all comments by its postId.
     *
     * @param pageable an object with information about pagination
     *
     * @return A slice containing all the comments that were found
     */
    Slice<Comment> findCommentByPostId(Long postId, Pageable pageable);
}

