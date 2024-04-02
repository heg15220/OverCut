package es.udc.fic.tfg.rest.dtos;


import java.time.LocalDateTime;

public class PostDto {
    /** The id. */
    private Long id;

    /** The title. */
    private String title;

    /** The description. */
    private String subtitle;

    private byte[] image;

    private String article;

    private LocalDateTime creationDate;

    /** The user id. */
    private Long userId;

    /** The user name. */
    private String userName;

    /** The category id. */
    private Long categoryId;

    private String categoryName;

    public PostDto(Long id, String title, String subtitle, byte[] image, String article,
                   LocalDateTime creationDate, Long userId, String userName, Long categoryId, String categoryName) {
        this.id = id;
        this.title = title;
        this.subtitle = subtitle;
        this.image = image;
        this.article = article;
        this.creationDate = creationDate;
        this.userId = userId;
        this.userName = userName;
        this.categoryId = categoryId;
        this.categoryName = categoryName;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getSubtitle() {
        return subtitle;
    }

    public void setSubtitle(String subtitle) {
        this.subtitle = subtitle;
    }

    public byte[] getImage() {
        return image;
    }

    public void setImage(byte[] image) {
        this.image = image;
    }

    public String getArticle() {
        return article;
    }

    public void setArticle(String article) {
        this.article = article;
    }

    public LocalDateTime getCreationDate() {
        return creationDate;
    }

    public void setCreationDate(LocalDateTime creationDate) {
        this.creationDate = creationDate;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public Long getCategoryId() {
        return categoryId;
    }

    public void setCategoryId(Long categoryId) {
        this.categoryId = categoryId;
    }

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public String getCategoryName() {
        return categoryName;
    }

    public void setCategoryName(String categoryName) {
        this.categoryName = categoryName;
    }
}
