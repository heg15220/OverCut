package es.udc.fic.tfg.model.services;

import es.udc.fic.tfg.model.common.exceptions.InstanceNotFoundException;
import es.udc.fic.tfg.model.entities.Post;
import es.udc.fic.tfg.model.services.exceptions.PermissionException;
import es.udc.fic.tfg.model.services.exceptions.PostException;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

/**
 * The Interface PostService.
 */
public interface PostService {
    /**
     * Delete a post.
     *
     * @param userId the user id
     * @param postId the post id
     * @throws InstanceNotFoundException the instance not found exception
     * @throws PermissionException       the permission exception
     */
    void deletePost(Long userId, Long postId) throws InstanceNotFoundException, PermissionException;

    /**
     * Get posts.
     *
     * @param title      the title
     * @param categoryId the category id
     * @param page       the page
     * @param size       the size
     * @return the list of posts
     */
    Block<Post> getPosts(String title, Long categoryId, int page, int size, Short criteria, boolean order);

    /**
     * Visualize all the user posts.
     *
     * @param userId the user id
     * @param page   the page
     * @param size   the size
     * @return the list with all the user posts
     * @throws InstanceNotFoundException the instance not found exception
     */
    Block<Post> visualizeAllUserPosts(Long userId, int page, int size) throws InstanceNotFoundException;

    /**
     * Create post.
     *
     * @param title            the title
     * @param subtitle         the subtitle, short description of the article
     * @param userId           the user id
     * @param article          the article, the content news
     * @return the post
     * @throws InstanceNotFoundException the instance not found exception
     * @throws PostException             the post exception
     */
    Post createPost(String title, String subtitle, String article, Long userId) throws InstanceNotFoundException, PostException;

    /**
     * Modify post.
     *
     * @param title            the title
     * @param subtitle         the subtitle, short description of the article
     * @param userId           the user id
     * @param article          the article, the content news
     * @return the post
     * @throws InstanceNotFoundException the instance not found exception
     * @throws PostException             the post exception
     */
    public void modifyPost(String title, String subtitle, String article, Long userId)
            throws InstanceNotFoundException, PermissionException, PostException;

    /**
     * Add image.
     *
     * @param postId the post id
     * @param image  the image
     * @return the post
     * @throws InstanceNotFoundException the instance not found exception
     * @throws IOException               the IO exception
     */
    Post addImage(Long postId, MultipartFile image) throws InstanceNotFoundException, IOException;


}
