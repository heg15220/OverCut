package es.udc.fic.tfg.model.services;

import es.udc.fic.tfg.model.entities.Post;

public class PostDetails {
    /** The post */
    private Post post;

    /**
     * Instantiates a new post details.
     *
     * @param post    the post
     */
    public PostDetails(Post post) {
        super();
        this.post = post;
    }

    /**
     * Gets the post.
     *
     * @return the post
     */
    public Post getPost() {
        return post;
    }

}
