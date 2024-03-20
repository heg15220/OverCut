package es.udc.fic.tfg.model.entities;

import jakarta.persistence.*;

import java.time.LocalDateTime;

/**
 * The Class Post.
 */
@Entity
public class Post {

    private Long id;

    private String title;

    private String subtitle;

    /** The image. */
    @Lob
    private byte[] image;

    private String article;

    private LocalDateTime creationDate;

    /** The user. */
    private User user;


    /**
     * Constructor with no parameters for post
     */
    public Post() {
    }


    /**
     * Constructor with all parameters for Post <br/>
     * <b>USAGE:</b> If necessary, add the id with <code>setId</code>
     *
     * @param title         the title of the post
     * @param subtitle      the subtitle of the post
     * @param user          the user who uploaded the post
     * @param article      the article of the post
     * @param image         the image of the post
     * @param creationDate  the date of creation
     */
    public Post(String title, String subtitle, byte[] image, String article, LocalDateTime creationDate, User user) {
        this.title = title;
        this.subtitle = subtitle;
        this.image = image;
        this.article = article;
        this.creationDate = creationDate;
        this.user = user;
    }

    /**
     * Gets the id.
     *
     * @return the id
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    /**
     * Gets the title.
     *
     * @return the title
     */

    public String getTitle() {
        return title;
    }

    /**
     * Sets the title.
     *
     * @param title the new title
     */
    public void setTitle(String title) {
        this.title = title;
    }

    /**
     * Gets the subtitle.
     *
     * @return the subtitle
     */
    public String getSubtitle() {
        return subtitle;
    }

    /**
     * Sets the subtitle.
     *
     * @param subtitle the new subtitle
     */
    public void setSubtitle(String subtitle) {
        this.subtitle = subtitle;
    }

    /**
     * Gets the image.
     *
     * @return the image
     */
    public byte[] getImage() {
        return image;
    }

    /**
     * Sets the image.
     *
     * @param image the new image
     */
    public void setImage(byte[] image) {
        this.image = image;
    }

    /**
     * Gets the article.
     *
     * @return the article
     */
    public String getArticle() {
        return article;
    }

    /**
     * Sets the article.
     *
     * @param article the new article
     */
    public void setArticle(String article) {
        this.article = article;
    }

    /**
     * Gets the creationDate.
     *
     * @return the creationDate
     */
    public LocalDateTime getCreationDate() {
        return creationDate;
    }

    /**
     * Sets the creationDate.
     *
     * @param creationDate the new creationDate
     */
    public void setCreationDate(LocalDateTime creationDate) {
        this.creationDate = creationDate;
    }


    /**
     * Gets the user.
     *
     * @return the user
     */
    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "userId")
    public User getUser() {
        return user;
    }

    /**
     * Sets the user.
     *
     * @param user the new user id
     */
    public void setUser(User user) {
        this.user = user;
    }
}
