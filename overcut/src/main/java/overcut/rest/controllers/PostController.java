package overcut.rest.controllers;


import overcut.rest.dtos.*;
import overcut.model.common.exceptions.InstanceNotFoundException;
import overcut.model.entities.Comment;
import overcut.model.entities.Post;
import overcut.model.services.Block;
import overcut.model.services.CommentService;
import overcut.model.services.PostService;
import overcut.model.services.exceptions.PermissionException;
import overcut.model.services.exceptions.PostException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.List;

/**
 * The class PostController
 */
@RestController
@RequestMapping("/api/posts")
public class PostController {
    /** The post service. */
    @Autowired
    private PostService postService;

    @Autowired

    private CommentService commentService;


    /**
     * Visualize all the user posts.
     *
     * @param userId the user id
     * @param page   the page
     * @return the list with all the user posts
     * @throws InstanceNotFoundException the instance not found exception
     */
    @GetMapping("/user")
    public BlockDto<PostDto> visualizeAllUserPosts(@RequestAttribute Long userId,
                                                   @RequestParam(defaultValue = "0") int page) throws InstanceNotFoundException {

        Block<Post> postBlock = postService.visualizeAllUserPosts(userId, page, 40);

        return new BlockDto<>(PostConversor.toPostDtos(postBlock.getItems()), postBlock.getExistMoreItems());
    }

    /**
     * Delete post.
     *
     * @param userId the user id
     * @param postId the post id
     * @throws PermissionException       the permission exception
     * @throws InstanceNotFoundException the instance not found exception
     */
    @DeleteMapping("/{id}")
    public void deletePost(@RequestAttribute Long userId, @PathVariable("id") Long postId)
            throws PermissionException, InstanceNotFoundException {

        postService.deletePost(userId, postId);
    }

    /**
     * Create post.
     *
     * @param userId the user id
     * @param params the params
     * @return the post
     * @throws InstanceNotFoundException the instance not found exception
     * @throws PostException             the post exception
     */
    @PostMapping("/")
    public Long createPost(@RequestAttribute Long userId, @Validated @RequestBody PostParamsDto params)
            throws InstanceNotFoundException, PostException {
        byte[] decodedImage = null;
        if (params.getImage() != null && !params.getImage().isEmpty()) {
            decodedImage = Base64.getDecoder().decode(params.getImage());
        }

        return postService.createPost(
                params.getTitle(),
                params.getSubtitle(),
                params.getArticle(),
                userId,
                params.getCategoryId(),
                decodedImage,
                params.getImageCaption()
        ).getId();
    }

    /**
     * Get posts.
     *
     * @param title      the title
     * @param categoryId the category id
     * @param page       the page
     * @param criteria   sort criteria
     * @param order      indicates asc-true desc-false
     * @return the list with the posts
     * @throws InstanceNotFoundException the instance not found exception
     */
    @GetMapping("/getPosts")
    public BlockDto<PostDto> getPosts(
            @Validated @RequestParam(required = false) String title,
            @Validated @RequestParam(required = false) Long categoryId,
            @RequestParam(defaultValue = "0") int page,
            @Validated @RequestParam(required = false) Short criteria,
            @Validated @RequestParam(required = false, defaultValue = "false") Boolean order,
            @RequestParam(required = false) String language
    ) throws InstanceNotFoundException {

        Block<Post> foundPost = postService.getPosts(title, categoryId, page, 40, criteria, order, language);

        return new BlockDto<>(PostConversor.toPostDtos(foundPost.getItems()), foundPost.getExistMoreItems());
    }



    /**
     * Modify post.
     *
     * @param userId the user id
     * @param id the post id
     * @param params the params
     * @throws InstanceNotFoundException the instance not found exception
     * @throws PermissionException       the permission exception
     */
    @PutMapping("/{id}")
    public PostDto modifyPost(@PathVariable Long id,
                              @RequestAttribute Long userId,
                              @RequestBody PostParamsDto params)
            throws Exception {

        byte[] decodedImage = null;
        if (params.getImage() != null && !params.getImage().isEmpty()) {
            decodedImage = Base64.getDecoder().decode(params.getImage());
        }

        Post post = postService.modifyPost(id, params.getTitle(), params.getSubtitle(),
                params.getArticle(), userId, params.getCategoryId(), decodedImage, params.getImageCaption());

        return PostConversor.toPostDto(post);
    }


    /**
     * Get all categories.
     *
     * @return the category dto
     */
    @GetMapping("/categories")
    public List<CategoryDto> getAllCategories() {
        return CategoryConversor.toCategoryDtos(postService.getAllCategories());
    }

    /**
     * Post details.
     *
     * @param postId the post id
     * @return the post dto
     * @throws InstanceNotFoundException the instance not found exception
     */
    @GetMapping("/{id}")
    public PostDto postDetails(@RequestAttribute(required = false) Long userId, @PathVariable("id") Long postId) throws InstanceNotFoundException {
        return PostConversor.toPostDetailsDto(postService.getPostDetails(userId, postId));
    }



    /**
     * Add image.
     *
     * @param id   the id
     * @param file the file
     * @return the post dto
     * @throws InstanceNotFoundException the instance not found exception
     * @throws IOException               the IO exception
     */
    @PutMapping("/addImage/{id}")
    public PostDto addImage(@PathVariable Long id, @RequestParam("file") MultipartFile file)
            throws InstanceNotFoundException, IOException {
        Post post = postService.addImage(id, file);

        return PostConversor.toPostDto(post);
    }



    @GetMapping("/new")
    public boolean newPost(@Validated @RequestParam(required = true) LocalDateTime date) {
        return postService.newPosts(date);
    }

    /**
     * Add a comment to a post
     *
     * @param userId the user id
     * @param postId the post id
     * @param params the parameters for creating the post
     * @return the id of the new comment
     * @throws InstanceNotFoundException the instance not found exception
     */
    @PostMapping("{id}/comment")
    public Long addComment(@RequestAttribute Long userId, @PathVariable("id") Long postId,
                           @Validated @RequestBody CommentParamsDto params) throws InstanceNotFoundException {
        return commentService.addComment(postId, userId, params.getContent()).getId();
    }

    /**
     * Modify a comment
     *
     * @param commentId the user comment id
     * @param params    the parameters for modifying the post
     * @throws InstanceNotFoundException the instance not found exception
     */
    @PutMapping("/comment/{id}")
    public void modifyComment(@PathVariable("id") Long commentId, @Validated @RequestBody CommentParamsDto params)
            throws InstanceNotFoundException {
        commentService.modifyComment(commentId, params.getContent());
    }

    /**
     * Delete a comment
     *
     * @param commentId the comment id
     * @throws InstanceNotFoundException the instance not found exception
     */
    @DeleteMapping("/comment/{id}")
    public void deleteComment(@PathVariable("id") Long commentId) throws InstanceNotFoundException {

        commentService.deleteComment(commentId);
    }

    /**
     * Adds an answer to comment
     *
     * @param userId          the id of user
     * @param parentCommentId the id of the parent comment
     * @param params          the parameters for modifying the post
     * @return the list with all the user posts
     * @throws InstanceNotFoundException the instance not found exception
     */
    @PostMapping("/comment/{id}/answer")
    public Long addAnswer(@RequestAttribute Long userId, @PathVariable("id") Long parentCommentId,
                          @Validated @RequestBody CommentParamsDto params) throws InstanceNotFoundException {
        return commentService.addAnswer(parentCommentId, userId, params.getContent()).getId();

    }

    /**
     * Get comments on a post.
     * @param page    the page
     * @return the list with the comments
     * @throws InstanceNotFoundException the instance not found exception
     */
    @GetMapping("/{id}/comments")
    public BlockDto<CommentDto> getComments(@PathVariable("id") Long postId,
                                            @RequestParam(defaultValue = "0") int page)
            throws InstanceNotFoundException {

        Block<Comment> foundComment = commentService.getComments(postId, page, 35);

        return new BlockDto<>(CommentConversor.toCommentDtos(foundComment.getItems()),
                foundComment.getExistMoreItems());
    }

    @GetMapping("/{id}/user")
    public UserDto getUserPost(@PathVariable("id") Long postId) throws InstanceNotFoundException{
        return UserConversor.toUserDto(postService.getUserPost(postId));
    }

    @PostMapping("/{id}/sections")
    public void addPostSections(@PathVariable("id") Long postId,
                                @Validated @RequestBody List<PostSectionDto> sections)
            throws InstanceNotFoundException {
        postService.addPostSections(postId, PostSectionConversor.toPostSections(sections));
    }

    @GetMapping("/{id}/sections")
    public List<PostSectionDto> getPostSections(@PathVariable("id") Long postId)
            throws InstanceNotFoundException {
        return PostSectionConversor.toPostSectionDtos(postService.getPostSections(postId));
    }

    @DeleteMapping("/{id}/sections")
    public void deletePostSections(@PathVariable("id") Long postId)
            throws InstanceNotFoundException {
        postService.deletePostSections(postId);
    }


}
