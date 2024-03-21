package es.udc.fic.tfg.rest.dtos;

import es.udc.fic.tfg.model.entities.Category;
import es.udc.fic.tfg.model.entities.Post;
import es.udc.fic.tfg.model.entities.User;
import es.udc.fic.tfg.model.services.PostDetails;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

public class PostConversor {
    /**
     * Instantiates a new post conversor
     */
    private PostConversor() {
    }

    /**
     * To post dto.
     *
     * @param post the post
     * @return the post dto
     */

    public static final PostDto toPostDto(Post post) {
        User user = post.getUser();
        Category category = post.getCategory();

        return new PostDto(post.getId(), post.getTitle(), post.getSubtitle(),post.getImage(),post.getArticle(),
                post.getCreationDate(),user.getId(),user.getUserName(),
                category.getId(), category.getName());

    }

    public static final PostDto toPostDetailsDto(PostDetails postDetails) {
        Post post = postDetails.getPost();
        User user = post.getUser();
        Category category = post.getCategory();



            return new PostDto(post.getId(), post.getTitle(), post.getSubtitle(),post.getImage(),post.getArticle(),
                post.getCreationDate(),user.getId(),user.getUserName(),
                category.getId(), category.getName());

    }


    /**
     * To post dtos
     *
     * @param posts the posts
     * @return the post
     */
    public static final List<PostDto> toPostDtos(List<Post> posts) {
        return posts.stream().map(PostConversor::toPostDto).collect(Collectors.toList());

    }
}
