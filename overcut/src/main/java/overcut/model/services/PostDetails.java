package overcut.model.services;

import overcut.model.entities.Post;
import overcut.model.entities.PostSection;

import java.util.List;

public class PostDetails {

    private Post post;
    private List<PostSection> postSections;

    public PostDetails(Post post) {
        this.post = post;
    }

    public PostDetails(Post post, List<PostSection> postSections) {
        this.post = post;
        this.postSections = postSections;
    }

    public Post getPost() {
        return post;
    }

    public List<PostSection> getPostSections() {
        return postSections;
    }

    public void setPostSections(List<PostSection> postSections) {
        this.postSections = postSections;
    }
}
