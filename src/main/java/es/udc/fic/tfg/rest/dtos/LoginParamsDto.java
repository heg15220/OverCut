package es.udc.fic.tfg.rest.dtos;

import jakarta.validation.constraints.NotNull;

/**
 * The Class LoginParamsDto.
 */
public class LoginParamsDto {
    /** The user name. */
    private String email;

    /** The password. */
    private String password;

    /**
     * Instantiates a new login params dto.
     */
    public LoginParamsDto() {
        super();
    }

    public LoginParamsDto(String mail, String password) {
        this.email = mail;
        this.password = password;
    }

    /**
     * Gets the user email.
     *
     * @return the user email
     */
    @NotNull
    public String getEmail() {
        return email;
    }

    /**
     * Sets the user email.
     *
     * @param email the new user email
     */
    public void setEmail(String email) {
        this.email = email;
    }

    /**
     * Gets the password.
     *
     * @return the password
     */
    @NotNull
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
}
