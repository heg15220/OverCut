package es.udc.fic.tfg.rest.dtos;

public class CommentDto {
    /** The id of the comment. */
    private Long id;

    /** The parent comment of the current comment. */
    private Long parentCommentId;

    /** The user that commented the post. */
    private Long authorId;

    /** The content of the comment. */
    private String content;

    /** The post commented. */
    private Long postId;

    private String userName;

    private byte[] userImage;

    /**
     * Instantiates a new comment dto.
     */
    public CommentDto() {
    }

    /**
     * Instantiates a new comment dto.
     *
     * @param id              the comment id
     * @param parentCommentId the parent of the comment if exists
     * @param authorId        the id of the user that commented the post
     * @param content         what the user wants to write in the comment
     * @param postId          the id of the post commented
     */
    public CommentDto(Long id, Long parentCommentId, Long authorId, String content, Long postId, String userName,
                      byte[] userImage) {
        this.id = id;
        this.parentCommentId = parentCommentId;
        this.authorId = authorId;
        this.content = content;
        this.postId = postId;
        this.userName = userName;
        this.userImage = userImage;
    }

    /**
     * Gets the Id of the comment.
     *
     * @return the id of the comment as a long
     */
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

    public Long getParentCommentId() {
        return parentCommentId;
    }

    public void setParentCommentId(Long parentCommentId) {
        this.parentCommentId = parentCommentId;
    }

    public Long getAuthorId() {
        return authorId;
    }

    public void setAuthorId(Long authorId) {
        this.authorId = authorId;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public Long getPostId() {
        return postId;
    }

    public void setPostId(Long postId) {
        this.postId = postId;
    }

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public byte[] getUserImage() {
        return userImage;
    }

    public void setUserImage(byte[] userImage) {
        this.userImage = userImage;
    }
}
