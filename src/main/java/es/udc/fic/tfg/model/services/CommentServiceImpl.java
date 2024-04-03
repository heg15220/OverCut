package es.udc.fic.tfg.model.services;

import es.udc.fic.tfg.model.common.exceptions.InstanceNotFoundException;
import es.udc.fic.tfg.model.entities.*;
import org.springframework.beans.factory.annotation.Autowired;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Slice;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

/**
 * The Class CommentServiceImpl.
 */
@Service
@Transactional
public class CommentServiceImpl implements CommentService{
    /** The permission checker. */
    @Autowired
    private PermissionChecker permissionChecker;

    /** The user dao. */
    @Autowired
    private UserDao userDao;

    /** The post dao. */
    @Autowired
    private PostDao postDao;

    /** The comments dao. */
    @Autowired
    private CommentDao commentDao;

    /**
     * Add comment to the post.
     *
     * @param postId  the post id
     * @param userId  the user id
     * @param content the content of the comment
     * @return comment the new comment of the post
     * @throws InstanceNotFoundException the instance not found exception
     */
    @Override
    public Comment addComment(Long postId, Long userId, String content) throws InstanceNotFoundException {
        if (!postDao.existsById(postId)) {
            throw new InstanceNotFoundException("Post doesn't exist", postId);
        }

        if (!userDao.existsById(userId)) {
            throw new InstanceNotFoundException("User doesn't exist", userId);
        }

        User user = permissionChecker.checkUser(userId);

        Post post = postDao.findPostById(postId);

        Comment comment = new Comment(null, user, content, post);

        commentDao.save(comment);


        return comment;

    }

    /**
     * Delete comment of a post.
     *
     * @param commentId the comment id
     * @throws InstanceNotFoundException the instance not found exception
     * @throws Exception                 the exception
     */
    @Override
    public void deleteComment(Long commentId) throws InstanceNotFoundException {
        Optional<Comment> comment = commentDao.findById(commentId);

        if (comment.isEmpty()) {
            throw new InstanceNotFoundException("The comment doesnt exist", commentId);
        }

        commentDao.delete(comment.get());
    }

    /**
     * Modify comment of a post.
     *
     * @param commentId the comment id
     * @param content   the content of the comment
     * @throws InstanceNotFoundException the instance not found exception
     */
    @Override
    public void modifyComment(Long commentId, String content) throws InstanceNotFoundException {
        Optional<Comment> commentOptional = commentDao.findById(commentId);

        if (commentOptional.isEmpty()) {
            throw new InstanceNotFoundException("The comment doesnt exist", commentId);
        }

        Comment comment = commentOptional.get();
        comment.setContent(content);

        commentDao.save(comment);

    }

    /**
     * Add answer to a comment in a post.
     *
     * @param parentCommentId the id of the parent
     * @param userId          the user id
     * @param content         the content of the comment
     * @throws InstanceNotFoundException the instance not found exception
     */
    @Override
    public Comment addAnswer(Long parentCommentId, Long userId, String content) throws InstanceNotFoundException {

        if (!userDao.existsById(userId)) {
            throw new InstanceNotFoundException("User doesn't exist", userId);
        }

        Optional<Comment> commentOptional = commentDao.findById(parentCommentId);
        if (commentOptional.isEmpty()) {
            throw new InstanceNotFoundException("Parent doesn't exist", parentCommentId);
        }

        User user = userDao.findUserById(userId);
        Post post = postDao.findPostById(commentOptional.get().getPost().getId());

        Comment answer = new Comment(commentOptional.get(), user, content, post);

        commentDao.save(answer);


        return answer;
    }

    /**
     * Get all the comments in a post
     *
     * @param postId the post id
     * @param page   the page
     * @param size   the size
     */
    @Override
    public Block<Comment> getComments(Long postId, int page, int size) throws InstanceNotFoundException {
        Slice<Comment> comments = commentDao.findCommentByPostId(postId, PageRequest.of(page, size));
        return new Block<>(comments.getContent(), comments.hasNext());
    }

}
