package es.udc.fic.tfg.model.services;

import es.udc.fic.tfg.model.common.exceptions.InstanceNotFoundException;
import es.udc.fic.tfg.model.entities.*;
import es.udc.fic.tfg.model.services.exceptions.PermissionException;
import es.udc.fic.tfg.model.services.exceptions.PostException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Slice;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * The Class PostServiceImpl.
 */
@Service
@Transactional
public class PostServiceImpl implements PostService{
    /** The permission checker. */
    @Autowired
    private PermissionChecker permissionChecker;

    /** The category dao. */
    @Autowired
    private CategoryDao categoryDao;

    /** The user dao. */
    @Autowired
    private UserDao userDao;

    /** The post dao. */
    @Autowired
    private PostDao postDao;

    /**
     * Delete post.
     *
     * @param userId the user id
     * @param postId the post id
     * @throws InstanceNotFoundException the instance not found exception
     * @throws PermissionException       the permission exception
     */
    @Override
    public void deletePost(Long userId, Long postId) throws InstanceNotFoundException, PermissionException {
        Optional<Post> postOptional = postDao.findById(postId);
        if (!postOptional.isPresent()) {
            throw new InstanceNotFoundException("project.entities.post", postId);
        }

        if (!postOptional.get().getUser().getId().equals(userId)) {
            throw new PermissionException();
        }

        postDao.deleteById(postId);
    }

    /**
     * Visualize all user posts.
     *
     * @param userId the user id
     * @param page   the page
     * @param size   the size
     * @return the list with all the user posts
     * @throws InstanceNotFoundException the instance not found exception
     */
    @Override
    @Transactional(readOnly = true)
    public Block<Post> visualizeAllUserPosts(Long userId, int page, int size) throws InstanceNotFoundException {
        Optional<User> userOptional = userDao.findById(userId);

        if (!userOptional.isPresent()) {
            throw new InstanceNotFoundException("project,entities,user", userId);
        }

        Slice<Post> slice = postDao.findByUserIdOrderByCreationDateDesc(userId, PageRequest.of(page, size));

        return new Block<>(slice.getContent(), slice.hasNext());
    }

    /**
     * Create post.
     *
     * @param title            the title
     * @param subtitle the short description of the article
     * @param article          the post content
     * @param userId          the user id
     * @param categoryId       the category id
     * @return the post
     * @throws InstanceNotFoundException the instance not found exception
     * @throws PostException             the post exception
     */
    @Override
    public Post createPost(String title, String subtitle, String article,Long userId, Long categoryId)
            throws InstanceNotFoundException, PostException {
        User user = permissionChecker.checkUser(userId);
        Optional<Category> categoryOptional = categoryDao.findById(categoryId);
        if (!categoryOptional.isPresent()) {
            throw new InstanceNotFoundException("project.entities.category", categoryId);
        }

        if(!user.isJournalist()) throw new PostException("project.entities.posts.user");
        Category category = categoryOptional.get();

        LocalDateTime creationDate = LocalDateTime.now();


        Post post = new Post(title, subtitle, null, article, creationDate, user, category);

        postDao.save(post);

        return post;
    }

    /**
     * Modify post.
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
    @Override
    public void modifyPost(Long postId, String title, String subtitle, String article, Long userId, Long categoryId)
            throws InstanceNotFoundException, PermissionException, PostException{
        Post existingPost = postDao.findById(postId).orElseThrow(() -> new InstanceNotFoundException("Post", postId));

        if (!existingPost.getUser().getId().equals(userId)) {
            throw new PermissionException();
        }

        Optional<Category> categoryOptional = categoryDao.findById(categoryId);
        if (!categoryOptional.isPresent()) {
            throw new InstanceNotFoundException("project.entities.category", categoryId);
        }

        existingPost.setTitle(title);
        existingPost.setSubtitle(subtitle);
        existingPost.setCategory(categoryOptional.get());
        existingPost.setArticle(article);

        LocalDateTime updatingDate = LocalDateTime.now();

        existingPost.setCreationDate(updatingDate);

        postDao.save(existingPost);
    }

    /**
     * Add image.
     *
     * @param postId the post id
     * @param image  the image
     * @return the post
     * @throws InstanceNotFoundException the instance not found exception
     * @throws IOException               the IO exception
     */
    @Override
    public Post addImage(Long postId, MultipartFile image) throws InstanceNotFoundException, IOException {
        if (image == null) {
            throw new InstanceNotFoundException("Post image not found", null);
        }

        Post post = postDao.findPostById(postId);
        post.setImage(image.getBytes());

        return post;
    }

    /**
     * Get all categories.
     *
     * @return the list with all categories.
     */
    @Override
    public List<Category> getAllCategories() {
        return categoryDao.findAll();
    }


    /**
     * Get post details.
     *
     * @param postId the post id
     * @return the post
     * @throws InstanceNotFoundException the instance not found exception
     */
    @Override
    public PostDetails getPostDetails(Long userId, Long postId) throws InstanceNotFoundException {
        Optional<Post> postOptional = postDao.findById(postId);
        if (!postOptional.isPresent()) {
            throw new InstanceNotFoundException("project.entities.post", postId);
        }

        if (userId != null) {
            Optional<User> userOptional = userDao.findById(userId);
            if (userOptional.isPresent()) {
                return new PostDetails(postOptional.get());
            } else {
                throw new InstanceNotFoundException("project.entities.user", userId);
            }
        }
        return new PostDetails(postOptional.get());
    }




}
