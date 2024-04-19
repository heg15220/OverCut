package es.udc.fic.tfg.rest.dtos;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * The Class UserDto.
 */
public class UserDto {

    /**
     * The Interface AllValidations.
     */
    public interface AllValidations {
    }

    /**
     * The Interface UpdateValidations.
     */
    public interface UpdateValidations {
    }

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
    private byte[] image;

    /** The role. */
    private boolean isJournalist;

    private int points;
    /**
     * Instantiates a new user dto.
     */
    public UserDto() {
    }

    /**
     * Instantiates a new user dto.
     *
     * @param id        the id
     * @param userName  the user name
     * @param firstName the first name
     * @param lastName  the last name
     * @param email     the email
     * @param image     the image
     * @param isJournalist   the role
     */
    public UserDto(Long id, String userName, String firstName, String lastName,
                   String email, byte[] image, boolean isJournalist, int points) {
        super();
        this.id = id;
        this.userName = userName;
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
    @NotNull(groups = { AllValidations.class })
    @Size(min = 1, max = 60, groups = { AllValidations.class })
    public String getUserName() {
        return userName;
    }

    /**
     * Sets the user name.
     *
     * @param userName the new user name
     */
    public void setUserName(String userName) {
        this.userName = userName.trim();
    }

    /**
     * Gets the password.
     *
     * @return the password
     */
    @NotNull(groups = { AllValidations.class })
    @Size(min = 1, max = 60, groups = { AllValidations.class })
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
    @NotNull(groups = { AllValidations.class, UpdateValidations.class })
    @Size(min = 1, max = 60, groups = { AllValidations.class, UpdateValidations.class })
    public String getFirstName() {
        return firstName;
    }

    /**
     * Sets the first name.
     *
     * @param firstName the new first name
     */
    public void setFirstName(String firstName) {
        this.firstName = firstName.trim();
    }

    /**
     * Gets the last name.
     *
     * @return the last name
     */
    @NotNull(groups = { AllValidations.class, UpdateValidations.class })
    @Size(min = 1, max = 60, groups = { AllValidations.class, UpdateValidations.class })
    public String getLastName() {
        return lastName;
    }

    /**
     * Sets the last name.
     *
     * @param lastName the new last name
     */
    public void setLastName(String lastName) {
        this.lastName = lastName.trim();
    }

    /**
     * Gets the email.
     *
     * @return the email
     */
    @NotNull(groups = { AllValidations.class, UpdateValidations.class })
    @Size(min = 1, max = 60, groups = { AllValidations.class, UpdateValidations.class })
    @Email(groups = { AllValidations.class, UpdateValidations.class })
    public String getEmail() {
        return email;
    }

    /**
     * Sets the email.
     *
     * @param email the new email
     */
    public void setEmail(String email) {
        this.email = email.trim();
    }

    /**
     * Gets the role.
     *
     * @return the role
     */

    public boolean isJournalist() {
        return isJournalist;
    }

    /**
     * Sets the role.
     *
     * @param journalist if it is a jornalist or not
     */
    public void setJournalist(boolean journalist) {
        isJournalist = journalist;
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

    public int getPoints() {
        return points;
    }

    public void setPoints(int points) {
        this.points = points;
    }
}
