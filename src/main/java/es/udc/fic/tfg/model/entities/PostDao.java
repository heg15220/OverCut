package es.udc.fic.tfg.model.entities;

import es.udc.fic.tfg.model.common.exceptions.InstanceNotFoundException;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.repository.CrudRepository;

import java.time.LocalDateTime;

public interface PostDao extends CrudRepository<Post, Long> {

    /**
     * Exists by post id.
     *
     * @param postId the id to find
     * @return true, if it exists
     */
    boolean existsById(long postId);

    /**
     * Delete a Post by its id
     *
     * @param postId the id of the post
     */
    void deleteById(long postId);

    /**
     * Find by post id.
     *
     * @param id the post id
     * @return the post
     * @throws InstanceNotFoundException
     */
    Post findPostById(Long id) throws InstanceNotFoundException;

    /**
     * Find all posts.
     *
     * @param pageable the pagination information
     * @return the slice of posts
     */
    Slice<Post> findAll(Pageable pageable);

    /**
     * Find by user id order by creation date and in descending order.
     *
     * @param userId   the user id
     * @param pageable the pagination information
     * @return the slice post
     */
    Slice<Post> findByUserIdOrderByCreationDateDesc(Long userId, Pageable pageable);

    /**
     * Find posts with creation date after <code>referenceDate</code>
     *
     * @param referenceDate the date after which are created the posts
     * @return boolean, whether there are new posts or not
     */
    boolean existsByCreationDateAfter(LocalDateTime referenceDate);

}
