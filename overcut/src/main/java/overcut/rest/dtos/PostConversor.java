package overcut.rest.dtos;

import overcut.model.entities.Category;
import overcut.model.entities.Post;
import overcut.model.entities.User;
import overcut.model.services.PostDetails;

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
