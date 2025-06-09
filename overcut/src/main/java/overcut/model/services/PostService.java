package overcut.model.services;

import overcut.model.common.exceptions.InstanceNotFoundException;
import overcut.model.entities.Category;
import overcut.model.entities.Post;
import overcut.model.entities.PostSection;
import overcut.model.entities.User;
import overcut.model.services.exceptions.PermissionException;
import overcut.model.services.exceptions.PostException;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;

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
     * @param categoryId        the category id
     * @return the post
     * @throws InstanceNotFoundException the instance not found exception
     * @throws PostException             the post exception
     */
    Post createPost(String title, String subtitle, String article, Long userId, Long categoryId, byte[] image) throws InstanceNotFoundException, PostException;

    /**
     * Modify post.
     * @param postId           the post id
     * @param title            the title
     * @param subtitle         the subtitle, short description of the article
     * @param userId           the user id
     * @param article          the article, the content news
     * @param categoryId       the category id
     * @return the post
     * @throws InstanceNotFoundException the instance not found exception
     * @throws PostException             the post exception
     */
    Post modifyPost(Long postId, String title, String subtitle, String article, Long userId, Long categoryId, byte[] image)
            throws InstanceNotFoundException, Exception, PostException;


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

    /**
     * Get all categories.
     *
     * @return the list with all categories.
     */
    List<Category> getAllCategories();

    /**
     * Get post details.
     *
     * @param postId the post id
     * @return the post
     * @throws InstanceNotFoundException the instance not found exception
     */
    PostDetails getPostDetails(Long userId, Long postId) throws InstanceNotFoundException;

    boolean newPosts(LocalDateTime referenceDate);


    User getUserPost(Long postId) throws InstanceNotFoundException;

    // Añadir secciones enriquecidas a un post
    void addPostSections(Long postId, List<PostSection> sections) throws InstanceNotFoundException;

    // Obtener secciones enriquecidas de un post
    List<PostSection> getPostSections(Long postId) throws InstanceNotFoundException;

    // Eliminar todas las secciones de un post (por si se quiere regenerar)
    void deletePostSections(Long postId) throws InstanceNotFoundException;

}
