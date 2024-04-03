package es.udc.fic.tfg.model.services;

import es.udc.fic.tfg.model.common.exceptions.InstanceNotFoundException;
import es.udc.fic.tfg.model.entities.Comment;

/**
 * The Interface CommentService.
 */
public interface CommentService {

    /**
     * Add comment to the post.
     *
     * @param postId  the post id
     * @param userId  the user id
     * @param content the content of the comment
     * @throws InstanceNotFoundException the instance not found exception
     * @return the added comment
     */
    Comment addComment(Long postId, Long userId, String content) throws InstanceNotFoundException;

    /**
     * Delete comment of a post.
     *
     * @param commentId the comment id
     * @throws InstanceNotFoundException the instance not found exception
     * @throws Exception                 the exception
     */
    void deleteComment(Long commentId) throws InstanceNotFoundException;

    /**
     * Modify comment of a post.
     *
     * @param commentId the comment id
     * @param comment   the content of the comment
     * @throws InstanceNotFoundException the instance not found exception
     */
    void modifyComment(Long commentId, String comment) throws InstanceNotFoundException;

    /**
     * Add answer to a comment in a post.
     *
     * @param parentCommentId the id of the parent
     * @param userId          the user id
     * @param content         the content of the comment
     * @throws InstanceNotFoundException the instance not found exception
     * @return the answer
     */
    Comment addAnswer(Long parentCommentId, Long userId, String content) throws InstanceNotFoundException;

    /**
     * Get the comments of a post
     *
     * @param postId the post id
     * @param page   the page
     * @param size   the size
     * @throws InstanceNotFoundException the instance not found exception
     * @return the block of comments
     */
    Block<Comment> getComments(Long postId, int page, int size) throws InstanceNotFoundException;
}
