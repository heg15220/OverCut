package es.udc.fic.tfg.model.entities;

import jakarta.persistence.*;

import java.util.List;

/**
 * The Class Rating.
 */
@Entity
public class Comment {
    /** The id of the comment. */
    private Long id;

    /** The parent comment of the current comment. */
    private Comment parentComment;

    /** The user that commented the post. */
    private User user;

    /** The content of the comment. */
    private String content;

    /** The post commented. */
    private Post post;

    /** The List of comments if the comment is a parent. */
    @OneToMany(mappedBy = "parentComment")
    private List<Comment> childComments;

    /**
     * Constructor with no parameters
     */
    public Comment() {
    }

    /**
     * Constructor with all parameters <br/>
     * <b>USAGE:</b> If necessary, add the id with <code>setId</code>
     *
     * @param parentComment the parent of the comment if exists
     * @param author         the user that commented the post
     * @param content        what the user wants to write in the comment
     * @param post           the post commented
     *
     * @return the comment entity
     */
    public Comment(Comment parentComment, User author, String content, Post post) {
        this.parentComment = parentComment;
        this.user = author;
        this.content = content;
        this.post = post;
    }

    /**
     * Gets the Id of the comment.
     *
     * @return the id of the comment as a long
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long getId() {
        return id;
    }

    /**
     * Sets the Id of the comment.
     *
     * @param id the id of the comment
     */
    public void setId(Long id) {
        this.id = id;
    }

    @ManyToOne
    @JoinColumn(name = "parent_comment")
    public Comment getParentComment() {
        return parentComment;
    }

    public void setParentComment(Comment parentComment) {
        this.parentComment = parentComment;
    }

    @ManyToOne
    @JoinColumn(name = "userId")
    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    @ManyToOne
    @JoinColumn(name = "postId")
    public Post getPost() {
        return post;
    }

    public void setPost(Post post) {
        this.post = post;
    }

    @OneToMany(mappedBy = "parentComment")
    public List<Comment> getChildComments() {
        return childComments;
    }

    public void setChildComments(List<Comment> childComments) {
        this.childComments = childComments;
    }

}
