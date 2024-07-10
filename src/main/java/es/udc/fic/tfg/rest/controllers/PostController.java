package es.udc.fic.tfg.rest.controllers;


import es.udc.fic.tfg.model.common.exceptions.InstanceNotFoundException;
import es.udc.fic.tfg.model.entities.Comment;
import es.udc.fic.tfg.model.entities.Post;
import es.udc.fic.tfg.model.services.Block;
import es.udc.fic.tfg.model.services.CommentService;
import es.udc.fic.tfg.model.services.PostService;
import es.udc.fic.tfg.model.services.exceptions.PermissionException;
import es.udc.fic.tfg.model.services.exceptions.PostException;
import es.udc.fic.tfg.rest.dtos.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;

import static es.udc.fic.tfg.rest.dtos.CategoryConversor.toCategoryDtos;
import static es.udc.fic.tfg.rest.dtos.PostConversor.toPostDetailsDto;
import static es.udc.fic.tfg.rest.dtos.PostConversor.toPostDtos;

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

        Block<Post> postBlock = postService.visualizeAllUserPosts(userId, page, 2);

        return new BlockDto<>(toPostDtos(postBlock.getItems()), postBlock.getExistMoreItems());
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

        return postService.createPost(params.getTitle(), params.getSubtitle(), params.getArticle(),userId, params.getCategoryId())
                .getId();
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
    @GetMapping("/")
    public BlockDto<PostDto> getPosts(@Validated @RequestParam(required = false) String title,
                                      @Validated @RequestParam(required = false) Long categoryId,
                                      @RequestParam(defaultValue = "0") int page,
                                      @Validated @RequestParam(required = false) Short criteria,
                                      @Validated @RequestParam(required = false, defaultValue = "false") Boolean order) throws InstanceNotFoundException {

        Block<Post> foundPost = postService.getPosts(title, categoryId, page,400, criteria, order);

        return new BlockDto<>(PostConversor.toPostDtos(foundPost.getItems()), foundPost.getExistMoreItems());
    }


    /**
     * Modify post.
     *
     * @param userId the user id
     * @param postId the post id
     * @param params the params
     * @throws InstanceNotFoundException the instance not found exception
     * @throws PermissionException       the permission exception
     */
    @PutMapping("/{id}")
    public void modifyPost(@RequestAttribute Long userId, @PathVariable("id") Long postId,
                           @Validated @RequestBody PostParamsDto params)
            throws InstanceNotFoundException, PermissionException, PostException {

        postService.modifyPost(postId, params.getTitle(), params.getSubtitle(), params.getArticle(),
                userId,params.getCategoryId());
    }

    /**
     * Get all categories.
     *
     * @return the category dto
     */
    @GetMapping("/categories")
    public List<CategoryDto> getAllCategories() {
        return toCategoryDtos(postService.getAllCategories());
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
        return toPostDetailsDto(postService.getPostDetails(userId, postId));
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

}
