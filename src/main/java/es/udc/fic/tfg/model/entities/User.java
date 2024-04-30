package es.udc.fic.tfg.model.entities;

import jakarta.persistence.*;

import java.util.List;

/**
 * The Class User.
 */
@Entity
@Table(name = "Users")
public class User {
    /** The id. */
    private Long id;

    /** The user name. */
    private String userName;


    /** The password. */
    private String password;

    /** The first name. */
    private String firstName;

    /** The last name. */
    private String lastName;

    /** The email. */
    private String email;

    /** The image. */
    @Lob
    private byte[] image;


    /** To know if the user is a journalist or not. */
    @Column(name = "journalist")
    private boolean isJournalist;

    private int points;

    private List<Post> posts;

    /** The list of comments to posts */
    private List<Comment> comments;

    private List<UserAnswer> userAnswers;

    private List<Assessment> assessments;

    private List<Award> awards;

    /**
     * Constructor with no parameters
     */
    public User() {
    }

    /**
     * Constructor with all parameters <br/>
     * <b>USAGE:</b> If necessary, add the id with <code>setId</code>
     *
     * @param userName  the user name
     * @param password  the password
     * @param firstName the first name
     * @param lastName  the last name
     * @param email     the email
     * @param image     the image
     * @param isJournalist  the user journalist
     */
    public User(String userName, String password, String firstName, String lastName, String email, byte[] image,
                boolean isJournalist, int points) {
        this.userName = userName;
        this.password = password;
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.image = image;
        this.isJournalist = isJournalist;
        this.points = points;
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

    /**
     * Sets the id.
     *
     * @param id the new id
     */
    public void setId(Long id) {
        this.id = id;
    }

    /**
     * Gets the user name.
     *
     * @return the user name
     */
    public String getUserName() {
        return userName;
    }

    /**
     * Sets the user name.
     *
     * @param userName the new user name
     */
    public void setUserName(String userName) {
        this.userName = userName;
    }

    /**
     * Gets the password.
     *
     * @return the password
     */
    public String getPassword() {
        return password;
    }

    /**
     * Sets the password.
     *
     * @param password the new password
     */
    public void setPassword(String password) {
        this.password = password;
    }

    /**
     * Gets the first name.
     *
     * @return the first name
     */
    public String getFirstName() {
        return firstName;
    }

    /**
     * Sets the first name.
     *
     * @param firstName the new first name
     */
    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    /**
     * Gets the last name.
     *
     * @return the last name
     */
    public String getLastName() {
        return lastName;
    }

    /**
     * Sets the last name.
     *
     * @param lastName the new last name
     */
    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    /**
     * Gets the email.
     *
     * @return the email
     */
    public String getEmail() {
        return email;
    }

    /**
     * Sets the email.
     *
     * @param email the new email
     */
    public void setEmail(String email) {
        this.email = email;
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
     * Gets the boolean isJournalist.
     *
     * @return the boolean
     */
    public boolean isJournalist() {
        return isJournalist;
    }

    public void setJournalist(boolean journalist) {
        isJournalist = journalist;
    }

    public int getPoints() {
        return points;
    }

    public void setPoints(int points) {
        this.points = points;
    }

    @OneToMany(mappedBy = "user")
    public List<Post> getPosts() {
        return posts;
    }

    public void setPosts(List<Post> posts) {
        this.posts = posts;
    }

    /**
     * Gets the comments.
     *
     * @return the comments.
     */

    @OneToMany(mappedBy = "user")
    public List<Comment> getComments() {
        return comments;
    }

    public void setComments(List<Comment> comments) {
        this.comments = comments;
    }

    @OneToMany(mappedBy = "user")
    public List<UserAnswer> getUserAnswers() {
        return userAnswers;
    }

    public void setUserAnswers(List<UserAnswer> userAnswers) {
        this.userAnswers = userAnswers;
    }

    @OneToMany(mappedBy = "user")
    public List<Assessment> getAssessments() {
        return assessments;
    }

    public void setAssessments(List<Assessment> assessments) {
        this.assessments = assessments;
    }

    @OneToMany(mappedBy = "user")
    public List<Award> getAwards() {
        return awards;
    }

    public void setAwards(List<Award> awards) {
        this.awards = awards;
    }

}
